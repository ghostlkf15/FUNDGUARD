-- 0009: Reglas OFICIALES FX LIVE CAPITAL extraídas de public/fxlivecapital_reglas_tipos_cuenta.pdf
-- Páginas PDF procesadas:
--   P2 (4 productos): Boost+ 2-Step · Live FX 1-Step · Power Live (Directo) · Live Synthetics 1-Step
--   P3 (Boost+ reglas): 10% F1 / 8% F2 · 5% DD diario · 10% DD total · 3d mín / 90d máx
--   P4 (Live FX / Power Live): Live FX = 10% / 5%/10% / 3-90d; Power Live = sin obj / 95% PS / retiro diario
--   P5 (tabla tamaños × productos): Boost+ [7.5K,13.5K,22.5K,37.5K,75K] / Live FX [5K-100K] / Power Live [$500-$50K] / Synthetics [5K-50K]
--   P6 (Live Synthetics): 10% obj / 4% DD diario / 8% DD total · 3d/90d · tope 10% mensual · 1:50 · solo sintéticos
-- Resultado neto:
--   firm-fxlivecap (FOREX): 15 presets = Boost+ ×5 + Live FX ×5 + Power Live ×5
--   firm-fxlivecap-synth (SYNTH): 5 presets [5K/10K/20K/25K/50K] con DD 4%/8% PDF
--   firm-synthetic (Deriv): sin cambios (sin PDF oficial aún)

BEGIN;

-- ================================================================
-- 1) Actualizar descripciones de firmas FXLC a texto 100% PDF
-- ================================================================
UPDATE public.firms SET
  description = 'FX Live Capital · 4 programas oficiales PDF: Boost+ 2-Step (10% F1 · 8% F2 · 5%/10% DD · 3mín/90máx días), Live FX 1-Step (10% · 5%/10% · 3/90), Power Live Fondeo Directo (95% profit share · retiro diario) y Live Synthetics 1-Step (4%/8% DD · tope 10% mensual). DD sin confirmar públicamente = tratado como static por defecto. Holding fin de semana permitido en todos los productos. Leverage 1:100 Forex / 1:50 Synthetics.',
  is_featured = TRUE,
  order_index = 3,
  updated_at = NOW()
WHERE id = 'firm-fxlivecap';

UPDATE public.firms SET
  description = 'FX Live Capital · Split prop sintéticos oficial. Live Synthetics 1-Step: 10% obj / 4% DD diario / 8% DD total estático · 3 días mín / 90 días máx · 1:50 leverage · tope 10% ganancia mensual · scalping ilimitado · 24/7 trading · fines de semana OK · profit share 80% · fee reembolsable · solo activos sintéticos (Boom & Crash / Volatility / Step / Jump / Range Break).',
  is_featured = TRUE,
  order_index = 15,
  updated_at = NOW()
WHERE id = 'firm-fxlivecap-synth';

-- ================================================================
-- 2) HELPER inline pg_temp para construir 15 presets FXLC FOREX + 5 FXLC SYNTH
-- ================================================================
DO $$
DECLARE
  r RECORD;
  -- FOREX
  boost_f1 jsonb; boost_f2 jsonb;
  livefx_f1 jsonb;
  powerlive_f1 jsonb;
  -- SYNTH
  fxlc_synth_f1 jsonb;
  -- Tamaños
  sz INT;
  pad_id TEXT;
  sz_idx INT;
  -- Arrays tamaños PDF oficial
  sizes_boost INT[] := ARRAY[7500, 13500, 22500, 37500, 75000];
  sizes_livefx INT[] := ARRAY[5000, 10000, 25000, 50000, 100000];
  sizes_powerlive INT[] := ARRAY[500, 5000, 10000, 25000, 50000];
  sizes_fxlc_synth INT[] := ARRAY[5000, 10000, 20000, 25000, 50000];
  common_fxlc TEXT[] := ARRAY['weekends_allowed','dd_static_treat_by_default','timezone_reset_tbd_confirm'];
BEGIN

  -- ================================================================
  -- BOOST+ · 2-Step (P3 + P5 PDF)
  --   F1: 10% · 5% DD día · 10% DD total · 3mín/90máx
  --   F2: 8% · 5% DD día · 10% DD total · 3mín/90máx
  --   Profit split 90% · Fee reembolsable · Leverage 1:100
  -- ================================================================
  boost_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Boost+ · Fase 1 · Challenge',
    'profit_target_pct', 10,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'time_limit_days', 90,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(common_fxlc || ARRAY['profit_split_90','fee_refundable','leverage_1_100'])
  );
  boost_f2 := jsonb_build_object(
    'order', 1,
    'name', 'Boost+ · Fase 2 · Verification',
    'profit_target_pct', 8,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'time_limit_days', 90,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(common_fxlc || ARRAY['profit_split_90','fee_refundable','leverage_1_100'])
  );

  -- ================================================================
  -- LIVE FX · 1-Step (P4 + P5 PDF)
  --   10% obj · 5% DD día · 10% DD total · 3mín/90máx
  --   Profit split 80% · Fee reembolsable · Leverage 1:100
  -- ================================================================
  livefx_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Live FX · 1-Step Challenge',
    'profit_target_pct', 10,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'time_limit_days', 90,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(common_fxlc || ARRAY['profit_split_80','fee_refundable','leverage_1_100'])
  );

  -- ================================================================
  -- POWER LIVE · Fondeo Directo (P4 + P5 PDF)
  --   Sin objetivo · 10% DD día / 10% DD total (sin especificar = conservador)
  --   95% profit share · Retiro DIARIO · Leverage 1:100
  -- ================================================================
  powerlive_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Power Live · Fondeo Directo',
    'profit_target_pct', 0,
    'max_daily_drawdown_pct', 10,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY['direct_funding_no_challenge','profit_split_95','withdrawal_daily','weekends_allowed','leverage_1_100'])
  );

  -- ================================================================
  -- LIVE SYNTHETICS (FXLC Synth) 1-Step (P6 PDF)
  --   10% obj · 4% DD día · 8% DD total · 3mín/90máx
  --   Tope 10% mensual · 1:50 · solo sintéticos · 80% PS · fee reembolsable
  -- ================================================================
  fxlc_synth_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Live Synthetics · 1-Step Challenge',
    'profit_target_pct', 10,
    'max_daily_drawdown_pct', 4,
    'max_total_drawdown_pct', 8,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'time_limit_days', 90,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY[
      'scalping_unlimited','24_7_trading','weekends_allowed',
      'monthly_profit_cap_10_pct_synth',
      'leverage_1_50','only_synthetics_assets',
      'profit_split_80','fee_refundable'
    ])
  );

  -- ================================================================
  -- 2A) FXLC FOREX · BOOST+ · 5 tamaños [7.5K → 75K] (order 1-5)
  -- ================================================================
  sz_idx := 1;
  FOREACH sz IN ARRAY sizes_boost LOOP
    pad_id := 'firm-fxlivecap-preset-' || LPAD(sz::TEXT, 6, '0');
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id,
      'firm-fxlivecap',
      ('$' || ROUND(sz/1000.0, 1)::TEXT || 'K · Boost+'),
      (sz || '-challenge-boostplus'),
      sz,
      'USD',
      jsonb_build_array(boost_f1, boost_f2),
      'Etc/UTC',
      0,
      FALSE, TRUE, TRUE,
      TRUE, sz_idx, NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, slug = EXCLUDED.slug, initial_balance = EXCLUDED.initial_balance,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      is_active = TRUE,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();
    sz_idx := sz_idx + 1;
  END LOOP;

  -- ================================================================
  -- 2B) FXLC FOREX · LIVE FX · 5 tamaños [5K → 100K] (order 101-105)
  --     IDs: sufijo -livefx para evitar colisión con Boost+
  -- ================================================================
  sz_idx := 1;
  FOREACH sz IN ARRAY sizes_livefx LOOP
    pad_id := 'firm-fxlivecap-preset-' || LPAD(sz::TEXT, 6, '0') || '-livefx';
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id,
      'firm-fxlivecap',
      ('$' || CASE sz WHEN 5000 THEN '5' ELSE ROUND(sz/1000.0)::TEXT END || 'K · Live FX'),
      (sz || '-challenge-livefx'),
      sz,
      'USD',
      jsonb_build_array(livefx_f1),
      'Etc/UTC',
      0,
      FALSE, TRUE, TRUE,
      TRUE, 100 + sz_idx, NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, slug = EXCLUDED.slug, initial_balance = EXCLUDED.initial_balance,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      is_active = TRUE,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();
    sz_idx := sz_idx + 1;
  END LOOP;

  -- ================================================================
  -- 2C) FXLC FOREX · POWER LIVE (Directo) · 5 tamaños [$500 → $50K] (order 201-205)
  --     IDs: sufijo -power
  -- ================================================================
  sz_idx := 1;
  FOREACH sz IN ARRAY sizes_powerlive LOOP
    pad_id := 'firm-fxlivecap-preset-' || LPAD(sz::TEXT, 6, '0') || '-power';
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id,
      'firm-fxlivecap',
      CASE
        WHEN sz < 1000 THEN ('$' || sz || ' · Power Live (Directo)')
        ELSE ('$' || (CASE sz WHEN 5000 THEN '5' ELSE ROUND(sz/1000.0)::TEXT END) || 'K · Power Live (Directo)')
      END,
      (sz || '-challenge-powerlive'),
      sz,
      'USD',
      jsonb_build_array(powerlive_f1),
      'Etc/UTC',
      0,
      FALSE, TRUE, TRUE,
      TRUE, 200 + sz_idx, NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, slug = EXCLUDED.slug, initial_balance = EXCLUDED.initial_balance,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      is_active = TRUE,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();
    sz_idx := sz_idx + 1;
  END LOOP;

  -- ================================================================
  -- 2D) FXLC SYNTHETICS (firm-fxlivecap-synth) · 5 tamaños PDF [5K → 50K] (order 401-405)
  --     10% obj · 4% día / 8% total · 3d/90d · tope 10% mensual
  -- ================================================================
  sz_idx := 1;
  FOREACH sz IN ARRAY sizes_fxlc_synth LOOP
    pad_id := 'firm-fxlivecap-synth-preset-' || LPAD(sz::TEXT, 6, '0');
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id,
      'firm-fxlivecap-synth',
      ('$' || (CASE sz WHEN 5000 THEN '5' WHEN 20000 THEN '20' WHEN 25000 THEN '25' ELSE ROUND(sz/1000.0)::TEXT END) || 'K · Live Synthetics'),
      (sz || '-challenge-live-synthetics'),
      sz,
      'USD',
      jsonb_build_array(fxlc_synth_f1),
      'Etc/UTC',
      0,
      FALSE, FALSE, FALSE,
      TRUE, 400 + sz_idx, NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, slug = EXCLUDED.slug, initial_balance = EXCLUDED.initial_balance,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      is_active = TRUE,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();
    sz_idx := sz_idx + 1;
  END LOOP;

END $$;

-- ================================================================
-- 3) Limpieza: DESACTIVAR (no borrar safe) presets FXLC FOREX genéricos antiguos
--    (los 5 originales de 0007: 10K/25K/50K/100K/200K genéricos 2-Step)
--    SOLO se desactivan si no tienen challenges asociados (safe check)
-- ================================================================
UPDATE public.firm_presets
SET is_active = FALSE, updated_at = NOW()
WHERE
  firm_id = 'firm-fxlivecap'
  AND id IN (
    'firm-fxlivecap-preset-010000',
    'firm-fxlivecap-preset-025000',
    'firm-fxlivecap-preset-050000',
    'firm-fxlivecap-preset-100000',
    'firm-fxlivecap-preset-200000'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.challenges c WHERE c.preset_id = public.firm_presets.id
  );

COMMIT;
