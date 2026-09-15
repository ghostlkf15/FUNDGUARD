"use client";

import * as React from "react";
import { ShieldCheck } from "@/lib/ui/lucide-polyfill";
import { cn } from "@/lib/utils";

export function PagePreloader() {
  const [phase, setPhase] = React.useState<0 | 1 | 2>(0);

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 2) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[150] bg-[#0a0806] flex items-center justify-center transition-opacity duration-700 pointer-events-none",
        phase === 0 ? "opacity-100" : "opacity-0"
      )}
      style={{ transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}
    >
      {/* Grid + Orbs background */}
      <div className="pointer-events-none absolute inset-0 hero-grid-bg opacity-30 mask-fade-b" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-gold-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-gold-500/10 blur-[100px] animate-float-soft" />

      <div className="relative flex flex-col items-center gap-6 animate-fade-in-up">
        {/* Logo con ring glow */}
        <div className="relative">
          {/* Progress ring exterior */}
          <svg className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] -rotate-90 animate-spin-slow" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="preloaderRing" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(246,209,134,0.05)" />
                <stop offset="50%" stopColor="rgba(212,160,92,0.95)" />
                <stop offset="100%" stopColor="rgba(139,94,35,0)" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r={92}
              fill="none"
              stroke="url(#preloaderRing)"
              strokeWidth={2}
              strokeDasharray="180 400"
              strokeLinecap="round"
            />
          </svg>

          {/* Halo pulse */}
          <div className="absolute -inset-2 rounded-full bg-gold-500/25 blur-2xl animate-glow-pulse-ring" />

          {/* Logo real */}
          <div className="relative w-20 h-20 rounded-[26px] bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-[0_30px_80px_-20px_rgba(212,160,92,0.6)] overflow-hidden">
            <div className="absolute inset-0 bg-grid-gold-fine opacity-20 mask-fade-b" />
            <ShieldCheck className="w-11 h-11 text-black relative z-10" strokeWidth={2.25} />
          </div>
        </div>

        {/* Nombre marca + tag */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-display font-semibold text-3xl tracking-tight gold-gradient-text">
            FUNDGUARD
          </span>
          <span className="text-[10px] tracking-[0.28em] text-gold-300/70 uppercase">
            Suite institucional
          </span>
        </div>

        {/* Progress shimmer bar */}
        <div className="w-56 h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-gold-300 via-gold-500 to-gold-700 animate-[fill_1.4s_ease-out_forwards]" />
        </div>

        <style>{`
          @keyframes fill {
            0% { width: 10%; opacity: 0.6; }
            40% { width: 65%; opacity: 1; }
            100% { width: 98%; opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
