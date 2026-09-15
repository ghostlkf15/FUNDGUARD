import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BellRing,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Check,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RuleEvent, Challenge, Firm, RuleEventType } from "@/lib/types";
import { NotificationsClient } from "@/components/dashboard/notifications-client";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "approved" | "failed" | "alert" | "system";

interface EnrichedEvent extends RuleEvent {
  challenge?: (Challenge & { firm: Firm }) | null;
}

const KIND_FROM_TYPE: Partial<Record<RuleEventType, FilterKey>> = {
  approved: "approved",
  phase_change: "approved",
  min_days_met: "approved",
  failed_max_dd: "failed",
  failed_daily_dd: "failed",
  failed_special: "failed",
  disconnected: "system",
  reconnected: "system",
  alert_daily_dd: "alert",
  alert_max_dd: "alert",
  warning_best_day_ratio: "alert",
  warning_scalping: "alert",
};

export default async function NotificationsPage() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data?.user) redirect("/login?next=/dashboard/notifications");
  const uid = data.user.id;

  const { data: ownChallenges } = await sb
    .from("challenges")
    .select(
      "id, user_id, firm_id, preset_id, market, current_phase, status, initial_balance, current_balance, current_equity, peak_equity, start_daily_balance, daily_pnl, total_pnl, total_pnl_pct, daily_drawdown_pct, max_drawdown_pct, trading_days_count, last_trade_date, ea_last_report_at, broker_server_timezone, link_method, report_key_hash, crypto_api_key_enc, crypto_api_secret_enc, crypto_exchange_id, crypto_passphrase_enc, started_at, ended_at, created_at, updated_at, firm:firms(*)",
    )
    .eq("user_id", uid);

  const challengeIds = (ownChallenges ?? []).map((c: { id: string }) => c.id);

  const { data: events = [] } = challengeIds.length
    ? await sb
        .from("rule_events")
        .select(
          "id, challenge_id, type, message, severity, is_read, read_at, snapshot_json, created_at",
        )
        .in("challenge_id", challengeIds)
        .order("created_at", { ascending: false })
        .limit(400)
    : { data: [] };

  const enriched: EnrichedEvent[] = (events as RuleEvent[]).map((ev) => {
    const ch = (ownChallenges ?? []).find((c: { id: string }) => c.id === ev.challenge_id) as
      | (Challenge & { firm: Firm })
      | undefined;
    return { ...ev, challenge: ch ?? null };
  });

  const unreadCount = enriched.filter((e) => !e.is_read).length;
  const counts: Record<FilterKey, number> = {
    all: enriched.length,
    approved: enriched.filter((e) => KIND_FROM_TYPE[e.type] === "approved").length,
    failed: enriched.filter((e) => KIND_FROM_TYPE[e.type] === "failed").length,
    alert: enriched.filter((e) => KIND_FROM_TYPE[e.type] === "alert").length,
    system: enriched.filter((e) => KIND_FROM_TYPE[e.type] === "system").length,
  };

  const fallback = buildMockNotifications();
  const finalEvents: EnrichedEvent[] = enriched.length ? enriched : fallback;
  const finalUnread = enriched.length ? unreadCount : fallback.filter((f) => !f.is_read).length;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="chip-gold mb-3 !py-1">
          <BellRing className="w-3 h-3" /> Centro de notificaciones
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">
              Tu <span className="gold-gradient-text">timeline</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Todos los eventos del motor de reglas, alertas y cambios de estado en una sola vista.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="chip-gold !py-0 !gap-1.5">
              <BellRing className="w-3 h-3" />
              <span className="font-semibold">{finalUnread}</span>
              <span className="text-muted-foreground/80">sin leer</span>
            </div>
          </div>
        </div>
      </div>

      <NotificationsClient
        initialEvents={finalEvents as any}
        initialCounts={counts}
        initialUnread={finalUnread}
        hasRealData={enriched.length > 0}
      />
    </div>
  );
}

function buildMockNotifications(): EnrichedEvent[] {
  const now = Date.now();
  const rows: Omit<EnrichedEvent, "challenge">[] = [
    {
      id: "m1",
      challenge_id: "mock_ch_1",
      type: "approved",
      message: "Objetivo 10% alcanzado en 14 días. Ya puedes pasar a Fase 2.",
      severity: "info",
      is_read: false,
      read_at: null,
      created_at: new Date(now - 2 * 3600_000).toISOString(),
    },
    {
      id: "m2",
      challenge_id: "mock_ch_2",
      type: "alert_daily_dd",
      message: "FundedNext 25K · DD actual 4.1% / 5%. Reduce exposición.",
      severity: "warning",
      is_read: false,
      read_at: null,
      created_at: new Date(now - 6 * 3600_000).toISOString(),
    },
    {
      id: "m3",
      challenge_id: "mock_ch_1",
      type: "reconnected",
      message: "EA MT5 volvió a reportar tras 18 min sin señal.",
      severity: "info",
      is_read: true,
      read_at: new Date(now - 10 * 3600_000).toISOString(),
      created_at: new Date(now - 26 * 3600_000).toISOString(),
    },
    {
      id: "m4",
      challenge_id: "mock_ch_3",
      type: "failed_daily_dd",
      message: "Drawdown diario superado: 5.1% / 5%. Desafío cerrado automáticamente.",
      severity: "critical",
      is_read: true,
      read_at: new Date(now - 30 * 3600_000).toISOString(),
      created_at: new Date(now - 52 * 3600_000).toISOString(),
    },
    {
      id: "m5",
      challenge_id: "mock_ch_2",
      type: "warning_best_day_ratio",
      message: "El día de hoy representa el 42% del PnL total. Revisa consistencia.",
      severity: "warning",
      is_read: true,
      read_at: new Date(now - 70 * 3600_000).toISOString(),
      created_at: new Date(now - 96 * 3600_000).toISOString(),
    },
    {
      id: "m6",
      challenge_id: "mock_ch_1",
      type: "phase_change",
      message: "Apex 50K ha cambiado de Fase 1 a Fase 2 automáticamente.",
      severity: "info",
      is_read: true,
      read_at: new Date(now - 170 * 3600_000).toISOString(),
      created_at: new Date(now - 168 * 3600_000).toISOString(),
    },
  ];
  return rows.map((r) => ({ ...r, challenge: null }));
}
