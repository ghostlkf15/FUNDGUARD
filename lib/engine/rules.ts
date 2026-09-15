import type {
  Challenge,
  FirmPreset,
  FirmPresetPhase,
  RuleEngineResult,
  RuleEventType,
  Trade,
} from "@/lib/types";

export interface RuleEngineInput {
  challenge: Challenge;
  preset: FirmPreset;
  closedTradesToday: Trade[];
  currentEquity: number;
  currentBalance: number;
  dailyStartBalance: number;
  peakEquityAllTime: number;
  dailyPnlByUtcDate?: Record<string, number>;
  allClosedTrades?: Pick<Trade, "open_time" | "close_time" | "pnl" | "volume">[];
}

export function getCurrentPhase(preset: FirmPreset, phaseIndex: number): FirmPresetPhase {
  const idx = Math.max(0, Math.min(phaseIndex, preset.phases.length - 1));
  return preset.phases[idx];
}

export function calcDailyDDPct(
  dailyStartBalance: number,
  currentEquity: number
): number {
  if (dailyStartBalance <= 0) return 0;
  const change = currentEquity - dailyStartBalance;
  if (change >= 0) return 0;
  return Math.abs((change / dailyStartBalance) * 100);
}

export function calcMaxDDPct(
  peakEquity: number,
  currentEquity: number,
  initialBalance: number,
  drawdownType: "static" | "trailing"
): number {
  const reference =
    drawdownType === "trailing"
      ? Math.max(peakEquity, initialBalance)
      : initialBalance;

  if (reference <= 0 || currentEquity >= reference) return 0;
  return ((reference - currentEquity) / reference) * 100;
}

export function calcProfitTargetPct(
  initialBalance: number,
  currentBalance: number
): number {
  if (initialBalance <= 0) return 0;
  return ((currentBalance - initialBalance) / initialBalance) * 100;
}

export function calcTradingDaysMet(
  tradingDaysCount: number,
  minRequired: number
): boolean {
  return tradingDaysCount >= minRequired;
}

/**
 * Best Day Consistency Rule (FTMO 1-Step PDF p.4):
 * ratio = best_day_gain / sum_all_positive_day_gains
 * if ratio > 0.5 → WARNING (never fails the challenge, just informational flag)
 * NOOP if fewer than 2 positive trading days (division-by-zero / noise prevention)
 */
export function calcBestDayRatio(dailyPnlByUtcDate?: Record<string, number>): { ratio: number | undefined; bestDayPnl: number; sumPositivePnl: number } {
  const entries = Object.entries(dailyPnlByUtcDate || {});
  const positive = entries.map(([, v]) => Number(v)).filter((v) => v > 0);
  if (positive.length < 2) return { ratio: undefined, bestDayPnl: 0, sumPositivePnl: 0 };
  const best = Math.max(...positive);
  const sum = positive.reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ratio: undefined, bestDayPnl: best, sumPositivePnl: sum };
  return { ratio: best / sum, bestDayPnl: best, sumPositivePnl: sum };
}

/**
 * Scalping classification (Bullfy PDF P.6 sección 5.4):
 * trades closed within < 60 seconds (open_time to close_time diff)
 * if scalping_trades / total_trades >= 0.10 → warning_scalping
 * NO es una violación; solo reduce los primeros 4 retiros al 3% del equity.
 */
export function calcScalpingRatio(trades?: Pick<Trade, "open_time" | "close_time">[]): { scalpingRatio: number | undefined; scalpingCount: number; totalCount: number } {
  const arr = trades || [];
  if (arr.length === 0) return { scalpingRatio: undefined, scalpingCount: 0, totalCount: 0 };
  let under60s = 0;
  let total = 0;
  for (const t of arr) {
    if (!t.open_time || !t.close_time) continue;
    total++;
    const deltaMs = new Date(t.close_time).getTime() - new Date(t.open_time).getTime();
    if (deltaMs < 60_000) under60s++;
  }
  if (total === 0) return { scalpingRatio: undefined, scalpingCount: 0, totalCount: 0 };
  return { scalpingRatio: under60s / total, scalpingCount: under60s, totalCount: total };
}

export function runRuleEngine(input: RuleEngineInput): RuleEngineResult {
  const {
    challenge,
    preset,
    currentEquity,
    currentBalance,
    dailyStartBalance,
    peakEquityAllTime,
    dailyPnlByUtcDate,
    allClosedTrades,
  } = input;

  const phase = getCurrentPhase(preset, challenge.current_phase);
  const events: RuleEventType[] = [];

  const dailyDDPct = calcDailyDDPct(dailyStartBalance, currentEquity);
  const maxDDPct = calcMaxDDPct(
    peakEquityAllTime,
    currentEquity,
    challenge.initial_balance,
    phase.drawdown_type
  );
  const profitPct = calcProfitTargetPct(
    challenge.initial_balance,
    currentBalance
  );

  const targetPct = phase.profit_target_pct;
  const phaseProgress =
    targetPct > 0 ? Math.max(0, Math.min(100, (profitPct / targetPct) * 100)) : 0;

  const tradingDaysMet = calcTradingDaysMet(
    challenge.trading_days_count,
    phase.min_trading_days
  );

  const specialRules: string[] = Array.isArray((phase as any).special_rules) ? (phase as any).special_rules : [];
  const isStrictestFloor = specialRules.includes("strictest_floor_daily_vs_total");
  const initialBal = challenge.initial_balance;
  const strictestFloorCombinedPct = Math.max(dailyDDPct, maxDDPct);

  let approved = false;
  let failed = false;
  let failReason: string | undefined;

  if (isStrictestFloor) {
    const dailyFloorEquity = dailyStartBalance * (1 - phase.max_daily_drawdown_pct / 100);
    const totalFloorRef =
      phase.drawdown_type === "trailing"
        ? Math.max(peakEquityAllTime, initialBal)
        : initialBal;
    const totalFloorEquity = totalFloorRef * (1 - phase.max_total_drawdown_pct / 100);
    const effectiveFloorEquity = Math.min(dailyFloorEquity, totalFloorEquity);
    if (currentEquity < effectiveFloorEquity) {
      failed = true;
      failReason = `Piso combinado Bullfy violado (equity ${currentEquity.toFixed(2)} < piso ${effectiveFloorEquity.toFixed(2)} · DD diario ${dailyDDPct.toFixed(2)}% / DD total ${maxDDPct.toFixed(2)}%)`;
      events.push("failed_max_dd");
      events.push("failed_daily_dd");
    }
  } else {
    if (maxDDPct >= phase.max_total_drawdown_pct) {
      failed = true;
      failReason = `Drawdown máximo (${maxDDPct.toFixed(2)}%) excede el límite (${phase.max_total_drawdown_pct}%)`;
      events.push("failed_max_dd");
    }

    if (!failed && dailyDDPct >= phase.max_daily_drawdown_pct) {
      failed = true;
      failReason = `Drawdown diario (${dailyDDPct.toFixed(2)}%) excede el límite (${phase.max_daily_drawdown_pct}%)`;
      events.push("failed_daily_dd");
    }
  }

  const ALERT_THRESHOLD = 0.8;

  if (
    !failed &&
    dailyDDPct >= phase.max_daily_drawdown_pct * ALERT_THRESHOLD &&
    dailyDDPct < phase.max_daily_drawdown_pct
  ) {
    events.push("alert_daily_dd");
  }

  if (
    !failed &&
    maxDDPct >= phase.max_total_drawdown_pct * ALERT_THRESHOLD &&
    maxDDPct < phase.max_total_drawdown_pct
  ) {
    events.push("alert_max_dd");
  }

  if (!failed && profitPct >= targetPct && tradingDaysMet) {
    approved = true;
    events.push("approved");
  }

  if (approved && challenge.current_phase < preset.phases.length - 1) {
    events.push("phase_change");
  }

  // Consistency rule: warning only (PDF p.4: NO fail)
  let bestDayRatio: number | undefined;
  if (preset.allow_consistency_rule) {
    const c = calcBestDayRatio(dailyPnlByUtcDate);
    bestDayRatio = c.ratio;
    if (typeof c.ratio === "number" && c.ratio > 0.5) {
      events.push("warning_best_day_ratio");
    }
  }

  // Scalping rule (Bullfy PDF P.6 §5.4): warning only (NO fail)
  let scalpingRatio: number | undefined;
  const isScalpingRule = specialRules.includes("scalping_10pct_warning");
  if (isScalpingRule || preset.firm_id === "firm-bullfy") {
    const s = calcScalpingRatio(allClosedTrades);
    scalpingRatio = s.scalpingRatio;
    if (typeof s.scalpingRatio === "number" && s.scalpingRatio >= 0.10) {
      events.push("warning_scalping");
    }
  }

  return {
    dailyDDPct,
    maxDDPct,
    profitTargetPct: profitPct,
    currentPhaseProgessPct: phaseProgress,
    tradingDaysMet,
    approved,
    failed,
    failReason,
    bestDayRatio,
    scalpingRatio,
    events,
  };
}

export function updatePeakEquity(
  previousPeak: number,
  currentEquity: number
): number {
  return Math.max(previousPeak, currentEquity);
}

export function isNewTradingDay(
  lastTradeDateIso: string | undefined | null,
  nowIso: string,
  resetHourUtc: number
): boolean {
  if (!lastTradeDateIso) return true;

  const a = new Date(lastTradeDateIso);
  const b = new Date(nowIso);

  a.setUTCHours(resetHourUtc, 0, 0, 0);
  if (new Date(lastTradeDateIso) < a) {
    a.setUTCDate(a.getUTCDate() - 1);
  }

  b.setUTCHours(resetHourUtc, 0, 0, 0);
  if (new Date(nowIso) < b) {
    b.setUTCDate(b.getUTCDate() - 1);
  }

  return a.getTime() !== b.getTime();
}

export function countTradingDays(
  trades: Pick<Trade, "close_time">[]
): number {
  const days = new Set<string>();
  for (const t of trades) {
    if (t.close_time) {
      const d = new Date(t.close_time);
      days.add(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
      );
    }
  }
  return days.size;
}
