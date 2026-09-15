"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Shield, Calendar, AlertTriangle, CheckCircle2, Clock3 } from "@/lib/ui/lucide-polyfill";
import { cn, formatCurrency, formatPercent, cnPnl, formatNumber } from "@/lib/utils";

function generateEquitySeries(days = 30) {
  const data = [];
  let balance = 100000;
  const initial = balance;
  for (let i = 1; i <= days; i++) {
    const change = (Math.random() - 0.38) * 1800;
    balance = Math.max(initial * 0.88, balance + change);
    data.push({
      d: `D${i}`,
      equity: Math.round(balance),
      balance: Math.round(balance - (Math.random() - 0.5) * 400),
      peak: Math.max(initial, balance + 200),
    });
  }
  return data;
}

function generateDailyPnl(days = 30) {
  return Array.from({ length: days }).map((_, i) => ({
    d: `D${i + 1}`,
    pnl: Math.round((Math.random() - 0.35) * 1800 * 100) / 100,
  }));
}

function StatCard({
  icon: Icon,
  title,
  value,
  delta,
  accent = "gold",
}: {
  icon: any;
  title: string;
  value: string;
  delta?: { label: string; positive?: boolean };
  accent?: "gold" | "emerald" | "rose" | "sky";
}) {
  const accentBg = {
    gold: "from-gold-400/20 to-gold-600/5 border-gold-500/20",
    emerald: "from-emerald-400/20 to-emerald-600/5 border-emerald-400/20",
    rose: "from-rose-400/20 to-rose-600/5 border-rose-400/20",
    sky: "from-sky-400/20 to-sky-600/5 border-sky-400/20",
  }[accent];
  const accentIcon = {
    gold: "text-gold-300",
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    sky: "text-sky-300",
  }[accent];
  return (
    <div className="stat-card">
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">{title}</div>
          <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
            {value}
          </div>
          {delta && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs mt-2",
                delta.positive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {delta.positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {delta.label}
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-11 h-11 rounded-xl border flex items-center justify-center bg-gradient-to-br",
            accentBg
          )}
        >
          <Icon className={cn("w-5 h-5", accentIcon)} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  danger,
}: {
  label: string;
  value: number;
  max: number;
  danger?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(danger && pct > 80 ? "text-rose-400 font-semibold" : "text-foreground")}>
          {value.toFixed(2)}% / {max}%
        </span>
      </div>
      <div className="progress-track">
        <div
          className={cn(
            "progress-fill",
            danger && pct > 80 && "!from-rose-500 !via-rose-400 !to-rose-300"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const equity = React.useMemo(() => generateEquitySeries(22), []);
  const dpnl = React.useMemo(() => generateDailyPnl(22), []);

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="chip-gold mb-4">
            <Target className="w-3 h-3" /> Preview en vivo
          </div>
          <h2 className="font-display text-4xl md:text-5xl mb-5">
            Dashboard{" "}
            <span className="gold-gradient-text">cinematográfico</span>
          </h2>
          <p className="text-muted-foreground">
            Cada métrica, cada trade y cada regla, visibles en tiempo real con
            una estética institucional.
          </p>
        </div>

        <div className="relative rounded-3xl p-2 md:p-3 bg-gradient-to-br from-gold-500/20 via-background to-gold-500/10 border border-gold-500/20 shadow-gold-lg">
          <div className="rounded-2xl overflow-hidden bg-card/80 backdrop-blur-2xl border border-white/[0.04]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-gold-500/10 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado · FTMO · 100K Challenge Fase 1
                </div>
              </div>
              <div className="chip-gold !py-1">
                <Clock3 className="w-3 h-3" /> Actualizado hace 2s
              </div>
            </div>

            {/* Content */}
            <div className="p-5 md:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Shield}
                  title="Equity"
                  value={formatCurrency(108432.55)}
                  delta={{ label: "+8.43% vs inicial", positive: true }}
                  accent="gold"
                />
                <StatCard
                  icon={TrendingUp}
                  title="PnL Total"
                  value={formatCurrency(8432.55)}
                  delta={{ label: "+2.15% hoy", positive: true }}
                  accent="emerald"
                />
                <StatCard
                  icon={Calendar}
                  title="Días operados"
                  value="14 / 4 mín."
                  delta={{ label: "Meta cumplida ✓", positive: true }}
                  accent="sky"
                />
                <StatCard
                  icon={AlertTriangle}
                  title="DD Diario hoy"
                  value="1.82%"
                  delta={{ label: "Límite 5% · seguro", positive: true }}
                  accent="emerald"
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Equity chart */}
                <div className="lg:col-span-2 glass-card !p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Curva de Equity</div>
                      <div className="text-xs text-muted-foreground">Últimos 22 días · FTMO Challenge 100K</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Equity
                      </span>
                      <span className="inline-flex items-center gap-1 text-gold-300">
                        <span className="w-2 h-2 rounded-full bg-gold-400" />
                        Peak trailing
                      </span>
                    </div>
                  </div>
                  <div className="h-72 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="eqGold" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E9AE30" stopOpacity={0.5}/>
                            <stop offset="100%" stopColor="#E9AE30" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="peak" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#86efac" stopOpacity={0.15}/>
                            <stop offset="100%" stopColor="#86efac" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="d" tick={{ fill: "rgba(200,170,120,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(200,170,120,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 2000", "dataMax + 1000"]} />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(15,15,15,0.95)",
                            border: "1px solid rgba(212,146,15,0.3)",
                            borderRadius: "12px",
                            color: "#f5efe0",
                            fontSize: 12,
                          }}
                          formatter={(v: any) => [formatCurrency(v), ""]}
                          labelStyle={{ color: "#d4a05c", fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="peak" stroke="#86efac" strokeOpacity={0.4} fillOpacity={1} fill="url(#peak)" strokeDasharray="5 4" />
                        <Area type="monotone" dataKey="equity" stroke="#E9AE30" strokeWidth={2.4} fillOpacity={1} fill="url(#eqGold)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Progress panel */}
                <div className="glass-card !p-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-gold-400" />
                      <div className="font-semibold">Progreso · Fase 1</div>
                    </div>
                    <div className="flex items-end gap-2 mt-3">
                      <div className="font-display text-4xl gold-gradient-text font-bold">84.3%</div>
                      <div className="text-xs text-muted-foreground mb-2">hacia el 10%</div>
                    </div>
                    <div className="progress-track mt-3">
                      <div className="progress-fill" style={{ width: "84.3%" }} />
                    </div>
                  </div>

                  <ProgressBar label="Drawdown diario" value={1.82} max={5} danger />
                  <ProgressBar label="Drawdown máximo" value={3.64} max={10} danger />
                  <ProgressBar label="Objetivo fase" value={8.43} max={10} />
                  <ProgressBar label="Días mínimos" value={350} max={100} />

                  <div className="pt-3 border-t border-white/[0.05] space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-muted-foreground">
                        Evento: <span className="text-emerald-300">Días mínimos cumplidos</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-muted-foreground">
                        Alerta: <span className="text-amber-300">DD máx. al 36%</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Daily PnL */}
                <div className="lg:col-span-2 glass-card !p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                    <div>
                      <div className="font-semibold">PnL Diario</div>
                      <div className="text-xs text-muted-foreground">Últimos 22 días de trading</div>
                    </div>
                    <div className="chip-gold !py-1">
                      <TrendingUp className="w-3 h-3" /> Win rate 68%
                    </div>
                  </div>
                  <div className="h-64 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dpnl} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="posBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ade80" stopOpacity={1}/>
                            <stop offset="50%" stopColor="#10b981" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#047857" stopOpacity={0.85}/>
                          </linearGradient>
                          <linearGradient id="negBar" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                            <stop offset="50%" stopColor="#e11d48" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#9f1239" stopOpacity={0.85}/>
                          </linearGradient>
                          <filter id="glowG" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="2.2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glowR" x="-40%" y="-40%" width="180%" height="180%">
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
                          formatter={(v: any) => {
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
                          {dpnl.map((e, i) => (
                            <Cell
                              key={i}
                              fill={e.pnl >= 0 ? "url(#posBar)" : "url(#negBar)"}
                              filter={e.pnl >= 0 ? "url(#glowG)" : "url(#glowR)"}
                              radius={e.pnl >= 0 ? [7,7,0,0] : [0,0,7,7]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent trades */}
                <div className="glass-card !p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.05]">
                    <div className="font-semibold">Operaciones recientes</div>
                    <div className="text-xs text-muted-foreground">Últimas 5 cerradas</div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[
                      ["EURUSD", "buy", 0.82, +384.21],
                      ["XAUUSD", "sell", 0.15, -92.44],
                      ["GBPJPY", "buy", 0.4, +512.8],
                      ["US30",   "sell", 1.2,  +142.9],
                      ["BTCUSD", "buy", 0.02, +820.11],
                    ].map(([sym, side, vol, pnl]) => (
                      <div key={sym as string} className="px-6 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div>
                          <div className="font-medium text-sm">{sym as string}</div>
                          <div className="text-[11px] text-muted-foreground">
                            <span className={cn((side as string) === "buy" ? "text-emerald-400" : "text-rose-400", "uppercase mr-2")}>
                              {side}
                            </span>
                            {vol} lots
                          </div>
                        </div>
                        <div className={cnPnl(pnl as number)}>
                          {formatCurrency(pnl as number)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
