-- =========================================================================
-- MIGRACIÓN 0005 · Synthetic Indices Data (FIRM + 5 PRESETS)
-- Ejecutar DESPUÉS de 0004_synthetic_indices.sql (ya amplió el enum)
-- =========================================================================
BEGIN;

INSERT INTO public.firms (
  id, name, slug, market, description, website_url, logo_url,
  is_active, is_featured, order_index
) VALUES (
  'firm-synthetic',
  'Synthetic Indices (Deriv)',
  'synthetic-deriv',
  'synthetic_indices',
  'Índices sintéticos 24/7: Boom & Crash 300/500/1000, Volatility 10-100 1s, Step Index, Jump Index, Range Break 100-200. Correlación cero con mercados reales — disponibilidad 365 días, weekends incluido. 1-Step Challenge 10% obj / 5% DD diario / 10% DD total / 4 días mínimos. Scalping ilimitado.',
  'https://deriv.com',
  NULL,
  TRUE,
  TRUE,
  13
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.firm_presets (
  id, firm_id, name, slug, initial_balance, currency,
  daily_reset_hour_utc, broker_timezone,
  allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
  is_active, order_index, phases
) VALUES
  (
    'firm-synthetic-preset-010000',
    'firm-synthetic',
    '$10K · Synthetic 1-Step',
    '10000-challenge-synthetic',
    10000,
    'USD',
    0,
    'Etc/UTC',
    FALSE, FALSE, FALSE,
    TRUE, 301,
    jsonb_build_array(jsonb_build_object(
      'order', 0,
      'name', '1-Step · Synthetic Challenge',
      'profit_target_pct', 10.0,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', to_jsonb(ARRAY['scalping_unlimited','24_7_trading','weekends_allowed'])
    ))
  ),
  (
    'firm-synthetic-preset-025000',
    'firm-synthetic',
    '$25K · Synthetic 1-Step',
    '25000-challenge-synthetic',
    25000,
    'USD',
    0,
    'Etc/UTC',
    FALSE, FALSE, FALSE,
    TRUE, 302,
    jsonb_build_array(jsonb_build_object(
      'order', 0,
      'name', '1-Step · Synthetic Challenge',
      'profit_target_pct', 10.0,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', to_jsonb(ARRAY['scalping_unlimited','24_7_trading','weekends_allowed'])
    ))
  ),
  (
    'firm-synthetic-preset-050000',
    'firm-synthetic',
    '$50K · Synthetic 1-Step',
    '50000-challenge-synthetic',
    50000,
    'USD',
    0,
    'Etc/UTC',
    FALSE, FALSE, FALSE,
    TRUE, 303,
    jsonb_build_array(jsonb_build_object(
      'order', 0,
      'name', '1-Step · Synthetic Challenge',
      'profit_target_pct', 10.0,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', to_jsonb(ARRAY['scalping_unlimited','24_7_trading','weekends_allowed'])
    ))
  ),
  (
    'firm-synthetic-preset-100000',
    'firm-synthetic',
    '$100K · Synthetic 1-Step',
    '100000-challenge-synthetic',
    100000,
    'USD',
    0,
    'Etc/UTC',
    FALSE, FALSE, FALSE,
    TRUE, 304,
    jsonb_build_array(jsonb_build_object(
      'order', 0,
      'name', '1-Step · Synthetic Challenge',
      'profit_target_pct', 10.0,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', to_jsonb(ARRAY['scalping_unlimited','24_7_trading','weekends_allowed'])
    ))
  ),
  (
    'firm-synthetic-preset-200000',
    'firm-synthetic',
    '$200K · Synthetic 1-Step',
    '200000-challenge-synthetic',
    200000,
    'USD',
    0,
    'Etc/UTC',
    FALSE, FALSE, FALSE,
    TRUE, 305,
    jsonb_build_array(jsonb_build_object(
      'order', 0,
      'name', '1-Step · Synthetic Challenge',
      'profit_target_pct', 10.0,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', to_jsonb(ARRAY['scalping_unlimited','24_7_trading','weekends_allowed'])
    ))
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
