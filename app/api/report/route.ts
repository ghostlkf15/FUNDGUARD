import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  runRuleEngine,
  updatePeakEquity,
  isNewTradingDay,
  countTradingDays,
} from "@/lib/engine/rules";
import { getPresetById } from "@/lib/data/seed";
import { createServiceClient } from "@/lib/supabase/service";
import type { RuleEventType, Trade } from "@/lib/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const _ENV_WORKER_SECRET = process.env.WORKER_SECRET;
const DEV_DEFAULT = "dev-fundguard-worker-secret";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const workerSecret: string | null = (() => {
  const raw = _ENV_WORKER_SECRET ? String(_ENV_WORKER_SECRET).trim() : "";
  if (raw.length) return raw;
  if (IS_PRODUCTION) return null;
  return DEV_DEFAULT;
})();
const NODE_ENV = process.env.NODE_ENV || "development";

const OpenPositionSchema = z.object({
  ticket: z.string(),
  symbol: z.string(),
  side: z.enum(["buy", "sell"]),
  volume: z.number(),
  open_price: z.number(),
  open_time: z.string(),
  swap: z.number().optional().default(0),
  commission: z.number().optional().default(0),
});

const ClosedTradeSchema = z.object({
  ticket: z.string(),
  symbol: z.string(),
  side: z.enum(["buy", "sell"]),
  volume: z.number(),
  open_price: z.number(),
  close_price: z.number(),
  open_time: z.string(),
  close_time: z.string(),
  pnl: z.number(),
  swap: z.number().optional().default(0),
  commission: z.number().optional().default(0),
});

const ReportSchema = z.object({
  report_key: z.string().min(8),
  balance: z.number(),
  equity: z.number(),
  currency: z.string().default("USD"),
  timestamp: z.string().default(() => new Date().toISOString()),
  broker_name: z.string().optional(),
  server_name: z.string().optional(),
  server_timezone: z.string().optional(),
  open_positions: z.array(OpenPositionSchema).default([]),
  closed_trades: z.array(ClosedTradeSchema).default([]),
  challenge_id: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    if (!workerSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "misconfigured_server",
          hint: "Falta variable WORKER_SECRET en hosting. El servidor no acepta reportes hasta configurarla.",
        },
        { status: 503 },
      );
    }
    const authHeader = req.headers.get("x-worker-secret");
    if (!authHeader || authHeader !== workerSecret) {
      return NextResponse.json(
        { ok: false, error: "unauthorized", hint: "Falta header X-Worker-Secret o es incorrecto." },
        { status: 401 },
      );
    }

    const raw = await req.json();
    const parsed = ReportSchema.parse(raw);

    const { challenge: dbChallenge, source } = await resolveChallenge(
      parsed.challenge_id,
      parsed.report_key
    );

    if (!dbChallenge) {
      return NextResponse.json(
        { ok: false, error: "challenge_not_found", hint: "report_key no coincide con ningún desafío activo." },
        { status: 404 }
      );
    }

    const preset = getPresetById(dbChallenge.preset_id);
    if (!preset) {
      return NextResponse.json({ ok: false, error: "preset_not_found", preset_id: dbChallenge.preset_id }, { status: 500 });
    }

    const newDay = isNewTradingDay(
      typeof dbChallenge.last_trade_date === "string" ? dbChallenge.last_trade_date : null,
      parsed.timestamp,
      preset.daily_reset_hour_utc
    );
    const startDailyBalance = newDay
      ? parsed.balance
      : Number(dbChallenge.start_daily_balance ?? dbChallenge.initial_balance);

    const newPeak = updatePeakEquity(Number(dbChallenge.peak_equity), parsed.equity);

    const closedTradesModel: Trade[] = (parsed.closed_trades as any[]).map((t: any) => ({
      id: `${dbChallenge.id}-${t.ticket}`,
      challenge_id: dbChallenge.id,
      external_id: t.ticket,
      symbol: t.symbol,
      side: t.side,
      volume: t.volume,
      open_price: t.open_price,
      close_price: t.close_price,
      open_time: t.open_time,
      close_time: t.close_time,
      pnl: t.pnl,
      swap: t.swap ?? 0,
      commission: t.commission ?? 0,
      is_open: false,
      created_at: t.close_time ?? parsed.timestamp,
    }));

    const priorClosedIds: string[] = Array.isArray((dbChallenge as any).closed_trades_ids)
      ? (dbChallenge as any).closed_trades_ids
      : [];
    const allClosedIds = Array.from(new Set([...priorClosedIds, ...closedTradesModel.map((t) => t.external_id)]));

    const mergedForDayCount: Pick<Trade, "close_time">[] = [
      ...priorClosedIds.map((ext) => ({
        close_time:
          closedTradesModel.find((t) => t.external_id === ext)?.close_time ??
          new Date().toISOString(),
      })),
      ...closedTradesModel,
    ];
    const distinctDays = countTradingDays(mergedForDayCount);

    const dailyPnlByUtcDate: Record<string, number> = {};
    for (const t of closedTradesModel) {
      if (!t.close_time) continue;
      const d = new Date(t.close_time);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      dailyPnlByUtcDate[key] = (dailyPnlByUtcDate[key] || 0) + Number(t.pnl || 0);
    }

    const enriched = {
      ...(dbChallenge as any),
      peak_equity: newPeak,
      start_daily_balance: startDailyBalance,
      current_balance: parsed.balance,
      current_equity: parsed.equity,
      daily_pnl: parsed.balance - startDailyBalance,
      total_pnl: parsed.balance - Number(dbChallenge.initial_balance),
      total_pnl_pct: ((parsed.balance - Number(dbChallenge.initial_balance)) / Number(dbChallenge.initial_balance)) * 100,
      trading_days_count: distinctDays,
      last_trade_date: parsed.closed_trades.length
        ? parsed.closed_trades[parsed.closed_trades.length - 1].close_time
        : dbChallenge.last_trade_date,
      closed_trades_ids: allClosedIds,
    };

    const result = runRuleEngine({
      challenge: enriched,
      preset,
      closedTradesToday: closedTradesModel,
      currentEquity: parsed.equity,
      currentBalance: parsed.balance,
      dailyStartBalance: startDailyBalance,
      peakEquityAllTime: newPeak,
      dailyPnlByUtcDate,
      allClosedTrades: closedTradesModel.map((t) => ({
        open_time: t.open_time,
        close_time: t.close_time,
        pnl: t.pnl,
        volume: t.volume,
      })),
    });

    let finalPhase = enriched.current_phase;
    let finalStatus: string = result.failed
      ? "failed"
      : result.approved && enriched.current_phase >= preset.phases.length - 1
      ? "approved"
      : result.approved && result.events.includes("phase_change")
      ? "phase_changed"
      : "active";
    let nextResetStartDaily: number = startDailyBalance;

    if (result.approved && result.events.includes("phase_change") && enriched.current_phase < preset.phases.length - 1) {
      const nextPh = preset.phases[enriched.current_phase + 1];
      finalPhase = enriched.current_phase + 1;
      if (nextPh?.reset_balance_on_new_phase) {
        nextResetStartDaily = Number(dbChallenge.initial_balance);
        enriched.start_daily_balance = nextResetStartDaily;
      }
    }

    enriched.current_phase = finalPhase;

    const updatedChallenge = {
      current_balance: parsed.balance,
      current_equity: parsed.equity,
      peak_equity: newPeak,
      start_daily_balance: nextResetStartDaily,
      daily_pnl: enriched.daily_pnl,
      total_pnl: enriched.total_pnl,
      total_pnl_pct: enriched.total_pnl_pct,
      daily_drawdown_pct: result.dailyDDPct,
      max_drawdown_pct: result.maxDDPct,
      trading_days_count: distinctDays,
      closed_trades_ids: allClosedIds,
      last_trade_date: parsed.closed_trades.length
        ? parsed.closed_trades[parsed.closed_trades.length - 1].close_time
        : dbChallenge.last_trade_date,
      ea_last_report_at: parsed.timestamp,
      broker_server_timezone: parsed.server_timezone || (dbChallenge as any).broker_server_timezone || "UTC",
      current_phase: finalPhase,
      status: finalStatus,
      updated_at: new Date().toISOString(),
      ended_at: result.failed || (result.approved && finalPhase >= preset.phases.length - 1)
        ? new Date().toISOString()
        : (dbChallenge as any).ended_at,
    };

    if (source === "db") {
      persistInSupabase(dbChallenge.id, (dbChallenge as any).user_id, {
        challengePatch: updatedChallenge,
        snapshot: {
          balance: parsed.balance,
          equity: parsed.equity,
          daily_pnl: enriched.daily_pnl,
          peak_equity: newPeak,
          open_count: parsed.open_positions.length,
        },
        closedTrades: closedTradesModel,
        events: result.events,
        engineResult: result,
      }).catch((err) => {
        console.error("[report] persistInSupabase error:", err?.message || err);
      });
    }

    return NextResponse.json({
      ok: true,
      received_at: new Date().toISOString(),
      next_report_ms: 3000,
      mode: source,
      challenge: {
        id: dbChallenge.id,
        status: finalStatus,
        phase: finalPhase,
        daily_dd_pct: +result.dailyDDPct.toFixed(4),
        max_dd_pct: +result.maxDDPct.toFixed(4),
        profit_target_pct: +result.profitTargetPct.toFixed(4),
        progress_pct: +result.currentPhaseProgessPct.toFixed(2),
        approved: result.approved,
        failed: result.failed,
        fail_reason: result.failReason,
        warnings: result.events.filter((e: string) => e.startsWith("warning_")),
        alerts: result.events.filter((e: string) => e.startsWith("alert_")),
      },
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "validation", issues: e.issues }, { status: 400 });
    }
    console.error("[report] POST handler error:", e?.message || String(e));
    return NextResponse.json(
      { ok: false, error: "server", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}

// =========================================================================
// Helpers
// =========================================================================

async function resolveChallenge(
  challengeId?: string,
  reportKey?: string
): Promise<{ challenge: any | null; source: "db" | "mock" }> {
  if (!reportKey) return { challenge: null, source: "mock" };

  const sb = createServiceClient();
  let row: any = null;

  try {
    if (challengeId) {
      const r = await sb
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .maybeSingle();
      if (r.error) throw r.error;
      row = r.data;
    }

    if (!row && reportKey.length >= 8) {
      const r = await sb
        .from("challenges")
        .select("*")
        .in("status", ["draft", "linking", "active", "phase_changed"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (r.error) throw r.error;
      const candidates = r.data || [];
      for (const c of candidates) {
        if (!c.report_key_hash) continue;
        try {
          const match = await bcrypt.compare(reportKey, c.report_key_hash);
          if (match) { row = c; break; }
        } catch (_err) { /* skip invalid hash */ }
      }
    }
  } catch (err: any) {
    console.warn("[report] Supabase challenge lookup failed (falling to mock):", err?.message || err);
  }

  if (row) {
    return { challenge: row, source: "db" };
  }

  if (NODE_ENV === "development" || reportKey.startsWith("fk_demo_")) {
    const presetId =
      (challengeId && challengeId.includes("bullfy")) ? "firm-bullfy-preset-100000-one"
      : (challengeId && challengeId.includes("apex")) ? "firm-apex-preset-050000"
      : "firm-ftmo-preset-100000-1step";
    const initial = 100000;
    return {
      source: "mock",
      challenge: {
        id: challengeId || "challenge-demo",
        user_id: "00000000-0000-0000-0000-000000000000",
        firm_id: presetId.startsWith("firm-bullfy") ? "firm-bullfy" : presetId.startsWith("firm-apex") ? "firm-apex" : "firm-ftmo",
        preset_id: presetId,
        market: "forex",
        current_phase: 0,
        status: "active",
        initial_balance: initial,
        current_balance: initial,
        current_equity: initial,
        peak_equity: initial,
        start_daily_balance: initial,
        daily_pnl: 0,
        total_pnl: 0,
        total_pnl_pct: 0,
        daily_drawdown_pct: 0,
        max_drawdown_pct: 0,
        trading_days_count: 0,
        closed_trades_ids: [],
        last_trade_date: null,
        ea_last_report_at: null,
        link_method: "ea_mt5",
      },
    };
  }

  return { challenge: null, source: "mock" };
}

async function persistInSupabase(
  challengeId: string,
  userId: string,
  ctx: {
    challengePatch: Record<string, any>;
    snapshot: { balance: number; equity: number; daily_pnl: number; peak_equity: number; open_count: number };
    closedTrades: Trade[];
    events: RuleEventType[];
    engineResult: any;
  }
) {
  const sb = createServiceClient();

  const { challengePatch, snapshot, closedTrades, events, engineResult } = ctx;
  const now = new Date().toISOString();

  await sb.from("challenges").update(challengePatch).eq("id", challengeId);

  await sb.from("equity_snapshots").insert({
    challenge_id: challengeId,
    balance: snapshot.balance,
    equity: snapshot.equity,
    daily_pnl: snapshot.daily_pnl,
    peak_equity: snapshot.peak_equity,
    open_count: snapshot.open_count,
    created_at: now,
  });

  if (closedTrades.length) {
    const rows = closedTrades.map((t) => ({
      id: t.id,
      challenge_id: challengeId,
      external_id: t.external_id,
      symbol: t.symbol,
      side: t.side,
      volume: t.volume,
      open_price: t.open_price,
      close_price: t.close_price,
      open_time: t.open_time,
      close_time: t.close_time,
      pnl: t.pnl,
      swap: t.swap ?? 0,
      commission: t.commission ?? 0,
      is_open: false,
      duration_ms:
        t.open_time && t.close_time
          ? new Date(t.close_time).getTime() - new Date(t.open_time).getTime()
          : null,
      created_at: now,
    }));
    const { error } = await sb.from("trades").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }

  if (events.length) {
    const thirtySecAgo = new Date(Date.now() - 30_000).toISOString();
    const existing = await sb
      .from("rule_events")
      .select("type, created_at")
      .eq("challenge_id", challengeId)
      .gte("created_at", thirtySecAgo);
    const already = new Set((existing.data || []).map((r: any) => r.type));

    const eventRows = [];
    for (const type of events) {
      if (already.has(type)) continue;
      const severity: "info" | "warning" | "critical" =
        type.startsWith("failed") ? "critical"
        : type.startsWith("alert") || type.startsWith("warning") ? "warning"
        : "info";
      eventRows.push({
        id: `evt_${challengeId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        challenge_id: challengeId,
        type,
        message: buildRuleMessage(type, engineResult),
        severity,
        snapshot_json: {
          equity: snapshot.equity,
          balance: snapshot.balance,
          daily_dd_pct: engineResult.dailyDDPct,
          max_dd_pct: engineResult.maxDDPct,
          profit_pct: engineResult.profitTargetPct,
        },
        created_at: now,
      });
      already.add(type);
    }
    if (eventRows.length) {
      const { error } = await sb.from("rule_events").insert(eventRows);
      if (error) throw error;

      const criticalOrApproved = eventRows.some(
        (r) => r.type === "approved" || r.type.startsWith("failed")
      );
      if (criticalOrApproved) {
        try {
          const notifications = eventRows
            .filter((r) => r.type === "approved" || r.type.startsWith("failed") || r.type.startsWith("alert"))
            .map((r) => ({
              id: `notif_${r.id}`,
              user_id: userId,
              challenge_id: challengeId,
              channel: "in_app" as const,
              subject: r.type === "approved" ? "🎉 Desafío Aprobado" : r.type.startsWith("failed") ? "❌ Desafío Reprobado" : `⚠️ ${r.type}`,
              body: r.message,
              created_at: now,
            }));
          if (notifications.length) {
            await sb.from("notifications").insert(notifications, { defaultToNull: true }).catch(() => {});
          }
        } catch (_err) { /* ignore notification errors */ }
      }
    }
  }
}

function buildRuleMessage(type: RuleEventType, r: any): string {
  switch (type) {
    case "approved":
      return `Prueba APROBADA: objetivo ${Number(r.profitTargetPct || 0).toFixed(2)}% alcanzado y días mínimos cumplidos.`;
    case "failed_max_dd":
      return `Reprobado: Drawdown máximo ${Number(r.maxDDPct || 0).toFixed(2)}%.`;
    case "failed_daily_dd":
      return `Reprobado: Drawdown diario ${Number(r.dailyDDPct || 0).toFixed(2)}%.`;
    case "alert_daily_dd":
      return `Alerta: Drawdown diario al ${Number(r.dailyDDPct || 0).toFixed(2)}% (80% del límite).`;
    case "alert_max_dd":
      return `Alerta: Drawdown máximo al ${Number(r.maxDDPct || 0).toFixed(2)}% (80% del límite).`;
    case "phase_change":
      return `¡Cambio de fase! Has superado la fase actual — tu cuenta entra en verificación.`;
    case "warning_best_day_ratio":
      return `Consistency Rule: Best Day >50% del profit. Advertencia informativa (no falla el desafío).`;
    case "warning_scalping":
      return `Scalping detectado: ≥10% trades cerrados <60s. Primeros 4 retiros limitados al 3% del equity.`;
    case "disconnected":
      return `Cuenta desconectada: último reporte hace más de 5 minutos.`;
    case "reconnected":
      return `Conexión restablecida.`;
    case "min_days_met":
      return `Días mínimos de trading cumplidos. Ya puedes cobrar el objetivo de profit.`;
    default:
      return `Evento: ${type}`;
  }
}
