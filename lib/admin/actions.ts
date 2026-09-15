"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MarketType } from "@/lib/types";
import { getFirmById, DEFAULT_PRESETS } from "@/lib/data/seed";

async function assertAdmin(sb: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await sb.auth.getUser();
  if (!data?.user) throw new Error("Sin sesión");

  const res = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  const profile = (res as any)?.data ?? null;

  if (!profile?.is_admin) throw new Error("No tienes permisos de administrador");
  return data.user.id;
}

// =========================================================================
// RESET DE PRESETS ESTÁNDAR DE FIRMA (desde seed.ts = lo que sale de los PDFs)
// Safe: no borra presets que tengan desafíos asociados
// =========================================================================
export async function resetFirmPresetsStandardAction(firmId: string) {
  const sb = await createClient();
  await assertAdmin(sb);
  const firm = getFirmById(firmId);
  if (!firm) throw new Error("Firma no encontrada en catálogo local");

  const standard = DEFAULT_PRESETS.filter((p) => p.firm_id === firmId);
  if (standard.length === 0) throw new Error("No hay presets estándar para esta firma");

  // Safe check: count existing challenges per preset id (incluye los estándar + custom no estándar)
  const { data: existingPresets } = await sb.from("firm_presets").select("id, name").eq("firm_id", firmId);
  const presetIds = (existingPresets || []).map((x: any) => x.id);
  if (presetIds.length) {
    const { count, error } = await sb
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .in("preset_id", presetIds);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) {
      throw new Error(
        `No se puede resetear: hay ${count} desafío(s) usando presets de esta firma. Borra los desafíos primero o edita los presets individualmente.`
      );
    }
  }

  // Borrar todos los presets actuales de la firma (ya safe check) y insertar los estándar
  if (presetIds.length) {
    const { error: delErr } = await sb.from("firm_presets").delete().in("id", presetIds);
    if (delErr) throw new Error(delErr.message);
  }

  const { error: insErr } = await sb
    .from("firm_presets")
    .insert(standard.map((p) => ({
      id: p.id,
      firm_id: p.firm_id,
      name: p.name,
      slug: p.slug,
      initial_balance: p.initial_balance,
      currency: p.currency,
      phases: p.phases as unknown as any,
      broker_timezone: p.broker_timezone,
      daily_reset_hour_utc: p.daily_reset_hour_utc,
      allow_consistency_rule: !!p.allow_consistency_rule,
      allow_newstrade_lock: !!p.allow_newstrade_lock,
      allow_news_trade_lock: !!p.allow_news_trade_lock,
      is_active: !!p.is_active,
      order_index: p.order_index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })));
  if (insErr) throw new Error(insErr.message);

  revalidatePath(`/admin/firms/${firmId}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard/new");
  return { ok: true, inserted: standard.length };
}

// =========================================================================
// PRESETS
// =========================================================================

export async function createPresetAction(input: {
  firm_id: string;
  name: string;
  initial_balance: number;
  currency?: string;
  phases?: any[];
  daily_reset_hour_utc?: number;
  broker_timezone?: string;
}) {
  const sb = await createClient();
  await assertAdmin(sb);

  const pad6 = (n: number) => String(n).padStart(6, "0");
  const phases = input.phases ?? [
    { order: 0, name: "Fase 1 · Challenge", profit_target_pct: 10, max_daily_drawdown_pct: 5,
      max_total_drawdown_pct: 10, drawdown_type: "static", min_trading_days: 4,
      reset_balance_on_new_phase: false, special_rules: [] },
    { order: 1, name: "Fase 2 · Verification", profit_target_pct: 5, max_daily_drawdown_pct: 5,
      max_total_drawdown_pct: 10, drawdown_type: "static", min_trading_days: 3,
      reset_balance_on_new_phase: true, special_rules: [] },
  ];

  const payload = {
    id: `${input.firm_id}-preset-${pad6(input.initial_balance)}`,
    firm_id: input.firm_id,
    name: input.name || `$${Math.round(input.initial_balance / 1000)}K`,
    slug: `${input.initial_balance}-challenge`,
    initial_balance: input.initial_balance,
    currency: input.currency ?? "USD",
    daily_reset_hour_utc: input.daily_reset_hour_utc ?? 0,
    broker_timezone: input.broker_timezone ?? "UTC",
    allow_consistency_rule: true,
    allow_newstrade_lock: false,
    allow_news_trade_lock: false,
    is_active: true,
    order_index: 1,
    phases,
  };

  const { error } = await sb.from("firm_presets").upsert([payload], { onConflict: "id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/firms/${input.firm_id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard/new");
  return { ok: true, id: payload.id };
}

export async function updatePresetNameAction(presetId: string, name: string) {
  const sb = await createClient();
  await assertAdmin(sb);
  const { error } = await sb.from("firm_presets").update({ name }).eq("id", presetId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/dashboard/new");
  return { ok: true };
}

export async function updatePresetActiveAction(presetId: string, isActive: boolean) {
  const sb = await createClient();
  await assertAdmin(sb);
  const { error } = await sb.from("firm_presets").update({ is_active: isActive }).eq("id", presetId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/dashboard/new");
  return { ok: true };
}

export async function updatePresetOrderAction(presetId: string, order_index: number) {
  const sb = await createClient();
  await assertAdmin(sb);
  const { error } = await sb.from("firm_presets").update({ order_index }).eq("id", presetId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updatePresetPhaseAction(
  presetId: string,
  phaseIndex: number,
  patch: Partial<{
    name: string;
    profit_target_pct: number;
    max_daily_drawdown_pct: number;
    max_total_drawdown_pct: number;
    drawdown_type: "static" | "trailing";
    min_trading_days: number;
    time_limit_days: number | null;
    reset_balance_on_new_phase: boolean;
    special_rules: string[];
  }>
) {
  const sb = await createClient();
  await assertAdmin(sb);
  const { data, error: fetchErr } = await sb
    .from("firm_presets")
    .select("phases, firm_id")
    .eq("id", presetId)
    .maybeSingle();
  if (fetchErr || !data) throw new Error("Preset no encontrado");

  const phases = Array.isArray(data.phases) ? [...data.phases] : [];
  if (!phases[phaseIndex]) throw new Error("Fase no encontrada");
  phases[phaseIndex] = { ...phases[phaseIndex], ...patch, order: phaseIndex };

  const { error } = await sb.from("firm_presets").update({ phases }).eq("id", presetId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/firms/${data.firm_id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard/new");
  return { ok: true };
}

export async function deletePresetAction(presetId: string) {
  const sb = await createClient();
  const uid = await assertAdmin(sb);
  // soft safe: no borrar si hay desafíos que lo usen
  const { count, error: cErr } = await sb
    .from("challenges")
    .select("*", { count: "exact", head: true })
    .eq("preset_id", presetId);
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) throw new Error("No se puede borrar: hay desafíos usando este preset");

  // obtener firm_id antes de borrar para revalidate
  const { data: before } = await sb.from("firm_presets").select("firm_id").eq("id", presetId).maybeSingle();

  const { error } = await sb.from("firm_presets").delete().eq("id", presetId);
  if (error) throw new Error(error.message);
  if (before?.firm_id) revalidatePath(`/admin/firms/${before.firm_id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard/new");
  void uid;
  return { ok: true };
}

// =========================================================================
// FIRMS
// =========================================================================

export async function createFirmAction(input: {
  name: string; slug: string; market: MarketType;
  description?: string; website_url?: string; logo_url?: string;
  is_featured?: boolean; order_index?: number;
}) {
  const sb = await createClient();
  await assertAdmin(sb);
  const id = `firm-${input.slug.replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
  const payload = {
    id,
    name: input.name,
    slug: input.slug,
    market: input.market,
    description: input.description ?? "",
    website_url: input.website_url ?? null,
    logo_url: input.logo_url ?? null,
    is_active: true,
    is_featured: !!input.is_featured,
    order_index: input.order_index ?? 99,
  };
  const { error } = await sb.from("firms").insert([payload]);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/firms");
  revalidatePath("/dashboard/new");
  revalidatePath("/");
  return { ok: true, id };
}

export async function updateFirmMetaAction(firmId: string, patch: Partial<{
  name: string; description: string; website_url: string; logo_url: string;
  is_featured: boolean; order_index: number; is_active: boolean;
}>) {
  const sb = await createClient();
  await assertAdmin(sb);
  const { error } = await sb.from("firms").update(patch).eq("id", firmId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/firms/${firmId}`);
  revalidatePath("/dashboard/new");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteFirmAction(firmId: string) {
  const sb = await createClient();
  await assertAdmin(sb);
  const { count, error: cErr } = await sb
    .from("challenges")
    .select("*", { count: "exact", head: true })
    .eq("firm_id", firmId);
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) throw new Error("No se puede borrar la firma: tiene desafíos asociados");

  // borra en cascada presets primero? la FK es ON DELETE CASCADE.
  const { error } = await sb.from("firms").delete().eq("id", firmId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/firms");
  revalidatePath("/dashboard/new");
  revalidatePath("/");
  return { ok: true };
}
