-- 0002: Reglas oficiales BULLFY extraídas de public/bullfy_reglas_tipos_cuenta.pdf
-- Páginas clave procesadas: P2 (tabla productos), P3 (strictest floor), P6 (scalping §5.4),
--   P7 (tabla 3 variantes × 6 tamaños), P9 (JSON spec técnico).
-- Ejecutar después de 0001_ftmo_reglas_oficiales.sql
-- Resultado neto: Bullfy pasa de 5 presets genéricos → 18 presets oficiales PDF
--   6 Bull Prime (2-Step) + 6 Bull One (1-Step) + 6 Bull Titan (Fondeo Directo)

BEGIN;

-- 1) Actualizar firma BULLFY con descripción fiel al PDF + destacar
UPDATE public.firms SET
  description = 'BULLFY · 3 productos oficiales PDF: Bull Prime 2-Step (8%/3d → 5%/3d), Bull One 1-fase (12%/5d) y Bull Titan Fondeo Directo (sin evaluación, retiros c/3d). Drawdown STATIC permanente (incluye cuenta fondeada). Strictest Floor Rule = piso combinado diario+total (P3 PDF). Scalping <60s ≥10% trades = warning (primeros 4 retiros limitados 3%). Inactividad 30d = cierre automático.',
  is_featured = TRUE,
  order_index = 2,
  updated_at = NOW()
WHERE id = 'firm-bullfy';

-- 2) HELPER inline pg_temp para construir fases JSONB
DO $$
DECLARE
  r RECORD;
  prime_f1 jsonb;
  prime_f2 jsonb;
  one_f1 jsonb;
  titan_f1 jsonb;
  sz INT;
  pad_id TEXT;
  sz_idx INT;
  sizes INT[] := ARRAY[5000, 10000, 25000, 50000, 100000, 200000];
BEGIN
  -- ================================================================
  -- BULL PRIME · 2-Step Evaluación (P7 tabla + P9 spec)
  -- F1: 8% profit · 3d mín · DD 5%/10% static. Reset balance F2 = NO (diferencia FTMO).
  -- ================================================================
  prime_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Bull Prime · Fase 1 · Evaluación',
    'profit_target_pct', 8,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY['strictest_floor_daily_vs_total','dd_static_funded_same_rules','inactivity_30d_close'])
  );
  prime_f2 := jsonb_build_object(
    'order', 1,
    'name', 'Bull Prime · Fase 2 · Verificación',
    'profit_target_pct', 5,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY['strictest_floor_daily_vs_total','dd_static_funded_same_rules','inactivity_30d_close'])
  );

  -- ================================================================
  -- BULL ONE · 1-fase Challenge (P2 + P7)
  -- 12% profit · 5d mín · DD 5%/10% static
  -- ================================================================
  one_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Bull One · Challenge 1-fase',
    'profit_target_pct', 12,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 5,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY['strictest_floor_daily_vs_total','dd_static_funded_same_rules','scalping_10pct_warning','inactivity_30d_close'])
  );

  -- ================================================================
  -- BULL TITAN · Fondeo Directo (P7 + P9)
  -- Sin objetivo. 3% día / 6% total static. 3 días trading mínimo por retiro.
  -- ================================================================
  titan_f1 := jsonb_build_object(
    'order', 0,
    'name', 'Bull Titan · Fondeo Directo',
    'profit_target_pct', 0,
    'max_daily_drawdown_pct', 3,
    'max_total_drawdown_pct', 6,
    'drawdown_type', 'static',
    'min_trading_days', 3,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY['profit_split_70','strictest_floor_daily_vs_total','scalping_10pct_warning','inactivity_30d_close'])
  );

  -- ================================================================
  -- Loop de 6 tamaños $5K → $200K (Bullfy incluye $5K exclusivo)
  -- ================================================================
  FOREACH sz IN ARRAY sizes LOOP
    pad_id := 'firm-bullfy-preset-' || LPAD(sz::TEXT, 6, '0');
    sz_idx := (
      CASE sz
        WHEN 5000 THEN 1
        WHEN 10000 THEN 2
        WHEN 25000 THEN 3
        WHEN 50000 THEN 4
        WHEN 100000 THEN 5
        WHEN 200000 THEN 6
        ELSE 99
      END
    );

    -- --------------------------------------------------------------
    -- BULL PRIME 2-Step (UPDATE existentes seed.sql 10K-200K + INSERT $5K nuevo)
    -- --------------------------------------------------------------
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id,
      'firm-bullfy',
      ('$' || CASE sz WHEN 5000 THEN '5' ELSE ROUND(sz/1000.0)::TEXT END || 'K · Bull Prime'),
      (sz || '-challenge-prime'),
      sz,
      'USD',
      jsonb_build_array(prime_f1, prime_f2),
      'UTC',
      0,
      FALSE,
      TRUE,
      TRUE,
      TRUE,
      sz_idx,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();

    -- --------------------------------------------------------------
    -- BULL ONE (1-Step Challenge) · NUEVOS 6 presets (con sufijo -one)
    -- --------------------------------------------------------------
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id || '-one',
      'firm-bullfy',
      ('$' || CASE sz WHEN 5000 THEN '5' ELSE ROUND(sz/1000.0)::TEXT END || 'K · Bull One'),
      (sz || '-challenge-one'),
      sz,
      'USD',
      jsonb_build_array(one_f1),
      'UTC',
      0,
      FALSE,
      TRUE,
      TRUE,
      TRUE,
      100 + sz_idx,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();

    -- --------------------------------------------------------------
    -- BULL TITAN (Fondeo Directo) · NUEVOS 6 presets (con sufijo -titan)
    -- --------------------------------------------------------------
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id || '-titan',
      'firm-bullfy',
      ('$' || CASE sz WHEN 5000 THEN '5' ELSE ROUND(sz/1000.0)::TEXT END || 'K · Bull Titan (Fondeo Directo)'),
      (sz || '-challenge-titan'),
      sz,
      'USD',
      jsonb_build_array(titan_f1),
      'UTC',
      0,
      FALSE,
      TRUE,
      TRUE,
      TRUE,
      200 + sz_idx,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      allow_newstrade_lock = EXCLUDED.allow_newstrade_lock,
      allow_news_trade_lock = EXCLUDED.allow_news_trade_lock,
      broker_timezone = EXCLUDED.broker_timezone,
      daily_reset_hour_utc = EXCLUDED.daily_reset_hour_utc,
      order_index = EXCLUDED.order_index,
      updated_at = NOW();

  END LOOP;
END $$;

COMMIT;
