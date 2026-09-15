import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { aesDecrypt } from "@/lib/crypto/aes-utils";
import {
  buildExchange,
  fetchSnapshot,
  type CryptoSnapshot,
} from "@/lib/engine/crypto-connector";
import {
  runRuleEngine,
  updatePeakEquity,
  isNewTradingDay,
  countTradingDays,
} from "@/lib/engine/rules";
import { getPresetById } from "@/lib/data/seed";
import type { RuleEventType, Trade } from "@/lib/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const _RAW_PULL = process.env.WORKER_PULL_SECRET;
const DEV_DEFAULT_PULL = "dev-fundguard-pull-secret";
const IS_PROD_PULL = process.env.NODE_ENV === "production";
const SHARED_SECRET = (() => {
  const raw = _RAW_PULL ? String(_RAW_PULL).trim() : "";
  if (raw.length) return raw;
  if (IS_PROD_PULL) return null;
  return DEV_DEFAULT_PULL;
})();

export async function POST(req: Request) {
  if (!SHARED_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: "misconfigured_server",
        hint: "WORKER_PULL_SECRET no configurado en variables de entorno. Endpoint deshabilitado.",
      },
      { status: 503 },
    );
  }
  const auth = req.headers.get("x-pull-secret");
  if (auth !== SHARED_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();
  const { data: rows, error: chErr } = await sb
    .from("challenges")
    .select("id, crypto_exchange_id, crypto_api_key_enc, crypto_api_secret_enc, crypto_passphrase_enc, current_phase, preset_id, peak_equity, current_balance, current_equity, start_daily_balance, last_trade_date, trading_days_count, status")
    .eq("link_method", "crypto_api")
    .in("status", ["active", "linking"])
    .not("crypto_exchange_id", "is", null)
    .limit(200);

  if (chErr || !rows) {
    return NextResponse.json({ ok: false, error: chErr?.message || "sin retos" }, { status: 500 });
  }

  const results: any[] = [];
  const now = new Date().toISOString();

  for (const r of rows) {
    try {
      if (!r.crypto_api_key_enc || !r.crypto_api_secret_enc || !r.crypto_exchange_id) continue;
      const key = aesDecrypt(r.crypto_api_key_enc);
      const secret = aesDecrypt(r.crypto_api_secret_enc);
      const passphrase = r.crypto_passphrase_enc ? aesDecrypt(r.crypto_passphrase_enc) : undefined;

      let snap: CryptoSnapshot;
      try {
        snap = await fetchSnapshot({
          exchangeId: r.crypto_exchange_id,
          apiKey: key,
          secret,
          password: passphrase,
          sandbox: false,
        });
      } catch (e: any) {
        await sb.from("challenges").update({
          status: r.status === "linking" ? "linking" : "disconnected",
          ea_last_report_at: now,
        }).eq("id", r.id);
        results.push({ challenge_id: r.id, ok: false, error: e?.message || "pull failed" });
        continue;
      }

      const balance = snap.balance;
      const equity = snap.equity;

      const { data: lastSnap, error: lastErr } = await sb
        .from("equity_snapshots")
        .select("*")
        .eq("challenge_id", r.id)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();

      const prevStartDaily = r.start_daily_balance ?? balance;
      const prevPeak = r.peak_equity ?? equity;
      const newPeak = updatePeakEquity(prevPeak, equity);
      const dailyPnl = equity - prevStartDaily;
      const dailyDDPct = ((newPeak - equity) / newPeak) * 100;
      const maxDDPct = (((r.initial_balance ?? balance) - equity) / (r.initial_balance ?? balance)) * 100 * -1;
      const totalPnl = equity - (r.initial_balance ?? balance);
      const totalPnlPct = (totalPnl / (r.initial_balance ?? balance)) * 100;

      const preset = getPresetById(r.preset_id);
      const resetHour = preset?.daily_reset_hour_utc ?? 0;
      const newDay = !lastSnap || isNewTradingDay(lastSnap.timestamp, snap.timestamp, resetHour);
      const tradeDates = new Set<string>();
      if (lastSnap?.timestamp) tradeDates.add(new Date(lastSnap.timestamp).toDateString());
      tradeDates.add(new Date(snap.timestamp).toDateString());
      const daysCount = Math.max(r.trading_days_count || 0, tradeDates.size + (snap.closed_trades_today?.length ? 1 : 0));

      await sb.from("equity_snapshots").insert({
        challenge_id: r.id,
        balance,
        equity,
        daily_pnl: dailyPnl,
        total_pnl: totalPnl,
        daily_dd_pct: dailyDDPct,
        max_dd_pct: maxDDPct,
        open_positions_count: snap.open_positions?.length ?? 0,
        timestamp: snap.timestamp,
      });

      const phase = 0;
      const engineResult: any = {
        dailyDDPct,
        maxDDPct,
        profitTargetPct: 0,
        currentPhaseProgessPct: 0,
        tradingDaysMet: daysCount >= 1,
        approved: false,
        failed: false,
        events: [] as RuleEventType[],
        failReason: undefined as string | undefined,
      };

      let newStatus = r.status === "linking" ? "active" : r.status;
      if (engineResult.failed) newStatus = "failed";
      else if (engineResult.approved) newStatus = "approved";

      await sb.from("challenges").update({
        current_balance: balance,
        current_equity: equity,
        peak_equity: newPeak,
        daily_pnl: dailyPnl,
        total_pnl: totalPnl,
        total_pnl_pct: totalPnlPct,
        daily_drawdown_pct: dailyDDPct,
        max_drawdown_pct: maxDDPct,
        trading_days_count: daysCount,
        start_daily_balance: newDay ? balance : prevStartDaily,
        last_trade_date: snap.timestamp,
        ea_last_report_at: now,
        status: newStatus,
      }).eq("id", r.id);

      results.push({ challenge_id: r.id, ok: true, balance, equity });
    } catch (e: any) {
      results.push({ challenge_id: (r as any).id, ok: false, error: e?.message || "fatal" });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    results,
  });
}
