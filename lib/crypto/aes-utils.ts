import * as crypto from "node:crypto";

const AES_ALGO = "aes-256-gcm";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const RAW_AES = process.env.WORKER_AES_MASTER_KEY ?? null;
const DEV_FALLBACK = "dev-fundguard-aes-master-key-32bytes!!";
const AES_MASTER_B64 = (() => {
  if (RAW_AES && String(RAW_AES).trim()) return String(RAW_AES).trim();
  if (IS_PRODUCTION) return null;
  return DEV_FALLBACK;
})();

export function getAesKey(): Buffer {
  if (!AES_MASTER_B64) {
    throw new Error(
      "[aes] WORKER_AES_MASTER_KEY no configurada en variables de entorno. Obligatoria en producción.",
    );
  }
  let raw: Buffer;
  try {
    if (AES_MASTER_B64.length === 44 && /^[A-Za-z0-9+/=]{44}$/.test(AES_MASTER_B64)) {
      raw = Buffer.from(AES_MASTER_B64, "base64");
      if (raw.length !== 32) throw new Error("base64 decoded no dio 32 bytes");
    } else {
      raw = Buffer.from(String(AES_MASTER_B64).padEnd(32, "0").slice(0, 32), "utf8");
    }
  } catch (err: any) {
    throw new Error(`[aes] Formato de WORKER_AES_MASTER_KEY inválido: ${err?.message || String(err)}`);
  }
  if (raw.length !== 32) {
    throw new Error("[aes] Clave AES debe ser exactamente 32 bytes (256 bits).");
  }
  return raw;
}

export function aesEncrypt(plain: string): string {
  const key = getAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(AES_ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function aesDecrypt(b64: string): string {
  const key = getAesKey();
  const buf = Buffer.from(b64, "base64");
  if (buf.length < 12 + 16 + 1) throw new Error("Payload AES corrupto (longitud insuficiente).");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 12 + 16);
  const enc = buf.subarray(12 + 16);
  const decipher = crypto.createDecipheriv(AES_ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
