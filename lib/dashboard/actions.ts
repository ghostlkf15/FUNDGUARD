"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AccountLinkMethod, ChallengeStatus, MarketType } from "@/lib/types";
import { getPresetById, getFirmById } from "@/lib/data/seed";
import { getPresetByIdLive, getFirmByIdLive } from "@/lib/data/catalog-live";
import { aesEncrypt } from "@/lib/crypto/aes-utils";

const CLOSED_STATUSES: ChallengeStatus[] = ["failed", "approved"];

function assertOwnership(challenge: { user_id: string }, userId: string) {
  if (challenge.user_id !== userId) {
    throw new Error("No autorizado: este desafío no pertenece a tu cuenta.");
  }
}

function assertNotClosed(status: ChallengeStatus) {
  if (CLOSED_STATUSES.includes(status)) {
    throw new Error(
      `No se puede modificar un desafío en estado "${status}". Solo se permite en desafíos pendientes o activos.`,
    );
  }
}

function generatePlainKey(): string {
  const hex = crypto.randomBytes(24).toString("hex");
  return `fk_${hex}`;
}

export async function generateReportKey(
  challengeId: string,
  method: AccountLinkMethod,
): Promise<{ plainKey: string }> {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión no válida. Inicia sesión nuevamente.");

  const { data: challenge, error: chErr } = await sb
    .from("challenges")
    .select("id, user_id, status, report_key_hash")
    .eq("id", challengeId)
    .maybeSingle();

  if (chErr || !challenge) throw new Error("Desafío no encontrado.");
  assertOwnership(challenge, user.id);
  assertNotClosed(challenge.status as ChallengeStatus);

  if (challenge.report_key_hash) {
    throw new Error(
      "Esta cuenta ya tiene una clave de reporte. Usa 'Rotar clave' para generar una nueva.",
    );
  }

  const plainKey = generatePlainKey();
  const hash = await bcrypt.hash(plainKey, 10);

  const { error: updErr } = await sb
    .from("challenges")
    .update({
      report_key_hash: hash,
      link_method: method,
      account_linked_at: new Date().toISOString(),
      status: challenge.status === "draft" ? "linking" : challenge.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  if (updErr) {
    throw new Error(`Error al guardar la clave: ${updErr.message}`);
  }

  return { plainKey };
}

export async function rotateReportKey(
  challengeId: string,
): Promise<{ plainKey: string }> {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión no válida. Inicia sesión nuevamente.");

  const { data: challenge, error: chErr } = await sb
    .from("challenges")
    .select("id, user_id, status")
    .eq("id", challengeId)
    .maybeSingle();

  if (chErr || !challenge) throw new Error("Desafío no encontrado.");
  assertOwnership(challenge, user.id);
  assertNotClosed(challenge.status as ChallengeStatus);

  const plainKey = generatePlainKey();
  const hash = await bcrypt.hash(plainKey, 10);

  const { error: updErr } = await sb
    .from("challenges")
    .update({
      report_key_hash: hash,
      account_linked_at: new Date().toISOString(),
      status:
        challenge.status === "draft" || challenge.status === "disconnected"
          ? "linking"
          : challenge.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  if (updErr) {
    throw new Error(`Error al rotar la clave: ${updErr.message}`);
  }

  return { plainKey };
}

export async function unlinkAccount(
  challengeId: string,
): Promise<{ ok: true }> {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión no válida. Inicia sesión nuevamente.");

  const { data: challenge, error: chErr } = await sb
    .from("challenges")
    .select("id, user_id, status, current_phase")
    .eq("id", challengeId)
    .maybeSingle();

  if (chErr || !challenge) throw new Error("Desafío no encontrado.");
  assertOwnership(challenge, user.id);
  assertNotClosed(challenge.status as ChallengeStatus);

  const backToDraft =
    challenge.current_phase === 0 || !challenge.current_phase;

  const { error: updErr } = await sb
    .from("challenges")
    .update({
      report_key_hash: null,
      link_method: null,
      account_linked_at: null,
      ea_last_report_at: null,
      status: backToDraft ? "draft" : "disconnected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  if (updErr) {
    throw new Error(`Error al desvincular la cuenta: ${updErr.message}`);
  }

  return { ok: true };
}

const CreateChallengeSchema = z.object({
  market: z.enum(["forex", "futures", "crypto", "synthetic_indices"]),
  firm_id: z.string().uuid().or(z.string().min(2).max(64)),
  preset_id: z.string().uuid().or(z.string().min(2).max(64)),
  link_method: z.enum(["ea_mt4", "ea_mt5", "cbot_ctrader", "crypto_api"]),
  exchange_id: z.string().min(2).max(32).optional(),
  api_key: z.string().min(8).max(256).optional(),
  api_secret: z.string().min(8).max(512).optional(),
  passphrase: z.string().max(128).optional(),
});

type CreateChallengeInput = {
  market: "forex" | "futures" | "crypto" | "synthetic_indices";
  firm_id: string;
  preset_id: string;
  link_method: "ea_mt4" | "ea_mt5" | "cbot_ctrader" | "crypto_api";
  exchange_id?: string;
  api_key?: string;
  api_secret?: string;
  passphrase?: string;
};

export interface CreateChallengeResult {
  challenge_id: string | null;
  plain_report_key: string | null;
  next_path: string;
  guest_mode?: boolean;
  guest_signup_path?: string;
}

export async function createChallengeAction(
  input: CreateChallengeInput,
): Promise<CreateChallengeResult> {
  const sb = await createClient();

  const parsed = CreateChallengeSchema.safeParse(input);
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    const valArr = Object.values(f) as (string[] | undefined)[];
    const first = valArr.find((v) => v && v.length > 0)?.[0];
    throw new Error(`Datos inválidos: ${first || "revisa los campos"}.`);
  }
  const p = parsed.data;

  const preset = (await getPresetByIdLive(p.preset_id)) || getPresetById(p.preset_id);
  if (!preset) {
    throw new Error("Preset no encontrado. Refresca la página e inténtalo de nuevo.");
  }
  const firm = (await getFirmByIdLive(p.firm_id)) || getFirmById(p.firm_id);
  if (!firm) {
    throw new Error("Firma no encontrada.");
  }
  if (preset.firm_id !== p.firm_id) {
    throw new Error("El preset no pertenece a esta firma.");
  }
  if (firm.market !== p.market) {
    throw new Error("El mercado seleccionado no coincide con esta firma.");
  }

  if (p.link_method === "crypto_api") {
    if (!p.exchange_id || !p.api_key || !p.api_secret) {
      throw new Error("Para API cripto debes incluir exchange, key y secret.");
    }
  }

  const {
    data: { user },
  } = await sb.auth.getUser();

  // -------------
  // Modo invitado: no hay sesión → retornar path de signup pre-rellenado
  // -------------
  if (!user) {
    const params = new URLSearchParams({
      next: `/dashboard/new?market=${encodeURIComponent(p.market)}&firm=${encodeURIComponent(p.firm_id)}&preset=${encodeURIComponent(p.preset_id)}&link=${encodeURIComponent(p.link_method)}`,
      guest: "1",
    });
    const signupNext = `/signup?${params.toString()}`;
    return {
      challenge_id: null,
      plain_report_key: null,
      next_path: signupNext,
      guest_mode: true,
      guest_signup_path: signupNext,
    };
  }

  const balance = preset.initial_balance;
  const status: ChallengeStatus = p.link_method === "crypto_api" ? "active" : "linking";
  const now = new Date().toISOString();

  let plainReportKey: string | null = null;
  let reportKeyHash: string | null = null;
  if (p.link_method !== "crypto_api") {
    plainReportKey = generatePlainKey();
    reportKeyHash = await bcrypt.hash(plainReportKey, 12);
  }

  const insert: Record<string, unknown> = {
    user_id: user.id,
    firm_id: p.firm_id,
    preset_id: p.preset_id,
    market: p.market as MarketType,
    current_phase: 0,
    status,
    initial_balance: balance,
    current_balance: balance,
    current_equity: balance,
    peak_equity: balance,
    start_daily_balance: balance,
    daily_pnl: 0,
    total_pnl: 0,
    total_pnl_pct: 0,
    daily_drawdown_pct: 0,
    max_drawdown_pct: 0,
    trading_days_count: 0,
    link_method: p.link_method,
    report_key_hash: reportKeyHash,
    crypto_exchange_id: p.link_method === "crypto_api" ? p.exchange_id! : null,
    crypto_api_key_enc: p.link_method === "crypto_api" ? aesEncrypt(p.api_key!) : null,
    crypto_api_secret_enc: p.link_method === "crypto_api" ? aesEncrypt(p.api_secret!) : null,
    crypto_passphrase_enc:
      p.link_method === "crypto_api" && p.passphrase ? aesEncrypt(p.passphrase) : null,
    started_at: p.link_method === "crypto_api" ? now : null,
    account_linked_at: p.link_method === "crypto_api" ? now : null,
  };

  const { data: rows, error: insErr } = await sb
    .from("challenges")
    .insert([insert as any])
    .select("id")
    .single();

  if (insErr || !rows) {
    throw new Error(
      `Error creando desafío en BD: ${insErr?.message || "sin respuesta"}.`,
    );
  }

  return {
    challenge_id: rows.id,
    plain_report_key: plainReportKey,
    next_path: `/dashboard/${rows.id}`,
  };
}

const UpdateProfileSchema = z.object({
  full_name: z.string().max(120).optional().or(z.literal("")),
  timezone: z.string().max(64).optional().or(z.literal("")),
  language: z.string().max(16).optional().or(z.literal("")),
  alert_dd_pct: z.coerce.number().min(10).max(95).optional().nullable(),
  two_factor_enabled: z.boolean().optional(),
});

type UpdateProfileInput = {
  full_name?: string;
  timezone?: string;
  language?: string;
  alert_dd_pct?: number | null;
  two_factor_enabled?: boolean;
};

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<{ ok: true }> {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión no válida. Inicia sesión nuevamente.");

  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    const valArr = Object.values(f) as (string[] | undefined)[];
    const first = valArr.find((v) => v && v.length > 0)?.[0];
    throw new Error(`Datos inválidos: ${first || "revisa los campos"}.`);
  }
  const p = parsed.data;

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof p.full_name === "string") payload.full_name = p.full_name || null;
  if (typeof p.timezone === "string") payload.timezone = p.timezone || null;
  if (typeof p.language === "string") payload.language = p.language || null;
  if (p.alert_dd_pct !== undefined) payload.alert_dd_pct = p.alert_dd_pct;
  if (typeof p.two_factor_enabled === "boolean") payload.two_factor_enabled = p.two_factor_enabled;

  const { error } = await sb
    .from("profiles")
    .update(payload as any)
    .eq("id", user.id);

  if (error) throw new Error(`Error guardando ajustes: ${error.message}`);
  return { ok: true };
}

export async function markEventReadAction(eventId: string, read: boolean = true): Promise<{ ok: true }> {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión no válida. Inicia sesión nuevamente.");

  if (!/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) throw new Error("ID de evento no válido.");

  const { error: joinErr } = await sb
    .from("rule_events")
    .update({
      is_read: read,
      read_at: read ? new Date().toISOString() : null,
    } as any)
    .eq("id", eventId)
    .filter("challenge_id", "in", `(SELECT id FROM challenges WHERE user_id = '${user.id}')`);

  if (joinErr) throw new Error(`Error marcando leído: ${joinErr.message}`);
  return { ok: true };
}

export async function markAllEventsReadAction(): Promise<{ ok: true }> {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión no válida. Inicia sesión nuevamente.");

  const { data: ownIds, error: listErr } = await sb
    .from("challenges")
    .select("id")
    .eq("user_id", user.id);
  if (listErr) throw new Error(`Error listando desafíos: ${listErr.message}`);
  if (!ownIds?.length) return { ok: true };

  const ids = ownIds.map((c: { id: string }) => c.id);
  const { error } = await sb
    .from("rule_events")
    .update({ is_read: true, read_at: new Date().toISOString() } as any)
    .in("challenge_id", ids)
    .is("is_read", false);

  if (error) throw new Error(`Error marcando leídos: ${error.message}`);
  return { ok: true };
}

