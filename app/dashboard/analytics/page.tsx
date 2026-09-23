import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  DollarSign,
  Percent,
  Calendar,
  Activity,
  Sparkles,
  Zap,
  ArrowRight as ArrowRightIcon,
} from "@/lib/ui/lucide-polyfill";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  formatCurrency,
  formatPercent,
  cnPnl,
  formatNumber,
  cn,
} from "@/lib/utils";
import type { Challenge, Firm, MarketType, RuleEvent } from "@/lib/types";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";

export const dynamic = "force-dynamic";

interface ChallengeWithFirm extends Challenge {
  firm?: Firm | null;
}

export default async function AnalyticsPage() {
  try {
    const sb = await createClient();
    const { data } = await sb.auth.getUser();
    if (!data?.user) redirect("/login?next=/dashboard/analytics");
    const uid = data.user.id;

    let challengesRaw: any[] = [];
    try {
      const res = await sb
        .from("challenges")
        .select("*, firm:firms(*)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      challengesRaw = res.data || [];
    } catch {
      challengesRaw = [];
    }

    const challenges = (challengesRaw as ChallengeWithFirm[]) || [];
    const hasChallenges = challenges.length > 0;

    const challengeIds = challenges.map((c) => c.id);

    let events: any[] = [];
    try {
      events = challengeIds.length
        ? (
            await sb
              .from("rule_events")
              .select("id, challenge_id, type, severity, created_at")
              .in("challenge_id", challengeIds)
              .order("created_at", { ascending: true })
          ).data || []
        : [];
    } catch {
      events = [];
    }

    const eventsTyped = events as RuleEvent[];

    let snaps: any[] = [];
    try {
      snaps = challengeIds.length
        ? (
            await sb
              .from("equity_snapshots")
              .select("id, challenge_id, balance, equity, total_pnl, daily_pnl, timestamp")
              .in("challenge_id", challengeIds)
              .order("timestamp", { ascending: true })
              .limit(1200)
          ).data || []
        : [];
    } catch {
      snaps = [];
    }

    const snapsTyped = snaps as {
      id: string;
      challenge_id: string;
      balance: number;
      equity: number;
      total_pnl: number;
      daily_pnl: number;
      timestamp: string;
    }[];

    const aggs = computeAggregates(challenges, eventsTyped, snapsTyped);

    return (
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8">
        <div>
          <div className="chip-gold mb-3 !py-1">
            <Activity className="w-3 h-3" /> Analíticas
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">
            Tu <span className="gold-gradient-text">performance</span> global
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Métricas agregadas por firma, mercado y fase. Identifica patrones y
            optimiza tu estrategia.
          </p>
        </div>

        <AnalyticsClient
          aggregates={aggs}
          events={eventsTyped}
          snapshots={snapsTyped}
          challenges={challenges as any}
          hasRealData={hasChallenges}
        />
      </div>
    );
  } catch (e) {
    redirect("/login?next=/dashboard/analytics");
  }
}

// ============================================================================
// Aggregations (pure, deterministic) — fallback con mocks si dataset vacío
// ============================================================================

export interface AnalyticsAggregates {
  kpis: {
    total_challenges: number;
    approved: number;
    failed: number;
    approval_rate: number;
    total_pnl: number;
    total_pnl_pct: number;
    avg_daily_dd: number;
    avg_max_dd: number;
    active_count: number;
    days_active: number;
    best_pnl: number;
    worst_pnl: number;
    total_volume_usd: number;
    events_count: number;
  };
  byFirm: { firm_id: string; firm_name: string; pnl: number; challenges: number; approved: number; rate: number }[];
  byMarket: { market: MarketType; challenges: number; pnl: number; pct: number }[];
  byPhase: { phase: string; challenges: number; approved: number; rate: number; avg_pnl_pct: number }[];
  pnlOverTime: { t: string; date: string; pnl: number; equity: number }[];
  firmRankingBars: { firm: string; pnl: number; rate: number }[];
  eventsTimeline: { t: string; label: string; approved: number; failed: number; alerts: number }[];
}

function computeAggregates(
  challenges: ChallengeWithFirm[],
  events: RuleEvent[],
  snaps: { id: string; challenge_id: string; balance: number; equity: number; total_pnl: number; daily_pnl: number; timestamp: string }[],
): AnalyticsAggregates {
  const kpis = {
    total_challenges: challenges.length,
    approved: challenges.filter((c) => c.status === "approved").length,
    failed: challenges.filter((c) => c.status === "failed").length,
    approval_rate: 0,
    total_pnl: 0,
    total_pnl_pct: 0,
    avg_daily_dd: 0,
    avg_max_dd: 0,
    active_count: challenges.filter((c) => c.status === "active" || c.status === "linking").length,
    days_active: 0,
    best_pnl: 0,
    worst_pnl: 0,
    total_volume_usd: 0,
    events_count: events.length,
  };

  challenges.forEach((c) => {
    kpis.total_pnl += c.total_pnl || 0;
    kpis.avg_daily_dd += c.daily_drawdown_pct || 0;
    kpis.avg_max_dd += c.max_drawdown_pct || 0;
    if (c.total_pnl > kpis.best_pnl) kpis.best_pnl = c.total_pnl;
    if (c.total_pnl < kpis.worst_pnl) kpis.worst_pnl = c.total_pnl;
    kpis.total_volume_usd += c.initial_balance || 0;
    if (c.started_at && (c.ended_at || c.status !== "draft")) {
      const start = new Date(c.started_at).getTime();
      const end = c.ended_at ? new Date(c.ended_at).getTime() : Date.now();
      kpis.days_active += Math.max(0, Math.round((end - start) / 86400_000));
    }
  });

  const denom = challenges.length || 1;
  kpis.approval_rate = kpis.total_challenges
    ? Math.round((kpis.approved / (kpis.approved + kpis.failed || 1)) * 100)
    : 0;
  kpis.avg_daily_dd = +(kpis.avg_daily_dd / denom).toFixed(2);
  kpis.avg_max_dd = +(kpis.avg_max_dd / denom).toFixed(2);
  kpis.total_pnl_pct = kpis.total_volume_usd
    ? +((kpis.total_pnl / kpis.total_volume_usd) * 100).toFixed(2)
    : 0;

  // byFirm
  const firmMap = new Map<string, { firm_id: string; firm_name: string; pnl: number; challenges: number; approved: number }>();
  challenges.forEach((c) => {
    const id = c.firm_id;
    const name = c.firm?.name || `Firm ${id.slice(0, 6)}`;
    if (!firmMap.has(id)) firmMap.set(id, { firm_id: id, firm_name: name, pnl: 0, challenges: 0, approved: 0 });
    const r = firmMap.get(id)!;
    r.challenges += 1;
    r.pnl += c.total_pnl || 0;
    if (c.status === "approved") r.approved += 1;
  });
  const byFirm = Array.from(firmMap.values())
    .map((r) => ({ ...r, rate: r.challenges ? Math.round((r.approved / r.challenges) * 100) : 0 }))
    .sort((a, b) => b.pnl - a.pnl);

  // byMarket
  const mktMap = new Map<MarketType, { challenges: number; pnl: number; balance_sum: number }>();
  (["forex", "futures", "crypto", "synthetic_indices"] as MarketType[]).forEach((m) =>
    mktMap.set(m, { challenges: 0, pnl: 0, balance_sum: 0 }),
  );
  challenges.forEach((c) => {
    const r = mktMap.get(c.market)!;
    r.challenges += 1;
    r.pnl += c.total_pnl || 0;
    r.balance_sum += c.initial_balance || 0;
  });
  const byMarket = Array.from(mktMap.entries())
    .filter(([, r]) => r.challenges > 0)
    .map(([market, r]) => ({
      market,
      challenges: r.challenges,
      pnl: r.pnl,
      pct: r.balance_sum ? +((r.pnl / r.balance_sum) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.challenges - a.challenges);

  // byPhase
  const phaseMap = new Map<string, { challenges: number; approved: number; pnl_pct_sum: number }>();
  challenges.forEach((c) => {
    const key = c.current_phase ? `Fase ${c.current_phase + 1}` : "Fase 1";
    if (!phaseMap.has(key)) phaseMap.set(key, { challenges: 0, approved: 0, pnl_pct_sum: 0 });
    const r = phaseMap.get(key)!;
    r.challenges += 1;
    if (c.status === "approved") r.approved += 1;
    r.pnl_pct_sum += c.total_pnl_pct || 0;
  });
  const byPhase = Array.from(phaseMap.entries()).map(([phase, r]) => ({
    phase,
    challenges: r.challenges,
    approved: r.approved,
    rate: r.challenges ? Math.round((r.approved / r.challenges) * 100) : 0,
    avg_pnl_pct: +(r.pnl_pct_sum / (r.challenges || 1)).toFixed(2),
  }));

  // PnL over time (snapshots daily buckets -> cumulative PnL at that day)
  const dailyBuckets = new Map<string, { pnlSum: number; equityLast: number }>();
  snaps.forEach((s) => {
    const d = s.timestamp.slice(0, 10);
    const cur = dailyBuckets.get(d) || { pnlSum: 0, equityLast: 0 };
    cur.pnlSum += s.daily_pnl || 0;
    cur.equityLast = s.equity || cur.equityLast;
    dailyBuckets.set(d, cur);
  });
  const sortedDays = Array.from(dailyBuckets.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  let cumulativePnl = 0;
  let cumulativeEquity = 0;
  const pnlOverTime = sortedDays.map(([d, v]) => {
    cumulativePnl += v.pnlSum;
    cumulativeEquity = v.equityLast || cumulativeEquity;
    return {
      t: d.slice(5),
      date: d,
      pnl: +cumulativePnl.toFixed(2),
      equity: +cumulativeEquity.toFixed(2),
    };
  });

  // firm ranking bars
  const firmRankingBars = byFirm.slice(0, 8).map((r) => ({ firm: r.firm_name, pnl: r.pnl, rate: r.rate }));

  // events timeline by day
  const evBuckets = new Map<string, { approved: number; failed: number; alerts: number }>();
  events.forEach((e) => {
    const d = e.created_at.slice(0, 10);
    const cur = evBuckets.get(d) || { approved: 0, failed: 0, alerts: 0 };
    if (e.type === "approved" || e.type === "phase_change" || e.type === "min_days_met") cur.approved += 1;
    else if (e.type.startsWith("failed_")) cur.failed += 1;
    else cur.alerts += 1;
    evBuckets.set(d, cur);
  });
  const evSorted = Array.from(evBuckets.entries()).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-21);
  const eventsTimeline = evSorted.map(([d, v]) => ({
    t: d.slice(5),
    label: d,
    approved: v.approved,
    failed: v.failed,
    alerts: v.alerts,
  }));

  return {
    kpis,
    byFirm,
    byMarket,
    byPhase,
    pnlOverTime,
    firmRankingBars,
    eventsTimeline,
  };
}
