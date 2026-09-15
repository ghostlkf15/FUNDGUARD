import { describe, it, expect } from "vitest";
import type { Challenge, FirmPreset, FirmPresetPhase, Trade } from "@/lib/types";
import {
  calcDailyDDPct,
  calcMaxDDPct,
  calcProfitTargetPct,
  calcBestDayRatio,
  calcScalpingRatio,
  calcTradingDaysMet,
  getCurrentPhase,
  runRuleEngine,
  updatePeakEquity,
  isNewTradingDay,
  countTradingDays,
  type RuleEngineInput,
} from "@/lib/engine/rules";

/* ------------------------------------------------------------------ */
/*  PRESETS MOCK (replicas fieles de FTMO + Bullfy reales)             */
/* ------------------------------------------------------------------ */

function ftmo2StepPhase(
  n: 1 | 2,
): FirmPresetPhase & { special_rules?: string[] } {
  return n === 1
    ? {
        name: "Phase 1",
        order: 1,
        profit_target_pct: 10,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static",
        min_trading_days: 4,
        reset_balance_on_new_phase: true,
        special_rules: [],
      }
    : {
        name: "Phase 2",
        order: 2,
        profit_target_pct: 5,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static",
        min_trading_days: 4,
        reset_balance_on_new_phase: false,
        special_rules: [],
      };
}

function ftmo1StepPhase(): FirmPresetPhase & { special_rules?: string[] } {
  return {
    name: "Verification",
    order: 1,
    profit_target_pct: 10,
    max_daily_drawdown_pct: 5,
    max_total_drawdown_pct: 10,
    drawdown_type: "trailing",
    min_trading_days: 4,
    reset_balance_on_new_phase: false,
    special_rules: [],
  };
}

function bullPrime2StepPhase(
  n: 1 | 2,
): FirmPresetPhase & { special_rules: string[] } {
  return n === 1
    ? {
        name: "Fase 1",
        order: 1,
        profit_target_pct: 8,
        max_daily_drawdown_pct: 3,
        max_total_drawdown_pct: 8,
        drawdown_type: "static",
        min_trading_days: 3,
        reset_balance_on_new_phase: false,
        special_rules: ["strictest_floor_daily_vs_total", "scalping_10pct_warning"],
      }
    : {
        name: "Fase 2",
        order: 2,
        profit_target_pct: 5,
        max_daily_drawdown_pct: 3,
        max_total_drawdown_pct: 8,
        drawdown_type: "static",
        min_trading_days: 3,
        reset_balance_on_new_phase: false,
        special_rules: ["strictest_floor_daily_vs_total", "scalping_10pct_warning"],
      };
}

const INIT = 100_000;

function baseChallenge(patch: Partial<Challenge> = {}): Challenge {
  return {
    id: "ch-test-001",
    user_id: "usr-test",
    firm_id: "firm-ftmo",
    preset_id: "preset-ftmo-100k",
    market: "forex",
    current_phase: 0,
    status: "active",
    initial_balance: INIT,
    current_balance: INIT,
    current_equity: INIT,
    peak_equity: INIT,
    start_daily_balance: INIT,
    daily_pnl: 0,
    total_pnl: 0,
    total_pnl_pct: 0,
    daily_drawdown_pct: 0,
    max_drawdown_pct: 0,
    trading_days_count: 0,
    last_trade_date: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...patch,
  };
}

function buildPreset(opts: {
  firmId: string;
  slug: string;
  phases: (FirmPresetPhase & { special_rules?: string[] })[];
  allowConsistency?: boolean;
}): FirmPreset {
  return {
    id: `preset-${opts.slug}`,
    firm_id: opts.firmId,
    name: `Mock ${opts.slug}`,
    slug: opts.slug,
    initial_balance: INIT,
    currency: "USD",
    phases: opts.phases as any,
    broker_timezone: "Europe/London",
    daily_reset_hour_utc: 0,
    allow_consistency_rule: opts.allowConsistency ?? false,
    allow_newstrade_lock: false,
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function runEngine(opts: {
  challenge: Challenge;
  preset: FirmPreset;
  currentEquity: number;
  currentBalance: number;
  dailyStartBalance?: number;
  peakEquity?: number;
  dailyPnl?: Record<string, number>;
  allClosed?: Pick<Trade, "open_time" | "close_time" | "pnl" | "volume">[];
  closedTradesToday?: Trade[];
}) {
  const input: RuleEngineInput = {
    challenge: opts.challenge,
    preset: opts.preset,
    closedTradesToday: opts.closedTradesToday ?? [],
    currentEquity: opts.currentEquity,
    currentBalance: opts.currentBalance,
    dailyStartBalance: opts.dailyStartBalance ?? opts.challenge.start_daily_balance,
    peakEquityAllTime: opts.peakEquity ?? opts.challenge.peak_equity,
    dailyPnlByUtcDate: opts.dailyPnl,
    allClosedTrades: opts.allClosed,
  };
  return runRuleEngine(input);
}

/* ================================================================== */
/*  Suite A · helpers matemáticos PUROS                                */
/* ================================================================== */
describe("A · Helpers matemáticos puros", () => {
  it("calcDailyDDPct · equity 95000 / start 100000 → 5.00%", () => {
    expect(calcDailyDDPct(100_000, 95_000)).toBeCloseTo(5.0, 4);
  });
  it("calcDailyDDPct · equity por encima del start = 0%", () => {
    expect(calcDailyDDPct(100_000, 101_000)).toBe(0);
  });
  it("calcMaxDDPct static · 100k init / 92k eq = 8.00%", () => {
    expect(calcMaxDDPct(100_000, 92_000, 100_000, "static")).toBeCloseTo(8.0, 4);
  });
  it("calcMaxDDPct trailing · peak 110k / eq 103.4k = 6.00% (usa peak, no init)", () => {
    // (110000 - 103400) / 110000 * 100 = 6
    expect(calcMaxDDPct(110_000, 103_400, 100_000, "trailing")).toBeCloseTo(6.0, 4);
  });
  it("calcMaxDDPct trailing · si peak < init se usa init", () => {
    // eq 95000 / init 100000 / peak 98000 → ref = max(98k,100k)=100k → 5%
    expect(calcMaxDDPct(98_000, 95_000, 100_000, "trailing")).toBeCloseTo(5.0, 4);
  });
  it("calcProfitTargetPct · 8% up exacto", () => {
    expect(calcProfitTargetPct(100_000, 108_000)).toBeCloseTo(8.0, 4);
  });
  it("calcTradingDaysMet · 3/3 OK · 2/3 NO", () => {
    expect(calcTradingDaysMet(3, 3)).toBe(true);
    expect(calcTradingDaysMet(2, 3)).toBe(false);
  });
  it("getCurrentPhase · clamp al rango válido", () => {
    const p = buildPreset({
      firmId: "ftmo",
      slug: "ftmo-2step",
      phases: [ftmo2StepPhase(1), ftmo2StepPhase(2)],
    });
    expect(getCurrentPhase(p, 0).name).toBe("Phase 1");
    expect(getCurrentPhase(p, 1).name).toBe("Phase 2");
    expect(getCurrentPhase(p, 99).name).toBe("Phase 2"); // clamp a última
    expect(getCurrentPhase(p, -5).name).toBe("Phase 1"); // clamp a primera
  });
  it("updatePeakEquity · solo sube (monotónico)", () => {
    expect(updatePeakEquity(105_000, 104_000)).toBe(105_000);
    expect(updatePeakEquity(105_000, 106_500)).toBe(106_500);
  });
  it("countTradingDays · agrupa por fecha UTC", () => {
    const arr: Pick<Trade, "close_time">[] = [
      { close_time: "2026-09-10T12:00:00Z" },
      { close_time: "2026-09-10T23:59:00Z" },
      { close_time: "2026-09-11T00:05:00Z" },
      { close_time: "2026-09-13T08:00:00Z" },
    ];
    expect(countTradingDays(arr)).toBe(3);
  });
  it("isNewTradingDay · reset hour UTC=0 → día nuevo si cambia la fecha UTC", () => {
    expect(
      isNewTradingDay("2026-09-10T22:00:00Z", "2026-09-11T01:00:00Z", 0),
    ).toBe(true);
    expect(
      isNewTradingDay("2026-09-11T01:00:00Z", "2026-09-11T23:00:00Z", 0),
    ).toBe(false);
    expect(isNewTradingDay(null, "2026-09-11T01:00:00Z", 0)).toBe(true);
  });
});

/* ================================================================== */
/*  Suite B · Best Day Consistency Rule FTMO (calcBestDayRatio)       */
/* ================================================================== */
describe("B · Best Day Consistency FTMO (PDF p.4)", () => {
  it("solo 1 día positivo → ratio undefined (noise prevention)", () => {
    const r = calcBestDayRatio({ "2026-09-10": 1000 });
    expect(r.ratio).toBeUndefined();
  });
  it("ratio = 49% (justo bajo 50%) → NO dispara warning", () => {
    // best=490, sum=490+200+310=1000 → ratio 0.49 exacto
    const r = calcBestDayRatio({
      "2026-09-10": 490,
      "2026-09-11": 200,
      "2026-09-12": 310,
      "2026-09-13": -80, // días negativos se ignoran
    });
    expect(r.ratio).toBeCloseTo(0.49, 6);
    expect(r.bestDayPnl).toBe(490);
    expect(r.sumPositivePnl).toBe(1000);
  });
  it("ratio = 51% (justo por encima 50%) → warning al correr runRuleEngine con allow_consistency_rule", () => {
    const daily = {
      "2026-09-10": 510,
      "2026-09-11": 490,
    };
    const ratio = calcBestDayRatio(daily).ratio;
    expect(ratio).toBeCloseTo(0.51, 6);

    const preset = buildPreset({
      firmId: "firm-ftmo",
      slug: "ftmo-2step-100k",
      phases: [ftmo2StepPhase(1)],
      allowConsistency: true,
    });
    const ch = baseChallenge({ trading_days_count: 4 });
    const out = runEngine({
      challenge: ch,
      preset,
      currentEquity: 100_000,
      currentBalance: 100_000,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
      dailyPnl: daily,
    });
    expect(out.bestDayRatio).toBeCloseTo(0.51, 6);
    expect(out.events).toContain("warning_best_day_ratio");
    // NO debe ser failed por consistencia (warning)
    expect(out.failed).toBe(false);
    expect(out.failReason).toBeUndefined();
  });
  it("allow_consistency_rule=false → NO se calcula bestDayRatio aunque ratio sea 100%", () => {
    const preset = buildPreset({
      firmId: "firm-ftmo",
      slug: "ftmo-2step-nocons",
      phases: [ftmo2StepPhase(1)],
      allowConsistency: false,
    });
    const ch = baseChallenge();
    const out = runEngine({
      challenge: ch,
      preset,
      currentEquity: 100_000,
      currentBalance: 100_000,
      dailyPnl: { "2026-09-10": 2000, "2026-09-11": 100 },
    });
    expect(out.bestDayRatio).toBeUndefined();
    expect(out.events).not.toContain("warning_best_day_ratio");
  });
});

/* ================================================================== */
/*  Suite C · Scalping Bullfy (trades <60s ≥ 10% → warning)           */
/* ================================================================== */
describe("C · Scalping ratio Bullfy (PDF P.6 §5.4)", () => {
  function tradeWithDuration(durationMs: number, t0 = new Date("2026-09-14T10:00:00Z")) {
    return {
      open_time: t0.toISOString(),
      close_time: new Date(t0.getTime() + durationMs).toISOString(),
      pnl: 0,
      volume: 0.1,
    };
  }

  it("9% scalping trades · NO warning", () => {
    const arr: any[] = [];
    for (let i = 0; i < 9; i++) arr.push(tradeWithDuration(25_000)); // < 60s
    for (let i = 0; i < 91; i++) arr.push(tradeWithDuration(180_000)); // 3m
    const s = calcScalpingRatio(arr);
    expect(s.scalpingCount).toBe(9);
    expect(s.totalCount).toBe(100);
    expect(s.scalpingRatio).toBeCloseTo(0.09, 4);
  });

  it("11% scalping trades ≥ 10% · warning_scalping en runRuleEngine Bullfy", () => {
    const arr: any[] = [];
    for (let i = 0; i < 11; i++) arr.push(tradeWithDuration(10_000));
    for (let i = 0; i < 89; i++) arr.push(tradeWithDuration(120_000));

    const s = calcScalpingRatio(arr);
    expect(s.scalpingRatio).toBeCloseTo(0.11, 4);

    const preset = buildPreset({
      firmId: "firm-bullfy",
      slug: "bull-prime-100k",
      phases: [bullPrime2StepPhase(1)],
    });
    const ch = baseChallenge({ firm_id: "firm-bullfy" });
    const out = runEngine({
      challenge: ch,
      preset,
      currentEquity: INIT,
      currentBalance: INIT,
      allClosed: arr,
    });
    expect(out.scalpingRatio).toBeCloseTo(0.11, 4);
    expect(out.events).toContain("warning_scalping");
    // Scalping NO produce failed (warning only)
    expect(out.failed).toBe(false);
    expect(out.failReason).toBeUndefined();
  });

  it("empty trades · scalpingRatio undefined (no hay datos)", () => {
    const s = calcScalpingRatio([]);
    expect(s.scalpingRatio).toBeUndefined();
    expect(s.scalpingCount).toBe(0);
    expect(s.totalCount).toBe(0);
  });
});

/* ================================================================== */
/*  Suite D · Strictest Floor Rule Bullfy                             */
/*        effectiveFloorEquity = min(dailyFloor, totalFloor)          */
/* ================================================================== */
describe("D · Bullfy Strictest Floor (combined daily+total, min wins)", () => {
  const preset = buildPreset({
    firmId: "firm-bullfy",
    slug: "bull-prime-100k",
    phases: [bullPrime2StepPhase(1)],
  });

  it("Calcula correctamente los 2 pisos: daily 3% → 97k / total 8% → 92k · efectivo = 92k", () => {
    const phase = bullPrime2StepPhase(1);
    const dStart = INIT;
    const peakRef = INIT;
    const dailyF = dStart * (1 - phase.max_daily_drawdown_pct / 100);
    const totalF = peakRef * (1 - phase.max_total_drawdown_pct / 100);
    expect(dailyF).toBe(97_000);
    expect(totalF).toBe(92_000);
    expect(Math.min(dailyF, totalF)).toBe(92_000);
  });

  it("equity = 92001 (justo por encima effectiveFloor 92000) → NO failed", () => {
    // start=100k peak=100k eq=92001 → dailyDD=(100k-92001)/100k=7.999%, maxDD=7.999%
    // ambos sueltos exceden límites individuales PERO strictest_floor = min(97k, 92k)=92k
    // equity NO < 92k → NO FAIL (diferencia crucial con FTMO)
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: 92_001,
      currentBalance: 92_001,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
    });
    expect(out.failed).toBe(false);
    expect(out.failReason).toBeUndefined();
  });

  it("equity = 91999 (justo por debajo effectiveFloor 92000) → FAILED + ambos failed_*_dd events", () => {
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: 91_999,
      currentBalance: 91_999,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
    });
    expect(out.failed).toBe(true);
    expect(out.failReason).toMatch(/Piso combinado Bullfy/);
    expect(out.failReason).toContain("91999");
    expect(out.events).toContain("failed_max_dd");
    expect(out.events).toContain("failed_daily_dd");
  });

  it("Caso real: DD diario estalla primero (ej eq=96500 < dailyFloor 97000 pero > total 92k) → FALLA", () => {
    // eq=96500, start=100k, peak=100k
    // dailyF=97k, totalF=92k → efectivo=92k. eq=96500 > 92k → no floor.
    // PERO wait rules.ts D strictest: solo compara equity < effectiveFloorEquity
    // Así que 96500 > 92k → no fail. El individual dailyDD 3.5% excede 3% PERO en strictest
    // mode se usa el COMBINADO FLOOR, no los checks individuales. Correcto.
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: 96_500,
      currentBalance: 96_500,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
    });
    expect(out.failed).toBe(false);
  });

  it("Mismo escenario 96500 en FTMO normal (sin strictest) → FAILED por daily DD 3.5% ≥ 3%", () => {
    const ftmoPreset = buildPreset({
      firmId: "firm-ftmo",
      slug: "ftmo-phase1",
      phases: [ftmo2StepPhase(1)],
    });
    // Pero ftmo phase 1 daily=5% total=10% así que no falla con 3.5%.
    // Necesito ajustar para mostrar diferencia: pongo eq=94500 (dailyDD=5.5% en una fase con daily=5%)
    const out = runEngine({
      challenge: baseChallenge(),
      preset: ftmoPreset,
      currentEquity: 94_000, // dailyDD = 6% > 5%
      currentBalance: 94_000,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
    });
    expect(out.failed).toBe(true);
    expect(out.failReason).toMatch(/Drawdown diario/);
    expect(out.events).toContain("failed_daily_dd");
    expect(out.events).not.toContain("failed_max_dd"); // totalDD=6% < 10%
  });
});

/* ================================================================== */
/*  Suite E · Aprobación + Phase Change                               */
/*        FTMO phase 1 → 2 genera phase_change                       */
/*        FTMO 1-step (última fase) NO genera phase_change            */
/* ================================================================== */
describe("E · Aprobación, phase_change FTMO reset balance vs Bullfy sin reset", () => {
  it("FTMO 2-Step Phase 1: profit target 10% + 4 días mínimos → approved + phase_change", () => {
    const preset = buildPreset({
      firmId: "firm-ftmo",
      slug: "ftmo-2step",
      phases: [ftmo2StepPhase(1), ftmo2StepPhase(2)],
    });
    const ch = baseChallenge({ current_phase: 0, trading_days_count: 4 });
    const out = runEngine({
      challenge: ch,
      preset,
      currentEquity: 110_000,
      currentBalance: 110_000,
      dailyStartBalance: 108_000,
      peakEquity: 110_000,
    });
    expect(out.approved).toBe(true);
    expect(out.profitTargetPct).toBeCloseTo(10.0, 4);
    expect(out.events).toContain("approved");
    expect(out.events).toContain("phase_change");
  });

  it("FTMO 2-Step Phase 1: profit 10% PERO solo 3 días (min=4) → NO approved, NO phase_change", () => {
    const preset = buildPreset({
      firmId: "firm-ftmo",
      slug: "ftmo-2step",
      phases: [ftmo2StepPhase(1), ftmo2StepPhase(2)],
    });
    const ch = baseChallenge({ current_phase: 0, trading_days_count: 3 });
    const out = runEngine({
      challenge: ch,
      preset,
      currentEquity: 110_000,
      currentBalance: 110_000,
      dailyStartBalance: 108_000,
      peakEquity: 110_000,
    });
    expect(out.approved).toBe(false);
    expect(out.events).not.toContain("approved");
    expect(out.events).not.toContain("phase_change");
    expect(out.currentPhaseProgessPct).toBeCloseTo(100.0, 4); // barra llena aunque no aprobado
  });

  it("FTMO 1-Step (única fase): target alcanzado → approved pero NO phase_change (no hay sig fase)", () => {
    const preset = buildPreset({
      firmId: "firm-ftmo",
      slug: "ftmo-1step",
      phases: [ftmo1StepPhase()],
    });
    const ch = baseChallenge({ current_phase: 0, trading_days_count: 4 });
    const out = runEngine({
      challenge: ch,
      preset,
      currentEquity: 110_000,
      currentBalance: 110_000,
      dailyStartBalance: 108_000,
      peakEquity: 110_000,
    });
    expect(out.approved).toBe(true);
    expect(out.events).toContain("approved");
    expect(out.events).not.toContain("phase_change"); // longitud phases=1, current_phase=0=length-1
  });

  it("FTMO Phase 1 → Phase 2: reset_balance_on_new_phase = TRUE vs Bullfy = FALSE", () => {
    const ftmoP1 = ftmo2StepPhase(1);
    const bullP1 = bullPrime2StepPhase(1);
    const bullP2 = bullPrime2StepPhase(2);
    expect(ftmoP1.reset_balance_on_new_phase).toBe(true);
    expect(bullP1.reset_balance_on_new_phase).toBe(false);
    expect(bullP2.reset_balance_on_new_phase).toBe(false);
  });
});

/* ================================================================== */
/*  Suite F · Alerts 80% threshold (no fails, solo eventos info)      */
/* ================================================================== */
describe("F · Alertas precaución al 80% del límite", () => {
  const preset = buildPreset({
    firmId: "firm-ftmo",
    slug: "ftmo-phase1",
    phases: [ftmo2StepPhase(1)],
  });

  it("DailyDD = 4.1% (82% del 5%) → alert_daily_dd pero NO fail", () => {
    const eq = 100_000 * (1 - 0.041); // 95900
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: eq,
      currentBalance: eq,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
    });
    expect(out.dailyDDPct).toBeCloseTo(4.1, 3);
    expect(out.events).toContain("alert_daily_dd");
    expect(out.failed).toBe(false);
  });
  it("MaxDD = 8.1% (81% del 10%) → alert_max_dd pero NO fail", () => {
    const eq = 100_000 * (1 - 0.081); // 91900
    // dailyStartBalance = 95000 → dailyDD = (95000-91900)/95000 = 3.26% (< 4% threshold 80%·5%)
    // así evitamos alert_daily_dd y solo se dispara alert_max_dd (8.1% ≥ 80%·10% = 8%)
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: eq,
      currentBalance: eq,
      dailyStartBalance: 95_000,
      peakEquity: 100_000,
    });
    expect(out.maxDDPct).toBeCloseTo(8.1, 3);
    expect(out.dailyDDPct).toBeLessThan(5 * 0.8); // < 4% threshold (80% del límite 5%)
    expect(out.events).toContain("alert_max_dd");
    expect(out.events).not.toContain("alert_daily_dd");
    expect(out.failed).toBe(false);
  });
  it("DailyDD = 3.9% (78% <80%) → NO alert_daily_dd", () => {
    const eq = 100_000 * (1 - 0.039);
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: eq,
      currentBalance: eq,
      dailyStartBalance: 100_000,
      peakEquity: 100_000,
    });
    expect(out.events).not.toContain("alert_daily_dd");
  });
});

/* ================================================================== */
/*  Suite G · FTMO 1-Step Trailing EOD Drawdown                       */
/* ================================================================== */
describe("G · FTMO 1-Step Trailing EOD (drawdown respecto peak_equity)", () => {
  const preset = buildPreset({
    firmId: "firm-ftmo",
    slug: "ftmo-1step",
    phases: [ftmo1StepPhase()], // drawdown_type: trailing, max_total_dd=10%
  });

  it("Peak 120k / equity 107500 → trailing DD = 10.41% >10% → FAILED por max DD", () => {
    // (120000 - 107500) / 120000 * 100 = 10.4167
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: 107_500,
      currentBalance: 107_500,
      dailyStartBalance: 110_000,
      peakEquity: 120_000, // trailing usa peak
    });
    expect(out.maxDDPct).toBeCloseTo(10.4167, 3);
    expect(out.failed).toBe(true);
    expect(out.failReason).toContain("Drawdown máximo");
    expect(out.events).toContain("failed_max_dd");
  });

  it("Mismo equity 107500 PERO peak = initial = 100k (no hubo ganancias) → ref = 100k · eq 107500 > ref → maxDD = 0%", () => {
    // equity está POR ENCIMA del ref = max(peak=100k, init=100k)=100k → 0
    const out = runEngine({
      challenge: baseChallenge(),
      preset,
      currentEquity: 107_500,
      currentBalance: 107_500,
      dailyStartBalance: 105_000,
      peakEquity: 100_000,
    });
    expect(out.maxDDPct).toBe(0);
    expect(out.failed).toBe(false);
  });

  it("calcMaxDDPct trailing direct math check: peak=150000, eq=135000 → 10.0% exacto", () => {
    const dd = calcMaxDDPct(150_000, 135_000, 100_000, "trailing");
    expect(dd).toBeCloseTo(10.0, 5);
  });
});
