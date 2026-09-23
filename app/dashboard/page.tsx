import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PlusCircle,
  Target,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Calendar,
  PlayCircle,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
  Link2,
} from "@/lib/ui/lucide-polyfill";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { getFirmById, getPresetById } from "@/lib/data/seed";
import { getFirmByIdLive, getPresetByIdLive } from "@/lib/data/catalog-live";
import type { Challenge, ChallengeStatus, MarketType } from "@/lib/types";
import { FirmLogo } from "@/components/ui/firm-logo";

const statusMeta: Record<ChallengeStatus, { label: string; icon: any; cls: string }> = {
  draft: { label: "Borrador", icon: Clock3, cls: "bg-white/[0.06] text-muted-foreground border-white/10" },
  linking: { label: "Vinculando", icon: Link2, cls: "bg-sky-500/10 text-sky-300 border-sky-400/20" },
  active: { label: "En curso", icon: PlayCircle, cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" },
  approved: { label: "Aprobado", icon: CheckCircle2, cls: "bg-gold-500/15 text-gold-200 border-gold-500/30" },
  failed: { label: "Reprobado", icon: XCircle, cls: "bg-rose-500/10 text-rose-300 border-rose-400/20" },
  disconnected: { label: "Desconectado", icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-300 border-amber-400/20" },
  phase_changed: { label: "Cambio de fase", icon: ChevronRight, cls: "bg-violet-500/10 text-violet-300 border-violet-400/20" },
};

async function getUserAndChallenges() {
  try {
    const sb = await createClient();
    const { data: userData, error: uErr } = await sb.auth.getUser();
    if (uErr || !userData?.user) return { user: null, challenges: [], counts: null as any };

    const uid = userData.user.id;

    let challenges: Challenge[] = [];
    try {
      const { data, error } = await sb
        .from("challenges")
        .select("*")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false });
      if (!error && Array.isArray(data)) challenges = data as Challenge[];
    } catch {}

    if (challenges.length === 0) {
      // Sin datos reales → dejar vacío (no inyectar mocks).
    }

    const counts = {
      total: challenges.length,
      active: challenges.filter((c) => c.status === "active" || c.status === "phase_changed").length,
      approved: challenges.filter((c) => c.status === "approved").length,
      failed: challenges.filter((c) => c.status === "failed").length,
    };

    return { user: userData.user, challenges, counts };
  } catch {
    return { user: null, challenges: [], counts: null as any };
  }
}

export default async function DashboardHome() {
  const { challenges, counts } = await getUserAndChallenges();
  if (!counts) redirect("/login?next=/dashboard");

  const stats = [
    { label: "Desafíos totales", value: String(counts.total), icon: Target, accent: "gold" },
    { label: "En curso", value: String(counts.active), icon: PlayCircle, accent: "emerald" },
    { label: "Aprobados", value: String(counts.approved), icon: CheckCircle2, accent: "sky" },
    { label: "Reprobados", value: String(counts.failed), icon: ShieldAlert, accent: "rose" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <div className="chip-gold mb-3 !py-1">
            <TrendingUp className="w-3 h-3" /> Dashboard
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">
            Tus desafíos{" "}
            <span className="gold-gradient-text">en vivo</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Monitorea en tiempo real tu progreso por firma. Alertas, métricas y
            curva de equity — todo en un solo lugar.
          </p>
        </div>
        <div>
          <Link href="/dashboard/new" className="btn-gold !px-7">
            <PlusCircle className="w-4 h-4" /> Nuevo desafío
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        {stats.map((s) => {
          const Accent = s.accent === "gold" ? "from-gold-400/20 to-gold-600/5 border-gold-500/20"
            : s.accent === "emerald" ? "from-emerald-400/20 to-emerald-600/5 border-emerald-400/20"
            : s.accent === "sky" ? "from-sky-400/20 to-sky-600/5 border-sky-400/20"
            : "from-rose-400/20 to-rose-600/5 border-rose-400/20";
          const AccentText = s.accent === "gold" ? "text-gold-300"
            : s.accent === "emerald" ? "text-emerald-300"
            : s.accent === "sky" ? "text-sky-300"
            : "text-rose-300";
          return (
            <div key={s.label} className="stat-card">
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">{s.label}</div>
                  <div className="font-display text-3xl md:text-4xl font-bold">{s.value}</div>
                </div>
                <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center bg-gradient-to-br", Accent)}>
                  <s.icon className={cn("w-5 h-5", AccentText)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Todos los desafíos</h2>
        <div className="text-sm text-muted-foreground">{challenges.length} resultados</div>
      </div>

      {challenges.length === 0 ? (
        <div className="glass-card-strong p-16 text-center gold-gradient-border">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center mb-6">
            <Target className="w-10 h-10 text-gold-300" />
          </div>
          <h3 className="font-display text-2xl mb-2">Aún no tienes desafíos</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Elige una firma prop, tamaño de cuenta y vincula tu cuenta demo
            para empezar a monitorear tu reto.
          </p>
          <Link href="/dashboard/new" className="btn-gold">
            <PlusCircle className="w-4 h-4" /> Crear primer desafío
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {challenges.map((c) => {
            const firm = getFirmById(c.firm_id);
            const preset = getPresetById(c.preset_id);
            const meta = statusMeta[c.status as ChallengeStatus];
            const Icon = meta.icon;
            const phase = preset?.phases?.[c.current_phase];
            const targetPct = phase?.profit_target_pct ?? 10;
            const progress = Math.min(100, Math.max(0, ((c.total_pnl_pct / targetPct) * 100)));
            const firmLogo = firm;
            // hydrate lazy live meta (logo URLs, preset phase names)
            // We keep fallback to seed; live lookup is not blocking render
            void Promise.all([
              getFirmByIdLive(c.firm_id),
              getPresetByIdLive(c.preset_id),
            ]).then(() => {});
            return (
              <Link
                href={`/dashboard/${c.id}`}
                key={c.id}
                className="group glass-card !p-0 overflow-hidden hover:!border-gold-500/30 transition-all"
              >
                <div className="grid md:grid-cols-12 gap-6 p-6">
                  <div className="md:col-span-4 flex items-center gap-4">
                    {firm ? (
                      <FirmLogo
                        firm={firm}
                        size="lg"
                        className="shadow-gold group-hover:shadow-gold-lg transition-all"
                      />
                    ) : (
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-gold-400/15 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shadow-gold group-hover:shadow-gold-lg transition-all">
                        <span className="font-display text-xl gold-gradient-text font-bold">?</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-xl font-semibold truncate">
                          {firm?.name ?? "—"} · {preset?.name ?? "?"}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border",
                            meta.cls
                          )}
                        >
                          <Icon className="w-3 h-3" /> {meta.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="uppercase font-semibold tracking-wider">{c.market}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.created_at).toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span>·</span>
                        <span>Fase {c.current_phase + 1}{preset?.phases && `/${preset.phases.length}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-gold-400" />
                        Progreso fase {c.current_phase + 1}
                      </span>
                      <span className="font-semibold">
                        <span className="gold-gradient-text">{formatPercent(c.total_pnl_pct)}</span>
                        <span className="text-muted-foreground"> / {targetPct}%</span>
                      </span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <Metric label="Equity" value={formatCurrency(c.current_equity)} />
                      <Metric
                        label="DD Diario"
                        value={`${c.daily_drawdown_pct.toFixed(2)}%`}
                        warn={c.daily_drawdown_pct > (phase?.max_daily_drawdown_pct ?? 5) * 0.8}
                      />
                      <Metric
                        label="DD Máx"
                        value={`${c.max_drawdown_pct.toFixed(2)}%`}
                        warn={c.max_drawdown_pct > (phase?.max_total_drawdown_pct ?? 10) * 0.8}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between gap-3">
                    <div className="md:text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                        Días operados
                      </div>
                      <div className="font-display text-2xl font-bold">
                        {c.trading_days_count}
                        <span className="text-sm text-muted-foreground font-normal">
                          / {phase?.min_trading_days ?? 4}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
                                    border border-white/[0.08] bg-white/[0.03] text-foreground/80
                                    group-hover:border-gold-500/30 group-hover:text-gold-200 group-hover:bg-gold-500/5
                                    transition-all">
                      Ver detalle <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl px-3 py-2.5 bg-white/[0.02] border border-white/[0.04]">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">{label}</div>
      <div className={cn("font-semibold text-sm mt-0.5", warn ? "text-rose-400" : "text-foreground")}>{value}</div>
    </div>
  );
}
