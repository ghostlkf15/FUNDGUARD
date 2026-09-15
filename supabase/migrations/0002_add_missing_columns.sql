-- =====================================================================
-- Migration 0002 · Parche columnas faltantes en firms y firm_presets
-- + Cambia PK firms.id / firm_presets.id / challenges.id de UUID → TEXT
--   (porque en la app usamos IDs estables como "firm-ftmo", "firm-ftmo-preset-100000")
-- 2026-09-13 · FUNDGUARD MVP
--
-- Ejecutar SÓLO SI YA CORRISTE 0001_initial_schema.sql y te salió:
--   ERROR 42703: column "is_featured" of relation "firms" does not exist
--
-- Si empiezas desde 0 puedes mezclar este archivo al final de 0001.
-- =====================================================================

BEGIN;

-- ── (0) Drop foreign keys temporalmente para poder cambiar tipos PK ──
ALTER TABLE public.firm_presets  DROP CONSTRAINT IF EXISTS firm_presets_firm_id_fkey;
ALTER TABLE public.challenges    DROP CONSTRAINT IF EXISTS challenges_firm_id_fkey;
ALTER TABLE public.challenges    DROP CONSTRAINT IF EXISTS challenges_preset_id_fkey;
ALTER TABLE public.equity_snapshots DROP CONSTRAINT IF EXISTS equity_snapshots_challenge_id_fkey;
ALTER TABLE public.trades        DROP CONSTRAINT IF EXISTS trades_challenge_id_fkey;
ALTER TABLE public.rule_events   DROP CONSTRAINT IF EXISTS rule_events_challenge_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_challenge_id_fkey;
ALTER TABLE public.profiles      DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ── (1) firms PK: uuid → text ───────────────────────────────────────
ALTER TABLE public.firms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.firms ALTER COLUMN id TYPE text USING (id::text);
ALTER TABLE public.firms ALTER COLUMN id SET DEFAULT md5(gen_random_uuid()::text || now())::text;

-- ── (2) firm_presets PK + firm_id FK: uuid → text ───────────────────
ALTER TABLE public.firm_presets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.firm_presets ALTER COLUMN id TYPE text USING (id::text);
ALTER TABLE public.firm_presets ALTER COLUMN id SET DEFAULT md5(gen_random_uuid()::text || now())::text;
ALTER TABLE public.firm_presets ALTER COLUMN firm_id TYPE text USING (firm_id::text);

-- ── (3) challenges PK + FKs: uuid → text ────────────────────────────
ALTER TABLE public.challenges ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.challenges ALTER COLUMN id TYPE text USING (id::text);
ALTER TABLE public.challenges ALTER COLUMN id SET DEFAULT md5(gen_random_uuid()::text || now())::text;
ALTER TABLE public.challenges ALTER COLUMN firm_id   TYPE text USING (firm_id::text);
ALTER TABLE public.challenges ALTER COLUMN preset_id TYPE text USING (preset_id::text);

-- ── (4) child tables challenge_id FK uuid → text ────────────────────
ALTER TABLE public.equity_snapshots ALTER COLUMN challenge_id TYPE text USING (challenge_id::text);
ALTER TABLE public.trades         ALTER COLUMN challenge_id TYPE text USING (challenge_id::text);
ALTER TABLE public.rule_events    ALTER COLUMN challenge_id TYPE text USING (challenge_id::text);
ALTER TABLE public.notifications  ALTER COLUMN challenge_id TYPE text USING (challenge_id::text);

-- ── (5) profiles PK se mantiene UUID (match auth.users id uuid) ─────
-- (no hay cambio; sólo restauramos FK más abajo con uuid original)

-- ── (6) Columnas faltantes firms ────────────────────────────────────
ALTER TABLE public.firms ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false NOT NULL;
ALTER TABLE public.firms ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0 NOT NULL;
CREATE INDEX IF NOT EXISTS firms_order_idx ON public.firms(order_index);

-- ── (7) Columnas faltantes firm_presets ─────────────────────────────
ALTER TABLE public.firm_presets ADD COLUMN IF NOT EXISTS allow_consistency_rule boolean DEFAULT true NOT NULL;
ALTER TABLE public.firm_presets ADD COLUMN IF NOT EXISTS allow_newstrade_lock boolean DEFAULT false NOT NULL;
ALTER TABLE public.firm_presets ADD COLUMN IF NOT EXISTS allow_news_trade_lock boolean DEFAULT false NOT NULL;
ALTER TABLE public.firm_presets ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0 NOT NULL;

-- ── (8) Recrear Foreign Keys ────────────────────────────────────────
ALTER TABLE public.firm_presets
  ADD CONSTRAINT firm_presets_firm_id_fkey FOREIGN KEY (firm_id)
  REFERENCES public.firms(id) ON DELETE CASCADE;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_firm_id_fkey FOREIGN KEY (firm_id)
  REFERENCES public.firms(id) ON DELETE SET NULL;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_preset_id_fkey FOREIGN KEY (preset_id)
  REFERENCES public.firm_presets(id) ON DELETE SET NULL;

ALTER TABLE public.equity_snapshots
  ADD CONSTRAINT equity_snapshots_challenge_id_fkey FOREIGN KEY (challenge_id)
  REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_challenge_id_fkey FOREIGN KEY (challenge_id)
  REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.rule_events
  ADD CONSTRAINT rule_events_challenge_id_fkey FOREIGN KEY (challenge_id)
  REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_challenge_id_fkey FOREIGN KEY (challenge_id)
  REFERENCES public.challenges(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
