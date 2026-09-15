import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck, CheckCircle2, Sparkles, ArrowRight, TrendingUp, BellRing, Lock, Zap,
} from "@/lib/ui/lucide-polyfill";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/auth-form";
import { DEFAULT_FIRMS } from "@/lib/data/seed";
import { FirmLogo } from "@/components/ui/firm-logo";
import { cn } from "@/lib/utils";

const HERO_STATS = [
  { label: "Firmas verificadas", value: `${DEFAULT_FIRMS.filter((f) => f.is_active).length}`, icon: ShieldCheck, color: "text-gold-300" },
  { label: "Modelos de cuenta", value: "100+", icon: TrendingUp, color: "text-emerald-300" },
  { label: "Alertas en tiempo real", value: "24/7", icon: BellRing, color: "text-fuchsia-300" },
  { label: "Tiempo medio first alert", value: "<3s", icon: Zap, color: "text-sky-300" },
];

const HERO_FEATURES = [
  { title: "Motor de reglas quirúrgico", desc: "Fórmulas idénticas al PDF oficial de cada firma, con Bullfy strictest floor y FTMO consistency.", icon: ArrowRight },
  { title: "Claves AES-256 hasheadas", desc: "Report Key con bcrypt 12 rounds. API keys crypto en AES-256-gcm cifradas server-side.", icon: Lock },
  { title: "Panel cinematográfico", desc: "Equity curve con gradient, drawdown dinámico, PnL diario verde/rojo glow, alertas umbral al 80%.", icon: Sparkles },
];

function SideHero() {
  const animDelay = (ms: number) => ({ animationDelay: ms + "ms" });

  return (
    <div className="relative h-full flex flex-col justify-between p-8 md:p-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-grid-bg opacity-30 mask-fade-b" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-gold-500/15 blur-[120px] animate-float-soft" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-amber-500/10 blur-[120px] animate-float" style={animDelay(-4000)} />

      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-3 group mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-300 to-gold-600 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-gold">
              <ShieldCheck className="w-7 h-7 text-black" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl tracking-tight gold-gradient-text font-semibold">FUNDGUARD</span>
            <span className="text-[10px] tracking-[0.2em] text-gold-300/60 uppercase mt-1">Suite institucional</span>
          </div>
        </Link>

        <div className="chip-gold !py-0.5 mb-4 animate-badge-bounce !text-[10px]">
          <Sparkles className="w-3 h-3" /> Actualizado Septiembre 2026 · FXLC presets oficiales PDF
        </div>

        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] animate-fade-in-up">
          Prop trading,
          <br />
          <span className="gold-gradient-text">sin distracciones.</span>
        </h1>

        <p className="mt-5 text-muted-foreground max-w-md text-sm md:text-base leading-relaxed animate-fade-in-up" style={animDelay(80)}>
          La suite institucional para traders que pasan desafíos y sacan payout.
          Reglas oficiales extraídas del PDF, alertas antes de cruzar límites,
          equity curve cinematográfico y conexión sin credenciales compartidas.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:gap-4">
          {HERO_STATS.map((s, i) => {
          const Icon = s.icon;
          const ms = 120 + i * 90;
          return (
            <div key={s.label} className="relative p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:border-gold-500/20 hover:bg-gold-500/[0.04] transition-all animate-fade-in-up" style={animDelay(ms)}>
              <Icon className={cn("w-5 h-5 mb-2", s.color)} />
              <div className="font-display text-2xl font-semibold">{s.value}</div>
              <div className="text-[11px] tracking-wide text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
        </div>
      </div>

      <div className="relative space-y-4 animate-fade-in-up" style={animDelay(480)}>
        <div className="flex items-center gap-2 flex-wrap">
          {DEFAULT_FIRMS.filter(f => f.is_active).slice(0,9).map((f, i) => (
            <div key={f.id} className="w-10 h-10 rounded-xl border border-white/[0.07] bg-white/[0.02] flex items-center justify-center" style={animDelay(i * 60)}>
              <FirmLogo firm={f} size="sm" />
            </div>
          ))}
          <div className="px-3 h-10 rounded-xl border border-gold-500/30 bg-gold-500/10 text-[11px] text-gold-200 flex items-center gap-1.5 font-semibold">
            +{DEFAULT_FIRMS.filter(f => f.is_active).length - 9} más
          </div>
        </div>

        <div className="space-y-3">
          {HERO_FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-gold-500/20 hover:bg-white/[0.03] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-gold-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold mb-0.5">{f.title}</div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (data.user) redirect("/dashboard");

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 hero-grid-bg opacity-20 mask-fade-edges" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gold-500/8 blur-[160px] pointer-events-none animate-float-soft" />

      <div className="relative mx-auto w-full min-h-screen grid lg:grid-cols-2">
        {/* SideHero · desktop */}
        <div className="hidden lg:flex lg:relative border-r border-white/[0.06] bg-hero-orb-3">
          <SideHero />
        </div>

        {/* Formulario */}
        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="relative w-full max-w-lg mx-auto">
            {/* Header mobile-only logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10 group">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-300 to-gold-600 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-gold">
                    <ShieldCheck className="w-7 h-7 text-black" />
                  </div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-2xl tracking-tight gold-gradient-text font-semibold">FUNDGUARD</span>
                  <span className="text-[10px] tracking-[0.2em] text-gold-300/60 uppercase mt-1">Suite institucional</span>
                </div>
              </Link>
            </div>

            <div className="glass-card-strong gold-gradient-border p-8 md:p-10 relative overflow-hidden animate-fade-in-up">
              <div className="pointer-events-none absolute -top-28 -right-28 w-64 h-64 rounded-full bg-gold-500/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-grid-gold-fine opacity-[0.04] mask-fade-b" />

              <div className="relative mb-8">
                <div className="chip-gold !py-0.5 mb-4 animate-badge-bounce !text-[10px]">
                <Lock className="w-3 h-3" /> Acceso seguro · bcrypt + TLS
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Inicia sesión para ver tus desafíos en vivo, equity curve y alertas.
                </p>
                {sp?.registered && (
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs inline-flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>Cuenta creada correctamente. Revisa tu email para confirmar o inicia directamente.</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <AuthForm mode="login" next={sp?.next} />
              </div>

              <div className="relative mt-6 pt-6 border-t border-white/[0.05] flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  ¿Sin cuenta?{" "}
                  <Link href="/signup" className="text-gold-300 hover:text-gold-200 font-semibold inline-flex items-center gap-1 group">
                    Regístrate gratis <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </p>
                <Link href="/" className="text-xs text-muted-foreground hover:text-gold-200 inline-flex items-center gap-1.5">
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
