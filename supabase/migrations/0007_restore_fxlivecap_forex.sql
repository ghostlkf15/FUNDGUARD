-- =========================================================================
-- MIGRACIÓN 0007 · RESTAURAR FX LIVE CAPITAL en mercado FOREX + 5 presets standard
-- (FXLC ahora tiene 2 mercados: FOREX (1) + ÍNDICES SINTÉTICOS (1))
-- =========================================================================

BEGIN;

-- 1) Restaurar firma firm-fxlivecap (FOREX)
INSERT INTO public.firms (id, name, slug, market, description, website_url, logo_url, is_active, is_featured, order_index, created_at, updated_at)
VALUES (
  'firm-fxlivecap',
  'FX Live Capital',
  'fx-live-capital',
  'forex',
  'FX Live Capital · Split prop scalping friendly. 2-Step Challenge estándar en MT5: 10% / 5% obj · DD estático 5% diario / 10% total · 4/3 días mín.',
  'https://fxlivecapital.com',
  NULL,
  TRUE, TRUE, 3,
  NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  market = EXCLUDED.market,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- 2) Insertar 5 presets FX Live Capital FOREX (10K / 25K / 50K / 100K / 200K)
--    Mismo patrón 2-Step que Upcomers Crypto (0006):
--      F1: obj 10% (8% si 200K) · 5% DD día · 10% DD total · static · 4 días · no reset
--      F2: obj 5% (4% si 200K) · 5% DD día · 10% DD total · static · 3 días · reset balance sí
INSERT INTO public.firm_presets (
  id, firm_id, name, slug, initial_balance, currency,
  daily_reset_hour_utc, broker_timezone,
  allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
  is_active, order_index, phases
)
SELECT
  CONCAT('firm-fxlivecap-preset-', LPAD(s.bal::text, 6, '0'))   AS id,
  'firm-fxlivecap'                                              AS firm_id,
  CONCAT('$', TO_CHAR(s.bal, 'FM999G999G999'), 'K · FX Live Capital') AS name,
  CONCAT(s.bal, '-challenge-fxlivecap-forex')                   AS slug,
  s.bal                                                               AS initial_balance,
  'USD'                                                               AS currency,
  0                                                                   AS daily_reset_hour_utc,
  'Etc/UTC'                                                           AS broker_timezone,
  FALSE                                                               AS allow_consistency_rule,
  FALSE                                                               AS allow_newstrade_lock,
  FALSE                                                               AS allow_news_trade_lock,
  TRUE                                                                AS is_active,
  s.n + 100                                                           AS order_index,
  jsonb_build_array(
    jsonb_build_object(
      'order', 0,
      'name', CASE WHEN s.bal >= 100000 THEN 'Fase 1 · Challenge' ELSE 'Fase 1 - Evaluación' END,
      'profit_target_pct', CASE WHEN s.bal >= 200000 THEN 8.0 ELSE 10.0 END,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 4,
      'reset_balance_on_new_phase', FALSE,
      'special_rules', '[]'::jsonb
    ),
    jsonb_build_object(
      'order', 1,
      'name', 'Fase 2 · Verification',
      'profit_target_pct', CASE WHEN s.bal >= 200000 THEN 4.0 ELSE 5.0 END,
      'max_daily_drawdown_pct', 5.0,
      'max_total_drawdown_pct', 10.0,
      'drawdown_type', 'static',
      'min_trading_days', 3,
      'reset_balance_on_new_phase', TRUE,
      'special_rules', '[]'::jsonb
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
  is_active = TRUE,
  updated_at = NOW();

COMMIT;
