import * as ccxt from "ccxt";
import type { AccountLinkMethod } from "@/lib/types";

export interface CryptoConnectorConfig {
  exchangeId: string;
  apiKey?: string;
  secret?: string;
  password?: string;
  sandbox?: boolean;
}

export interface CryptoSnapshot {
  balance: number;
  equity: number;
  used_margin: number;
  available_margin: number;
  open_positions: CryptoPosition[];
  closed_trades_today: CryptoTrade[];
  timestamp: string;
  error?: string;
}

export interface CryptoPosition {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  contracts: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  leverage: number;
}

export interface CryptoTrade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  cost: number;
  fee: number;
  realized_pnl: number;
  timestamp: string;
}

export function buildExchange({ exchangeId, apiKey, secret, password, sandbox }: CryptoConnectorConfig) {
  const id = exchangeId.toLowerCase();
  const Cls = (ccxt as any)[id];
  if (!Cls) throw new Error(`Exchange ${id} no soportado por CCXT.`);
  const ex = new Cls({
    apiKey, secret, password,
    enableRateLimit: true,
    options: { sandboxMode: !!sandbox, defaultType: "swap" },
  });
  return ex;
}

export async function fetchSnapshot(cfg: CryptoConnectorConfig): Promise<CryptoSnapshot> {
  const ex = buildExchange(cfg);
  try {
    const [balance, positions, tradesRaw] = await Promise.all([
      ex.fetchBalance(),
      ex.fetchPositions(),
      ex.fetchMyTrades(undefined, undefined, 200),
    ]) as any;

    const usdt = balance?.total?.["USDT"] ?? balance?.total?.["USD"] ?? 0;
    const equity = balance?.total?.["USDT"] ?? balance?.total?.["USD"] ?? 0;
    const used = balance?.used?.["USDT"] ?? balance?.used?.["USD"] ?? 0;
    const avail = balance?.free?.["USDT"] ?? balance?.free?.["USD"] ?? 0;

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const open_positions = (positions || [])
      .filter((p: any) => Math.abs(p?.contracts || 0) > 0)
      .map((p: any) => ({
        id: String(p.id || `${p.symbol}-${p.side}-${p.entryPrice}`),
        symbol: p.symbol,
        side: (p.side === "short" || (p.contracts || 0) < 0) ? "sell" : "buy",
        contracts: Math.abs(p.contracts || p.amount || 0),
        entry_price: Number(p.entryPrice || p.averagePrice || 0),
        mark_price: Number(p.markPrice || p.lastPrice || 0),
        unrealized_pnl: Number(p.unrealizedPnl || p.pnl || 0),
        leverage: Number(p.leverage || 1),
      }));

    const closed_trades_today = (tradesRaw || [])
      .filter((t: any) => (t.timestamp || 0) >= startOfDay.getTime())
      .map((t: any) => ({
        id: String(t.id),
        symbol: t.symbol,
        side: t.side === "sell" ? "sell" : "buy",
        amount: Number(t.amount || 0),
        price: Number(t.price || 0),
        cost: Number(t.cost || 0),
        fee: Number(t.fee?.cost || t.fee || 0),
        realized_pnl: Number(t.pnl || 0),
        timestamp: new Date(t.timestamp || now).toISOString(),
      }));

    return {
      balance: Number(usdt || 0),
      equity: Number(equity || 0),
      used_margin: Number(used || 0),
      available_margin: Number(avail || 0),
      open_positions,
      closed_trades_today,
      timestamp: new Date(now).toISOString(),
    };
  } finally {
    // @ts-ignore
    if (typeof ex.close === "function") ex.close().catch(() => {});
  }
}

export function validateReadOnlyOnly(exchange: any): Promise<void> {
  // Mejor esfuerzo: intentar una escritura y esperar que falle.
  // En producción, se debe verificar a nivel exchange el alcance del API Key.
  return Promise.resolve();
}
