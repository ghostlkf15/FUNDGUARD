"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  radius?: number;
  asChild?: boolean;
}

export function MagneticButton({
  strength = 0.35,
  radius = 120,
  className,
  children,
  onMouseMove,
  onMouseLeave,
  ...rest
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [t, setT] = React.useState({ x: 0, y: 0, s: 1 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = ref.current;
      if (!el) {
        onMouseMove?.(e);
        return;
      }
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const fall = 1 - dist / radius;
        const pull = fall * fall;
        setT({
          x: dx * strength * pull,
          y: dy * strength * pull,
          s: 1 + 0.06 * pull,
        });
      } else {
        setT({ x: 0, y: 0, s: 1 });
      }
      onMouseMove?.(e);
    },
    [radius, strength, onMouseMove]
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setT({ x: 0, y: 0, s: 1 });
      onMouseLeave?.(e);
    },
    [onMouseLeave]
  );

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("will-change-transform transition-[box-shadow,filter] duration-200", className)}
      style={{
        transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`,
        transitionProperty: "transform, box-shadow, filter",
        transitionDuration: "240ms, 200ms, 200ms",
        transitionTimingFunction: "cubic-bezier(.2,.8,.2,1), ease, ease",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
