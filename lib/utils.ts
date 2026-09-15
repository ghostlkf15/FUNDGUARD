import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { webcrypto } from "node:crypto";

const cryptoGlobal: Crypto =
  (globalThis as any).crypto || (webcrypto as unknown as Crypto);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value || 0).toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

export function cnPnl(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-muted-foreground";
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 5) return `hace ${diffW} sem`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo < 12) return `hace ${diffMo} mes${diffMo === 1 ? "" : "es"}`;
  const diffY = Math.floor(diffD / 365);
  return `hace ${diffY} año${diffY === 1 ? "" : "s"}`;
}

export function generateReportKey(): string {
  if (!cryptoGlobal?.getRandomValues) {
    // Fallback extremo a pseudo-aleatorio (sólo si no hay crypto)
    const rnd = Math.random().toString(16).slice(2) + Date.now().toString(16);
    return `fk_${rnd}${rnd}`.slice(0, 50);
  }
  const arr = new Uint8Array(32);
  cryptoGlobal.getRandomValues(arr);
  return `fk_${Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 48)}`;
}

export function hashReportKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${key.slice(-12)}`;
}
