-- 0001: Reglas oficiales FTMO extraídas de public/ftmo_reglas_tipos_cuenta.pdf (páginas 3, 4, 5)
-- Ejecutar después de 0000_full_reset_all_in_one.sql + seed.sql
-- No drop tables: actualiza presets FTMO e inserta 5 presets FTMO 1-Step NUEVOS

BEGIN;

-- 1) Actualizar firma FTMO con descripción fiel al PDF
UPDATE public.firms SET
  description = 'FTMO · 2-Step Challenge+Verification (10%/5% static · DD día 5%) y 1-Step (10% trailing · DD día 3%). Consistency Rule 50% Best Day = warning, no fail.',
  is_featured = TRUE,
  order_index = 1,
  updated_at = NOW()
WHERE id = 'firm-ftmo';

-- 2) HELPER inline pg_temp para construir fases JSONB sin errores sintácticos
DO $$
DECLARE
  r RECORD;
  p1_f1 jsonb;  -- 2-Step fase 1 challenge
  p1_f2 jsonb;  -- 2-Step fase 2 verification
  p1s_1 jsonb;  -- 1-Step fase única
  sz INT;
  pad_id TEXT;
BEGIN
  -- PHASES FTMO 2-Step (todos los tamaños comparten misma regla = NO reduce a 8% en 200K)
  p1_f1 := jsonb_build_object(
    'order', 0,
    'name', '2-Step · Fase 1 · Challenge',
    'profit_target_pct', 10,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 4,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', '[]'::jsonb
  );
  p1_f2 := jsonb_build_object(
    'order', 1,
    'name', '2-Step · Fase 2 · Verification',
    'profit_target_pct', 5,
    'max_daily_drawdown_pct', 5,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'static',
    'min_trading_days', 4,
    'reset_balance_on_new_phase', TRUE,
    'special_rules', '[]'::jsonb
  );
  -- PHASES FTMO 1-Step Challenge (solo 1 fase)
  p1s_1 := jsonb_build_object(
    'order', 0,
    'name', '1-Step · Challenge',
    'profit_target_pct', 10,
    'max_daily_drawdown_pct', 3,
    'max_total_drawdown_pct', 10,
    'drawdown_type', 'trailing',
    'min_trading_days', 4,
    'reset_balance_on_new_phase', FALSE,
    'special_rules', to_jsonb(ARRAY['best_day_ratio_0_5_warning'])
  );

  -- Loop de tamaños $10K, $25K, $50K, $100K, $200K
  FOREACH sz IN ARRAY ARRAY[10000, 25000, 50000, 100000, 200000] LOOP
    pad_id := 'firm-ftmo-preset-' || LPAD(sz::TEXT, 6, '0');

    -- UPDATE preset 2-Step YA EXISTENTE en seed.sql
    UPDATE public.firm_presets SET
      name = ('$' || ROUND(sz/1000.0) || 'K 2-Step'),
      slug = (sz || '-challenge'),
      allow_consistency_rule = TRUE,
      allow_newstrade_lock = FALSE,
      allow_news_trade_lock = FALSE,
      daily_reset_hour_utc = 0,
      broker_timezone = 'UTC',
      phases = jsonb_build_array(p1_f1, p1_f2),
      updated_at = NOW()
    WHERE id = pad_id;

    -- INSERT preset 1-Step NUEVO (no existe tras seed.sql)
    INSERT INTO public.firm_presets (
      id, firm_id, name, slug, initial_balance, currency,
      phases, broker_timezone, daily_reset_hour_utc,
      allow_consistency_rule, allow_newstrade_lock, allow_news_trade_lock,
      is_active, order_index, created_at, updated_at
    ) VALUES (
      pad_id || '-1step',
      'firm-ftmo',
      ('$' || ROUND(sz/1000.0) || 'K 1-Step'),
      (sz || '-challenge-1step'),
      sz,
      'USD',
      jsonb_build_array(p1s_1),
      'UTC',
      0,
      TRUE,
      FALSE,
      FALSE,
      TRUE,
      100 + (CASE sz WHEN 10000 THEN 1 WHEN 25000 THEN 2 WHEN 50000 THEN 3 WHEN 100000 THEN 4 WHEN 200000 THEN 5 ELSE 99 END),
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phases = EXCLUDED.phases,
      allow_consistency_rule = EXCLUDED.allow_consistency_rule,
      updated_at = NOW();
  END LOOP;
END $$;

COMMIT;
