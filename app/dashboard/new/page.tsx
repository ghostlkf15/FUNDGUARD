"use client";

import * as React from "react";
import { Suspense, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Landmark,
  BarChart3,
  Coins,
  CheckCircle2,
  Building2,
  Wallet,
  Link2,
  KeyRound,
  ShieldCheck,
  Loader2,
  Copy,
  Download,
  Check,
  Activity,
  Clock,
  Calendar,
  Zap,
  TrendingUp,
  User,
  Sparkles,
} from "@/lib/ui/lucide-polyfill";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { MarketType, FirmPreset, Firm, AccountLinkMethod } from "@/lib/types";
import { DEFAULT_FIRMS, DEFAULT_PRESETS, getFirmsByMarket, getPresetsByFirm } from "@/lib/data/seed";
import { toast } from "@/components/ui/sonner";
import { FirmLogo } from "@/components/ui/firm-logo";
import { createChallengeAction } from "@/lib/dashboard/actions";
import type { CreateChallengeResult } from "@/lib/dashboard/actions";

const STEPS = [
  { id: 0, title: "Mercado", icon: Landmark, desc: "Forex · Futuros · Cripto · Sintéticos" },
  { id: 1, title: "Firma prop", icon: Building2, desc: "Elige tu firma" },
  { id: 2, title: "Tamaño de cuenta", icon: Wallet, desc: "Preset y balance inicial" },
  { id: 3, title: "Vincular cuenta", icon: Link2, desc: "EA / cBot o API key" },
];

const EA_DOWNLOAD_MAP: Record<AccountLinkMethod, { file: string; label: string }[]> = {
  ea_mt5: [
    { file: "/ea/FundGuard_EA.ex5", label: "EA MT5 · Compilado (.ex5)" },
    { file: "/ea/FundGuard_EA.mq5", label: "EA MT5 · Código fuente (.mq5)" },
  ],
  ea_mt4: [
    { file: "/ea/FundGuard_EA_MT4.mq4", label: "EA MT4 · Código fuente (.mq4)" },
  ],
  cbot_ctrader: [
    { file: "/ea/FundGuard_cBot.cs", label: "cBot cTrader · Código fuente (.cs)" },
  ],
  crypto_api: [],
};

function NewChallengeWizardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sb = React.useMemo(() => createSupabaseClient(), []);
  const [isGuest, setIsGuest] = React.useState<boolean>(false);
  const [sessionChecked, setSessionChecked] = React.useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: sessionData } = await sb.auth.getSession();
        setIsGuest(!sessionData.session?.user);
      } catch {
        setIsGuest(true);
      } finally {
        setSessionChecked(true);
      }
    })();
  }, [sb]);

  const [step, setStep] = React.useState<number>(0);
  const [market, setMarket] = React.useState<MarketType | null>(null);
  const [firm, setFirm] = React.useState<Firm | null>(null);
  const [preset, setPreset] = React.useState<FirmPreset | null>(null);
  const [linkMethod, setLinkMethod] = React.useState<AccountLinkMethod | null>(null);
  const [exchangeId, setExchangeId] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [apiSecret, setApiSecret] = React.useState("");
  const [isCreating, startCreating] = useTransition();
  const creatingLockedRef = React.useRef(false);
  const [copied, setCopied] = React.useState(false);
  const [created, setCreated] = React.useState<CreateChallengeResult | null>(null);
  const [keyRevealed, setKeyRevealed] = React.useState(false);

  const [guestSignupHref, setGuestSignupHref] = React.useState<string>("/signup?guest=1");

  const [paramsApplied, setParamsApplied] = React.useState(false);
  React.useEffect(() => {
    if (paramsApplied) return;
    const m = params.get("market") as MarketType | null;
    const f = params.get("firm");
    const l = params.get("link") as AccountLinkMethod | null;
    const p = params.get("preset");
    if (m) setMarket(m);
    const foundFirm = f ? DEFAULT_FIRMS.find((x) => x.id === f) || null : null;
    if (foundFirm) setFirm(foundFirm);
    if (l) setLinkMethod(l);
    let foundPreset: FirmPreset | null = null;
    if (p && foundFirm) {
      const presetList = getPresetsByFirm(foundFirm.id);
      foundPreset = presetList.find((pp) => pp.id === p) || null;
      if (foundPreset) setPreset(foundPreset);
    }
    if (m) {
      if (foundPreset && l) {
        setStep(3);
      } else if (foundPreset || (foundFirm && p)) {
        setStep(2);
      } else if (foundFirm) {
        setStep(1);
      } else {
        setStep(1);
      }
    }
    const qs = params.toString();
    const nextPath = qs ? `/dashboard/new?${qs}` : "/dashboard/new";
    setGuestSignupHref(`/signup?next=${encodeURIComponent(nextPath)}&guest=1`);
    setParamsApplied(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsApplied]);

  const markets: { id: MarketType; label: string; icon: any; desc: string; badge?: string }[] = [
    { id: "forex", label: "Forex", icon: Landmark, desc: "MT4 / MT5 · EA propio en MQL", badge: "7 firmas" },
    { id: "futures", label: "Futuros", icon: BarChart3, desc: "cTrader · cBot propio en cAlgo", badge: "5 firmas" },
    { id: "crypto", label: "Cripto", icon: Coins, desc: "Exchange vía CCXT · API read-only", badge: "1 firma" },
    { id: "synthetic_indices", label: "Índices Sintéticos", icon: Activity, desc: "Deriv · Boom & Crash · Volatility · 24/7", badge: "2 firmas · 24/7" },
  ];

  const firms = market ? getFirmsByMarket(market) : [];
  const presets = firm ? getPresetsByFirm(firm.id) : [];

  function goNext() {
    if (step === 0 && !market) return toast.error("Selecciona un mercado");
    if (step === 1 && !firm) return toast.error("Selecciona una firma prop");
    if (step === 2 && !preset) return toast.error("Selecciona un tamaño de cuenta");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function canCreate() {
    return market && firm && preset && linkMethod && (linkMethod !== "crypto_api" || (exchangeId && apiKey && apiSecret));
  }

  function createChallenge() {
    if (!canCreate() || !firm || !preset || !market) return;
    if (creatingLockedRef.current || isCreating) return;
    creatingLockedRef.current = true;

    const input = {
      market: market!,
      firm_id: firm!.id,
      preset_id: preset!.id,
      link_method: linkMethod!,
      exchange_id: linkMethod === "crypto_api" ? exchangeId || undefined : undefined,
      api_key: linkMethod === "crypto_api" ? apiKey || undefined : undefined,
      api_secret: linkMethod === "crypto_api" ? apiSecret || undefined : undefined,
    };

    startCreating(async () => {
      try {
        const res = await createChallengeAction(input);

        if (res.guest_mode && res.guest_signup_path) {
          const signupPath = res.guest_signup_path;
          toast.warning("Regístrate para guardar tu desafío", {
            description: "Sin tarjeta · Sin KYC · 30 segundos",
            action: {
              label: "Crear cuenta",
              onClick: () => router.push(signupPath),
            },
          });
          setTimeout(() => router.push(signupPath), 450);
          return;
        }

        setCreated(res);
        setKeyRevealed(false);
        toast.success("Desafío creado. Muestra y guarda tu clave de reporte.");
      } catch (e: any) {
        const msg = e?.message || "Error creando desafío";
        toast.error(msg);
      } finally {
        creatingLockedRef.current = false;
      }
    });
  }

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      toast.success("Clave copiada al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function triggerDownload(filePath: string, label: string) {
    try {
      const a = document.createElement("a");
      a.href = filePath;
      a.download = filePath.split("/").pop() || "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Descargando: ${label}`);
    } catch {
      toast.error("No se pudo iniciar la descarga");
    }
  }

  function handleDownloadEa() {
    if (!linkMethod) return toast.error("Selecciona un método de vinculación primero");
    const downloads = EA_DOWNLOAD_MAP[linkMethod];
    if (downloads.length === 0) return toast.info("Este método no requiere descarga de EA");
    if (downloads.length === 1) {
      triggerDownload(downloads[0].file, downloads[0].label);
    } else {
      downloads.forEach((d) => triggerDownload(d.file, d.label));
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold-300 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver al dashboard
      </Link>

      {sessionChecked && isGuest && (
        <div className="mb-8 relative overflow-hidden rounded-2xl gold-gradient-border glass-card-strong p-5">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gold-400/30 blur-3xl opacity-40 animate-glow-pulse-ring" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-300/20 blur-3xl opacity-40" />
          <div className="relative flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 shrink-0 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-400/30 via-amber-500/20 to-gold-700/10 flex items-center justify-center shadow-gold">
              <Sparkles className="w-5 h-5 text-gold-300" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-200 text-[10px] uppercase tracking-[0.18em] font-semibold mb-2">
                <User className="w-3 h-3" /> Modo invitado
              </div>
              <h2 className="font-display text-2xl font-semibold leading-tight">
                Prueba el wizard sin registrarte
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Configura todo el desafío, el preset exacto y el método. <span className="text-foreground/90 font-medium">Para guardarlo</span> y recibir tu clave de reporte, crea tu cuenta en 30s — sin tarjeta, sin KYC, gratis.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={guestSignupHref}
                className="btn-gold px-5 py-2.5 inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Guardar desafío
              </Link>
              <Link
                href="/login"
                className="btn-ghost-gold px-5 py-2.5 inline-flex items-center gap-2"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="chip-gold mb-3 !py-1">
          <CheckCircle2 className="w-3 h-3" /> Nuevo desafío
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">
          Configura tu <span className="gold-gradient-text">Prop Challenge</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Sigue estos 4 pasos. Los presets incluyen las reglas oficiales de
          cada firma (drawdown, trailing, días mínimos).
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-12 relative">
        <div className="grid grid-cols-4 gap-3">
          {STEPS.map((s) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "text-left p-4 rounded-2xl border transition-all relative",
                  active
                    ? "bg-gold-500/10 border-gold-500/40 shadow-gold"
                    : done
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-white/[0.02] border-white/[0.05] opacity-70",
                  s.id < step && "cursor-pointer hover:border-gold-500/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      done
                        ? "bg-emerald-500/15 border-emerald-400/30"
                        : active
                        ? "bg-gold-500/20 border-gold-500/40 shadow-gold"
                        : "bg-white/[0.03] border-white/[0.06]"
                    )}
                  >
                    {done ? (
                      <Check className="w-5 h-5 text-emerald-300" />
                    ) : (
                      <s.icon
                        className={cn(
                          "w-5 h-5",
                          active ? "text-gold-300" : "text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Paso {s.id + 1}
                    </div>
                    <div
                      className={cn(
                        "font-semibold text-sm truncate",
                        active && "text-gold-200"
                      )}
                    >
                      {s.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate hidden md:block">
                      {s.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel */}
      <div className="glass-card-strong p-6 md:p-10 gold-gradient-border min-h-[420px]">
        {/* STEP 0 · MARKET */}
        {step === 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {markets.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMarket(m.id);
                  setFirm(null);
                  setPreset(null);
                }}
                className={cn(
                  "relative text-left p-7 rounded-2xl border transition-all group overflow-hidden",
                  market === m.id
                    ? "bg-gold-500/10 border-gold-500/50 shadow-gold-lg"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-gold-500/30 hover:bg-gold-500/5"
                )}
              >
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-gold-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shadow-gold">
                      <m.icon className="w-7 h-7 text-gold-300" />
                    </div>
                    {m.badge && (
                      <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border bg-white/[0.03] border-white/10 text-muted-foreground">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl mb-2">{m.label}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{m.desc}</p>
                  <div className="text-xs inline-flex items-center gap-1.5 text-gold-300">
                    {market === m.id ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Seleccionado</>
                    ) : (
                      <>Elegir mercado <ChevronRight className="w-3 h-3.5" /></>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 1 · FIRM */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Elige la firma prop</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Mercado activo: <span className="text-gold-300 font-semibold uppercase">{market}</span>.
              Si no ves la firma que buscas, puedes agregarla luego desde el panel admin.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {firms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFirm(f);
                    setPreset(null);
                  }}
                  className={cn(
                    "text-left p-5 rounded-xl border transition-all relative overflow-hidden",
                    firm?.id === f.id
                      ? "bg-gold-500/10 border-gold-500/50 shadow-gold"
                      : "bg-white/[0.02] border-white/[0.05] hover:border-gold-500/30"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <FirmLogo firm={f} size="sm" />
                    <div>
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground">{f.market.toUpperCase()}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {f.description || "Reglas oficiales precargadas (drawdown, objetivos, días mínimos)."}
                  </p>
                  {firm?.id === f.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-gold-300" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 · PRESET */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Tamaño de cuenta</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              {firm?.name} · {firm?.market.toUpperCase()}. Todas las cuentas
              comparten el mismo preset de reglas (cambia solo el balance
              inicial).
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={cn(
                    "relative p-6 rounded-2xl border text-left transition-all group overflow-hidden",
                    preset?.id === p.id
                      ? "bg-gradient-to-br from-gold-500/15 to-gold-600/5 border-gold-500/50 shadow-gold scale-[1.02]"
                      : "bg-white/[0.02] border-white/[0.05] hover:border-gold-500/30"
                  )}
                >
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Cuenta</div>
                  <div className="font-display text-3xl mb-1 gold-gradient-text font-bold">{p.name}</div>
                  <div className="text-sm text-muted-foreground mb-4">{formatCurrency(p.initial_balance)}</div>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                    {p.phases.map((ph) => (
                      <li key={ph.order} className="flex justify-between gap-2">
                        <span>{ph.name}</span>
                        <span className="text-foreground/80">
                          Obj. {ph.profit_target_pct}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {preset && (
              <div className="rounded-2xl p-6 border border-gold-500/20 bg-gold-500/5 backdrop-blur-xl">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="w-5 h-5 text-gold-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Reglas del preset seleccionado</div>
                    <div className="text-sm text-muted-foreground">
                      Este preset aplica las reglas oficiales de {firm?.name}. Puedes revisar los
                      valores exactos por fase a continuación.
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {preset.phases.map((ph) => (
                    <div key={ph.order} className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">{ph.name}</div>
                        <span className="chip-gold !py-0 !text-[10px]">Fase {ph.order + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Rule k="Objetivo" v={`${ph.profit_target_pct}%`} />
                        <Rule k="DD diario" v={`${ph.max_daily_drawdown_pct}%`} />
                        <Rule k="DD máx" v={`${ph.max_total_drawdown_pct}%`} />
                        <Rule k="DD tipo" v={ph.drawdown_type === "trailing" ? "Trailing" : "Estático"} />
                        <Rule k="Días mínimos" v={`${ph.min_trading_days} días`} />
                        <Rule k="Timezone" v={preset.broker_timezone} />
                      </div>
                      {ph.special_rules && Array.isArray(ph.special_rules) && ph.special_rules.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/[0.05]">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Reglas especiales</div>
                          <div className="flex flex-wrap gap-1.5">
                            {ph.special_rules.map((r: string) => (
                              <SpecialRuleChip key={r} rule={r} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 · LINKING */}
        {step === 3 && market && (
          <div>
            <h2 className="font-display text-2xl mb-2">Vincula tu cuenta</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Nunca almacenamos credenciales del broker. Para Forex/Futuros
              usamos un EA/cBot que reporta con una clave única. Para Cripto,
              API key de solo lectura (sin retiros, sin trading).
            </p>

            {market !== "crypto" && (
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-gold-200 uppercase text-xs tracking-widest">
                  Elige método de reporte
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: market === "forex" ? "ea_mt5" : "cbot_ctrader",
                      title: market === "forex" ? "EA para MetaTrader 5" : "cBot para cTrader",
                      desc: market === "forex"
                        ? "Descarga el EA .ex5 y adjúntalo a un gráfico de tu cuenta demo MT5."
                        : "Descarga el cBot .algo y ejecútalo sobre tu cuenta de cTrader.",
                      icon: Download },
                    { id: market === "forex" ? "ea_mt4" : "cbot_ctrader",
                      title: market === "forex" ? "EA para MetaTrader 4" : "cBot cTrader (alternativa)",
                      desc: market === "forex"
                        ? "Si usas MT4, usamos el mismo protocolo HTTP del EA en MQL4."
                        : "Usa la Open API oficial de cTrader si el sandbox bloquea WebRequest.",
                      icon: KeyRound }
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setLinkMethod(o.id as AccountLinkMethod)}
                      className={cn(
                        "text-left p-5 rounded-xl border transition-all relative",
                        linkMethod === o.id
                          ? "bg-gold-500/10 border-gold-500/50 shadow-gold"
                          : "bg-white/[0.02] border-white/[0.05] hover:border-gold-500/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shrink-0">
                          <o.icon className="w-5 h-5 text-gold-300" />
                        </div>
                        <div>
                          <div className="font-semibold">{o.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{o.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {market === "crypto" && (
              <div className="space-y-6 mb-8 max-w-2xl">
                <button
                  type="button"
                  onClick={() => setLinkMethod("crypto_api")}
                  className={cn(
                    "w-full text-left p-5 rounded-xl border transition-all relative",
                    linkMethod === "crypto_api"
                      ? "bg-gold-500/10 border-gold-500/50 shadow-gold"
                      : "bg-white/[0.02] border-white/[0.05] hover:border-gold-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5 text-gold-300" />
                    </div>
                    <div>
                      <div className="font-semibold">API Key de solo lectura</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Binance · Bybit · OKX · Coinbase · Kraken · KuCoin y 100+ via CCXT.
                        Sin permiso de trading ni de retiro.
                      </div>
                    </div>
                  </div>
                </button>

                {linkMethod === "crypto_api" && (
                  <div className="space-y-4 p-5 rounded-xl border border-gold-500/15 bg-white/[0.02]">
                    <Field label="Exchange">
                      <select
                        value={exchangeId}
                        onChange={(e) => setExchangeId(e.target.value)}
                        className="input-gold"
                      >
                        <option value="">Selecciona un exchange</option>
                        {["binance","bybit","okx","coinbase","kraken","kucoin","bitget","mexc","gateio"].map((ex) => (
                          <option key={ex} value={ex}>{ex.charAt(0).toUpperCase() + ex.slice(1)}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="API Key (solo lectura)">
                      <input
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="input-gold"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </Field>
                    <Field label="API Secret">
                      <input
                        type="password"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        className="input-gold"
                        placeholder="••••••••••••••••••••••••••••"
                      />
                    </Field>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-200 flex gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      Las claves se cifran en reposo con AES-256-GCM y nunca se
                      exponen al frontend.
                    </div>
                  </div>
                )}
              </div>
            )}

            {linkMethod && market !== "crypto" && (
          <div className="space-y-5 p-6 rounded-2xl border border-gold-500/20 bg-gold-500/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-lg">Tu clave de reporte se genera al crear el desafío</h3>
              <span className="chip-gold">SOLO SE MUESTRA 1 VEZ</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 px-4 py-3 rounded-lg bg-background/70 border border-white/[0.08] font-mono text-sm break-all select-none text-muted-foreground">
                ••••••••••••••••••••••••••••••••••••••••••••••••••
              </div>
              <button type="button" disabled className="btn-ghost-gold !py-3 !px-5 text-sm opacity-60 cursor-not-allowed">
                <KeyRound className="w-4 h-4" /> Bloqueada
              </button>
              <button type="button" onClick={handleDownloadEa} className="btn-gold !py-3 !px-5 text-sm">
                <Download className="w-4 h-4" /> Descargar EA/cBot
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Al hacer clic en <strong>Crear desafío</strong> se genera la clave criptográficamente segura.</li>
              <li>Cópiala en lugar seguro: <strong className="text-gold-300">si la pierdes deberás ROTARLA invalidando la anterior</strong>.</li>
              <li>Descarga el experto y cópialo en la carpeta <code className="px-2 py-0.5 rounded bg-white/[0.05] text-xs text-gold-200">MQL5/Experts</code> o <code className="px-2 py-0.5 rounded bg-white/[0.05] text-xs text-gold-200">cAlgo/cBots</code>.</li>
              <li>En MetaTrader, activa <strong>"Algo Trading"</strong> y permite WebRequest para la URL del worker en Opciones → Expert Advisors.</li>
              <li>Adjunta el EA/cBot a cualquier gráfico (M1 recomendado), pega la clave y confirma.</li>
            </ol>
          </div>
        )}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-10 flex items-center justify-between border-t border-white/[0.05] pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border transition-all",
              step === 0
                ? "opacity-40 cursor-not-allowed border-white/10 text-muted-foreground"
                : "border-white/10 hover:border-gold-500/30 text-foreground/80 hover:text-gold-200"
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-gold text-sm">
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canCreate() || isCreating}
              onClick={createChallenge}
              className={cn("btn-gold text-sm", !canCreate() && "opacity-60 cursor-not-allowed")}
            >
              {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</> : <>Crear desafío <CheckCircle2 className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>

      {created && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
          <div className="w-full max-w-2xl glass-card-strong gold-gradient-border rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="chip-gold mb-3 !py-1">
                    <KeyRound className="w-3 h-3" /> Clave de reporte · 1 sola vista
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl tracking-tight">
                    {created.plain_report_key ? "Guarda esta clave ahora" : "Desafío creado correctamente"}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {created.plain_report_key
                      ? "Nunca más se volverá a mostrar. Si la pierdes, usa Rotar clave en el panel y el EA/cBot dejará de funcionar hasta que pegues la nueva."
                      : "Tu exchange se vinculó correctamente. Ya puedes ver tu panel."}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0 animate-pulse" />
              </div>

              {created.plain_report_key && (
                <div className="mt-6 space-y-4">
                  {!keyRevealed ? (
                    <button
                      type="button"
                      onClick={() => setKeyRevealed(true)}
                      className="w-full p-5 rounded-2xl border border-dashed border-gold-500/40 bg-gold-500/5 hover:bg-gold-500/10 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-6 h-6 text-gold-300" />
                          </div>
                          <div>
                            <div className="font-semibold">Pulsa para mostrar la clave</div>
                            <div className="text-sm text-muted-foreground">Asegúrate de que nadie más vea tu pantalla.</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gold-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ) : (
                    <div className="p-5 rounded-2xl border border-gold-500/30 bg-black/40 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Report Key</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="px-4 py-3 rounded-lg bg-background/60 border border-white/[0.08] font-mono text-sm break-all select-all">
                        {created.plain_report_key}
                      </div>
                      <div className="flex flex-wrap gap-2 items-stretch">
                        <button
                          type="button"
                          onClick={() => copyKey(created.plain_report_key!)}
                          className="btn-gold !py-2.5 !px-4 text-xs flex-1 justify-center"
                        >
                          {copied ? <><Check className="w-4 h-4" /> Copiada</> : <><Copy className="w-4 h-4" /> Copiar clave</>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cid = created.challenge_id ?? "unknown";
                            const blob = new Blob(
                              [`# FundGuard Report Key\n# Desafío: ${cid}\n# Generado: ${new Date().toISOString()}\n\nREPORT_KEY=${created.plain_report_key}\n`],
                              { type: "text/plain" }
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `fundguard-report-key-${cid.slice(0, 8)}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success("Clave descargada en .txt seguro");
                          }}
                          className="btn-ghost-gold !py-2.5 !px-4 text-xs flex-1 justify-center"
                        >
                          <Download className="w-4 h-4" /> Descargar .txt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs text-rose-200 flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
                <div>
                  <strong className="font-semibold">Recomendado:</strong> guarda la clave en un gestor de contraseñas (1Password / Bitwarden).
                  No la compartas con nadie: cualquier persona con la clave podría enviar reportes falsos a tu nombre.
                </div>
              </div>

              {created.plain_report_key && linkMethod && EA_DOWNLOAD_MAP[linkMethod].length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-gold-300" />
                    <div className="text-xs uppercase tracking-[0.18em] font-semibold text-gold-200">
                      Descargar EA / cBot
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {EA_DOWNLOAD_MAP[linkMethod].map((d) => (
                      <button
                        key={d.file}
                        type="button"
                        onClick={() => triggerDownload(d.file, d.label)}
                        className="btn-ghost-gold !py-2.5 !px-4 text-xs justify-center w-full"
                      >
                        <Download className="w-3.5 h-3.5" /> {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => router.replace("/dashboard")}
                  className="btn-ghost-gold !py-3 !px-5 text-sm"
                >
                  Volver al dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.replace(created.next_path)}
                  disabled={!!created.plain_report_key && !keyRevealed}
                  className={cn("btn-gold !py-3 !px-5 text-sm", !!created.plain_report_key && !keyRevealed && "opacity-60 cursor-not-allowed")}
                >
                  Ir al panel del desafío <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewChallengeWizardPage() {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-[60vh] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Cargando…</div>
      </div>
    }>
      <NewChallengeWizardInner />
    </Suspense>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground/90 tracking-wide uppercase">{label}</span>
      {children}
    </label>
  );
}

function Rule({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  );
}

function SpecialRuleChip({ rule }: { rule: string }) {
  const meta: Record<string, { label: string; icon: any; cls: string }> = {
    scalping_unlimited: { label: "Scalping ilimitado", icon: Zap, cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" },
    "24_7_trading": { label: "24/7 · 365 días", icon: Clock, cls: "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20" },
    weekends_allowed: { label: "Fines de semana OK", icon: Calendar, cls: "bg-violet-500/10 text-violet-300 border-violet-400/20" },
    strictest_floor_daily_vs_total: { label: "Strictest Floor Bullfy", icon: ShieldCheck, cls: "bg-amber-500/10 text-amber-300 border-amber-400/20" },
    allow_consistency_check: { label: "Best Day ≤ 50% (FTMO)", icon: TrendingUp, cls: "bg-sky-500/10 text-sky-300 border-sky-400/20" },
    reset_balance_on_new_phase: { label: "Reset balance nueva fase", icon: Wallet, cls: "bg-rose-500/10 text-rose-300 border-rose-400/20" },
    allow_news_trade: { label: "Trading noticias OK", icon: TrendingUp, cls: "bg-teal-500/10 text-teal-300 border-teal-400/20" },
    profit_split_95: { label: "Profit Share 95%", icon: Wallet, cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" },
    profit_split_90: { label: "Profit Share 90%", icon: Wallet, cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" },
    profit_split_80: { label: "Profit Share 80%", icon: Wallet, cls: "bg-sky-500/10 text-sky-300 border-sky-400/20" },
    fee_refundable: { label: "Fee reembolsable", icon: ShieldCheck, cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" },
    leverage_1_100: { label: "Apalancamiento 1:100", icon: TrendingUp, cls: "bg-indigo-500/10 text-indigo-300 border-indigo-400/20" },
    leverage_1_50: { label: "Apalancamiento 1:50", icon: TrendingUp, cls: "bg-indigo-500/10 text-indigo-300 border-indigo-400/20" },
    direct_funding_no_challenge: { label: "Fondeo directo · sin evaluación", icon: ShieldCheck, cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" },
    withdrawal_daily: { label: "Retiros diarios", icon: Calendar, cls: "bg-sky-500/10 text-sky-300 border-sky-400/20" },
    monthly_profit_cap_10_pct_synth: { label: "Tope mensual 10% Sintéticos", icon: ShieldCheck, cls: "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20" },
    only_synthetics_assets: { label: "Solo índices sintéticos", icon: Zap, cls: "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20" },
    dd_static_treat_by_default: { label: "DD estándar Estático (por defecto)", icon: ShieldCheck, cls: "bg-amber-500/10 text-amber-300 border-amber-400/20" },
    timezone_reset_tbd_confirm: { label: "Reset diario TBD: confirmar con FXLC", icon: Clock, cls: "bg-orange-500/10 text-orange-300 border-orange-400/20" },
  };
  const m = meta[rule];
  if (!m) {
    return (
      <span className="text-[10px] px-2.5 py-1 rounded-full border bg-white/[0.04] border-white/10 text-muted-foreground font-medium tracking-wide">
        {rule.replace(/_/g, " ")}
      </span>
    );
  }
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-medium tracking-wide", m.cls)}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}
