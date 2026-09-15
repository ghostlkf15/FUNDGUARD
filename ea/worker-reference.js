// =========================================================================
// FUNDGUARD · EA Worker · Node Reference Implementation
// -------------------------------------------------------------------------
// Env vars necesarias (poner en .env del EA worker o en variables sistema):
//   FUNDGUARD_API_BASE       = https://tu-dominio.com  (o http://localhost:3000 en dev)
//   FUNDGUARD_WORKER_SECRET  = WORKER_SECRET del .env.local de FUNDGUARD
//   FUNDGUARD_REPORT_KEY     = Clave única del desafío (generada en Dashboard
//                              → Conectar cuenta → Link EA MT5 → "Copiar Key")
//   FUNDGUARD_CHALLENGE_ID   = (opcional) ID público del challenge
//   REPORT_INTERVAL_MS       = 3000 (por defecto cada 3s, mismo que el servidor)
//
// Ejecutar:
//   node ea/worker-reference.js
//
// Modo demo (no necesita Supabase):
//   set FUNDGUARD_REPORT_KEY=fk_demo_12345678 && node ea/worker-reference.js
// =========================================================================

require("dotenv").config({ path: ".env.local" });

const http = require("http");
const https = require("https");
const { URL } = require("url");

const API_BASE = process.env.FUNDGUARD_API_BASE || "http://localhost:3000";
const WORKER_SECRET =
  process.env.FUNDGUARD_WORKER_SECRET ||
  process.env.WORKER_SECRET ||
  "fg_wrk_3f2a1f5e8d6e4b9c7a0d3c5e8f1b6a4d9c2e7f0b5a8d4c1e3f6a9b2d5c8e7f1";
const REPORT_KEY = process.env.FUNDGUARD_REPORT_KEY || "fk_demo_12345678";
const CHALLENGE_ID = process.env.FUNDGUARD_CHALLENGE_ID;
const INTERVAL = Number(process.env.REPORT_INTERVAL_MS || 3000);

let simBalance = Number(process.env.SIM_START_BALANCE || 100000);
let simEquity = simBalance;
let simPeak = simBalance;
const simTicket = { counter: 0 };

function simulateTick() {
  const vol = 0.02 * (Math.random() + 0.01);
  const noisePct = (Math.random() - 0.5) * 0.4; // +/- 0.2% por tick
  const drift = 0.00002; // pequeño drift al alza
  simEquity = Math.max(1, simEquity * (1 + (noisePct / 100) + drift));
  simPeak = Math.max(simPeak, simEquity);

  if (Math.random() < 0.015) {
    simTicket.counter++;
    const pnl = (simEquity - simBalance) * 0.05;
    simBalance = simBalance + pnl;
    simEquity = simBalance;
    const now = new Date();
    const openMinus5m = new Date(now.getTime() - Math.floor(30_000 + Math.random() * 240_000));
    return {
      ticket: String(simTicket.counter),
      symbol: Math.random() < 0.5 ? "EURUSD" : "XAUUSD",
      side: Math.random() < 0.5 ? "buy" : "sell",
      volume: +(0.01 + Math.random() * 0.99).toFixed(2),
      open_price: +(1.08 + Math.random() * 0.001).toFixed(5),
      close_price: +(1.08 + Math.random() * 0.001).toFixed(5),
      open_time: openMinus5m.toISOString(),
      close_time: now.toISOString(),
      pnl: +pnl.toFixed(2),
      swap: +(Math.random() * -0.25).toFixed(2),
      commission: +(Math.random() * -0.10).toFixed(2),
    };
  }
  return null;
}

function buildPayload() {
  const closed = [];
  for (let i = 0; i < 3; i++) {
    const t = simulateTick();
    if (t) closed.push(t);
  }
  const openPositions = [];
  if (Math.random() < 0.4) {
    openPositions.push({
      ticket: "OPN-" + Date.now(),
      symbol: "GBPUSD",
      side: "buy",
      volume: 0.3,
      open_price: 1.26543,
      open_time: new Date(Date.now() - 60_000).toISOString(),
      swap: 0,
      commission: 0,
    });
  }
  return {
    report_key: REPORT_KEY,
    challenge_id: CHALLENGE_ID,
    balance: +simBalance.toFixed(2),
    equity: +simEquity.toFixed(2),
    currency: "USD",
    timestamp: new Date().toISOString(),
    broker_name: process.env.BROKER_NAME || "MetaQuotes-Demo",
    server_name: process.env.BROKER_SERVER || "MetaTrader 5 Server",
    server_timezone: "Etc/UTC",
    open_positions: openPositions,
    closed_trades: closed,
  };
}

function httpRequest(urlStr, options, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body || ""),
        ...(options.headers || {}),
      },
      timeout: 10_000,
    };
    const req = lib.request(opts, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(new Error("timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

let consecutiveErrors = 0;
let reports = 0;
let lastStatus = null;

async function tick() {
  const payload = buildPayload();
  try {
    const res = await httpRequest(
      `${API_BASE}/api/report`,
      {
        method: "POST",
        headers: { "X-Worker-Secret": WORKER_SECRET },
      },
      JSON.stringify(payload)
    );
    if (res.status !== 200 || !res.body?.ok) {
      consecutiveErrors++;
      console.error(`[${new Date().toISOString()}] FAIL ${res.status} →`, res.body || res.raw);
    } else {
      consecutiveErrors = 0;
      reports++;
      const c = res.body.challenge || {};
      if (lastStatus !== c.status) {
        console.log(
          `\n[${new Date().toISOString()}] ✅ STATUS CHANGE: ${lastStatus ?? "init"} → ${c.status}`
          + (c.fail_reason ? ` | Motivo: ${c.fail_reason}` : "")
          + (c.approved ? " | 🎉 APROBADO" : "")
        );
        lastStatus = c.status;
      }
      if (reports % 20 === 0) {
        const warnings = (c.warnings || []).join(", ") || "-";
        console.log(
          `[${new Date().toISOString()}] report #${reports} · `
          + `bal=${payload.balance} eq=${payload.equity} · `
          + `DDd=${c.daily_dd_pct}% DDm=${c.max_dd_pct}% prog=${c.progress_pct}% `
          + `· phase=${c.phase} · warnings=[${warnings}] · next=${res.body.next_report_ms}ms`
        );
      }
      if (c.status === "failed" || c.status === "approved") {
        console.log("\n🏁 Fin del desafío — worker se detiene.");
        process.exit(c.status === "approved" ? 0 : 1);
      }
    }
  } catch (err) {
    consecutiveErrors++;
    console.error(`[${new Date().toISOString()}] ⚠️ Network error:`, err.message);
  }

  if (consecutiveErrors > 100) {
    console.error("❌ Demasiados errores consecutivos — abortando.");
    process.exit(2);
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   FUNDGUARD EA WORKER                       ║
╠══════════════════════════════════════════════════════════════╣
║  API:         ${API_BASE.padEnd(42)}║
║  Report Key:  ${(REPORT_KEY.slice(0, 12) + "...").padEnd(42)}║
║  Challenge:   ${(CHALLENGE_ID || "<auto-resolve>").padEnd(42)}║
║  Interval:    ${(INTERVAL + "ms").padEnd(42)}║
║  Modo:        ${(REPORT_KEY.startsWith("fk_demo_") ? "DEMO (sin Supabase)" : "PRODUCCIÓN").padEnd(42)}║
╚══════════════════════════════════════════════════════════════╝
Ctrl+C para detener.
`);

setInterval(tick, INTERVAL);
tick();
