import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  BellRing,
  LineChart as LineChartIcon,
  Lock,
  Globe2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Play,
  Activity,
  CircleDollarSign,
  Bot,
  Shield,
  Eye,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DashboardPreview } from "@/components/sections/dashboard-preview";
import { FirmGrid } from "@/components/sections/firm-grid";

const heroStats = [
  { v: "15+", l: "Firmas integradas", sub: "FTMO, Bullfy, FXLC, Deriv…" },
  { v: "4", l: "Mercados", sub: "Forex · Futuros · Crypto · Sintéticos" },
  { v: "<1s", l: "Latencia motor", sub: "Cálculo DD / PnL en tiempo real" },
  { v: "110+", l: "Presets oficiales", sub: "100% fieles al PDF de cada firma" },
];

const features = [
  {
    icon: Cpu,
    title: "Motor de reglas quirúrgico",
    desc: "Calcula drawdown diario, máximo (estático o trailing), objetivo, días mínimos y límite por fase — con la misma fórmula real de cada firma.",
    accent: "from-gold-300 to-amber-600",
  },
  {
    icon: Bot,
    title: "EA / cBot sin credenciales",
    desc: "Experto MQL4/MQL5 y cBot cAlgo. Cero contraseñas del broker, solo una clave de reporte con hash bcrypt y capa TLS.",
    accent: "from-amber-300 to-yellow-600",
  },
  {
    icon: BarChart3,
    title: "Alertas en tiempo real",
    desc: "Email, in-app y push cuando apruebas, fallas o acercas un 80% al límite. Historial íntegro de eventos por desafío.",
    accent: "from-orange-400 to-rose-500",
  },
  {
    icon: Eye,
    title: "Dashboard cinematográfico",
    desc: "Equity curve, peak trailing, PnL diario, progreso por fase y trades recientes — con estética institucional y modo dark nativo.",
    accent: "from-emerald-400 to-teal-600",
  },
  {
    icon: Lock,
    title: "Zero-knowledge por diseño",
    desc: "Sin credenciales, sin API keys con retiro, sin leer volcados. Todo lo que entra al servidor es un trade criptográficamente firmado.",
    accent: "from-indigo-400 to-violet-600",
  },
  {
    icon: Layers,
    title: "Multi mercado unificado",
    desc: "Forex (MT4/5), Futuros (cTrader), Cripto (CCXT) e Índices Sintéticos 24/7. Misma UX, mismo motor, mismas alertas.",
    accent: "from-sky-400 to-blue-600",
  },
];

const markets = [
  {
    name: "Forex",
    desc: "MT4 · MT5 · 80+ pares · scalping permitido",
    icon: CircleDollarSign,
    firms: 7,
    status: "Disponible",
  },
  {
    name: "Futuros",
    desc: "cTrader · Match-Trader · DXtrade · MNQ / CL",
    icon: BarChart3,
    firms: 5,
    status: "Disponible",
  },
  {
    name: "Cripto",
    desc: "Binance · Bybit · OKX · CCXT read-only",
    icon: Activity,
    firms: 1,
    status: "Beta",
  },
  {
    name: "Sintéticos",
    desc: "Boom & Crash · Volatility · 24/7 · sin swap",
    icon: Activity,
    firms: 2,
    status: "Nuevo",
  },
];

const workflow = [
  {
    n: "01",
    title: "Elige mercado y firma",
    desc: "Forex, Futuros, Cripto o Sintéticos. Cada preset viene con reglas oficiales extraídas del PDF de la firma.",
    icon: Globe2,
  },
  {
    n: "02",
    title: "Selecciona tamaño de cuenta",
    desc: "Desde $500 de Power Live hasta $200K de FTMO 2-Step. Todas las combinaciones soportadas y probadas.",
    icon: CircleDollarSign,
  },
  {
    n: "03",
    title: "Vincula tu EA / cBot / API",
    desc: "Pega una clave de reporte única. Sin contraseñas, sin permisos de retiro. Hash bcrypt en servidor.",
    icon: Zap,
  },
  {
    n: "04",
    title: "Opera y monitorea en vivo",
    desc: "Equity, DD diario, máx, días y eventos en tiempo real. Recibe alertas antes de cruzar cualquier límite.",
    icon: LineChartIcon,
  },
];

const trustChecks = [
  { icon: CheckCircle2, t: "Reglas validadas con Vitest", d: "33 tests unitarios por preset antes de producción." },
  { icon: ArrowRight, t: "Deduplicación 30s", d: "No se procesan trades duplicados aunque el EA reenvíe." },
  { icon: ShieldCheck, t: "End-to-end TLS", d: "Cada reporte lleva firma HMAC del worker." },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* =========================================================
          HERO CINEMATOGRÁFICO (estilo Upcomers: dark + glow dorado)
          ========================================================= */}
      <section className="relative pt-44 pb-36 md:pb-48">
        {/* Grid background + máscara fade */}
        <div className="absolute inset-0 hero-grid-bg mask-fade-b pointer-events-none" />
        {/* Orbes difuminados estilo Upcomers */}
        <div className="absolute -top-52 left-1/2 -translate-x-1/2 w-[1100px] h-[900px] bg-hero-orb-1 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-hero-orb-2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-hero-orb-3 pointer-events-none" />
        {/* Línea superior sutil */}
        <div className="absolute top-20 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent pointer-events-none" />

        <div className="container relative">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge principal */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl mb-9 shine-hover noise-overlay">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground/80">
                Plataforma Oficial · TKECH
              </span>
              <Sparkles className="w-3.5 h-3.5 text-gold-300 ml-1" />
            </div>

            {/* Headline */}
            <h1 className="font-display font-display-wide text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.02] tracking-tight mb-9 text-balance">
              Tu pase al fondeo,{" "}
              <br className="hidden sm:block" />
              <span className="gold-gradient-text">sin margen de error.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Simula tus pruebas con telemetría de <span className="text-foreground/90 font-medium">mercado en tiempo real</span>{" "}
              y {" "}
              <span className="text-foreground/90 font-medium">domina tu estrategia</span>  antes de dar el salto.
            </p>

            {/* CTA doble */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/dashboard/new" className="btn-gold w-full sm:w-auto px-10 text-base group">
                Crear desafío gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/dashboard" className="btn-ghost-gold w-full sm:w-auto px-10 text-base">
                <Play className="w-4 h-4 fill-current" />
                Ver dashboard demo
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground/80 mb-20">
              {trustChecks.map((c) => (
                <div key={c.t} className="inline-flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <c.icon className="w-3 h-3 text-gold-300" />
                  </div>
                  <span className="font-medium">{c.t}</span>
                  <span className="hidden sm:inline text-muted-foreground/60">· {c.d}</span>
                </div>
              ))}
            </div>

            {/* Hero stats grid estilo Upcomers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {heroStats.map((s) => (
                <div
                  key={s.l}
                  className="group relative glass-card-strong gold-gradient-border p-6 md:p-7 noise-overlay reveal-curtain shine-hover"
                >
                  <div className="font-display text-4xl md:text-5xl gold-gradient-text font-semibold tracking-tight mb-2">
                    {s.v}
                  </div>
                  <div className="text-sm font-semibold text-foreground/90 mb-1">{s.l}</div>
                  <div className="text-xs text-muted-foreground/80 leading-snug">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          WORKFLOW · 4 pasos con línea temporal animada
          ========================================================= */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-40 md:top-44 h-40 pointer-events-none opacity-70">
          <div className="absolute inset-0 bg-radial-gold" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <div className="chip-gold mb-5 inline-flex animate-badge-bounce">
              <ArrowRight className="w-3 h-3" /> Sin fricción · 4 pasos
            </div>
            <h2 className="font-display font-display-wide text-4xl md:text-6xl leading-[1.05] tracking-tight mb-6">
              Desde que eliges firma hasta{" "}
              <span className="gold-gradient-text">recibir la primera alerta.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Configura tu primer desafío en menos de 90 segundos. Sin validación de tarjeta, sin KYC innecesario.
            </p>
          </div>

          {/* Línea temporal conectora animada (desktop) */}
          <div className="hidden lg:block absolute left-0 right-0 top-[104px] h-[2px] pointer-events-none mask-fade-edges">
            <div className="h-full flow-x bg-gradient-to-r from-transparent via-gold-400/60 to-transparent bg-[length:200%_100%] opacity-80" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {workflow.map((r, i) => {
              const pct = ((i + 1) / workflow.length) * 100;
              const ringSize = 92;
              const stroke = 5;
              const radius = (ringSize - stroke) / 2;
              const circ = 2 * Math.PI * radius;
              const dash = (pct / 100) * circ;
              return (
                <div
                  key={r.n}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${0.05 + i * 0.12}s` }}
                >
                  <div className="glass-card p-7 md:p-8 h-full group hover:!border-gold-500/30 transition-all duration-500 noise-overlay shine-hover relative overflow-hidden
                                  hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-18px_rgba(233,174,48,0.35)]
                                  animate-tilt-breath"
                       style={{ animationDelay: `${i * 0.6}s` }}>
                    {/* Orb interior con hover */}
                    <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-gold-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    {/* Shimmer sweep interior */}
                    <div className="absolute inset-0 shimmer-inner pointer-events-none rounded-[inherit]" />

                    <div className="relative">
                      {/* Cabecera con progress ring + icono + badge */}
                      <div className="flex items-start justify-between mb-7">
                        <div className="relative shrink-0">
                          {/* Progress ring SVG radial */}
                          <svg
                            width={ringSize}
                            height={ringSize}
                            className={`w-[72px] h-[72px] md:w-[92px] md:h-[92px] -rotate-90 ${i === workflow.length - 1 ? "animate-spin-slow" : ""}`}
                          >
                            <defs>
                              <linearGradient id={`wrk-${r.n}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F7E19B" />
                                <stop offset="50%" stopColor="#E9AE30" />
                                <stop offset="100%" stopColor="#B57108" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx={ringSize / 2}
                              cy={ringSize / 2}
                              r={radius}
                              fill="none"
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth={stroke}
                            />
                            <circle
                              cx={ringSize / 2}
                              cy={ringSize / 2}
                              r={radius}
                              fill="none"
                              stroke={`url(#wrk-${r.n})`}
                              strokeWidth={stroke}
                              strokeLinecap="round"
                              strokeDasharray={`${dash} ${circ}`}
                              style={{ filter: "drop-shadow(0 0 6px rgba(233,174,48,0.45))" }}
                            />
                          </svg>
                          {/* Icono centrado dentro del ring */}
                          <div className="absolute inset-0 flex items-center justify-center animate-float-soft">
                            <div className="w-11 h-11 md:w-12 md:h-12 rounded-[18px] bg-gradient-to-br from-gold-400/25 to-gold-700/[0.07] border border-gold-500/25 flex items-center justify-center
                                            shadow-[0_0_34px_-10px_rgba(233,174,48,0.5)] group-hover:scale-110 transition-transform duration-500 animate-glow-pulse-ring">
                              <r.icon className="w-5 h-5 md:w-[22px] md:h-[22px] text-gold-300" strokeWidth={2.1} />
                            </div>
                          </div>
                        </div>

                        {/* Badge step numérico */}
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold-400/30 to-transparent blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/[0.03] border border-gold-500/20 backdrop-blur-sm">
                            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-gold-400/80">Step</span>
                            <span className="font-display text-xl md:text-2xl gold-gradient-text font-black leading-none tracking-tight">
                              {r.n}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Título + meta badge flotante */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-display text-xl font-semibold tracking-tight leading-tight group-hover:text-gold-100 transition-colors">
                          {r.title}
                        </h3>
                        {i === 0 && (
                          <span className="animate-float-soft shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/25">
                            <Globe2 className="w-2.5 h-2.5" /> Pick
                          </span>
                        )}
                        {i === 2 && (
                          <span className="animate-badge-bounce shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/25">
                            <ShieldCheck className="w-2.5 h-2.5" /> Safe
                          </span>
                        )}
                        {i === 3 && (
                          <span className="animate-badge-bounce shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/25">
                            <BellRing className="w-2.5 h-2.5" /> Live
                          </span>
                        )}
                      </div>

                      {/* Progress bar inferior step por step */}
                      <div className="mt-5 mb-4">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground/70 mb-2">
                          <span>Progreso</span>
                          <span className="text-gold-300">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="relative h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400 via-gold-300 to-gold-200"
                            style={{
                              width: `${pct}%`,
                              boxShadow: "0 0 16px -2px rgba(233,174,48,0.5)",
                            }}
                          >
                            <div className="absolute inset-y-0 right-0 w-6 -mr-3 flow-x bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%] opacity-60" />
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                    </div>
                  </div>

                  {/* Conector arrow desktop ENTRE cards (ahora reemplazado por línea temporal arriba, se mantiene como mini-arrow) */}
                  {i < workflow.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-[42px] -translate-y-1/2 z-20">
                      <div className="relative w-7 h-7 rounded-full group/arr">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400/30 to-amber-600/10 blur-md animate-pulse-glow" />
                        <div className="relative w-full h-full rounded-full bg-background/90 border border-gold-500/30 flex items-center justify-center backdrop-blur-md animate-float-soft" style={{ animationDelay: `${i * 0.4}s` }}>
                          <ArrowRight className="w-3 h-3 text-gold-300" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES GRID · 6 cards con micro-interacciones 3D
          ========================================================= */}
      <section id="caracteristicas" className="py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gold opacity-35 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-gold-fine opacity-35 mask-fade-b pointer-events-none" />
        {/* Orb features superior derecha */}
        <div className="absolute -top-20 -right-24 w-[420px] h-[420px] rounded-full bg-gold-500/[0.07] blur-[120px] pointer-events-none animate-float" />
        <div className="absolute bottom-0 -left-24 w-[380px] h-[380px] rounded-full bg-amber-500/[0.05] blur-[120px] pointer-events-none animate-float-soft" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <div className="chip-gold mb-5 inline-flex animate-badge-bounce">
              <TrendingUp className="w-3 h-3" /> Características
            </div>
            <h2 className="font-display font-display-wide text-4xl md:text-6xl leading-[1.05] tracking-tight mb-6">
              Todo lo que esperas de una suite{" "}
              <span className="gold-gradient-text">institucional.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sin plantillas baratas, sin falsas promesas. Cada feature está probada con casos reales de trading y picos de equity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((f, i) => {
              const isEmerald = f.accent.includes("emerald");
              const isRose = f.accent.includes("rose") || f.accent.includes("orange");
              return (
                <div
                  key={f.title}
                  className="stat-card group noise-overlay relative overflow-hidden
                             animate-fade-in-up hover:-translate-y-2 transition-all duration-500
                             hover:shadow-[0_30px_70px_-24px_rgba(233,174,48,0.4)]
                             hover:!border-gold-500/30
                             isolate"
                  style={{ animationDelay: `${0.05 + i * 0.1}s` }}
                >
                  {/* Grid interior decorativo */}
                  <div className="absolute inset-0 bg-grid-gold-fine opacity-25 mask-fade-b pointer-events-none -z-10" />
                  {/* Orb top-right on hover */}
                  <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gold-500/[0.08] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  {/* Shimmer sweep */}
                  <div className="absolute inset-0 shimmer-inner pointer-events-none rounded-[inherit]" />

                  {/* Badge flotante esquina superior derecha */}
                  <div className="absolute top-5 right-5 z-10">
                    <div className="flex -space-x-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border backdrop-blur-md
                                    ${
                                      isEmerald
                                        ? "bg-emerald-500/10 border-emerald-400/20 animate-glow-pulse-emerald"
                                        : isRose
                                        ? "bg-rose-500/10 border-rose-400/20 animate-glow-pulse-ring"
                                        : "bg-gold-500/10 border-gold-400/25 animate-glow-pulse-ring"
                                    }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            isEmerald ? "text-emerald-300" : isRose ? "text-rose-300" : "text-gold-300"
                          }`}
                        />
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.07] bg-white/[0.03] backdrop-blur-md animate-badge-bounce" style={{ animationDelay: `${i * 0.18}s` }}>
                        <span className="text-[9px] font-black tracking-[0.18em] text-muted-foreground/70">#{String(i + 1).padStart(2, "0")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative mb-7 mt-1">
                    <div className="relative inline-flex">
                      {/* Halo spinner exterior */}
                      <div className="absolute -inset-2 rounded-[26px] bg-gradient-to-br from-transparent via-gold-500/15 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {/* Icono box */}
                      <div
                        className={`relative w-16 h-16 rounded-[22px] bg-gradient-to-br ${f.accent} flex items-center justify-center
                                    shadow-[0_0_44px_-12px_rgba(233,174,48,0.55)]
                                    group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500
                                    animate-float-soft`}
                        style={{ animationDelay: `${i * 0.35}s` }}
                      >
                        <f.icon className="w-8 h-8 text-black/80" strokeWidth={2.2} />
                        {/* Shine overlay */}
                        <div className="absolute inset-0 rounded-[22px] overflow-hidden pointer-events-none">
                          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-20 translate-x-[-160%] group-hover:translate-x-[320%] transition-transform duration-[1400ms] ease-out" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="font-display text-xl md:text-[22px] font-semibold tracking-tight group-hover:text-gold-50 transition-colors">
                      {f.title}
                    </h3>
                  </div>
                  <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">{f.desc}</p>

                  {/* Mini chips + mini progress */}
                  <div className="flex items-center justify-between pt-5 border-t border-white/[0.05]">
                    <div className="flex flex-wrap gap-1.5">
                      {(i % 3 === 0 ? ["Preciso", "PDF oficial"] :
                        i % 3 === 1 ? ["Sin clave", "Hash bcrypt"] :
                        ["24/7", "Push · Email"]).map((chip) => (
                        <span key={chip} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase bg-white/[0.03] border border-white/[0.06] text-muted-foreground/80">
                          <span className="w-1 h-1 rounded-full bg-gold-400/70" />
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="relative w-10 h-10 shrink-0">
                      <svg width="40" height="40" className="-rotate-90">
                        <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                        <circle
                          cx="20" cy="20" r="15" fill="none"
                          stroke={
                            isEmerald ? "#34d399" :
                            isRose ? "#fb7185" :
                            "#E9AE30"
                          }
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(30 + i * 12)} ${2 * Math.PI * 15}`}
                          style={{ filter: "drop-shadow(0 0 4px rgba(233,174,48,0.45))" }}
                        />
                      </svg>
                      <ArrowRight className="absolute inset-0 m-auto w-3.5 h-3.5 text-gold-300 translate-x-[1px] group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          MERCADOS
          ========================================================= */}
      <section id="mercados" className="py-28 md:py-36 relative">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <div className="chip-gold mb-5">
              <Globe2 className="w-3 h-3" /> Multi mercado · 4 verticales
            </div>
            <h2 className="font-display font-display-wide text-4xl md:text-6xl leading-[1.05] tracking-tight mb-6">
              Cuatro mercados,{" "}
              <span className="gold-gradient-text">un solo motor.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expande tu estrategia sin aprender una herramienta nueva. Sintéticos 24/7, Futuros en horario CME o Forex 24/5 — todo igual.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {markets.map((m) => (
              <div
                key={m.name}
                className="relative overflow-hidden rounded-[28px] p-8 glass-card-strong gold-gradient-border group h-full noise-overlay shine-hover"
              >
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full flex flex-col">
                  <div className="flex items-start justify-between mb-7">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/15 to-gold-700/5 border border-gold-500/20 flex items-center justify-center shadow-[0_0_30px_-10px_rgba(233,174,48,0.4)]">
                      <m.icon className="w-7 h-7 text-gold-300" strokeWidth={2} />
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full ${
                        m.status === "Disponible"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20"
                          : m.status === "Nuevo"
                          ? "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-400/20"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-2 tracking-tight">{m.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">{m.desc}</p>
                  <div className="flex items-center justify-between pt-5 border-t border-white/[0.05]">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gold-400" />
                      <span className="text-muted-foreground">
                        <span className="text-foreground/90 font-semibold">{m.firms}</span> firmas
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-300 group-hover:translate-x-1 transition-transform">
                      Explorar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FIRMAS SOPORTADAS (componente externo: FirmGrid)
          ========================================================= */}
      <FirmGrid />

      {/* =========================================================
          DASHBOARD PREVIEW (componente externo)
          ========================================================= */}
      <DashboardPreview />

      {/* =========================================================
          RULES ENGINE / TRANSPARENCIA
          ========================================================= */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        <div className="absolute -left-40 top-1/3 w-[500px] h-[500px] bg-hero-orb-3 opacity-60 pointer-events-none" />
        <div className="container grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="chip-gold mb-5">
              <AlertTriangle className="w-3 h-3" /> Integridad verificada
            </div>
            <h2 className="font-display font-display-wide text-4xl md:text-5xl leading-[1.1] tracking-tight mb-7">
              Cada regla que ves{" "}
              <span className="gold-gradient-text">está testeada.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-9 leading-relaxed">
              Antes de publicar un preset nuevo, lo sometemos a casos límite: brechas de fin de semana, equity spikes, trailing vs static,
              inicios de mes y picos en el minuto 00 del reset diario.
            </p>
            <ul className="space-y-5">
              {[
                ["Drawdown diario", "Resetea exactamente a la hora del broker configurada por preset. No antes, no después."],
                ["Drawdown máximo", "Trailing o static, con la misma fórmula del challenge agreement oficial."],
                ["Días mínimos", "Solo cuenta días con al menos una operación cerrada. Los días sin trading no suman."],
                ["Límites especiales", "Tope mensual 10% en sintéticos, scalping ilimitado 24/7, profit split por fase…"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-gold-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-base mb-1 tracking-tight">{t}</div>
                    <div className="text-[15px] text-muted-foreground leading-relaxed">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Code block con estética terminal premium */}
          <div className="relative">
            <div className="glass-card-strong p-8 font-mono text-[13px] overflow-hidden relative noise-overlay gold-gradient-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    engine.ts · evaluate()
                  </span>
                </div>
                <div className="chip-gold !py-0.5 !px-3 !text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> 33 tests pass
                </div>
              </div>
              <pre className="text-muted-foreground leading-7 whitespace-pre-wrap">
{[
  ["kw","const"],["t"," phase = currentPhase(preset, challenge);\n"],
  ["kw","const"],["t"," { dailyFloor, totalFloor } = floors(\n  snapshot, phase\n);\n\n"],
  ["kw","const"],["t"," effectiveDaily = dailyDD(\n  balanceAtReset, equity\n);\n\n"],
  ["kw","if"],["t"," ("],["fn","min"],["t","(effectiveDaily, totalDD) "],["sym","≥"],["t"," phase.floor) "],["lb","{"],["t","\n  "],
    ["fn","emit"],["t","("],["st",`"failed_drawdown"`],["t",");\n"],
  ["rb","}"],["t","\n\n"],
  ["kw","if"],["t"," (profitPct "],["sym","≥"],["t"," phase.target "],["sym","&&"],["t"," daysMet) "],["lb","{"],["t","\n  "],
    ["fn","emit"],["t","("],["st",`"approved"`],["t",");\n"],
  ["rb","}"],["t","\n\n"],
  ["cmt","// = Bullfy strictest: min(dailyFloor, totalFloor)"],
].map((tok, i) => {
  const [kind, val] = tok as [string, string];
  const cls =
    kind === "kw" ? "text-sky-300" :
    kind === "fn" ? "text-gold-300" :
    kind === "st" ? "text-emerald-300" :
    kind === "cmt" ? "text-muted-foreground/50" :
    kind === "sym" || kind === "lb" || kind === "rb" ? "text-foreground/80" :
    "";
  if (!cls) return <span key={i}>{val}</span>;
  return <span key={i} className={cls}>{val}</span>;
})}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA (UPCOMERS STYLE: grande, glow, 2 columnas)
          ========================================================= */}
      <section className="py-28 md:py-36 relative">
        <div className="container">
          <div className="relative overflow-hidden rounded-[40px] p-10 md:p-16 lg:p-24 text-center glass-card-strong gold-gradient-border noise-overlay reveal-curtain">
            <div className="absolute -top-52 -left-52 w-[500px] h-[500px] rounded-full bg-gold-500/20 blur-[120px]" />
            <div className="absolute -bottom-52 -right-52 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
            <div className="absolute inset-0 bg-grid-gold-fine opacity-30 mask-fade-b pointer-events-none" />

            <div className="relative max-w-4xl mx-auto">
              <div className="chip-gold mb-8 !py-2 !px-5">
                <Sparkles className="w-3.5 h-3.5" /> Sin tarjeta · Sin compromiso
              </div>
              <h2 className="font-display font-display-wide text-4xl md:text-6xl lg:text-7xl leading-[1.03] tracking-tight mb-8">
                Listo para pasar tu{" "}
                <br className="hidden sm:block" />
                <span className="gold-gradient-text">siguiente desafío?</span>
              </h2>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                Crea tu cuenta en 30 segundos y configura tu primer challenge.
                Sin credenciales del broker. Sin letras chicas. Solo tú y tu estrategia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
                <Link href="/signup" className="btn-gold px-12 text-lg w-full sm:w-auto group">
                  Crear cuenta gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/dashboard/new" className="btn-ghost-gold px-12 text-lg w-full sm:w-auto">
                  Probar sin registrarse
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm text-muted-foreground/80 max-w-3xl mx-auto">
                {[
                  { i: Zap, t: "Setup en < 2 minutos" },
                  { i: ShieldCheck, t: "Zero credenciales broker" },
                  { i: TrendingUp, t: "Cancelas cuando quieras" },
                ].map((x) => (
                  <div key={x.t} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                    <x.i className="w-4 h-4 text-gold-300" />
                    <span className="font-medium text-foreground/80">{x.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
