import Link from "next/link";
import { ShieldCheck, Mail, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-gold-500/10 bg-background/50">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="container py-16 grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-gold">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="font-display text-xl gold-gradient-text font-semibold">
                FUNDGUARD
              </div>
              <div className="text-[10px] tracking-[0.2em] text-gold-300/60 uppercase">
                Prop Firm Challenge Simulator
              </div>
            </div>
          </Link>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Plataforma de simulación de pruebas de fondeo para traders
            profesionales. Motor de reglas preciso, dashboard en vivo y
            notificaciones automáticas. Desarrollado por TKECH y LKALGORITMIC.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold-200 mb-4 tracking-wider uppercase">
            Producto
          </h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link className="hover:text-gold-300 transition-colors" href="/#caracteristicas">Características</Link></li>
            <li><Link className="hover:text-gold-300 transition-colors" href="/#mercados">Mercados soportados</Link></li>
            <li><Link className="hover:text-gold-300 transition-colors" href="/#firmas">Firmas prop</Link></li>
            <li><Link className="hover:text-gold-300 transition-colors" href="/dashboard">Dashboard demo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold-200 mb-4 tracking-wider uppercase">
            Soporte
          </h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold-400" />
              <a href="mailto:soporte@fundguard.io" className="hover:text-gold-300 transition-colors">
                soporte@fundguard.io
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-gold-400" />
              <a href="#" className="hover:text-gold-300 transition-colors">@fundguard</a>
            </li>
            <li className="flex items-center gap-2">
              <Github className="w-4 h-4 text-gold-400" />
              <a href="#" className="hover:text-gold-300 transition-colors">TKECH Dev</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground/70">
          <div>© {new Date().getFullYear()} FUNDGUARD · TKECH / LKALGORITMIC. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gold-300 transition-colors">Términos</Link>
            <Link href="#" className="hover:text-gold-300 transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-gold-300 transition-colors">Seguridad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
