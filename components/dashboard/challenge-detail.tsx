"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, Target, Calendar, Shield, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Clock3, Link2, RefreshCw,
  XCircle, Copy, Activity, PlayCircle,
  BellRing, Download, Settings2, ChevronRight
} from "lucide-react";
import { cn, formatCurrency, formatPercent, formatNumber, cnPnl } from "@/lib/utils";
import type { Challenge, Trade, RuleEvent } from "@/lib/types";
import { getFirmById, getPresetById } from "@/lib/data/seed";
import AccountLinkPanel from "./AccountLinkPanel";
import {
  runRuleEngine,
  getCurrentPhase,
  calcDailyDDPct,
  calcMaxDDPct,
  calcProfitTargetPct,
  type RuleEngineInput,
} from "@/lib/engine/rules";

import type { ChallengeDetailBundle } from "@/app/dashboard/[challengeId]/page";

type Tab = "overview" | "trades" | "events" | "settings";
const CLOSED_STATUSES = ["failed", "approved"] as const;

export default function ChallengeDetailClient({ challengeId, serverBundle }: { challengeId: string; serverBundle: ChallengeDetailBundle | null }) {
  const router = useRouter();

  // Build mock data if server bundle not provided
  const fallback = React.useMemo(() => buildMock(challengeId), [challengeId]);
  const data = serverBundle && serverBundle.equitySeries.length ? serverBundle as any : fallback;
  const { challenge, equitySeries, dailyPnlSeries, trades, events } = data;

  const preset = getPresetById(challenge.preset_id);
  const firm = getFirmById(challenge.firm_id);
  const phase = preset ? getCurrentPhase(preset, challenge.current_phase) : undefined;

  // Rule engine
  const engineInput: RuleEngineInput = {
    challenge,
    preset: preset!,
    closedTradesToday: trades.filter((t: Trade) => !t.is_open && t.close_time),
    currentEquity: challenge.current_equity,
    currentBalance: challenge.current_balance,
    dailyStartBalance: challenge.start_daily_balance || challenge.initial_balance,
    peakEquityAllTime: challenge.peak_equity,
  };
  const result = preset
    ? runRuleEngine(engineInput)
    : { dailyDDPct: 0, maxDDPct: 0, profitTargetPct: 0, currentPhaseProgessPct: 0, tradingDaysMet: false, approved: false, failed: false, events: [] as any, failReason: undefined as string | undefined };

  const [tab, setTab] = React.useState<Tab>("overview");
  const [copyOk, setCopyOk] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  function refresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(challengeId);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1800);
    } catch {}
  }

  if (!challenge || !firm || !preset || !phase) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground mb-6">Desafío no encontrado.</p>
        <Link href="/dashboard" className="btn-ghost-gold"><ArrowLeft className="w-4 h-4"/> Volver</Link>
      </div>
    );
  }

  const status = challenge.status;
  const statusMeta = {
    draft: { label: "Borrador", color: "bg-white/[0.06] text-muted-foreground border-white/10", icon: Clock3 },
    linking: { label: "Vinculando", color: "bg-sky-500/10 text-sky-300 border-sky-400/20", icon: Link2 },
    active: { label: "En curso", color: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20", icon: PlayCircle },
    approved: { label: "Aprobado", color: "bg-gold-500/15 text-gold-200 border-gold-500/30", icon: CheckCircle2 },
    failed: { label: "Reprobado", color: "bg-rose-500/10 text-rose-300 border-rose-400/20", icon: XCircle },
    disconnected: { label: "Desconectado", color: "bg-amber-500/10 text-amber-300 border-amber-400/20", icon: AlertTriangle },
    phase_changed: { label: "Cambio de fase", color: "bg-violet-500/10 text-violet-300 border-violet-400/20", icon: ChevronRight },
  } as const;
  const StIcon = statusMeta[challenge.status as keyof typeof statusMeta]?.icon || Clock3;
  const StMeta = statusMeta[challenge.status as keyof typeof statusMeta];

  const phases = preset.phases;
  const phasesProgress = phases.map((p, idx) => {
    if (idx < challenge.current_phase) return { name: p.name, pct: 100, status: "done" as const };
    if (idx === challenge.current_phase) return { name: p.name, pct: result.currentPhaseProgessPct, status: "active" as const };
    return { name: p.name, pct: 0, status: "pending" as const };
  });

  return (
    <div className="p-6 md:p-10 max-w-[1500px] mx-auto space-y-8">
      {/* Top nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <Link href="/dashboard" className="p-2.5 rounded-xl border border-white/10 hover:border-gold-500/40 hover:text-gold-300 transition-colors text-muted-foreground shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl md:text-4xl tracking-tight truncate">
                {firm.name} · <span className="gold-gradient-text">{preset.name}</span>
              </h1>
              <span className={cn("inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border", StMeta.color)}>
                <StIcon className="w-3 h-3" /> {StMeta.label}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="uppercase font-semibold tracking-wider">{challenge.market}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5"/> Iniciado {new Date(challenge.started_at || challenge.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span>·</span>
              <button onClick={copyId} className="inline-flex items-center gap-1 hover:text-gold-300 transition-colors">
                ID: <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04]">{challengeId.slice(0, 10)}…</code>
                {copyOk ? <CheckCircle2 className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={refresh} className="btn-ghost-gold !py-2 !px-4 text-sm inline-flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Actualizar
          </button>
          <button className="btn-gold !py-2 !px-5 text-sm inline-flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Ajustes
          </button>
        </div>
      </div>

      {/* Phase progress */}
      <div className="glass-card p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Progreso por fases</div>
            <div className="font-display text-lg">Fase {challenge.current_phase + 1} de {phases.length}</div>
          </div>
          <div className="chip-gold !py-1">
            <Target className="w-3 h-3"/> {phase.name}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {phasesProgress.map((p, i) => (
            <div key={p.name} className={cn(
              "relative rounded-xl p-4 border transition-all",
              p.status === "done" && "bg-emerald-500/5 border-emerald-400/20",
              p.status === "active" && "bg-gold-500/8 border-gold-500/40 shadow-gold",
              p.status === "pending" && "bg-white/[0.02] border-white/[0.05] opacity-70"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-[10px] w-6 h-6 rounded-lg bg-white/[0.05] flex items-center justify-center">{i+1}</span>
                  {p.name}
                </div>
                {p.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400"/>}
                {p.status === "active" && <Activity className="w-4 h-4 text-gold-400 animate-pulse"/>}
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${p.pct}%` }}/></div>
              <div className="mt-2 text-xs text-muted-foreground">Completado: <span className="text-foreground font-semibold">{p.pct.toFixed(1)}%</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Shield}
          title="Equity actual"
          value={formatCurrency(challenge.current_equity)}
          sub={`${formatPercent(result.profitTargetPct)} vs inicial`}
          subPositive={result.profitTargetPct >= 0}
          accent="gold"
        />
        <StatCard
          icon={TrendingUp}
          title="PnL Total"
          value={formatCurrency(challenge.current_balance - challenge.initial_balance)}
          sub={`Objetivo: ${phase.profit_target_pct}% · ${formatPercent(result.profitTargetPct)}`}
          subPositive={challenge.current_balance >= challenge.initial_balance}
          accent="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          title="DD Diario"
          value={`${result.dailyDDPct.toFixed(2)}%`}
          sub={`Límite ${phase.max_daily_drawdown_pct}% · ${(phase.max_daily_drawdown_pct - result.dailyDDPct).toFixed(2)}% disponible`}
          warn={result.dailyDDPct > phase.max_daily_drawdown_pct * 0.8}
          accent="rose"
        />
        <StatCard
          icon={Calendar}
          title="Días operados"
          value={`${challenge.trading_days_count} / ${phase.min_trading_days}`}
          sub={result.tradingDaysMet ? "Mínimo cumplido ✓" : `Faltan ${phase.min_trading_days - challenge.trading_days_count} día(s)`}
          subPositive={result.tradingDaysMet}
          accent="sky"
        />
      </div>

      {/* Conectar cuenta */}
      {!CLOSED_STATUSES.includes(challenge.status as any) && (
        <AccountLinkPanel challenge={challenge} preset={preset} firm={firm} />
      )}

      {/* Rule engine summary */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 glass-card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <div className="font-semibold">Curva de Equity & Peak</div>
              <div className="text-xs text-muted-foreground">{equitySeries.length} snapshots · en vivo vía Realtime</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-gold-300"><span className="w-2 h-2 rounded-full bg-gold-400"/> Equity</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="w-2 h-2 rounded-full bg-emerald-400"/> Peak ({phase.drawdown_type})</span>
            </div>
          </div>
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <AreaChart data={equitySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E9AE30" stopOpacity={0.45}/><stop offset="100%" stopColor="#E9AE30" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pkA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86efac" stopOpacity={0.15}/><stop offset="100%" stopColor="#86efac" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="d" tick={{ fill: "rgba(200,170,120,0.4)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "rgba(200,170,120,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 1500", "dataMax + 1000"]} tickFormatter={(v: number) => `$${v.toLocaleString()}`}/>
                <Tooltip
                  cursor={{ stroke: "rgba(212,146,15,0.25)", strokeDasharray: "3 3" }}
                  contentStyle={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(212,146,15,0.3)", borderRadius: 12, color: "#f5efe0", fontSize: 12 }}
                  formatter={(v: any, n: any) => [formatCurrency(v as number), n === "peak" ? "Peak" : n === "init" ? "Inicial" : "Equity"]}
                  labelStyle={{ color: "#d4a05c", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="peak" stroke="#86efac" strokeOpacity={0.5} fill="url(#pkA)" strokeDasharray="5 4"/>
                <Area type="monotone" dataKey="equity" stroke="#E9AE30" strokeWidth={2.5} fill="url(#eqA)"/>
                <Line type="monotone" dataKey="init" stroke="#94a3b8" strokeOpacity={0.4} strokeDasharray="2 3" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gold-400"/>
              <div className="font-semibold">Resumen motor de reglas</div>
            </div>
            <div className="text-xs text-muted-foreground mb-4">Evaluar el preset de {firm.name} en tiempo real.</div>
          </div>
          <ProgressBar label="Objetivo fase" value={result.profitTargetPct} max={phase.profit_target_pct} />
          <ProgressBar label="Drawdown diario" value={result.dailyDDPct} max={phase.max_daily_drawdown_pct} danger />
          <ProgressBar label="Drawdown máximo" value={result.maxDDPct} max={phase.max_total_drawdown_pct} danger />
          <ProgressBar label="Días mínimos" value={(challenge.trading_days_count / phase.min_trading_days) * 100} max={100} />

          <div className="pt-4 border-t border-white/[0.05] space-y-2">
            <ResultRow ok={result.tradingDaysMet} label="Días mínimos cumplidos" />
            <ResultRow ok={result.profitTargetPct >= phase.profit_target_pct} label={`Objetivo ${phase.profit_target_pct}% alcanzado`} />
            <ResultRow ok={result.dailyDDPct < phase.max_daily_drawdown_pct} label={`DD diario < ${phase.max_daily_drawdown_pct}%`} />
            <ResultRow ok={result.maxDDPct < phase.max_total_drawdown_pct} label={`DD máx < ${phase.max_total_drawdown_pct}%`} />
            <ResultRow ok={phase.drawdown_type === "trailing"} label={`Tipo DD: ${phase.drawdown_type === "trailing" ? "Trailing" : "Estático"}`} />
          </div>

          {result.approved && (
            <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30 shadow-gold">
              <div className="flex items-center gap-2 text-gold-200 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4"/> ¡Prueba APROBADA!
              </div>
              <div className="text-xs text-muted-foreground">Cambia a Fase {challenge.current_phase + 2} o habilita tu cuenta fondeada.</div>
            </div>
          )}
          {result.failed && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-200 font-semibold mb-1">
                <XCircle className="w-4 h-4"/> Prueba reprobada
              </div>
              <div className="text-xs text-muted-foreground">{result.failReason}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
        {([
          ["overview", "Resumen"],
          ["trades", `Operaciones (${trades.length})`],
          ["events", `Eventos (${events.length})`],
          ["settings", "Ajustes"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              tab === id
                ? "bg-gold-500/15 text-gold-200 border border-gold-500/30 shadow-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <div className="font-semibold">PnL Diario</div>
                <div className="text-xs text-muted-foreground">Últimos {dailyPnlSeries.length} días de trading</div>
              </div>
              <div className="chip-gold !py-1"><TrendingUp className="w-3 h-3"/> Win rate 68%</div>
            </div>
            <div className="h-64 p-4">
              <ResponsiveContainer>
                <BarChart data={dailyPnlSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.85}/>
                    </linearGradient>
                    <linearGradient id="bN" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#e11d48" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#9f1239" stopOpacity={0.85}/>
                    </linearGradient>
                    <filter id="barGlowG" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2.2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <filter id="barGlowR" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="d"
                    tick={{ fill: "rgba(200,170,120,0.55)", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={10}
                  />
                  <YAxis
                    tick={{ fill: "rgba(200,170,120,0.55)", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v === 0 ? "0" : `${v >= 0 ? "+" : ""}$${Math.abs(v).toLocaleString()}`)}
                    width={70}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="#d4a05c"
                    strokeOpacity={0.55}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                  <Tooltip
                    cursor={{ fill: (datum: any) => (datum?.payload?.pnl >= 0 ? "rgba(74,222,128,0.06)" : "rgba(244,63,94,0.06)") }}
                    contentStyle={{
                      background: "rgba(10,10,10,0.97)",
                      border: "1px solid rgba(212,146,15,0.4)",
                      borderRadius: "14px",
                      color: "#f5efe0",
                      fontSize: 12,
                      padding: "10px 14px",
                      boxShadow: "0 8px 30px -10px rgba(0,0,0,0.6), 0 0 40px -18px rgba(233,174,48,0.35)",
                    }}
                    formatter={(v: any, _n: any, item: any) => {
                      const pnl = Number(v);
                      return [
                        <span key="f" className={pnl >= 0 ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
                          {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                        </span>,
                        "PnL",
                      ];
                    }}
                    labelStyle={{ color: "#d4a05c", fontWeight: 700, marginBottom: 4 }}
                  />
                  <Bar dataKey="pnl" barSize={16} radius={[7,7,0,0]}>
                    {dailyPnlSeries.map((e: any, i: number) => (
                      <Cell
                        key={i}
                        fill={e.pnl >= 0 ? "url(#bP)" : "url(#bN)"}
                        filter={e.pnl >= 0 ? "url(#barGlowG)" : "url(#barGlowR)"}
                        radius={e.pnl >= 0 ? [7,7,0,0] : [0,0,7,7]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <div className="font-semibold">Últimas operaciones</div>
                <div className="text-xs text-muted-foreground">5 más recientes</div>
              </div>
              <button onClick={() => setTab("trades")} className="text-xs text-gold-300 hover:text-gold-200 inline-flex items-center gap-1">
                Ver todas <ChevronRight className="w-3 h-3"/>
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {trades.slice(0, 5).map((t: Trade) => <TradeRow key={t.id} t={t} compact />)}
            </div>
          </div>
        </div>
      )}

      {tab === "trades" && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold">Historial de operaciones</div>
              <div className="text-xs text-muted-foreground">{trades.length} operaciones · sincronizadas desde {firm.name}</div>
            </div>
            <button className="btn-ghost-gold !py-2 !px-4 text-sm inline-flex items-center gap-2">
              <Download className="w-4 h-4"/> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/80">
                  <th className="px-6 py-3 font-semibold">Símbolo</th>
                  <th className="px-6 py-3 font-semibold">Lado</th>
                  <th className="px-6 py-3 font-semibold">Volumen</th>
                  <th className="px-6 py-3 font-semibold">Apertura</th>
                  <th className="px-6 py-3 font-semibold">Cierre</th>
                  <th className="px-6 py-3 font-semibold">PnL</th>
                  <th className="px-6 py-3 font-semibold">Swap</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {trades.map((t: Trade) => <TradeRow key={t.id} t={t} wide />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05]">
            <div className="font-semibold inline-flex items-center gap-2">
              <BellRing className="w-4 h-4 text-gold-400"/> Regla de eventos
            </div>
            <div className="text-xs text-muted-foreground">Alertas disparadas por el motor de reglas</div>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {events.length === 0 && <li className="px-6 py-12 text-center text-sm text-muted-foreground">Aún no hay eventos.</li>}
            {events.map((e: RuleEvent) => {
              const SEV_MAP: Record<string, string> = { info: "bg-sky-500/10 text-sky-300 border-sky-400/20", warning: "bg-amber-500/10 text-amber-300 border-amber-400/20", critical: "bg-rose-500/10 text-rose-300 border-rose-400/20" };
              const sev = SEV_MAP[e.severity];
              const Icon = e.type.startsWith("approved") || e.type === "phase_change" ? CheckCircle2
                : e.type.startsWith("failed") ? XCircle
                : e.type === "disconnected" ? AlertTriangle
                : e.type.startsWith("alert") ? AlertTriangle
                : BellRing;
              return (
                <li key={e.id} className="px-6 py-4 hover:bg-white/[0.02] flex items-start gap-4">
                  <div className={cn("w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center", sev)}>
                    <Icon className="w-4 h-4"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold">{e.type.replace(/_/g, " ")}</div>
                      <span className={cn("text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border", sev)}>{e.severity}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{e.message}</div>
                    <div className="text-[11px] text-muted-foreground/70 mt-1">{new Date(e.created_at).toLocaleString("es-ES")}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === "settings" && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="glass-card p-6 space-y-4">
            <div className="font-semibold text-lg mb-2">Vinculación</div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Método</div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-sm capitalize">
                {challenge.link_method || "Pendiente"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Clave de reporte (hash)</div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-sm font-mono break-all">
                {challenge.report_key_hash || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Último reporte</div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-sm">
                {challenge.ea_last_report_at
                  ? new Date(challenge.ea_last_report_at).toLocaleString("es-ES")
                  : "Sin reportes"}
              </div>
            </div>
            <button className="btn-gold !py-2 !w-full text-sm">Re-generar clave de reporte</button>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="font-semibold text-lg mb-2">Reglas de la fase actual</div>
            <InfoRow k="Tipo DD" v={phase.drawdown_type === "trailing" ? "Trailing" : "Estático"} />
            <InfoRow k="DD diario máx" v={`${phase.max_daily_drawdown_pct}%`} />
            <InfoRow k="DD total máx" v={`${phase.max_total_drawdown_pct}%`} />
            <InfoRow k="Objetivo ganancia" v={`${phase.profit_target_pct}%`} />
            <InfoRow k="Días mínimos" v={`${phase.min_trading_days} días`} />
            <InfoRow k="Zona horaria broker" v={preset.broker_timezone} />
            <InfoRow k="Reset DD diario" v={`${String(preset.daily_reset_hour_utc).padStart(2, "0")}:00 UTC`} />
            <button className="btn-ghost-gold !py-2 !w-full text-sm inline-flex items-center justify-center gap-2">
              <Settings2 className="w-4 h-4"/> Ver JSON de preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Subcomponents
// =========================================================================

function StatCard({
  icon: Icon, title, value, sub, subPositive, accent, warn,
}: {
  icon: any; title: string; value: string;
  sub?: string; subPositive?: boolean; accent?: "gold" | "emerald" | "rose" | "sky"; warn?: boolean;
}) {
  const bgs = {
    gold: "from-gold-400/20 to-gold-600/5 border-gold-500/20",
    emerald: "from-emerald-400/20 to-emerald-600/5 border-emerald-400/20",
    rose: "from-rose-400/20 to-rose-600/5 border-rose-400/20",
    sky: "from-sky-400/20 to-sky-600/5 border-sky-400/20",
  }[accent || "gold"];
  const ics = { gold: "text-gold-300", emerald: "text-emerald-300", rose: "text-rose-300", sky: "text-sky-300" }[accent || "gold"];
  return (
    <div className="stat-card">
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">{title}</div>
          <div className={cn("font-display text-3xl font-bold", warn && "text-rose-400")}>{value}</div>
          {sub && (
            <div className={cn("inline-flex items-center gap-1.5 text-xs mt-2", subPositive === true ? "text-emerald-400" : subPositive === false ? "text-rose-400" : "text-muted-foreground")}>
              {subPositive === true ? <TrendingUp className="w-3 h-3"/> : subPositive === false ? <TrendingDown className="w-3 h-3"/> : null}
              {sub}
            </div>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center bg-gradient-to-br", bgs)}>
          <Icon className={cn("w-5 h-5", ics)}/>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, danger }: { label: string; value: number; max: number; danger?: boolean }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(danger && pct > 80 ? "text-rose-400 font-semibold" : "text-foreground font-medium")}>
          {value.toFixed(2)}% / {max}%
        </span>
      </div>
      <div className="progress-track">
        <div
          className={cn("progress-fill", danger && pct > 80 && "!from-rose-500 !via-rose-400 !to-rose-300")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ResultRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>
        : <span className="w-4 h-4 shrink-0 rounded-full border border-white/[0.12]"/>}
      <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-white/[0.04] last:border-none">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function TradeRow({ t, compact, wide }: { t: Trade; compact?: boolean; wide?: boolean }) {
  if (wide) {
    return (
      <tr className="hover:bg-white/[0.02]">
        <td className="px-6 py-3.5 font-medium">{t.symbol}</td>
        <td className="px-6 py-3.5">
          <span className={cn("uppercase text-[10px] font-bold px-2 py-0.5 rounded", t.side === "buy" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")}>
            {t.side}
          </span>
        </td>
        <td className="px-6 py-3.5">{formatNumber(t.volume, 2)}</td>
        <td className="px-6 py-3.5">
          <div>{formatNumber(t.open_price, 5)}</div>
          <div className="text-[11px] text-muted-foreground">{new Date(t.open_time).toLocaleString("es-ES")}</div>
        </td>
        <td className="px-6 py-3.5">
          <div>{t.close_price ? formatNumber(t.close_price, 5) : "—"}</div>
          <div className="text-[11px] text-muted-foreground">{t.close_time ? new Date(t.close_time).toLocaleString("es-ES") : "—"}</div>
        </td>
        <td className={cn("px-6 py-3.5 font-semibold", cnPnl(t.pnl || 0))}>
          {t.pnl == null ? "—" : formatCurrency(t.pnl)}
        </td>
        <td className="px-6 py-3.5 text-muted-foreground">{t.swap ? formatCurrency(t.swap) : "—"}</td>
        <td className="px-6 py-3.5">
          <span className={cn(
            "text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border",
            t.is_open
              ? "bg-sky-500/10 text-sky-300 border-sky-400/20"
              : (t.pnl || 0) >= 0
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
                : "bg-rose-500/10 text-rose-300 border-rose-400/20"
          )}>
            {t.is_open ? "Abierta" : "Cerrada"}
          </span>
        </td>
      </tr>
    );
  }
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
      <div className="min-w-0">
        <div className="font-medium text-sm truncate flex items-center gap-2">
          {t.symbol}
          <span className={cn("uppercase text-[9px] font-bold px-1.5 py-0.5 rounded", t.side === "buy" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")}>
            {t.side}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {t.volume} lots · {new Date(t.open_time).toLocaleDateString("es-ES")}
        </div>
      </div>
      <div className={cn("font-semibold text-sm", cnPnl(t.pnl || 0))}>
        {t.pnl == null ? "—" : formatCurrency(t.pnl)}
      </div>
    </div>
  );
}

// =========================================================================
// Mock builder
// =========================================================================

function buildMock(id: string): {
  challenge: Challenge;
  equitySeries: any[];
  dailyPnlSeries: any[];
  trades: Trade[];
  events: RuleEvent[];
} {
  const presets = [
    { firm_id: "firm-ftmo", preset_id: "firm-ftmo-preset-100000", balance: 100000, market: "forex" as const, name: "FTMO" },
    { firm_id: "firm-apex", preset_id: "firm-apex-preset-050000", balance: 50000, market: "futures" as const, name: "Apex" },
    { firm_id: "firm-fundednext", preset_id: "firm-fundednext-preset-025000", balance: 25000, market: "forex" as const, name: "FundedNext" },
  ];
  const pick = presets[Math.abs(hash(id)) % presets.length];
  const initial = pick.balance;

  // equity series
  const N = 22;
  let balance = initial;
  const equitySeries: any[] = [];
  const dailyPnlSeries: any[] = [];
  let peak = initial;
  for (let i = 1; i <= N; i++) {
    const prev = balance;
    const change = (Math.random() - 0.38) * (initial * 0.018);
    balance = Math.max(initial * 0.88, balance + change);
    peak = Math.max(peak, balance + Math.random() * 800);
    const d = `D${i}`;
    equitySeries.push({ d, equity: Math.round(balance), peak: Math.round(peak), init: initial });
    dailyPnlSeries.push({ d, pnl: Math.round((balance - prev) * 100) / 100 });
  }

  // trades
  const symbols = pick.market === "forex"
    ? ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "GBPJPY", "US30", "NAS100", "AUDUSD"]
    : ["ES", "NQ", "CL", "GC", "RTY", "YM", "MES", "MNQ"];
  const trades: Trade[] = Array.from({ length: 38 }).map((_, i) => {
    const open = new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * (2 + Math.random() * 6));
    const side = Math.random() > 0.5 ? "buy" : "sell";
    const openPrice = 1.08 + (Math.random() - 0.5) * 0.1;
    const closePrice = side === "buy" ? openPrice + (Math.random() - 0.38) * 0.015 : openPrice - (Math.random() - 0.38) * 0.015;
    const volume = +(0.1 + Math.random() * 1.2).toFixed(2);
    const pnl = +((closePrice - openPrice) * (side === "buy" ? 1 : -1) * 100000 * volume).toFixed(2);
    const open2 = new Date(open.getTime() + 1000 * 60 * (10 + Math.random() * 240));
    return {
      id: `t-${id}-${i}`,
      challenge_id: id,
      external_id: `ext-${i}-${hash(id + i)}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: side as any,
      volume,
      open_price: +openPrice.toFixed(5),
      close_price: +closePrice.toFixed(5),
      open_time: open.toISOString(),
      close_time: i < 35 ? open2.toISOString() : undefined,
      pnl,
      swap: +(Math.random() * 3 - 1.5).toFixed(2),
      commission: +(Math.random() * 4).toFixed(2),
      is_open: i >= 35,
      created_at: open.toISOString(),
    };
  });

  // events
  const events: RuleEvent[] = [
    {
      id: `e-${id}-1`,
      challenge_id: id,
      type: "alert_daily_dd",
      severity: "warning",
      message: "DD diario alcanzó el 82% del límite (4.1% / 5%).",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: `e-${id}-2`,
      challenge_id: id,
      type: "alert_max_dd",
      severity: "info",
      message: "DD máximo alcanzó el 68% del límite.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
    {
      id: `e-${id}-3`,
      challenge_id: id,
      type: "reconnected",
      severity: "info",
      message: "Conexión con la cuenta reestablecida.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
  ];

  const todayPnl = dailyPnlSeries[dailyPnlSeries.length - 1]?.pnl || 0;
  const dailyDD = calcDailyDDPct(initial, balance);
  const peakEq = Math.max(initial, ...equitySeries.map((e) => e.peak));
  const maxDD = calcMaxDDPct(peakEq, balance, initial, "trailing");
  const tradingDays = Math.min(14, Math.floor(N * 0.7));

  return {
    challenge: {
      id,
      user_id: "mock-user",
      firm_id: pick.firm_id,
      preset_id: pick.preset_id,
      market: pick.market,
      current_phase: 0,
      status: dailyDD > 4.9 ? "failed" : dailyPnlSeries.length > 15 ? "active" : "linking",
      initial_balance: initial,
      current_balance: balance,
      current_equity: balance,
      peak_equity: peakEq,
      start_daily_balance: initial - todayPnl,
      daily_pnl: todayPnl,
      total_pnl: balance - initial,
      total_pnl_pct: +(((balance - initial) / initial) * 100).toFixed(4),
      daily_drawdown_pct: +dailyDD.toFixed(4),
      max_drawdown_pct: +maxDD.toFixed(4),
      trading_days_count: tradingDays,
      last_trade_date: new Date().toISOString().slice(0, 10),
      ea_last_report_at: new Date().toISOString(),
      broker_server_timezone: "Etc/UTC",
      link_method: pick.market === "forex" ? "ea_mt5" : pick.market === "futures" ? "cbot_ctrader" : "crypto_api",
      report_key_hash: `h_${hash(id + "report")}_${id.slice(-8)}`,
      started_at: new Date(Date.now() - N * 1000 * 60 * 60 * 24).toISOString(),
      created_at: new Date(Date.now() - (N + 2) * 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date().toISOString(),
    },
    equitySeries, dailyPnlSeries, trades, events,
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i), h |= 0;
  return h;
}
