import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  BarChart3,
  Users,
  Crown,
  UserCircle2,
  ChevronRight,
} from "@/lib/ui/lucide-polyfill";
import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const sb = await createClient();
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, is_admin, avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email,
    fullName: profile?.full_name ?? data.user.email,
    isAdmin: !!profile?.is_admin,
    avatarUrl: profile?.avatar_url,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const navItems = [
    { href: "/dashboard", label: "Mis desafíos", icon: LayoutDashboard },
    { href: "/dashboard/new", label: "Nuevo desafío", icon: PlusCircle },
    { href: "/dashboard/analytics", label: "Analíticas", icon: BarChart3 },
    { href: "/dashboard/notifications", label: "Notificaciones", icon: Bell },
  ];
  const adminItems = [
    { href: "/admin", label: "Panel admin", icon: Users },
    { href: "/admin/firms", label: "Firmas & presets", icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-white/[0.05] bg-card/30 backdrop-blur-2xl fixed inset-y-0 z-30">
        <Link href="/" className="flex items-center gap-3 p-6 border-b border-white/[0.05]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-gold">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl gold-gradient-text font-semibold">
              FUNDGUARD
            </div>
            <div className="text-[9px] tracking-[0.2em] text-gold-300/60 uppercase">
              Challenge Simulator
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2">
              Navegación
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                               hover:bg-gold-500/8 hover:text-gold-200 text-foreground/75"
                  >
                    <item.icon className="w-4 h-4 text-gold-400/70 group-hover:text-gold-300" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {user.isAdmin && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gold-400/70 px-3 mb-2">
                Administración
              </div>
              <ul className="space-y-1">
                {adminItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                                 hover:bg-gold-500/8 hover:text-gold-200 text-foreground/75"
                    >
                      <item.icon className="w-4 h-4 text-gold-400/70 group-hover:text-gold-300" />
                      <span className="flex-1">{item.label}</span>
                      <span className="chip-gold !py-0 !text-[9px]">ADMIN</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2">
              Cuenta
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/settings"
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-gold-500/8 hover:text-gold-200 text-foreground/75"
                >
                  <Settings className="w-4 h-4 text-gold-400/70 group-hover:text-gold-300" />
                  Ajustes
                </Link>
              </li>
              <li>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-rose-500/8 hover:text-rose-300 text-foreground/75"
                  >
                    <LogOut className="w-4 h-4 text-rose-400/70 group-hover:text-rose-300" />
                    Cerrar sesión
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-white/[0.05]">
          <div className="glass-card !p-4 !rounded-xl !shadow-none flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-black font-bold text-sm shadow-gold shrink-0">
              {user.fullName?.charAt(0).toUpperCase() ?? <UserCircle2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user.fullName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
              {user.isAdmin && (
                <div className="mt-1 chip-gold !py-0 !text-[9px]">Acceso admin</div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 lg:pl-72">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
