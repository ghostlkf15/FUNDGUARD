"use client";

import * as React from "react";
import { Building2, Landmark, BarChart3, Coins, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Firm, MarketType } from "@/lib/types";

const marketIcon: Record<MarketType, any> = {
  forex: Landmark,
  futures: BarChart3,
  crypto: Coins,
  synthetic_indices: Activity,
};

const marketBg: Record<MarketType, string> = {
  forex: "from-sky-400/30 to-blue-600/10 border-sky-400/20",
  futures: "from-violet-400/30 to-purple-600/10 border-violet-400/20",
  crypto: "from-amber-400/30 to-orange-600/10 border-amber-400/20",
  synthetic_indices: "from-fuchsia-400/30 to-purple-600/10 border-fuchsia-400/20",
};

function initials(name: string) {
  return name
    .split(/[\s·\-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] || "").toUpperCase())
    .join("") || "?";
}

export interface FirmLogoProps {
  firm: Pick<Firm, "name" | "logo_url" | "market">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  useMarketIcon?: boolean;
  className?: string;
}

const sizeMap: Record<string, { wrap: string; icon: string; text: string; pad: string }> = {
  xs: { wrap: "w-8 h-8 rounded-lg", icon: "w-4 h-4", text: "text-[8px]", pad: "p-1" },
  sm: { wrap: "w-11 h-11 rounded-xl", icon: "w-5 h-5", text: "text-[11px] font-bold", pad: "p-1.5" },
  md: { wrap: "w-12 h-12 rounded-xl", icon: "w-6 h-6", text: "text-[10px] font-semibold", pad: "p-1.5" },
  lg: { wrap: "w-14 h-14 rounded-2xl", icon: "w-7 h-7", text: "text-base font-bold", pad: "p-2" },
  xl: { wrap: "w-16 h-16 rounded-2xl", icon: "w-8 h-8", text: "text-sm font-extrabold tracking-widest", pad: "p-2" },
};

export function FirmLogo({ firm, size = "md", useMarketIcon = false, className }: FirmLogoProps) {
  const [imgErr, setImgErr] = React.useState(false);
  const sz = sizeMap[size];
  const showImg = !!firm.logo_url && !imgErr;
  const MarketIcon = marketIcon[firm.market];
  const FallbackIcon = useMarketIcon ? MarketIcon : Building2;

  return (
    <div
      className={cn(
        `${sz.wrap} border bg-gradient-to-br flex items-center justify-center overflow-hidden shrink-0`,
        showImg ? "border-white/10 bg-white" + (size === "xs" ? " p-1" : ` ${sz.pad}`) : marketBg[firm.market],
        className
      )}
    >
      {showImg ? (
        <img
          src={firm.logo_url!}
          alt={firm.name}
          onError={() => setImgErr(true)}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      ) : firm.logo_url && imgErr ? (
        <span className={cn(sz.text, "text-gold-200 tracking-wider")}>
          {initials(firm.name)}
        </span>
      ) : (
        <FallbackIcon className={cn(sz.icon, "text-gold-200")} />
      )}
    </div>
  );
}
