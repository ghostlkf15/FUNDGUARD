"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnalyticsAggregates } from "@/app/dashboard/analytics/page";
import type { Challenge, Firm, MarketType, RuleEvent } from "@/lib/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";
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
  Trophy,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  cnPnl,
  formatNumber,
  cn,
} from "@/lib/utils";

interface AnalyticsClientProps {
  aggregates: AnalyticsAggregates;
  events: RuleEvent[];
  snapshots: {
    id: string;
    challenge_id: string;
    balance: number;
    equity: number;
    total_pnl: number;
    daily_pnl: number;
    timestamp: string;
  }[];
  challenges: (Challenge & { firm?: Firm | null })[];
  hasRealData: boolean;
}

const MARKET_LABEL: Record<MarketType, string> = {
  forex: "Forex",
  futures: "Futuros",
  crypto: "Cripto",
  synthetic_indices: "Sintéticos",
};

export function AnalyticsClient({
  aggregates: a,
  hasRealData,
  challenges,
}: AnalyticsClientProps) {
  const router = useRouter();
  const k = a.kpis;

  const KPI_DEFS = [
    {
      label: "Total desafíos",
      value: k.total_challenges.toString(),
      sub: `${k.active_count} activos · ${k.days_active} días operados`,
      icon: Target,
      accent: "gold",
    },
    {
      label: "Aprobados",
      value: `${k.approved}`,
      sub: `Rate ${k.approval_rate}% · ${k.failed} fallidos`,
      icon: Trophy,
      accent: "emerald",
    },
    {
      label: "PnL Total",
      value: formatCurrency(k.total_pnl),
      sub: formatPercent(k.total_pnl_pct),
      icon: DollarSign,
      accent: "sky",
    },
    {
      label: "DD medio",
      value: `${k.avg_max_dd}%`,
      sub: `Diario ${k.avg_daily_dd}% · meta <3%`,
      icon: Percent,
      accent: "rose",
    },
  ] as const;

  const miniStats = useMemo(
    () => [
      {
        icon: Zap,
        label: "Mejor trade",
        value: formatCurrency(k.best_pnl),
        tone: "emerald",
      },
      {
        icon: ShieldCheck,
        label: "Peor trade",
        value: formatCurrency(k.worst_pnl),
        tone: "rose",
      },
      {
        icon: Trophy,
        label: "Volumen total",
        value: formatCurrency(k.total_volume_usd),
        tone: "gold",
      },
      {
        icon: Activity,
        label: "Eventos motor",
        value: k.events_count.toString(),
        tone: "sky",
      },
    ],
    [k],
  );

  const byFirmTotal = useMemo(
    () => Math.max(1, ...a.firmRankingBars.map((r) => Math.abs(r.pnl))),
    [a.firmRankingBars],
  );

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {KPI_DEFS.map((kpi, i) => {
          const bgs = [
            "from-gold-400/20 to-gold-600/5 border-gold-500/20",
            "from-emerald-400/20 to-emerald-600/5 border-emerald-400/20",
            "from-sky-400/20 to-sky-600/5 border-sky-400/20",
            "from-rose-400/20 to-rose-600/5 border-rose-400/20",
          ];
          const txt = ["text-gold-300", "text-emerald-300", "text-sky-300", "text-rose-300"];
          return (
            <div key={kpi.label} className="stat-card relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gold-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">
                    {kpi.label}
                  </div>
                  <div className="font-display text-3xl font-bold leading-none">
                    {kpi.value}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{kpi.sub}</div>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center bg-gradient-to-br ${bgs[i]}`}
                >
                  <kpi.icon className={`w-5 h-5 ${txt[i]}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini stats + badge */}
      <div className="grid lg:grid-cols-4 gap-5">
        {miniStats.map((m, i) => {
          const tones = {
            gold: "from-gold-500/20 via-amber-500/10 to-transparent border-gold-500/20 text-gold-300",
            emerald:
              "from-emerald-500/20 via-emerald-400/5 to-transparent border-emerald-500/20 text-emerald-300",
            rose: "from-rose-500/20 via-rose-400/5 to-transparent border-rose-500/20 text-rose-300",
            sky: "from-sky-500/20 via-sky-400/5 to-transparent border-sky-500/20 text-sky-300",
          } as const;
          return (
            <div
              key={m.label}
              className="glass-card p-5 relative overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-60",
                  tones[m.tone as keyof typeof tones].split(" border")[0],
                )}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 shrink-0 rounded-2xl border flex items-center justify-center",
                    tones[m.tone as keyof typeof tones],
                  )}
                >
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground/80">
                    {m.label}
                  </div>
                  <div
                    className={cn(
                      "font-display text-xl font-semibold mt-0.5",
                      (m.tone === "emerald" || m.tone === "rose") &&
                        (m.value.startsWith("-")
                          ? "text-rose-300"
                          : "text-emerald-300"),
                    )}
                  >
                    {m.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Area chart PnL over time + Ranking firmas */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-gold-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {!hasRealData && (
              <div className="chip-gold !py-0 !gap-1.5 text-[10px] uppercase tracking-[0.18em]">
                <Sparkles className="w-3 h-3" /> Dataset demo
              </div>
            )}
          </div>
          <div className="flex items-end justify-between mb-5 relative">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Curva de capital
              </div>
              <h2 className="font-display text-2xl font-semibold">PnL acumulado</h2>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <span className={cnPnl(k.total_pnl)}>{formatCurrency(k.total_pnl)}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-muted-foreground/80">{a.pnlOverTime.length} sesiones</span>
              </div>
            </div>
            <div className="chip-gold !py-0">últimos {a.pnlOverTime.length} días</div>
          </div>
          <div className="h-72 relative">
            <svg width="0" height="0" className="absolute" aria-hidden>
              <defs>
                <linearGradient id="gradPnlFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d4a857" stopOpacity="0.38" />
                  <stop offset="60%" stopColor="#d4a857" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#d4a857" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradPnlStroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#6b5422" />
                  <stop offset="50%" stopColor="#eac476" />
                  <stop offset="100%" stopColor="#8a6b22" />
                </linearGradient>
                <filter id="pnlGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a.pnlOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldStroke" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#b8903a" />
                    <stop offset="100%" stopColor="#f2d28b" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 6"
                  stroke="rgba(255,255,255,0.045)"
                  vertical={false}
                />
                <XAxis
                  dataKey="t"
                  stroke="rgba(255,255,255,0.25)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.25)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={60}
                  tickFormatter={(v: number) =>
                    Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
                  }
                />
                <Tooltip
                  cursor={{ stroke: "rgba(234,196,118,0.25)", strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "rgba(10,8,6,0.95)",
                    border: "1px solid rgba(212,168,87,0.3)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#d4a857", fontWeight: 600 }}
                  formatter={(v: number, n: string) => [formatCurrency(v), n === "pnl" ? "PnL" : "Equity"]}
                />
                <ReferenceLine y={0} stroke="rgba(212,168,87,0.35)" strokeDasharray="4 3" />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="url(#gradPnlStroke)"
                  strokeWidth={2.2}
                  fill="url(#gradPnlFill)"
                  filter="url(#pnlGlow)"
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Distribución
              </div>
              <h2 className="font-display text-2xl font-semibold mb-1">Por mercado</h2>
              <div className="text-xs text-muted-foreground/70">
                {a.byMarket.reduce((s, m) => s + m.challenges, 0)} desafíos totales
              </div>
            </div>
            <div className="chip-gold !py-0">
              <BarChart3 className="w-3 h-3" /> Mix
            </div>
          </div>
          <ul className="space-y-5">
            {a.byMarket.length === 0 ? (
              <li className="text-sm text-muted-foreground text-center py-8">
                Sin datos de mercado aún.
              </li>
            ) : (
              a.byMarket.map((m) => {
                const totalCh = a.byMarket.reduce((s, x) => s + x.challenges, 0) || 1;
                const w = Math.round((m.challenges / totalCh) * 100);
                const tone = {
                  forex: "from-gold-400 to-amber-600",
                  futures: "from-sky-400 to-sky-600",
                  crypto: "from-emerald-400 to-emerald-600",
                  synthetic_indices: "from-fuchsia-400 to-fuchsia-600",
                }[m.market];
                return (
                  <li key={m.market}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium">{MARKET_LABEL[m.market]}</span>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            m.pnl >= 0 ? "text-emerald-300" : "text-rose-300",
                          )}
                        >
                          {formatCurrency(m.pnl)}
                        </span>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {m.challenges} ch · {w}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-track h-2.5 overflow-hidden">
                      <div
                        className={cn(
                          "progress-fill h-full rounded-full bg-gradient-to-r relative",
                          tone,
                        )}
                        style={{ width: `${w}%` }}
                      >
                        <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep opacity-70" />
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <div className="mt-6 pt-6 border-t border-white/[0.05]">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Por fase
            </div>
            <div className="space-y-2">
              {a.byPhase.map((p) => (
                <div
                  key={p.phase}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-sm font-medium">{p.phase}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{p.challenges}ch</span>
                    <span
                      className={cn(
                        "font-semibold",
                        p.rate >= 60 ? "text-emerald-300" : p.rate >= 30 ? "text-amber-300" : "text-rose-300",
                      )}
                    >
                      {p.rate}%
                    </span>
                    <span className="text-muted-foreground/80">
                      {p.avg_pnl_pct >= 0 ? "+" : ""}
                      {p.avg_pnl_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ranking firmas (barras horizontales custom) + Events timeline bars stack */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-gold-fine opacity-20 mask-fade-b pointer-events-none" />
          <div className="flex items-end justify-between mb-5 relative">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Ranking
              </div>
              <h2 className="font-display text-2xl font-semibold">PnL por prop firm</h2>
            </div>
            <div className="chip-gold !py-0">últimos 90 días</div>
          </div>
          <div className="space-y-4 relative">
            {a.firmRankingBars.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Crea desafíos para ver tu ranking por firma.
              </p>
            ) : (
              a.firmRankingBars.map((r) => {
                const w = Math.min(100, Math.abs((r.pnl / byFirmTotal) * 100));
                const pos = r.pnl >= 0;
                return (
                  <div key={r.firm}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <TrendingUp
                          className={cn(
                            "w-4 h-4 shrink-0",
                            pos ? "text-emerald-300 rotate-0" : "text-rose-300 -rotate-180",
                          )}
                        />
                        <span className="font-medium truncate">{r.firm}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={pos ? "text-emerald-300" : "text-rose-300"}>
                          {formatCurrency(r.pnl)}
                        </span>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          Aprob. {r.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-track h-1.5">
                      <div
                        className={cn(
                          "progress-fill relative overflow-hidden",
                          pos
                            ? "bg-gradient-to-r from-emerald-400/80 to-emerald-300"
                            : "bg-gradient-to-r from-rose-500/80 to-rose-300",
                        )}
                        style={{ width: `${w}%` }}
                      >
                        <span className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep opacity-80" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute -left-14 -bottom-14 w-56 h-56 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Timeline de eventos
            </div>
            <h2 className="font-display text-2xl font-semibold mb-5">Reglas · Alertas</h2>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <StackedEventsChart data={a.eventsTimeline} />
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] uppercase tracking-widest">
              <LegendChip className="bg-emerald-400/90" label="Aprob." />
              <LegendChip className="bg-rose-400/90" label="Fallos" />
              <LegendChip className="bg-amber-400/90" label="Alertas" />
            </div>
          </div>
        </div>
      </div>

      {/* Challenges summary table top 5 */}
      <div className="glass-card !p-0 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gold-500/8 via-transparent to-transparent pointer-events-none" />
        <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap relative">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Detalle por desafío
            </div>
            <h2 className="font-display text-2xl font-semibold">Top desafíos por PnL</h2>
          </div>
          <Link
            href="/dashboard"
            className="btn-ghost-gold px-4 py-2 text-sm !rounded-xl inline-flex items-center gap-2"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground/80 border-y border-white/[0.04] bg-white/[0.02]">
                <th className="text-left font-medium px-6 py-3">Desafío</th>
                <th className="text-left font-medium px-3 py-3">Fase</th>
                <th className="text-right font-medium px-3 py-3">Balance inicial</th>
                <th className="text-right font-medium px-3 py-3">PnL</th>
                <th className="text-right font-medium px-3 py-3">% DD</th>
                <th className="text-right font-medium px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.035]">
              {(challenges.length
                ? [...challenges].sort((a, b) => (b.total_pnl || 0) - (a.total_pnl || 0)).slice(0, 6)
                : demoChallenges()
              ).map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                  onClick={() => router.push(`/dashboard/${c.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Target className="w-4 h-4 text-gold-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[240px]">
                          {c.firm?.name || `Challenge ${c.id.slice(0, 6)}`}
                        </div>
                        <div className="text-[11px] text-muted-foreground/70 truncate">
                          {c.market} · {c.link_method || "sin vincular"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wider border border-white/[0.06] bg-white/[0.03]">
                      Fase {(c.current_phase || 0) + 1}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right tabular-nums text-muted-foreground/90">
                    {formatCurrency(c.initial_balance)}
                  </td>
                  <td className="px-3 py-4 text-right tabular-nums font-semibold">
                    <span className={cnPnl(c.total_pnl || 0)}>
                      {formatCurrency(c.total_pnl || 0)}
                      <span className="block text-[10px] text-muted-foreground/70 font-normal mt-0.5">
                        {formatPercent(c.total_pnl_pct || 0)}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right tabular-nums">
                    <span
                      className={cn(
                        "font-medium",
                        (c.max_drawdown_pct || 0) >= 8
                          ? "text-rose-300"
                          : (c.max_drawdown_pct || 0) >= 4
                          ? "text-amber-300"
                          : "text-emerald-300/80",
                      )}
                    >
                      {(c.max_drawdown_pct || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StatusPill status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LegendChip({ className, label }: { className: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] justify-center">
      <span className={cn("w-2.5 h-2.5 rounded-full", className)} />
      <span className="text-[10px] text-muted-foreground/90 tracking-widest">{label}</span>
    </div>
  );
}

function StackedEventsChart({
  data,
}: {
  data: AnalyticsAggregates["eventsTimeline"];
}) {
  return (
    <BarChart
      data={data}
      margin={{ top: 6, right: 8, bottom: 0, left: -28 }}
    >
      <CartesianGrid
        stroke="rgba(255,255,255,0.04)"
        vertical={false}
        strokeDasharray="3 4"
      />
      <XAxis
        dataKey="t"
        stroke="rgba(255,255,255,0.22)"
        tickLine={false}
        axisLine={false}
        fontSize={10}
        interval="preserveStartEnd"
      />
      <YAxis
        stroke="rgba(255,255,255,0.2)"
        tickLine={false}
        axisLine={false}
        fontSize={10}
        allowDecimals={false}
        width={30}
      />
      <Tooltip
        cursor={{ fill: "rgba(212,168,87,0.06)" }}
        contentStyle={{
          background: "rgba(10,8,6,0.95)",
          border: "1px solid rgba(212,168,87,0.3)",
          borderRadius: 12,
          fontSize: 12,
          color: "#fff",
        }}
        labelStyle={{ color: "#d4a857", fontWeight: 600 }}
      />
      <Bar
        dataKey="approved"
        stackId="ev"
        fill="#34d399"
        radius={[0, 0, 0, 0]}
      >
        {data.map((_, i) => (
          <Cell key={`a${i}`} fillOpacity={0.95} />
        ))}
      </Bar>
      <Bar
        dataKey="failed"
        stackId="ev"
        fill="#fb7185"
      />
      <Bar
        dataKey="alerts"
        stackId="ev"
        fill="#fbbf24"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    linking: "bg-sky-500/12 text-sky-300 border-sky-500/25",
    approved: "bg-gold-500/12 text-gold-300 border-gold-500/30",
    failed: "bg-rose-500/12 text-rose-300 border-rose-500/25",
    disconnected: "bg-amber-500/12 text-amber-300 border-amber-500/25",
    draft: "bg-white/[0.04] text-muted-foreground border-white/[0.06]",
    phase_changed: "bg-fuchsia-500/12 text-fuchsia-300 border-fuchsia-500/25",
  };
  const label: Record<string, string> = {
    active: "Activo",
    linking: "Vinculando",
    approved: "Aprobado",
    failed: "Fallido",
    disconnected: "Desconectado",
    draft: "Borrador",
    phase_changed: "Cambio fase",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border tracking-wider",
        map[status] || map.draft,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label[status] || status}
    </span>
  );
}

function demoChallenges() {
  return [
    {
      id: "d1",
      firm: { name: "FTMO Challenge 100K" },
      market: "forex",
      link_method: "ea_mt5",
      current_phase: 0,
      initial_balance: 100_000,
      total_pnl: 8432.18,
      total_pnl_pct: 8.43,
      max_drawdown_pct: 3.18,
      status: "active",
    },
    {
      id: "d2",
      firm: { name: "Bullfy Live 50K" },
      market: "synthetic_indices",
      link_method: "ea_mt5",
      current_phase: 1,
      initial_balance: 50_000,
      total_pnl: 4067.05,
      total_pnl_pct: 8.13,
      max_drawdown_pct: 2.77,
      status: "approved",
    },
    {
      id: "d3",
      firm: { name: "Apex Trader 50K" },
      market: "futures",
      link_method: "cbot_ctrader",
      current_phase: 0,
      initial_balance: 50_000,
      total_pnl: 2180.22,
      total_pnl_pct: 4.36,
      max_drawdown_pct: 5.42,
      status: "linking",
    },
    {
      id: "d4",
      firm: { name: "FX Live Capital Boost+ 25K" },
      market: "forex",
      link_method: "ea_mt4",
      current_phase: 0,
      initial_balance: 25_000,
      total_pnl: 1822.51,
      total_pnl_pct: 7.29,
      max_drawdown_pct: 2.22,
      status: "active",
    },
    {
      id: "d5",
      firm: { name: "FundedNext Stellar 25K" },
      market: "forex",
      link_method: "ea_mt5",
      current_phase: 0,
      initial_balance: 25_000,
      total_pnl: -580.18,
      total_pnl_pct: -2.32,
      max_drawdown_pct: 4.88,
      status: "failed",
    },
  ] as unknown as (Challenge & { firm?: Firm | null })[];
}
