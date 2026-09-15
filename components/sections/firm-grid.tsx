"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, CheckCircle2, ChevronRight, Landmark, BarChart3, Coins, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketType } from "@/lib/types";
import { DEFAULT_FIRMS, getPresetsByFirm } from "@/lib/data/seed";
import { FirmLogo } from "@/components/ui/firm-logo";

const marketMeta: Record<MarketType, { label: string; icon: any; color: string; desc: string }> = {
  forex: {
    label: "Forex",
    icon: Landmark,
    color: "from-sky-400/30 to-blue-600/10 border-sky-400/20",
    desc: "MT4 · MT5 · 7 firmas",
  },
  futures: {
    label: "Futuros",
    icon: BarChart3,
    color: "from-violet-400/30 to-purple-600/10 border-violet-400/20",
    desc: "cTrader · 5 firmas",
  },
  crypto: {
    label: "Cripto",
    icon: Coins,
    color: "from-amber-400/30 to-orange-600/10 border-amber-400/20",
    desc: "CCXT · 1 firma",
  },
  synthetic_indices: {
    label: "Índices Sintéticos",
    icon: Activity,
    color: "from-fuchsia-400/30 to-purple-600/10 border-fuchsia-400/20",
    desc: "24/7 · Boom & Crash · Volatility",
  },
};

export function FirmGrid() {
  const [filter, setFilter] = React.useState<"all" | MarketType>("all");
  const markets: ("all" | MarketType)[] = ["all", "forex", "futures", "crypto", "synthetic_indices"];

  const firms = React.useMemo(
    () =>
      DEFAULT_FIRMS.filter(
        (f) => f.is_active && (filter === "all" || f.market === filter)
      ),
    [filter]
  );

  return (
    <section id="firmas" className="py-28 relative">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="chip-gold mb-4">
              <Building2 className="w-3 h-3" /> Firmas soportadas
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              15+ firmas · <span className="gold-gradient-text">presets oficiales</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Todas las firmas cargadas con sus reglas reales. Y si quieres
              agregar una nueva, el panel admin lo permite en segundos sin
              código.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {markets.map((m) => {
              const Icon = m === "all" ? CheckCircle2 : marketMeta[m].icon;
              return (
                <button
                  key={m}
                  onClick={() => setFilter(m)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    filter === m
                      ? "bg-gold-500/15 text-gold-200 shadow-gold border border-gold-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {m === "all" ? "Todas" : marketMeta[m].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {firms.map((f) => {
            const presets = getPresetsByFirm(f.id);
            const meta = marketMeta[f.market];
            return (
              <Link
                href={`/dashboard/new?market=${f.market}&firm=${f.id}`}
                key={f.id}
                className="group relative overflow-hidden rounded-2xl p-6 glass-card hover:!border-gold-500/40 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-gold-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <FirmLogo firm={f} size="md" useMarketIcon />
                    <div className="flex items-center gap-1.5">
                      {f.market === "synthetic_indices" && (
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-fuchsia-200 bg-fuchsia-500/10 border border-fuchsia-400/20 px-2.5 py-1 rounded-full">
                          24/7
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-gold-300/80 bg-gold-500/5 border border-gold-500/15 px-2.5 py-1 rounded-full">
                        {f.market}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-1 group-hover:text-gold-200 transition-colors">
                    {f.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{meta.desc}</p>

                  <div className="flex items-center justify-between mb-5 pt-4 border-t border-white/[0.04]">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Presets
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {presets.slice(0, 4).map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.05] text-muted-foreground"
                          >
                            {p.name}
                          </span>
                        ))}
                        {presets.length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 text-gold-300">
                            +{presets.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {presets.length} tamaños · {presets[0]?.phases?.length || 2} fases
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-300 group-hover:translate-x-1 transition-transform">
                      Iniciar <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
