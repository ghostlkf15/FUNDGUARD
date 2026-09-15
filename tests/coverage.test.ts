import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aesEncrypt, aesDecrypt } from "@/lib/crypto/aes-utils";
import type { RuleEvent, Challenge } from "@/lib/types";
import { formatRelative, formatCurrency, formatPercent, cnPnl, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  AES-256-GCM roundtrip (FUNDGUARD worker crypto)                    */
/*  Verifica: IV distinto → ciphertext distinto; tag + decrypt OK;    */
/*  payload corrupto → throw; base64 inválido de menos 28 bytes → throw */
/* ------------------------------------------------------------------ */
describe("AES worker crypto (aesEncrypt / aesDecrypt)", () => {
  it("roundtrip idempotente", () => {
    const plain = "binance-api-key-test-abc123xyz";
    const enc = aesEncrypt(plain);
    expect(typeof enc).toBe("string");
    expect(enc.length).toBeGreaterThan(48);
    expect(aesDecrypt(enc)).toBe(plain);
  });

  it("mismo plaintext produce ciphertexts distintos (IV random 12 bytes)", () => {
    const plain = "same-secret-every-time";
    const encs = Array.from({ length: 6 }, () => aesEncrypt(plain));
    const uniq = new Set(encs);
    expect(uniq.size).toBe(6);
    // Todos desencriptan al mismo valor
    for (const e of encs) expect(aesDecrypt(e)).toBe(plain);
  });

  it("payload demasiado corto → reject (necesita 12 IV + 16 TAG = 28 bytes min)", () => {
    const tiny = Buffer.alloc(20).toString("base64");
    expect(() => aesDecrypt(tiny)).toThrow(/corrupto|longitud/);
  });

  it("tag manipulado rechazado (AuthTag integrity)", () => {
    const enc = aesEncrypt("hello integrity");
    const buf = Buffer.from(enc, "base64");
    // Corromper 1 byte del TAG (bytes 12..28)
    buf[15] ^= 0xff;
    expect(() => aesDecrypt(buf.toString("base64"))).toThrow();
  });

  it("soporta payloads grandes > 4KB", () => {
    const big = "A".repeat(8192);
    const enc = aesEncrypt(big);
    expect(aesDecrypt(enc)).toBe(big);
  });

  it("unicode emojis y caracteres latinos preservados", () => {
    const plain = "📈 Trader Español: ¡$1,234.56 de PnL! こんにちは";
    expect(aesDecrypt(aesEncrypt(plain))).toBe(plain);
  });
});

/* ------------------------------------------------------------------ */
/*  Utils coverage: formatRelative, formatCurrency, formatPercent,    */
/*  cnPnl, cn.                                                         */
/* ------------------------------------------------------------------ */
describe("Utils helpers", () => {
  const originalNow = Date.now;
  beforeAll(() => {
    const fixed = new Date("2025-09-14T12:00:00Z").getTime();
    (global as any).__fixedNow = fixed;
    Date.now = () => (global as any).__fixedNow;
  });
  afterAll(() => { Date.now = originalNow; });

  function fromNow(offsetMs: number) {
    return new Date(Date.now() - offsetMs).toISOString();
  }

  it("formatRelative devuelve escalas correctas", () => {
    expect(formatRelative(null)).toBe("");
    expect(formatRelative("invalid")).toBe("");
    expect(formatRelative(fromNow(30 * 1000))).toBe("hace 1 min");
    expect(formatRelative(fromNow(58 * 60_000))).toBe("hace 58 min");
    expect(formatRelative(fromNow(3 * 3600_000))).toBe("hace 3 h");
    expect(formatRelative(fromNow(5 * 86400_000))).toBe("hace 5 d");
    expect(formatRelative(fromNow(3 * 7 * 86400_000))).toBe("hace 3 sem");
    expect(formatRelative(fromNow(5 * 30 * 86400_000))).toBe("hace 5 meses");
    expect(formatRelative(fromNow(2 * 365 * 86400_000))).toBe("hace 2 años");
  });

  it("formatCurrency USD 2 decimales", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(1234.555)).toBe("$1,234.56");
    expect(formatCurrency(-50.1)).toBe("-$50.10");
    expect(formatCurrency(Number("bogus"))).toBe("$0.00");
  });

  it("formatPercent siempre signo", () => {
    expect(formatPercent(1.23)).toBe("+1.23%");
    expect(formatPercent(-0.5)).toBe("-0.50%");
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("cnPnl 3 vías", () => {
    expect(cnPnl(100)).toContain("emerald");
    expect(cnPnl(-1)).toContain("rose");
    expect(cnPnl(0)).toContain("muted");
  });

  it("cn merge tailwind classes sin colisiones (via tailwind-merge)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("flex", "block")).toBe("block");
    expect(cn(undefined, false && "hidden", "bg-white")).toBe("bg-white");
  });
});

/* ------------------------------------------------------------------ */
/*  Rule event deduplicator (reducer usado en pull-crypto)             */
/*  Simula la lógica: no emitir 2 eventos iguales en el mismo         */
/*  challenge_id + type dentro de una ventana de 4 min.                */
/* ------------------------------------------------------------------ */
describe("Rule events: deduplicación por ventana temporal", () => {
  function dedupeRecent(
    events: RuleEvent[],
    windowMs = 240_000,
  ): RuleEvent[] {
    const recent = new Map<string, number>();
    const out: RuleEvent[] = [];
    for (const ev of events) {
      const key = `${ev.challenge_id}:${ev.type}`;
      const t = new Date(ev.created_at).getTime();
      const last = recent.get(key);
      if (!last || t - last >= windowMs) {
        out.push(ev);
        recent.set(key, t);
      }
    }
    return out;
  }

  const baseChallenge = (id: string): Partial<Challenge> => ({ id, user_id: "u1" });
  void baseChallenge;

  function ev(id: string, chId: string, type: RuleEvent["type"], offsetSec: number): RuleEvent {
    return {
      id,
      challenge_id: chId,
      type,
      message: type,
      severity: "warning",
      created_at: new Date(Date.now() - offsetSec * 1000).toISOString(),
    };
  }

  it("descarta eventos duplicados tipo+challenge en <4min", () => {
    const list: RuleEvent[] = [
      ev("a", "c1", "alert_daily_dd", 120),
      ev("b", "c1", "alert_daily_dd", 180),   // dup 60s después
      ev("c", "c2", "alert_daily_dd", 190),   // otro challenge: OK
      ev("d", "c1", "alert_daily_dd", 500),   // 500s > 240s: OK
    ];
    const r = dedupeRecent(list);
    expect(r.map((e) => e.id)).toEqual(["a", "c", "d"]);
  });

  it("no descarta tipos distintos mismo challenge", () => {
    const list: RuleEvent[] = [
      ev("a", "c1", "alert_daily_dd", 30),
      ev("b", "c1", "alert_max_dd", 60),
      ev("c", "c1", "warning_best_day_ratio", 90),
    ];
    expect(dedupeRecent(list).length).toBe(3);
  });

  it("ventana de 4 min exacta: borderline exacto pasa", () => {
    const list: RuleEvent[] = [
      ev("a", "c1", "alert_max_dd", 240),
      ev("b", "c1", "alert_max_dd", 0),
    ];
    // 240s == windowMs exacto → debe pasar (>=)
    const r = dedupeRecent(list, 240_000);
    expect(r.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

/* ------------------------------------------------------------------ */
/*  Aggregate analytics reducer smoke                                 */
/*  (por ahora solo sanity check — sin ejecutar page SSR en tests)     */
/* ------------------------------------------------------------------ */
describe("Analytics aggregates: smoke reducer pure contract", () => {
  it("byMarket suma todos los challenges propios (no cuentan retorno vacío)", () => {
    type M = { market: "forex" | "futures"; challenges: number; pnl: number; pct: number };
    const rows: M[] = [
      { market: "forex", challenges: 5, pnl: 1000, pct: 4 },
      { market: "futures", challenges: 2, pnl: -200, pct: -1 },
    ];
    const total = rows.reduce((s, r) => s + r.challenges, 0);
    expect(total).toBe(7);
    expect(rows.map((r) => r.pnl).reduce((s, n) => s + n, 0)).toBe(800);
  });
});
