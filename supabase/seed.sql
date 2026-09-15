-- =========================================================================
-- Seed FUNDGUARD · Firmas + Presets por defecto
-- Ejecutar en Supabase SQL Editor después de 0001_initial_schema.sql
-- =========================================================================

BEGIN;

-- 1) Limpiar si existen (en orden de FK)
DELETE FROM public.firm_presets CASCADE;
DELETE FROM public.firms CASCADE;

-- =========================================================================
-- FIRMAS
-- =========================================================================
INSERT INTO public.firms (id, name, slug, market, description, website_url, logo_url, is_active, is_featured, order_index)
VALUES
  ('firm-ftmo',            'FTMO',                    'ftmo',                      'forex',            'El prop firm original · 2 fases estándar.',                                                                              'https://ftmo.com',               '/images/ftmo.png',         TRUE, TRUE,  1),
  ('firm-bullfy',          'Bullfy',                  'bullfy',                    'forex',            'Bullfy Trader · Europeo con reglas flexibles.',                                                                         'https://bullfy.com',             '/images/bullfy.jpg',       TRUE, TRUE,  2),
  ('firm-fxlivecap',       'FX Live Capital',           'fx-live-capital',          'forex',            'FX Live Capital · Split prop scalping friendly. 2-Step Challenge estándar MT5.',                                         'https://fxlivecapital.com',      '/images/fxlivecapital.png',TRUE, TRUE,  3),
  ('firm-upcomers-fx',     'Upcomers Forex',          'upcomers-forex',            'forex',            'Upcomers · rampa en Forex.',                                                                                           'https://upcomers.com',           '/images/upcommers.jpg',    TRUE, FALSE, 4),
  ('firm-fundednext',      'FundedNext',              'fundednext',                'forex',            'FundedNext · Stellar Challenge 2 pasos.',                                                                              'https://fundednext.com',         '/images/fundednext.png',   TRUE, TRUE,  5),
  ('firm-the5ers',         'The 5ers',                'the5ers',                   'forex',            'The 5%ers · programas low-stakes.',                                                                                    'https://the5ers.com',            '/images/the5ers.jpg',      TRUE, TRUE,  6),
  ('firm-fundingpips',     'FundingPips',             'fundingpips',               'forex',            'FundingPips · reglas claras 2 fases.',                                                                                 'https://fundingpips.com',        '/images/fundingpips.jpg',  TRUE, FALSE, 7),

  ('firm-apex',            'Apex Trader',             'apex',                      'futures',          'Apex Trading · PA más grande en futuros.',                                                                             'https://apextraderfunding.com',  '/images/apex.png',         TRUE, TRUE,  8),
  ('firm-lucid',           'Lucid',                   'lucid',                     'futures',          'Lucid Futures · NQ/ES friendly.',                                                                                     'https://lucidfutures.com',       '/images/lucid.jpg',        TRUE, TRUE,  9),
  ('firm-upcomers-fu',     'Upcomers Futuros',        'upcomers-fut',              'futures',          'Upcomers · NQ/MNQ/ES/MES.',                                                                                            'https://upcomers.com',           '/images/upcommers.jpg',    TRUE, FALSE, 10),
  ('firm-topstep',         'Topstep',                 'topstep',                   'futures',          'Topstep · Express & Combine original.',                                                                                'https://topstep.com',            '/images/topstep.png',      TRUE, TRUE,  11),
  ('firm-myfundedfu',      'MyFundedFutures',         'my-funded-fu',              'futures',          'MyFundedFutures · evaluaciones rápidas.',                                                                              'https://myfundedfutures.com',    '/images/myfundedfutures.png', TRUE, FALSE, 12),

  ('firm-upcomers-crypto', 'Upcomers Crypto',         'upcomers-crypto',           'crypto',           'Upcomers · Rampa Cripto vía CCXT. API read-only. 2-Step 10/5/10.',                                                    'https://upcomers.com',           '/images/upcommers.jpg',    TRUE, TRUE,  13),

  ('firm-synthetic',       'Synthetic (Deriv)',       'synthetic-deriv',           'synthetic_indices','Synthetic Indices 24/7: Boom&Crash, Volatility, Jump, Step, Range Break. 1-Step 10% / 5% DD día / 10% DD total.',       'https://deriv.com',              NULL,                       TRUE, TRUE,  14),
  ('firm-fxlivecap-synth', 'FX Live Capital · Synth', 'fx-live-capital-synthetic', 'synthetic_indices','FX Live Capital · Índices Sintéticos · Scalping friendly 24/7. Boom & Crash · Volatility · Step · Jump · Range Break.','https://fxlivecapital.com',      '/images/fxlivecapital.png',TRUE, TRUE,  15)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- FUNCIONES AUXILIARES · Presets JSONB
-- =========================================================================
CREATE OR REPLACE FUNCTION pg_temp.fg_phase(
  order_i int, name text, target float8, daily float8, maxdd float8,
  ddtype text, mindays int, resetbal boolean DEFAULT FALSE
) RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'order', order_i,
    'name', name,
    'profit_target_pct', target,
    'max_daily_drawdown_pct', daily,
    'max_total_drawdown_pct', maxdd,
    'drawdown_type', ddtype::text,  -- 'static' | 'trailing'
    'min_trading_days', mindays,
    'reset_balance_on_new_phase', resetbal,
    'special_rules', '[]'::jsonb
  );
$$ LANGUAGE sql;

-- =========================================================================
-- PRESETS · 5 tamaños por firma × 2 fases estándar
-- =========================================================================
WITH sizes AS (
  SELECT s.n, s.bal
  FROM (VALUES (1,10000),(2,25000),(3,50000),(4,100000),(5,200000)) s(n,bal)
),
firms_list AS (
  SELECT id, slug,
    CASE WHEN market = 'forex' THEN 'FOREX'::text ELSE 'FUT'::text END as suffix,
    CASE WHEN slug IN ('apex','topstep','lucid','the5ers') THEN 'trailing'::text ELSE 'static'::text END as ddt
  FROM public.firms
)
INSERT INTO public.firm_presets (
  id, firm_id, name, slug, initial_balance, currency,
  daily_reset_hour_utc, broker_timezone,
  allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
  is_active, order_index, phases
)
SELECT
  CONCAT(f.id, '-preset-', LPAD(s.bal::text, 6, '0'))        AS id,
  f.id                                                        AS firm_id,
  CONCAT('$', TO_CHAR(s.bal, 'FM999G999G999'))                AS name,
  CONCAT(s.bal, '-challenge')                                 AS slug,
  s.bal                                                       AS initial_balance,
  'USD'                                                       AS currency,
  CASE WHEN f.suffix = 'FOREX' THEN 0 ELSE 23 END             AS daily_reset_hour_utc,
  CASE WHEN f.suffix = 'FOREX' THEN 'UTC' ELSE 'America/Chicago' END AS broker_timezone,
  TRUE                                                        AS allow_consistency_rule,
  FALSE                                                       AS allow_newstrade_lock,
  FALSE                                                       AS allow_news_trade_lock,
  TRUE                                                        AS is_active,
  s.n                                                         AS order_index,
  jsonb_build_array(
    pg_temp.fg_phase(0,
      CASE WHEN s.bal >= 100000 THEN 'Fase 1 · Challenge' ELSE 'Fase 1 - Evaluación' END,
      CASE WHEN s.bal >= 200000 THEN 8.0 ELSE 10.0 END,
      CASE WHEN f.slug='apex' THEN 6.0 ELSE 5.0 END,
      CASE WHEN f.slug='apex' THEN 10.0 ELSE 10.0 END,
      f.ddt, 4),
    pg_temp.fg_phase(1,
      'Fase 2 · Verification',
      CASE WHEN s.bal >= 200000 THEN 4.0 ELSE 5.0 END,
      CASE WHEN f.slug='apex' THEN 6.0 ELSE 5.0 END,
      CASE WHEN f.slug IN ('the5ers','lucid') THEN 8.0 ELSE 10.0 END,
      f.ddt, 3, TRUE)
  ) AS phases
FROM firms_list f
CROSS JOIN sizes s
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =========================================================================
-- Hacerte administrador (reemplaza por TU email registrado en Auth)
-- EJECUTA ESTA LÍNEA DESPUÉS DE HABERTE REGISTRADO UNA VEZ EN /signup
-- =========================================================================
-- Opción A (recomendada, por email):
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'tu@email.com';

-- Opción B (por auth user id):
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = '00000000-0000-0000-0000-000000000000';

-- Verifica que quedó:
-- SELECT id, full_name, email, is_admin FROM public.profiles;
-- =========================================================================
