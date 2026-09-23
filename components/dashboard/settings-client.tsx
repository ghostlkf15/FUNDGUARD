"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { Globe2, BellRing, ShieldCheck, Eye, User, Save, Check, AlertTriangle, Download, RefreshCw } from "@/lib/ui/lucide-polyfill";
import { toast } from "@/components/ui/sonner";
import { updateProfileAction } from "@/lib/dashboard/actions";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  initialProfile: Profile & { avatar_url?: string };
  timezones: string[];
  languages: { id: string; label: string }[];
  email: string;
}

interface GroupItem {
  label: string;
  action?: "download" | "rotate-key" | "placeholder";
  file?: string;
}

interface Group {
  icon: any;
  title: string;
  desc: string;
  items: GroupItem[];
}

const EA_DOWNLOADS: Record<string, string> = {
  "EA MT5 · v1.2.0": "/ea/FundGuard_EA.ex5",
  "EA MT4 · v1.1.3": "/ea/FundGuard_EA_MT4.mq4",
  "cBot CTRader · v1.0.1": "/ea/FundGuard_cBot.cs",
};

const GROUPS: Group[] = [
  {
    icon: ShieldCheck,
    title: "Seguridad",
    desc: "Contraseña, 2FA y sesiones activas.",
    items: [
      { label: "Cambiar contraseña", action: "placeholder" },
      { label: "Sesiones activas", action: "placeholder" },
      { label: "API keys personales", action: "placeholder" },
    ],
  },
  {
    icon: Eye,
    title: "EA / cBot",
    desc: "Versiones actuales del software de reporte.",
    items: [
      { label: "EA MT5 · v1.2.0", action: "download", file: "/ea/FundGuard_EA.ex5" },
      { label: "EA MT4 · v1.1.3", action: "download", file: "/ea/FundGuard_EA_MT4.mq4" },
      { label: "cBot CTRader · v1.0.1", action: "download", file: "/ea/FundGuard_cBot.cs" },
      { label: "Regenerar clave de reporte", action: "placeholder" },
    ],
  },
];

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

export function SettingsClient({ initialProfile, timezones, languages, email }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [timezone, setTimezone] = useState(initialProfile.timezone ?? "UTC");
  const [language, setLanguage] = useState(initialProfile.language ?? "es");
  const [alertDd, setAlertDd] = useState<number>(initialProfile.alert_dd_pct ?? 80);
  const [tfa, setTfa] = useState<boolean>(initialProfile.two_factor_enabled ?? false);

  function submit() {
    startTransition(async () => {
      try {
        await updateProfileAction({
          full_name: fullName.trim(),
          timezone,
          language,
          alert_dd_pct: alertDd,
          two_factor_enabled: tfa,
        });
        toast.success("Ajustes guardados", {
          description: "Tus preferencias se actualizaron correctamente.",
          icon: <Check className="w-4 h-4" />,
        });
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        toast.error("No se pudieron guardar los ajustes", {
          description: msg,
          icon: <AlertTriangle className="w-4 h-4" />,
        });
      }
    });
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {/* 2/3 izq: forms reales */}
      <div className="md:col-span-2 space-y-5">
        {/* CUENTA */}
        <section className="glass-card p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-gold-500/10 blur-3xl opacity-60" />
          <div className="flex items-start gap-4 mb-6 relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-gold-300" />
            </div>
            <div>
              <div className="font-semibold text-lg">Cuenta</div>
              <div className="text-sm text-muted-foreground">
                Nombre, idioma y zona horaria del broker.
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">Nombre completo</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Samuel Trader"
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all",
                )}
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">Email</span>
              <div className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300/80" />
                <span className="truncate">{email}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1 block">
                No modificable · verificado
              </span>
            </label>

            <label className="block relative">
              <span className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex items-center gap-1.5">
                <Globe2 className="w-3 h-3" /> Zona horaria
              </span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-foreground appearance-none pr-10",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all",
                )}
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>

            <label className="block relative">
              <span className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex items-center gap-1.5">
                <Globe2 className="w-3 h-3" /> Idioma
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-foreground appearance-none pr-10",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all",
                )}
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* NOTIFICACIONES */}
        <section className="glass-card p-6 relative overflow-hidden">
          <div className="absolute left-0 bottom-0 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl opacity-60" />
          <div className="flex items-start gap-4 mb-6 relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="font-semibold text-lg">Notificaciones</div>
              <div className="text-sm text-muted-foreground">
                Canales y umbrales de alerta personalizados.
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground/80">
                    Umbral alerta Drawdown diario
                  </span>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Avisa cuando el DD diario alcance este % del límite máximo.
                  </div>
                </div>
                <span className="chip-gold !py-0 !text-sm font-semibold text-gold-300">
                  {alertDd}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                step={5}
                value={alertDd}
                onChange={(e) => setAlertDd(Number(e.target.value))}
                className="w-full accent-gold-500"
              />
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1">
                <span>10%</span><span>50%</span><span>95%</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Aprobación / Reprobación", true, "email"],
                ["Alerta DD diario", true, "email in-app"],
                ["Push móvil (OneSignal)", false, "pendiente config"],
                ["Conexión / Desconexión EA", true, "in-app"],
              ].map(([title, checked, sub]) => (
                <label key={title as string} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-gold-500/20 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={checked as boolean}
                    className="mt-0.5 w-4 h-4 accent-gold-500"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
                      {sub}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* SEGURIDAD 2FA */}
        <section className="glass-card p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-40 h-40 rounded-full bg-rose-500/10 blur-3xl opacity-60" />
          <div className="flex items-start gap-4 mb-6 relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400/20 to-rose-600/5 border border-rose-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="font-semibold text-lg">Autenticación de dos factores (2FA)</div>
              <div className="text-sm text-muted-foreground">
                Añade una capa extra de seguridad a tu cuenta.
              </div>
            </div>
          </div>

          <label className="flex items-start justify-between gap-4 p-5 rounded-xl border bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 via-amber-500/15 to-gold-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-rose-200" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Requiere un código de 6 dígitos de Google Authenticator, Authy o similar al iniciar sesión.
                </div>
                {!tfa && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] uppercase tracking-widest">
                    <AlertTriangle className="w-3 h-3" /> Recomendado activar
                  </div>
                )}
                {tfa && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] uppercase tracking-widest">
                    <Check className="w-3 h-3" /> Activo
                  </div>
                )}
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={tfa}
                onChange={(e) => setTfa(e.target.checked)}
              />
              <div className="w-14 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] peer-checked:bg-gradient-to-r peer-checked:from-gold-500 peer-checked:to-emerald-500 peer-checked:border-transparent transition-all" />
              <div className="absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md peer-checked:translate-x-6 transition-transform" />
            </div>
          </label>
        </section>

        {/* SUBMIT */}
        <div className="sticky bottom-6 z-20">
          <div className="rounded-2xl glass-card-strong gold-gradient-border p-4 flex flex-col sm:flex-row gap-3 items-center sm:justify-between">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isPending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              {isPending ? "Guardando cambios…" : "Los cambios se guardan localmente hasta pulsar Guardar"}
            </div>
            <button
              onClick={submit}
              disabled={isPending}
              className={cn(
                "btn-gold w-full sm:w-auto px-8 gap-2 relative overflow-hidden group",
                isPending && "opacity-70 cursor-wait",
              )}
            >
              <Save className="w-4 h-4" />
              {isPending ? "Guardando…" : "Guardar ajustes"}
            </button>
          </div>
        </div>
      </div>

      {/* 1/3 der: groups informativos placeholder */}
      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g.title} className="glass-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/5 border border-gold-500/20 flex items-center justify-center shrink-0">
                <g.icon className="w-5 h-5 text-gold-300" />
              </div>
              <div>
                <div className="font-semibold text-lg">{g.title}</div>
                <div className="text-sm text-muted-foreground">{g.desc}</div>
              </div>
            </div>
            <ul className="space-y-1.5">
              {g.items.map((it) => {
                if (it.action === "download" && it.file) {
                  return (
                    <li key={it.label}>
                      <button
                        type="button"
                        onClick={() => triggerDownload(it.file!, it.label)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-gold-500/30 hover:bg-gold-500/5 transition-colors text-left group"
                      >
                        <span className="text-sm group-hover:text-gold-100 transition-colors">{it.label}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold-300/80 group-hover:text-gold-200 transition-colors">
                          <Download className="w-3 h-3" /> Descargar
                        </span>
                      </button>
                    </li>
                  );
                }
                if (it.action === "rotate-key") {
                  return (
                    <li key={it.label}>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-gold-500/20 transition-colors text-left opacity-70 cursor-not-allowed"
                        disabled
                      >
                        <span className="text-sm">{it.label}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gold-300/80">Prox.</span>
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={it.label} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-gold-500/20 transition-colors">
                    <span className="text-sm">{it.label}</span>
                    <span className="text-[10px] uppercase tracking-widest text-gold-300/80">Prox.</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-gold-fine opacity-30 mask-fade-b" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-200 text-[10px] uppercase tracking-[0.18em] mb-4">
              <ShieldCheck className="w-3 h-3" /> Build
            </div>
            <div className="font-display text-xl font-semibold leading-tight">
              v1.0.0-beta.4
              <div className="text-xs text-muted-foreground mt-1">
                Fase C activa · RLS + Settings + Notifications
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
