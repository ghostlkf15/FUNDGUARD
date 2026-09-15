import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Settings as SettingsIcon, Globe2, BellRing, ShieldCheck, Eye, User, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { SettingsClient } from "@/components/dashboard/settings-client";

export const dynamic = "force-dynamic";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Athens",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
];

const LANGUAGES = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
  { id: "pt", label: "Português" },
];

export default async function SettingsPage() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data?.user) redirect("/login?next=/dashboard/settings");
  const email = data.user.email;
  const uid = data.user.id;

  const { data: profile } = await sb
    .from("profiles")
    .select("id, full_name, language, timezone, alert_dd_pct, two_factor_enabled, is_admin, created_at, updated_at")
    .eq("id", uid)
    .maybeSingle();

  const profileOrDefault: Profile & { avatar_url?: string } = profile
    ? (profile as any)
    : {
        id: uid,
        full_name: email?.split("@")[0] ?? "",
        avatar_url: undefined,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        language: "es",
        timezone: "UTC",
        alert_dd_pct: 80,
        two_factor_enabled: false,
      };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="chip-gold mb-3 !py-1">
          <SettingsIcon className="w-3 h-3" /> Ajustes
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">
          Configura tu <span className="gold-gradient-text">cuenta</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Personaliza notificaciones, seguridad, apariencia y tus EAs/cBots.
        </p>
      </div>

      <div className="rounded-2xl p-6 glass-card-strong gold-gradient-border flex items-center gap-5 flex-wrap relative overflow-hidden">
        <div className="absolute -right-24 -top-20 w-64 h-64 rounded-full bg-gold-400/30 blur-3xl opacity-40" />
        <div className="absolute -left-24 -bottom-20 w-56 h-56 rounded-full bg-amber-300/20 blur-3xl opacity-30" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center text-black font-bold text-2xl shadow-gold shrink-0 relative z-10">
          {profileOrDefault.full_name?.charAt(0) || email?.charAt(0) || "U"}
        </div>
        <div className="min-w-0 relative z-10">
          <div className="font-display text-2xl font-semibold">{profileOrDefault.full_name || email?.split("@")[0]}</div>
          <div className="text-sm text-muted-foreground">{email}</div>
          <div className="mt-2 chip-gold !py-0">
            {profileOrDefault.is_admin
              ? "Administrador · acceso completo"
              : "Acceso completo · sin suscripción"}
          </div>
        </div>
      </div>

      <SettingsClient
        initialProfile={profileOrDefault as any}
        timezones={TIMEZONES}
        languages={LANGUAGES}
        email={email ?? ""}
      />
    </div>
  );
}
