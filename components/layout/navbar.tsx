"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, X, TrendingUp } from "@/lib/ui/lucide-polyfill";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#caracteristicas", label: "Características" },
  { href: "/#mercados", label: "Mercados" },
  { href: "/#firmas", label: "Firmas" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/70 backdrop-blur-2xl border-b border-gold-500/10"
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-300 to-gold-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-gold">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl tracking-tight gold-gradient-text font-semibold">
              FUNDGUARD
            </span>
            <span className="text-[10px] tracking-[0.2em] text-gold-300/60 uppercase">
              Powered by TKECH
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors hover:text-gold-300",
                path === item.href
                  ? "text-gold-300"
                  : "text-foreground/70"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-ghost-gold !px-4 !py-2 text-sm">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="btn-gold !px-5 !py-2 text-sm">
            Crear cuenta
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg border border-white/10"
          aria-label="Menú"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gold-500/10 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-gold-500/10 text-foreground/80"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 flex gap-2">
              <Link href="/login" className="btn-ghost-gold flex-1 !py-2">
                Iniciar sesión
              </Link>
              <Link href="/signup" className="btn-gold flex-1 !py-2">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
