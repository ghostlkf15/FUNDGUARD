"use client";

import * as React from "react";
import {
  KeyRound, RefreshCw, Unlink, Copy, CheckCircle2, AlertTriangle,
  Clock3, Link2, PlayCircle, XCircle, ChevronRight,
  Terminal, Code2, Bot, Download, ExternalLink, Eye, EyeOff,
  ShieldCheck, Check, Globe2, Sparkles,
} from "@/lib/ui/lucide-polyfill";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Challenge, Firm, FirmPreset, AccountLinkMethod } from "@/lib/types";
import {
  generateReportKey,
  rotateReportKey,
  unlinkAccount,
} from "@/lib/dashboard/actions";

type TabKey = "mt5" | "ctrader" | "node";

interface Props {
  challenge: Challenge;
  firm?: Firm;
  preset?: FirmPreset;
}

const statusMeta: Record<
  string,
  { label: string; color: string; icon: any; banner: string }
> = {
  draft: {
    label: "Borrador",
    color: "bg-white/[0.06] text-muted-foreground border-white/10",
    icon: Clock3,
    banner: "from-slate-500/10 via-transparent to-transparent border-slate-400/20",
  },
  linking: {
    label: "Vinculando",
    color: "bg-sky-500/10 text-sky-300 border-sky-400/20",
    icon: Link2,
    banner: "from-sky-500/15 via-transparent to-transparent border-sky-400/30",
  },
  active: {
    label: "Conexión activa",
    color: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
    icon: PlayCircle,
    banner: "from-emerald-500/15 via-transparent to-transparent border-emerald-400/30",
  },
  approved: {
    label: "Aprobado",
    color: "bg-gold-500/15 text-gold-200 border-gold-500/30",
    icon: CheckCircle2,
    banner: "from-gold-500/20 via-transparent to-transparent border-gold-500/40",
  },
  failed: {
    label: "Reprobado",
    color: "bg-rose-500/10 text-rose-300 border-rose-400/20",
    icon: XCircle,
    banner: "from-rose-500/15 via-transparent to-transparent border-rose-400/30",
  },
  disconnected: {
    label: "Desconectado",
    color: "bg-amber-500/10 text-amber-300 border-amber-400/20",
    icon: AlertTriangle,
    banner: "from-amber-500/15 via-transparent to-transparent border-amber-400/30",
  },
  phase_changed: {
    label: "Cambio de fase",
    color: "bg-violet-500/10 text-violet-300 border-violet-400/20",
    icon: ChevronRight,
    banner: "from-violet-500/15 via-transparent to-transparent border-violet-400/30",
  },
};

const methodMeta: Record<Exclude<AccountLinkMethod, "ea_mt4" | "crypto_api">, { label: string; tab: TabKey; icon: any }> = {
  ea_mt5: { label: "MetaTrader 5 EA", tab: "mt5", icon: Bot },
  cbot_ctrader: { label: "cTrader cBot", tab: "ctrader", icon: Code2 },
};

const CLOSED = ["failed", "approved"];

function useCopy() {
  const [ok, setOk] = React.useState<string | null>(null);
  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setOk(id);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setOk(null), 1800);
    } catch {
      toast.error("No se pudo copiar. Hazlo manualmente.");
    }
  }
  return { ok, copy };
}

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return "ahora mismo";
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function isMockChallenge(c: Challenge) {
  return (
    c.id.startsWith("mock-") ||
    c.id === "demo-challenge" ||
    (c.report_key_hash && c.report_key_hash.startsWith("h_mock_"))
  );
}

export default function AccountLinkPanel({ challenge, firm, preset }: Props) {
  const [tab, setTab] = React.useState<TabKey>(() => {
    if (challenge.link_method === "ea_mt5") return "mt5";
    if (challenge.link_method === "cbot_ctrader") return "ctrader";
    return "node";
  });
  const [plainKey, setPlainKey] = React.useState<string | null>(null);
  const [showKey, setShowKey] = React.useState(true);
  const [loading, setLoading] = React.useState<"gen" | "rot" | "unlink" | null>(null);
  const [localStatus, setLocalStatus] = React.useState(challenge.status);
  const [localHash, setLocalHash] = React.useState(challenge.report_key_hash || null);
  const [localMethod, setLocalMethod] = React.useState<AccountLinkMethod | undefined>(challenge.link_method);

  const { ok, copy } = useCopy();

  const effectiveStatus = localStatus;
  const effectiveHash = localHash;
  const SMeta = statusMeta[effectiveStatus] || statusMeta.draft;
  const SIcon = SMeta.icon;
  const isClosed = CLOSED.includes(effectiveStatus);
  const hasKey = Boolean(effectiveHash);

  const apiBase =
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "https://TU-DOMINIO.com";

  const reportKeyForTemplate = plainKey || (effectiveHash ? "fk_XXXX_GENERA_UNA_CLAVE_EN_EL_DASHBOARD" : "fk_CAMBIAME_POR_TU_REPORT_KEY_DEL_DASHBOARD");

  async function handleGenerate(method: AccountLinkMethod = "ea_mt5") {
    if (isClosed) return;
    setLoading("gen");
    try {
      if (isMockChallenge(challenge)) {
        await new Promise((r) => setTimeout(r, 650));
        const mockKey = `fk_mock_${Math.random().toString(16).slice(2, 26)}${Math.random().toString(16).slice(2, 24)}`;
        setPlainKey(mockKey);
        setShowKey(true);
        setLocalStatus("linking");
        setLocalHash("h_mock_" + mockKey.slice(0, 16));
        setLocalMethod(method);
        toast.success("Clave generada (modo demo). Guárdala bien.");
      } else {
        const r = await generateReportKey(challenge.id, method);
        setPlainKey(r.plainKey);
        setShowKey(true);
        setLocalStatus(challenge.status === "draft" ? "linking" : challenge.status);
        setLocalHash("h_set_via_server");
        setLocalMethod(method);
        toast.success("Clave generada. GUÁRDALA — solo se muestra esta vez.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al generar la clave");
    } finally {
      setLoading(null);
    }
  }

  async function handleRotate() {
    if (isClosed) return;
    setLoading("rot");
    try {
      if (isMockChallenge(challenge)) {
        await new Promise((r) => setTimeout(r, 650));
        const mockKey = `fk_mock_${Math.random().toString(16).slice(2, 26)}${Math.random().toString(16).slice(2, 24)}`;
        setPlainKey(mockKey);
        setShowKey(true);
        setLocalStatus((s) => (s === "draft" || s === "disconnected" ? "linking" : s));
        setLocalHash("h_mock_" + mockKey.slice(0, 16));
        toast.success("Clave rotada (modo demo).");
      } else {
        const r = await rotateReportKey(challenge.id);
        setPlainKey(r.plainKey);
        setShowKey(true);
        setLocalStatus((s) => (s === "draft" || s === "disconnected" ? "linking" : s));
        setLocalHash("h_set_via_server");
        toast.success("Clave rotada. La anterior queda invalidada.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al rotar la clave");
    } finally {
      setLoading(null);
    }
  }

  async function handleUnlink() {
    if (isClosed) return;
    const ok = window.confirm(
      "¿Desvincular la cuenta? Se invalidará la clave actual y dejarán de procesarse reportes.",
    );
    if (!ok) return;
    setLoading("unlink");
    try {
      if (isMockChallenge(challenge)) {
        await new Promise((r) => setTimeout(r, 500));
        setLocalHash(null);
        setPlainKey(null);
        setLocalStatus(challenge.current_phase === 0 ? "draft" : "disconnected");
        setLocalMethod(undefined);
        toast.success("Cuenta desvinculada (modo demo).");
      } else {
        await unlinkAccount(challenge.id);
        setLocalHash(null);
        setPlainKey(null);
        setLocalStatus(challenge.current_phase === 0 ? "draft" : "disconnected");
        setLocalMethod(undefined);
        toast.success("Cuenta desvinculada.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al desvincular");
    } finally {
      setLoading(null);
    }
  }

  function changeMethodTab(t: TabKey) {
    setTab(t);
    if (!hasKey) return;
    if (t === "mt5") setLocalMethod("ea_mt5");
    if (t === "ctrader") setLocalMethod("cbot_ctrader");
  }

  return (
    <div className="glass-card !p-0 overflow-hidden border-gold-500/20 relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      <div className="pointer-events-none absolute -top-36 -right-36 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl animate-float-soft" />
      <div className="pointer-events-none absolute -bottom-40 -left-28 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      {/* Banner status */}
      <div
        className={cn(
          "relative px-6 py-5 border-b bg-gradient-to-r flex flex-col sm:flex-row sm:items-center justify-between gap-3",
          SMeta.banner,
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 relative animate-glow-pulse-ring", SMeta.color)}>
            <div className="absolute inset-0 rounded-2xl bg-white/5 animate-sweep -skew-x-12" />
            <SIcon className="w-5 h-5 relative z-10" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display text-xl tracking-tight">Conectar cuenta de trading</span>
              <span className={cn("inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-0.5 rounded-full border animate-badge-bounce", SMeta.color)}>
                <SIcon className="w-3 h-3" /> {SMeta.label}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Último reporte recibido:{" "}
              <span className="text-foreground/90 font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07]">
                {timeAgo(challenge.ea_last_report_at)}
              </span>
              {localMethod && (
                <>
                  <span className="mx-2 text-white/20">·</span>
                  Método:{" "}
                  <span className="text-foreground font-semibold">
                    {methodMeta[localMethod as keyof typeof methodMeta]?.label ||
                      (localMethod === "crypto_api" ? "API Cripto" : localMethod)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!hasKey && !isClosed && (
            <button
              onClick={() => handleGenerate(tab === "mt5" ? "ea_mt5" : tab === "ctrader" ? "cbot_ctrader" : "ea_mt5")}
              disabled={loading !== null}
              className="btn-gold !py-2.5 !px-4 text-sm inline-flex items-center gap-2 disabled:opacity-60 relative overflow-hidden group"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-white/10 -skew-x-12 animate-sweep" />
              <KeyRound className={cn("w-4 h-4 relative", loading === "gen" && "animate-spin")} />
              {loading === "gen" ? "Generando…" : "🔑 Generar clave reporte"}
            </button>
          )}
          {hasKey && !isClosed && (
            <>
              <button
                onClick={handleRotate}
                disabled={loading !== null}
                className="btn-ghost-gold !py-2.5 !px-4 text-sm inline-flex items-center gap-2 disabled:opacity-60 relative overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-white/10 -skew-x-12 animate-sweep" />
                <RefreshCw className={cn("w-4 h-4 relative", loading === "rot" && "animate-spin")} />
                {loading === "rot" ? "Rotando…" : "🔄 Rotar clave"}
              </button>
              <button
                onClick={handleUnlink}
                disabled={loading !== null}
                className="!py-2.5 !px-4 text-sm inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/5 text-rose-200 hover:bg-rose-500/10 hover:border-rose-400/50 transition-colors disabled:opacity-60 relative overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-white/10 -skew-x-12 animate-sweep" />
                <Unlink className={cn("w-4 h-4 relative", loading === "unlink" && "animate-spin")} />
                {loading === "unlink" ? "…" : "⛓️‍💥 Desvincular"}
              </button>
            </>
          )}
          {isClosed && (
            <div className="chip-gold !py-1.5 relative overflow-hidden">
              <span className="absolute inset-0 bg-grid-gold-fine opacity-10" />
              <CheckCircle2 className="w-3.5 h-3.5" /> Desafío cerrado
            </div>
          )}
        </div>
      </div>

      {/* Plain key reveal (1 sola vez) */}
      {plainKey && showKey && (
        <div className="px-6 py-6 border-b border-gold-500/20 bg-gold-500/5 relative overflow-hidden">
          <div className="absolute pointer-events-none inset-0 bg-grid-gold-fine opacity-10 mask-fade-b" />
          <div className="flex items-start gap-4 relative">
            <div className="w-11 h-11 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0 animate-float-soft">
              <Eye className="w-5 h-5 text-gold-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <div>
                  <div className="font-semibold text-gold-200 flex items-center gap-2 flex-wrap">
                    Tu clave de reporte
                    <span className="chip-gold !py-0 !text-[10px] animate-badge-bounce">
                      <ShieldCheck className="w-3 h-3" />
                      1 SOLA VEZ
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copia esta clave en el input <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded border border-gold-500/20 text-[11px] text-gold-100">ReportKey</code> de tu EA / cBot / Worker.
                    No se volverá a mostrar. Si la pierdes, rota la clave.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowKey(false);
                    setPlainKey(null);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                  <EyeOff className="w-3 h-3" /> Ya la guardé — ocultar
                </button>
              </div>
              <div className="mt-3 flex items-stretch gap-2 flex-col sm:flex-row">
                <div className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-gold-500/30 font-mono text-sm tracking-wide select-all break-all relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-gold-500/40 to-transparent" />
                  <span className="text-gold-400 mr-2">▍</span>{plainKey}
                </div>
                <button
                  onClick={() => copy("plain-key", plainKey)}
                  className="px-4 rounded-2xl bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 text-gold-200 transition-colors inline-flex items-center justify-center gap-2 shrink-0"
                >
                  {ok === "plain-key" ? (
                    <><Check className="w-4 h-4 text-emerald-400" /> Copiada</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copiar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN WORKFLOW · NUEVA */}
      <div className="px-6 pt-8 pb-2 relative">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <div className="chip-gold !py-0.5 !text-[10px] mb-2 animate-badge-bounce">
              <Sparkles className="w-3 h-3" />
              Workflow · 4 pasos
            </div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight">
              Desde que generas la clave <span className="text-gold-300">hasta recibir la primera alerta.</span>
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              La guía más visual y rápida para tener tu EA reportando en menos de 90 segundos.
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Timeline connector line (desktop) */}
          <div className="hidden lg:block absolute left-12 right-12 top-[68px] h-[2px] mask-fade-edges pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent animate-flow-x" style={{ backgroundSize: "200% 100%" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                n: "01", pct: 25, title: "Habilita WebRequest",
                desc: "En opciones del terminal permite llamadas HTTP al dominio FundGuard.",
                badge: { label: "Pick", cls: "bg-sky-500/10 text-sky-300 border-sky-400/30", icon: Globe2, anim: "animate-float-soft" },
                ring: "from-sky-300 via-sky-500 to-sky-700",
                delay: "0s",
              },
              {
                n: "02", pct: 50, title: "Pega Report Key",
                desc: "En inputs del EA/cBot/worker pega la clave única generada arriba.",
                badge: { label: "Safe", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30", icon: ShieldCheck, anim: "animate-badge-bounce" },
                ring: "from-emerald-300 via-emerald-500 to-emerald-700",
                delay: "-2s",
              },
              {
                n: "03", pct: 75, title: "Atacha al gráfico",
                desc: "Compila y adjunta el EA al chart EURUSD M1. Activa Algo Trading.",
                badge: { label: "Live", cls: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/30", icon: PlayCircle, anim: "animate-float-soft" },
                ring: "from-fuchsia-300 via-fuchsia-500 to-fuchsia-700",
                delay: "-4s",
              },
              {
                n: "04", pct: 100, title: "Alertas en vivo",
                desc: "Recibe email/push cuando apruebas o cuando el DD roza el límite.",
                badge: { label: "Win", cls: "bg-gold-500/10 text-gold-200 border-gold-500/30", icon: CheckCircle2, anim: "animate-badge-bounce" },
                ring: "from-gold-200 via-gold-500 to-gold-700",
                delay: "-6s",
              },
            ].map((s, i) => {
              const ringSize = 92;
              const stroke = 5;
              const r = (ringSize - stroke) / 2;
              const circ = 2 * Math.PI * r;
              const dash = (s.pct / 100) * circ;
              const BIcon = s.badge.icon;
              return (
                <div
                  key={s.n}
                  className="group relative p-5 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] hover:border-gold-500/30 hover:-translate-y-1.5 transition-all duration-500 hover:shadow-[0_20px_60px_-24px_rgba(212,160,92,0.35)] animate-fade-in-up overflow-hidden"
                  style={{ animationDelay: s.delay }}
                >
                  <div className="pointer-events-none absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gold-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="pointer-events-none absolute inset-0 bg-grid-gold-fine opacity-[0.07] mask-fade-b" />

                  <div className="flex items-start justify-between gap-3 mb-5 relative">
                    <div
                      className="relative shrink-0"
                      style={{ width: ringSize, height: ringSize }}
                    >
                      {i === 3 ? (
                        <svg width={ringSize} height={ringSize} className="absolute inset-0 animate-spin-slow" viewBox={`0 0 ${ringSize} ${ringSize}`}>
                          <defs>
                            <linearGradient id={`spin-${s.n}`} x1="0" x2="1" y1="0" y2="1">
                              <stop offset="0%" stopColor="rgba(212,160,92,0.2)" />
                              <stop offset="50%" stopColor="rgba(212,160,92,0.9)" />
                              <stop offset="100%" stopColor="rgba(212,160,92,0.0)" />
                            </linearGradient>
                          </defs>
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={r}
                            fill="none"
                            stroke={`url(#spin-${s.n})`}
                            strokeWidth={2}
                            strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : null}
                      <svg width={ringSize} height={ringSize} className="w-[72px] h-[72px] md:w-24 md:h-24 -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
                        <defs>
                          <linearGradient id={`ring-${s.n}`} x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f6d186" />
                            <stop offset="55%" stopColor="#d4a05c" />
                            <stop offset="100%" stopColor="#8b5e23" />
                          </linearGradient>
                          <filter id={`ringshadow-${s.n}`}><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#d4a05c" floodOpacity="0.55" /></filter>
                        </defs>
                        <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                        <circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={r}
                          fill="none"
                          stroke={`url(#ring-${s.n})`}
                          strokeWidth={stroke}
                          strokeDasharray={`${dash} ${circ}`}
                          strokeLinecap="round"
                          filter={`url(#ringshadow-${s.n})`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={cn(
                            "w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br border border-white/10 flex items-center justify-center shadow-lg shadow-black/40 bg-gradient-to-br text-black",
                            `from-${s.ring.split(" ")[0].replace("from-", "")} via-${s.ring.split(" ")[1].replace("via-", "")} to-${s.ring.split(" ")[2].replace("to-", "")}`,
                            "animate-float-soft"
                          )}
                          style={{ animationDelay: s.delay }}
                        >
                          <span className="font-display text-white text-lg drop-shadow">{s.n}</span>
                        </div>
                      </div>
                    </div>

                    <span className={cn("text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shrink-0", s.badge.cls, s.badge.anim)}>
                      <BIcon className="w-3 h-3" /> {s.badge.label}
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display text-lg leading-tight">{s.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>

                  {/* Micro progress bar */}
                  <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", s.ring)}
                      style={{ width: `${s.pct}%` }}
                    />
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-white/60 animate-sweep -skew-x-12" style={{ width: "33%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs métodos */}
      <div className="px-6 pt-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
              Método de conexión
            </div>
            <div className="font-display text-lg">Instrucciones detalladas por plataforma</div>
          </div>
        </div>

        <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 relative">
          <div className="absolute inset-0 rounded-2xl bg-grid-gold-fine opacity-[0.06] mask-fade-b pointer-events-none" />
          {(
            [
              { k: "mt5", label: "MetaTrader 5", icon: Bot, hint: ".mq5 EA" },
              { k: "ctrader", label: "cTrader cAlgo", icon: Code2, hint: ".cs cBot" },
              { k: "node", label: "Node Worker", icon: Terminal, hint: "worker.js" },
            ] as { k: TabKey; label: string; icon: any; hint: string }[]
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => changeMethodTab(t.k)}
              className={cn(
                "relative px-4 py-2.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 z-10",
                tab === t.k
                  ? "bg-gold-500/20 text-gold-100 shadow-[0_10px_30px_-15px_rgba(212,160,92,0.5)] border border-gold-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent",
              )}
            >
              {tab === t.k && <span className="absolute inset-0 -skew-x-12 bg-white/10 animate-sweep rounded-xl pointer-events-none" />}
              <t.icon className="w-4 h-4 relative" />
              {t.label}
              <span className="hidden md:inline opacity-60 text-[10px]">· {t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {tab === "mt5" && (
          <Mt5Instructions
            apiBase={apiBase}
            reportKey={reportKeyForTemplate}
            ok={ok}
            copy={copy}
            hasKey={hasKey}
          />
        )}
        {tab === "ctrader" && (
          <CTraderInstructions
            apiBase={apiBase}
            reportKey={reportKeyForTemplate}
            ok={ok}
            copy={copy}
            hasKey={hasKey}
          />
        )}
        {tab === "node" && (
          <NodeInstructions
            apiBase={apiBase}
            reportKey={reportKeyForTemplate}
            ok={ok}
            copy={copy}
            hasKey={hasKey}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MT5                                                                */
/* ------------------------------------------------------------------ */
function Mt5Instructions({
  apiBase,
  reportKey,
  ok,
  copy,
  hasKey,
}: {
  apiBase: string;
  reportKey: string;
  ok: string | null;
  copy: (id: string, text: string) => void;
  hasKey: boolean;
}) {
  const eaCode = `//+------------------------------------------------------------------+
//|                                                    FundGuard.mq5 |
//|                           Copyright 2025, FUNDGUARD · Prop Firm  |
//|                                             https://fundguard.app |
//+------------------------------------------------------------------+
//| EA (Asesor Experto) para MetaTrader 5. Reporta balance, equity,  |
//| posiciones abiertas y trades cerrados al endpoint /api/report.   |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, FUNDGUARD"
#property link      "https://fundguard.app"
#property version   "1.00"
#property strict
#property indicator_chart_window

#include <Trade\\Trade.mqh>
// Nota: JSON.mqh es opcional en MT5 build 4250+. Si tu build es antiguo:
// https://github.com/kroitor/mql5-json

input string FundGuardAPI       = "${apiBase}";   // Sin / al final
input string WorkerSecret       = "fg_wrk_CAMBIAME_POR_EL_DE_TU_ENV_LOCAL";
input string ReportKey          = "${reportKey}";
input string ChallengeId        = "";
input int    ReportIntervalMs   = 3000;
input bool   SimulateDemo       = false;

// (ver carpeta ea/FundGuard_EA.mq5 para el código completo OnTick + WebRequest)
// https://www.mql5.com/en/docs/common/webrequest`;

  return (
    <div className="space-y-4">
      {/* Banner OBLIGATORIO WebRequest — user lo pide VERBATIM */}
      <div className="p-4 rounded-xl border border-sky-400/30 bg-sky-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-sky-300" />
          </div>
          <div>
            <div className="font-semibold text-sky-100">
              Paso 1 (OBLIGATORIO) · Habilitar WebRequest
            </div>
            <p className="text-sm text-sky-200/90 mt-1 leading-relaxed">
              En MetaTrader 5, abre{" "}
              <code className="px-1.5 py-0.5 rounded bg-black/30 border border-sky-400/30 font-mono text-xs">
                Menú Herramientas → Opciones → pestaña Asesores Expertos
              </code>
              .<br />
              <span className="text-white font-medium">
                Marca ✅ "Permitir WebRequest para URL enumeradas"
              </span>
              , pulsa <b>Añadir URL</b> y pega:{" "}
            </p>
            <div className="mt-2 flex items-stretch gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-sky-400/40 font-mono text-xs break-all">
                {apiBase}
              </div>
              <button
                onClick={() => copy("mt5-url", apiBase)}
                className="px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-100 text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                {ok === "mt5-url" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {ok === "mt5-url" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-[11px] text-sky-200/70 mt-2 leading-relaxed">
              ⚠️ Importante:{" "}
              <b className="text-white">
                En Opciones → Asesores → añade tu URL al WebRequest
              </b>{" "}
              antes de atachar el EA. Si olvidas este paso, WebRequest devolverá -1 y los
              reportes no llegarán.
            </p>
          </div>
        </div>
      </div>

      <StepRow
        n={2}
        title="Inputs del trader · Solo 2 valores (WorkerSecret NO se toca)"
        body={
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              • <b className="text-amber-300">WorkerSecret</b>:{" "}
              <span className="text-amber-200">
                ✅ Embebido dentro del <code>.ex5</code> (el admin/developer lo ha compilado dentro).{" "}
                <b>NO lo rellena el trader.</b>
              </span>
            </li>
            <li>
              • <b>FundGuardAPI</b>: La URL base del hosting (ej <code>https://fundguard.tudominio.com</code>)
              — sin <code>/api/report</code> ni <code>/</code> final.
            </li>
            <li>
              • <b>ReportKey</b>: La clave <code className="font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">fk_...</code>
              {" "}que generaste arriba (y que solo se mostró una vez).
            </li>
            <li>
              • <b>ChallengeId</b>: Déjalo vacío. El servidor lo auto-resuelve por ReportKey.
            </li>
            <li>
              • <b>ReportIntervalMs</b>: <code>3000</code> (no bajar de 1500 para no saturar).
            </li>
            <li>
              • <b>SimulateDemo</b>:{" "}
              <code>true</code> para probar sin broker real (ticks sintéticos EURUSD / XAUUSD)
              ; <code>false</code> en producción con cuenta real.
            </li>
          </ul>
        }
      />

      <StepRow
        n={3}
        title="Compilar y atachar al chart"
        body={
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. En MT5 pulsa <b>F4</b> para abrir el <b>MetaEditor</b>.</p>
            <p>2. <b>Archivo → Nuevo → Asesor Experto</b>. Ponle nombre <code>FundGuard_EA</code> y reemplaza TODO su contenido por el código de abajo.</p>
            <p>3. Pulsa <b>F7</b> para compilar. Deberías ver <code className="text-emerald-300">0 errores, 0 warnings</code>.</p>
            <p>4. Vuelve a MT5, abre el chart de <b>EURUSD M1</b> y atacha el EA desde el <b>Navegador → Asesores Expertos</b>. En la pestaña <b>General</b> marca <b>Permitir trading en tiempo real</b> y <b>Permitir WebRequest</b>.</p>
            <p>5. En la <b>pestaña Entradas</b> pega <b>solo</b> tu ReportKey + verifica la URL. Click OK. (WorkerSecret ya viene compilado dentro, no lo toques).</p>
            <p className="text-emerald-300">✅ Si todo va bien, en la pestaña Expertos verás: <code>[FundGuard-EA] ✅ Report OK.</code> cada 3 segundos.</p>
          </div>
        }
      />

      <CodeBlock
        label="FundGuard_EA.mq5 (plantilla con tus valores)"
        lang="mq5"
        id="mt5-ea-code"
        code={eaCode}
        ok={ok}
        copy={copy}
        downloadFilename="FundGuard_EA.mq5"
      />

      {!hasKey && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-400/20 text-xs text-amber-200 inline-flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Aún no has generado una clave <code>ReportKey</code>. Pulsa el botón{" "}
            <b>"🔑 Generar clave reporte"</b> arriba para obtener tu clave única.
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  cTrader                                                            */
/* ------------------------------------------------------------------ */
function CTraderInstructions({
  apiBase,
  reportKey,
  ok,
  copy,
  hasKey,
}: {
  apiBase: string;
  reportKey: string;
  ok: string | null;
  copy: (id: string, text: string) => void;
  hasKey: boolean;
}) {
  const cbotCode = `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using cAlgo.API;
using cAlgo.API.Internals;
using Newtonsoft.Json;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.None)]
    public class FundGuardcBot : Robot
    {
        [Parameter("FundGuard API Base URL", DefaultValue = "${apiBase}")]
        public string FundGuardApiBase { get; set; }

        [Parameter("Worker Secret", DefaultValue = "fg_wrk_CAMBIAME_POR_EL_DE_TU_ENV_LOCAL")]
        public string WorkerSecret { get; set; }

        [Parameter("Report Key", DefaultValue = "${reportKey}")]
        public string ReportKey { get; set; }

        [Parameter("Challenge ID (optional)")]
        public string ChallengeId { get; set; }

        [Parameter("Report Interval (ms)", DefaultValue = 3000, MinValue = 1500)]
        public int ReportIntervalMs { get; set; }

        [Parameter("Enable Demo Mode (synthetic)", DefaultValue = false)]
        public bool DemoMode { get; set; }

        // (resto del código en ea/FundGuard_cBot.cs — OnStart / OnTick / BuildPayload)
    }
}
`;

  return (
    <div className="space-y-4">
      <StepRow
        n={1}
        title="Abrir cAlgo · Build from source"
        body={
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p>1. Abre <b>cTrader</b> y ve a la pestaña <b>cBots (cAlgo)</b>.</p>
            <p>2. Click <b>Nuevo → Build from source</b> o <b>Manage Sources → New Robot</b>.</p>
            <p>3. Borra el código de plantilla y pega el código del bloque inferior.</p>
            <p>4. Añade la referencia NuGet <b>Newtonsoft.Json</b> (click derecho en el proyecto → Manage NuGet Packages → buscar → instalar).</p>
            <p>5. Click <b>Build</b> (Ctrl+B). Deberías ver <code className="text-emerald-300">Build succeeded</code>.</p>
          </div>
        }
      />

      <StepRow
        n={2}
        title="Parámetros · añadir instancia"
        body={
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p>• <b>FundGuardApiBase</b>: <code>{apiBase}</code> (ya está pre-rellenado).</p>
            <p>• <b>WorkerSecret</b>: <span className="text-amber-200">Embebido dentro del <code>.ex5</code>. El admin/developer lo compiló dentro de la línea 32. <b>NO lo rellena el trader.</b></span></p>
            <p>• <b>ReportKey</b>: La clave <code>fk_...</code> que generaste arriba.</p>
            <p>• <b>ChallengeId</b>: Opcional — se auto-resuelve por ReportKey.</p>
            <p>• <b>DemoMode</b>: <code>true</code> si quieres probar ticks sintéticos sin cuentas reales.</p>
            <p className="pt-1">Arrastra el cBot a un chart (ej <b>EURUSD, m1</b>) o añádelo desde la lista de cBots → click Play ▶️.</p>
          </div>
        }
      />

      <CodeBlock
        label="FundGuard_cBot.cs (plantilla con tus valores)"
        lang="cs"
        id="ctrader-code"
        code={cbotCode}
        ok={ok}
        copy={copy}
        downloadFilename="FundGuard_cBot.cs"
      />

      {!hasKey && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-400/20 text-xs text-amber-200 inline-flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Aún no has generado una clave <code>ReportKey</code>. Pulsa el botón{" "}
            <b>"🔑 Generar clave reporte"</b> arriba.
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Node Worker                                                        */
/* ------------------------------------------------------------------ */
function NodeInstructions({
  apiBase,
  reportKey,
  ok,
  copy,
  hasKey,
}: {
  apiBase: string;
  reportKey: string;
  ok: string | null;
  copy: (id: string, text: string) => void;
  hasKey: boolean;
}) {
  const envBlock = `# .env.local del WORKER (ejecuta el worker desde la raíz del proyecto FUNDGUARD)
FUNDGUARD_API_BASE=${apiBase}
FUNDGUARD_WORKER_SECRET=fg_wrk_CAMBIAME_POR_EL_DE_TU_ENV_LOCAL
FUNDGUARD_REPORT_KEY=${reportKey}
# FUNDGUARD_CHALLENGE_ID=  # opcional
REPORT_INTERVAL_MS=3000
`;

  const runCmd = `# Windows PowerShell:
$env:FUNDGUARD_API_BASE="${apiBase}"
$env:FUNDGUARD_WORKER_SECRET="fg_wrk_CAMBIAME_POR_EL_DE_TU_ENV_LOCAL"
$env:FUNDGUARD_REPORT_KEY="${reportKey}"
node ea/worker-reference.js

# Linux / macOS:
export FUNDGUARD_API_BASE="${apiBase}"
export FUNDGUARD_WORKER_SECRET="fg_wrk_CAMBIAME_POR_EL_DE_TU_ENV_LOCAL"
export FUNDGUARD_REPORT_KEY="${reportKey}"
node ea/worker-reference.js

# Modo demo (no necesita Supabase — útil para pruebas rápidas):
set FUNDGUARD_REPORT_KEY=fk_demo_12345678  &&  node ea/worker-reference.js
`;

  return (
    <div className="space-y-4">
      <StepRow
        n={1}
        title="Requisitos · Node.js 18+"
        body={
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p>Ejecuta el worker en la misma carpeta de tu proyecto FUNDGUARD (donde está la carpeta <code>ea/</code> con <code>worker-reference.js</code>).</p>
            <p>Dependencias: <code>dotenv</code> (opcional). El worker usa únicamente módulos <b>nativos</b> <code>http / https / url</code>.</p>
          </div>
        }
      />

      <StepRow
        n={2}
        title="Configurar variables de entorno"
        body={
          <p className="text-sm text-muted-foreground">
            Crea o edita tu <code>.env.local</code> con estos valores, o exporta las variables
            en tu terminal antes de arrancar:
          </p>
        }
      />
      <CodeBlock
        label=".env.local (variables worker)"
        lang="bash"
        id="node-env"
        code={envBlock}
        ok={ok}
        copy={copy}
      />

      <StepRow
        n={3}
        title="Arrancar el worker"
        body={
          <p className="text-sm text-muted-foreground">
            Verás un banner ASCII y cada ~20 reports un resumen de balance, equity, DDs y warnings.
            El worker se detiene solo cuando el desafío llega a <b>failed</b> o <b>approved</b>.
          </p>
        }
      />
      <CodeBlock
        label="Terminal · arrancar worker"
        lang="bash"
        id="node-run"
        code={runCmd}
        ok={ok}
        copy={copy}
      />

      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-400/20">
        <ExternalLink className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
        <div className="text-xs text-violet-100/90 space-y-1">
          <p className="font-semibold text-violet-100">Modo demo (sin Supabase) 🔥</p>
          <p>
            Para probar la conexión al endpoint sin guardar nada en BD, usa{" "}
            <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded border border-violet-400/30">
              FUNDGUARD_REPORT_KEY=fk_demo_12345678
            </code>
            . El endpoint responde con{" "}
            <code className="font-mono">ok:true, mode:mock</code> y cálculos sintéticos.
          </p>
        </div>
      </div>

      {!hasKey && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-400/20 text-xs text-amber-200 inline-flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Aún no has generado una clave <code>ReportKey</code>. Pulsa{" "}
            <b>"🔑 Generar clave reporte"</b> arriba.
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers UI                                                         */
/* ------------------------------------------------------------------ */
function StepRow({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/40 flex items-center justify-center shrink-0 font-display text-sm text-gold-200">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground mb-1.5">{title}</div>
        <div>{body}</div>
      </div>
    </div>
  );
}

function CodeBlock({
  label,
  lang,
  id,
  code,
  ok,
  copy,
  downloadFilename,
}: {
  label: string;
  lang: string;
  id: string;
  code: string;
  ok: string | null;
  copy: (id: string, text: string) => void;
  downloadFilename?: string;
}) {
  function download() {
    if (!downloadFilename) return;
    try {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Descargado: ${downloadFilename}`);
    } catch {
      toast.error("No se pudo descargar.");
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground truncate">
            {label}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 font-mono text-muted-foreground shrink-0">
            .{lang}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {downloadFilename && (
            <button
              onClick={download}
              className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-muted-foreground hover:text-foreground transition-colors text-xs inline-flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Descargar
            </button>
          )}
          <button
            onClick={() => copy(id, code)}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs inline-flex items-center gap-1.5 transition-colors",
              ok === id
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                : "bg-gold-500/10 hover:bg-gold-500/20 border-gold-500/30 text-gold-100",
            )}
          >
            {ok === id ? (
              <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copiado</>
            ) : (
              <><Copy className="w-3 h-3" /> Copiar</>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-auto max-h-[420px] text-[12px] leading-relaxed font-mono text-slate-100/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}
