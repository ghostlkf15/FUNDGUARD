export type MarketType = "forex" | "futures" | "crypto" | "synthetic_indices";

export type ChallengeStatus =
  | "draft"
  | "linking"
  | "active"
  | "approved"
  | "failed"
  | "disconnected"
  | "phase_changed";

export type DrawdownType = "static" | "trailing";

export type RuleEventType =
  | "approved"
  | "failed_max_dd"
  | "failed_daily_dd"
  | "failed_special"
  | "alert_daily_dd"
  | "alert_max_dd"
  | "warning_best_day_ratio"
  | "warning_scalping"
  | "phase_change"
  | "disconnected"
  | "reconnected"
  | "min_days_met";

export type NotificationChannel = "email" | "in_app" | "push";

export type AccountLinkMethod = "ea_mt4" | "ea_mt5" | "cbot_ctrader" | "crypto_api";

export interface Firm {
  id: string;
  name: string;
  slug: string;
  market: MarketType;
  logo_url?: string;
  website_url?: string;
  description?: string;
  is_active: boolean;
  is_featured?: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface FirmPresetPhase {
  name: string;
  order: number;
  profit_target_pct: number;
  max_daily_drawdown_pct: number;
  max_total_drawdown_pct: number;
  drawdown_type: DrawdownType;
  min_trading_days: number;
  time_limit_days?: number;
  reset_balance_on_new_phase?: boolean;
  special_rules?: string[];
}

export interface FirmPreset {
  id: string;
  firm_id: string;
  name: string;
  slug: string;
  initial_balance: number;
  currency: string;
  phases: FirmPresetPhase[];
  broker_timezone: string;
  daily_reset_hour_utc: number;
  allow_consistency_rule?: boolean;
  allow_newstrade_lock?: boolean;
  allow_news_trade_lock?: boolean;
  order_index?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  language?: string;
  timezone?: string;
  alert_dd_pct?: number;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  firm_id: string;
  preset_id: string;
  market: MarketType;
  current_phase: number;
  status: ChallengeStatus;
  initial_balance: number;
  current_balance: number;
  current_equity: number;
  peak_equity: number;
  start_daily_balance: number;
  daily_pnl: number;
  total_pnl: number;
  total_pnl_pct: number;
  daily_drawdown_pct: number;
  max_drawdown_pct: number;
  trading_days_count: number;
  last_trade_date?: string;
  ea_last_report_at?: string;
  broker_server_timezone?: string;
  link_method?: AccountLinkMethod;
  report_key_hash?: string;
  crypto_api_key_enc?: string;
  crypto_api_secret_enc?: string;
  crypto_exchange_id?: string;
  crypto_passphrase_enc?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EquitySnapshot {
  id: string;
  challenge_id: string;
  balance: number;
  equity: number;
  daily_pnl: number;
  total_pnl: number;
  daily_dd_pct: number;
  max_dd_pct: number;
  open_positions_count: number;
  timestamp: string;
}

export interface Trade {
  id: string;
  challenge_id: string;
  external_id: string;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  open_price: number;
  close_price?: number;
  open_time: string;
  close_time?: string;
  pnl?: number;
  swap?: number;
  commission?: number;
  is_open: boolean;
  created_at: string;
}

export interface RuleEvent {
  id: string;
  challenge_id: string;
  type: RuleEventType;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read?: boolean;
  read_at?: string | null;
  snapshot_json?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  challenge_id?: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
}

export interface RuleEngineResult {
  dailyDDPct: number;
  maxDDPct: number;
  profitTargetPct: number;
  currentPhaseProgessPct: number;
  tradingDaysMet: boolean;
  approved: boolean;
  failed: boolean;
  failReason?: string;
  bestDayRatio?: number;
  scalpingRatio?: number;
  events: RuleEventType[];
}
