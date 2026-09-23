import type { Firm, FirmPreset, MarketType } from "@/lib/types";
import {
  DEFAULT_FIRMS,
  DEFAULT_PRESETS,
  getFirmsByMarket as seedFirmsByMarket,
  getPresetsByFirm as seedPresetsByFirm,
  getFirmById as seedFirmById,
  getPresetById as seedPresetById,
} from "@/lib/data/seed";

let _liveCache: {
  firms: Firm[];
  presets: FirmPreset[];
  ts: number;
} | null = null;
const TTL_MS = 60 * 1000;

function validFirm(x: any): Firm | null {
  if (!x?.id || !x?.name || !x?.slug || !x?.market || typeof x.is_active !== "boolean") return null;
  return x as Firm;
}
function validPreset(x: any): FirmPreset | null {
  if (!x?.id || !x?.firm_id || !x?.initial_balance || !Array.isArray(x.phases)) return null;
  return x as FirmPreset;
}

export async function loadLiveCatalog(): Promise<{ firms: Firm[]; presets: FirmPreset[] }> {
  const now = Date.now();
  if (_liveCache && now - _liveCache.ts < TTL_MS) {
    return { firms: _liveCache.firms, presets: _liveCache.presets };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const sb = await createClient();
    const [fRes, pRes] = await Promise.all([
      sb.from("firms").select("*").eq("is_active", true),
      sb.from("firm_presets").select("*").eq("is_active", true),
    ]);
    const firmsRaw = (fRes.data || []).map(validFirm).filter(Boolean) as Firm[];
    const presetsRaw = (pRes.data || []).map(validPreset).filter(Boolean) as FirmPreset[];
    const firms = firmsRaw.length ? firmsRaw : DEFAULT_FIRMS.filter(f => f.is_active);
    const presets = presetsRaw.length ? presetsRaw : DEFAULT_PRESETS.filter(p => p.is_active);
    _liveCache = { firms, presets, ts: now };
    return { firms, presets };
  } catch {
    return {
      firms: DEFAULT_FIRMS.filter(f => f.is_active),
      presets: DEFAULT_PRESETS.filter(p => p.is_active),
    };
  }
}

export async function getFirmByIdLive(id: string): Promise<Firm | undefined> {
  const { firms } = await loadLiveCatalog();
  return firms.find(f => f.id === id) ?? seedFirmById(id);
}

export async function getPresetByIdLive(id: string): Promise<FirmPreset | undefined> {
  const { presets } = await loadLiveCatalog();
  return presets.find(p => p.id === id) ?? seedPresetById(id);
}

export async function getFirmsByMarketLive(market: MarketType): Promise<Firm[]> {
  const { firms } = await loadLiveCatalog();
  const list = firms.filter(f => f.market === market && f.is_active)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  return list.length ? list : seedFirmsByMarket(market);
}

export async function getPresetsByFirmLive(firmId: string): Promise<FirmPreset[]> {
  const { presets } = await loadLiveCatalog();
  const list = presets.filter(p => p.firm_id === firmId && p.is_active)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  return list.length ? list : seedPresetsByFirm(firmId);
}
