-- =========================================================================
-- 0006: Upcomers → Crypto · FX Live Capital → Synthetic Indices
-- (Data migration, no schema changes needed — enums have crypto/synthetic_indices already)
-- =========================================================================

BEGIN;

-- ── 1) INSERT firmas NUEVAS (upsert por seguridad, no rompe si ya existen) ─
INSERT INTO public.firms (id, name, slug, market, description, website_url, logo_url, is_active, is_featured, order_index)
VALUES
  (
    'firm-upcomers-crypto',
    'Upcomers Crypto',
    'upcomers-crypto',
    'crypto',
    'Upcomers · Rampa de desafíos en Criptomonedas vía CCXT (Binance · Bybit · OKX · Coinbase · Kraken · KuCoin). API read-only, sin permiso de trading ni retiros. 2-Step Challenge estándar: 10% obj / 5% DD diario / 10% DD total / 4 días mín.',
    'https://upcomers.com',
    NULL, TRUE, TRUE, 12
  ),
  (
    'firm-fxlivecap-synth',
    'FX Live Capital · Synthetic',
    'fx-live-capital-synthetic',
    'synthetic_indices',
    'FX Live Capital · Split prop scalping-friendly especializado en Índices Sintéticos. Boom & Crash, Volatility 10s-100s, Step, Jump y Range Break 24/7/365. Drawdown dinámico 1-Step: 10% obj / 5% DD diario / 10% DD total / 4 días mín. Permite scalping sin límites, fines de semana OK, EOD flexible.',
    'https://fxlivecapital.com',
    NULL, TRUE, TRUE, 14
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  market = EXCLUDED.market,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  order_index = EXCLUDED.order_index;

-- ── 2) Preset auxiliar · 1-Step Synthetic Indices (fases JSONB 1 elemento) ─
CREATE OR REPLACE FUNCTION pg_temp.fg_synth_phase(
  name_i text, rules jsonb
) RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'order', 0,
    'name', name_i,
    'profit_target_pct', 10.0,
    'max_daily_drawdown_pct', 5.0,
    'max_total_drawdown_pct', 10.0,
    'drawdown_type', 'static',
    'min_trading_days', 4,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', COALESCE(rules, '["scalping_unlimited","24_7_trading","weekends_allowed"]'::jsonb)
  );
$$ LANGUAGE sql;

-- ── 3) Insertar 5 presets para Upcomers Crypto (2-Step standard, 10/5/10) ─
INSERT INTO public.firm_presets (
  id, firm_id, name, slug, initial_balance, currency,
  daily_reset_hour_utc, broker_timezone,
  allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
  is_active, order_index, phases
)
SELECT
  CONCAT('firm-upcomers-crypto-preset-', LPAD(s.bal::text, 6, '0'))  AS id,
  'firm-upcomers-crypto'                                             AS firm_id,
  CONCAT('$', TO_CHAR(s.bal, 'FM999G999G999'), 'K · Crypto Challenge') AS name,
  CONCAT(s.bal, '-challenge-upcomers-crypto')                        AS slug,
  s.bal                                                               AS initial_balance,
  'USD'                                                               AS currency,
  0                                                                   AS daily_reset_hour_utc,
  'Etc/UTC'                                                           AS broker_timezone,
  TRUE                                                                AS allow_consistency_rule,
  FALSE                                                               AS allow_newstrade_lock,
  FALSE                                                               AS allow_news_trade_lock,
  TRUE                                                                AS is_active,
  s.n + 500                                                           AS order_index,
  jsonb_build_array(
    jsonb_build_object('order', 0, 'name', 'Fase 1 · Challenge',
      'profit_target_pct', CASE WHEN s.bal >= 200000 THEN 8.0 ELSE 10.0 END,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', '[]'::jsonb),
    jsonb_build_object('order', 1, 'name', 'Fase 2 · Verification',
      'profit_target_pct', CASE WHEN s.bal >= 200000 THEN 4.0 ELSE 5.0 END,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 3,
      'reset_balance_on_new_phase', TRUE,
      'special_rules', '[]'::jsonb)
  ) AS phases
FROM (VALUES (1,10000),(2,25000),(3,50000),(4,100000),(5,200000)) s(n,bal)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  initial_balance = EXCLUDED.initial_balance,
  phases = EXCLUDED.phases,
  order_index = EXCLUDED.order_index,
  is_active = TRUE;

-- ── 4) Insertar 5 presets para FX Live Capital · Synthetic (1-Step 10/5/10)
INSERT INTO public.firm_presets (
  id, firm_id, name, slug, initial_balance, currency,
  daily_reset_hour_utc, broker_timezone,
  allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
  is_active, order_index, phases
)
SELECT
  CONCAT('firm-fxlivecap-synth-preset-', LPAD(s.bal::text, 6, '0'))   AS id,
  'firm-fxlivecap-synth'                                              AS firm_id,
  CONCAT('$', TO_CHAR(s.bal, 'FM999G999G999'), 'K · FXLC Synthetic')  AS name,
  CONCAT(s.bal, '-challenge-fxlc-synthetic')                          AS slug,
  s.bal                                                               AS initial_balance,
  'USD'                                                               AS currency,
  0                                                                   AS daily_reset_hour_utc,
  'Etc/UTC'                                                           AS broker_timezone,
  FALSE                                                               AS allow_consistency_rule,
  FALSE                                                               AS allow_newstrade_lock,
  FALSE                                                               AS allow_news_trade_lock,
  TRUE                                                                AS is_active,
  s.n + 400                                                           AS order_index,
  jsonb_build_array(
    pg_temp.fg_synth_phase(
      '1-Step · FXLC Synthetic Challenge',
      '["scalping_unlimited","24_7_trading","weekends_allowed"]'::jsonb
    )
  ) AS phases
FROM (VALUES (1,10000),(2,25000),(3,50000),(4,100000),(5,200000)) s(n,bal)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  initial_balance = EXCLUDED.initial_balance,
  phases = EXCLUDED.phases,
  order_index = EXCLUDED.order_index,
  is_active = TRUE;

COMMIT;
