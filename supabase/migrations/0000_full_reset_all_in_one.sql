-- =====================================================================
-- FUNDGUARD · Esquema COMPLETO (FIXED) · ALL-IN-ONE
-- =====================================================================
--
-- Ejecuta ESTE ÚNICO ARCHIVO en una NUEVA pestaña SQL del Dashboard.
--
-- Problemas corregidos vs 0001 original:
--   ✅ IDs TEXT estables (firm-ftmo, firm-ftmo-preset-100000) en vez de UUID
--      (coinciden con lib/data/seed.ts y supabase/seed.sql)
--   ✅ Columnas faltantes en firms: is_featured, order_index
--   ✅ Columnas faltantes en firm_presets: allow_* y order_index
--   ✅ Perfiles.id UUID → coincide con auth.users.id (UUID nativo de Supabase)
--   ✅ Policies RLS owner + admin escalado
--   ✅ Triggers handle_new_user + set_updated_at
--   ✅ Realtime publications (4 tablas)
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- (0) DROP TOTAL · partimos de 0 (ignora el 0001 / 0002 que fallaron)
--     en orden inverso a FKs → después policies → después tablas → enums
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS profiles_own              ON public.profiles;
DROP POLICY IF EXISTS firms_admin_all           ON public.firms;
DROP POLICY IF EXISTS firms_read_all            ON public.firms;
DROP POLICY IF EXISTS presets_admin_all         ON public.firm_presets;
DROP POLICY IF EXISTS presets_read_all          ON public.firm_presets;
DROP POLICY IF EXISTS challenges_own            ON public.challenges;
DROP POLICY IF EXISTS challenges_admin_all      ON public.challenges;
DROP POLICY IF EXISTS snapshots_own             ON public.equity_snapshots;
DROP POLICY IF EXISTS snapshots_admin_all       ON public.equity_snapshots;
DROP POLICY IF EXISTS trades_own                ON public.trades;
DROP POLICY IF EXISTS trades_admin_all          ON public.trades;
DROP POLICY IF EXISTS events_own                ON public.rule_events;
DROP POLICY IF EXISTS events_admin_all          ON public.rule_events;
DROP POLICY IF EXISTS notifications_own         ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_all   ON public.notifications;

DROP TABLE IF EXISTS public.notifications      CASCADE;
DROP TABLE IF EXISTS public.rule_events        CASCADE;
DROP TABLE IF EXISTS public.trades             CASCADE;
DROP TABLE IF EXISTS public.equity_snapshots   CASCADE;
DROP TABLE IF EXISTS public.challenges         CASCADE;
DROP TABLE IF EXISTS public.firm_presets       CASCADE;
DROP TABLE IF EXISTS public.firms              CASCADE;
DROP TABLE IF EXISTS public.profiles           CASCADE;

DROP TYPE IF EXISTS public.market_type;
DROP TYPE IF EXISTS public.challenge_status;
DROP TYPE IF EXISTS public.drawdown_type;
DROP TYPE IF EXISTS public.rule_event_type;
DROP TYPE IF EXISTS public.notification_channel;
DROP TYPE IF EXISTS public.account_link_method;

DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- ─────────────────────────────────────────────────────────────────────
-- (1) ENUMS (6)
-- ─────────────────────────────────────────────────────────────────────

CREATE TYPE public.market_type AS ENUM ('forex', 'futures', 'crypto');
CREATE TYPE public.challenge_status AS ENUM ('draft', 'linking', 'active', 'approved', 'failed', 'disconnected', 'phase_changed');
CREATE TYPE public.drawdown_type AS ENUM ('static', 'trailing');
CREATE TYPE public.rule_event_type AS ENUM (
  'alert_daily_dd', 'alert_max_dd', 'failed_daily_dd', 'failed_max_dd',
  'approved', 'phase_change', 'reconnected', 'disconnected', 'min_days_met'
);
CREATE TYPE public.notification_channel AS ENUM ('email', 'in_app', 'push');
CREATE TYPE public.account_link_method AS ENUM ('ea_mt4', 'ea_mt5', 'cbot_ctrader', 'crypto_api');

-- ─────────────────────────────────────────────────────────────────────
-- (2) TABLAS (8) · PK TEXT estables excepto profiles (UUID)
-- ─────────────────────────────────────────────────────────────────────

-- profiles: 1-a-1 con auth.users (ambos UUID)
CREATE TABLE public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name         text,
  email             text,
  avatar_url        text,
  is_admin          boolean DEFAULT false NOT NULL,
  newsletter_optin  boolean DEFAULT true NOT NULL,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

-- firms
CREATE TABLE public.firms (
  id             text PRIMARY KEY NOT NULL,
  name           text NOT NULL,
  slug           text NOT NULL UNIQUE,
  market         public.market_type NOT NULL,
  logo_url       text,
  website_url    text,
  description    text,
  is_active      boolean DEFAULT true NOT NULL,
  is_featured    boolean DEFAULT false NOT NULL,
  order_index    integer DEFAULT 0 NOT NULL,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX firms_market_idx ON public.firms(market);
CREATE INDEX firms_order_idx  ON public.firms(order_index);

-- firm_presets (phases JSONB flexible por preset)
CREATE TABLE public.firm_presets (
  id                      text PRIMARY KEY NOT NULL,
  firm_id                 text REFERENCES public.firms(id) ON DELETE CASCADE NOT NULL,
  name                    text NOT NULL,
  slug                    text NOT NULL,
  initial_balance         numeric(18,2) NOT NULL,
  currency                text DEFAULT 'USD' NOT NULL,
  phases                  jsonb NOT NULL DEFAULT '[]'::jsonb,
  broker_timezone         text DEFAULT 'Etc/UTC' NOT NULL,
  daily_reset_hour_utc    integer DEFAULT 0 NOT NULL,
  allow_consistency_rule  boolean DEFAULT true NOT NULL,
  allow_newstrade_lock    boolean DEFAULT false NOT NULL,
  allow_news_trade_lock   boolean DEFAULT false NOT NULL,
  is_active               boolean DEFAULT true NOT NULL,
  order_index             integer DEFAULT 0 NOT NULL,
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX firm_presets_firm_idx ON public.firm_presets(firm_id);

-- challenges (la tabla principal del motor)
CREATE TABLE public.challenges (
  id                        text PRIMARY KEY NOT NULL,
  user_id                   uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  firm_id                   text REFERENCES public.firms(id) ON DELETE SET NULL,
  preset_id                 text REFERENCES public.firm_presets(id) ON DELETE SET NULL,
  market                    public.market_type NOT NULL,
  current_phase             integer DEFAULT 0 NOT NULL,
  status                    public.challenge_status DEFAULT 'draft' NOT NULL,
  initial_balance           numeric(18,2) NOT NULL,
  current_balance           numeric(18,2) NOT NULL,
  current_equity            numeric(18,2) NOT NULL,
  peak_equity               numeric(18,2) NOT NULL,
  start_daily_balance       numeric(18,2),
  daily_pnl                 numeric(18,2) DEFAULT 0 NOT NULL,
  total_pnl                 numeric(18,2) DEFAULT 0 NOT NULL,
  total_pnl_pct             numeric(10,6) DEFAULT 0 NOT NULL,
  daily_drawdown_pct        numeric(10,6) DEFAULT 0 NOT NULL,
  max_drawdown_pct          numeric(10,6) DEFAULT 0 NOT NULL,
  trading_days_count        integer DEFAULT 0 NOT NULL,
  closed_trades_ids         text[] DEFAULT '{}'::text[] NOT NULL,
  last_trade_date           date,
  ea_last_report_at         timestamptz,
  broker_server_timezone    text DEFAULT 'Etc/UTC' NOT NULL,
  link_method               public.account_link_method NOT NULL,
  report_key_hash           text NOT NULL,
  started_at                timestamptz,
  created_at                timestamptz DEFAULT now() NOT NULL,
  updated_at                timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX challenges_user_idx   ON public.challenges(user_id);
CREATE INDEX challenges_firm_idx   ON public.challenges(firm_id);
CREATE INDEX challenges_status_idx ON public.challenges(status);

-- equity_snapshots (1 fila por cada report del EA, ~8k rows/mes por desafío)
CREATE TABLE public.equity_snapshots (
  id            bigserial PRIMARY KEY,
  challenge_id  text REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  balance       numeric(18,2) NOT NULL,
  equity        numeric(18,2) NOT NULL,
  daily_pnl     numeric(18,2) NOT NULL,
  peak_equity   numeric(18,2) NOT NULL,
  open_count    integer DEFAULT 0 NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX snapshots_challenge_idx ON public.equity_snapshots(challenge_id, created_at);

-- trades (historial cerrados y abiertos snapshot)
CREATE TABLE public.trades (
  id            text PRIMARY KEY NOT NULL,
  challenge_id  text REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  external_id   text NOT NULL,
  symbol        text NOT NULL,
  side          text NOT NULL,
  volume        numeric(18,4) NOT NULL,
  open_price    numeric(18,6) NOT NULL,
  close_price   numeric(18,6),
  open_time     timestamptz NOT NULL,
  close_time    timestamptz,
  pnl           numeric(18,2),
  swap          numeric(18,2) DEFAULT 0,
  commission    numeric(18,2) DEFAULT 0,
  is_open       boolean DEFAULT false NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX trades_challenge_idx ON public.trades(challenge_id, close_time);

-- rule_events (alerts / failed / approved del motor de reglas)
CREATE TABLE public.rule_events (
  id             text PRIMARY KEY NOT NULL,
  challenge_id   text REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  type           public.rule_event_type NOT NULL,
  message        text NOT NULL,
  severity       text NOT NULL DEFAULT 'info',
  snapshot_json  jsonb,
  created_at     timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX events_challenge_idx ON public.rule_events(challenge_id, created_at);

-- notifications (email/in-app/push)
CREATE TABLE public.notifications (
  id           text PRIMARY KEY NOT NULL,
  user_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id text REFERENCES public.challenges(id) ON DELETE SET NULL,
  channel      public.notification_channel NOT NULL,
  subject      text,
  body         text NOT NULL,
  is_read      boolean DEFAULT false NOT NULL,
  sent_at      timestamptz,
  created_at   timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, is_read);

-- ─────────────────────────────────────────────────────────────────────
-- (3) TRIGGERS · set_updated_at + handle_new_user
-- ─────────────────────────────────────────────────────────────────────

CREATE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON public.profiles         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_firms_updated_at     BEFORE UPDATE ON public.firms            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_presets_updated_at   BEFORE UPDATE ON public.firm_presets     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_challs_updated_at    BEFORE UPDATE ON public.challenges       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- (4) RLS · Habilitamos en 8 tablas + policies owner/admin escalado
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_presets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equity_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- Helper policy cond. admin
CREATE POLICY profiles_own         ON public.profiles          FOR ALL USING (auth.uid() = id);

CREATE POLICY firms_read_all       ON public.firms             FOR SELECT USING (true);
CREATE POLICY firms_admin_all      ON public.firms             FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY presets_read_all     ON public.firm_presets      FOR SELECT USING (true);
CREATE POLICY presets_admin_all    ON public.firm_presets      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY challenges_own       ON public.challenges        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY challenges_admin_all ON public.challenges        FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY snapshots_own        ON public.equity_snapshots  FOR ALL USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND (c.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))));
CREATE POLICY trades_own           ON public.trades            FOR ALL USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND (c.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))));
CREATE POLICY events_own           ON public.rule_events       FOR ALL USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND (c.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))));
CREATE POLICY notifications_own    ON public.notifications     FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ─────────────────────────────────────────────────────────────────────
-- (5) Realtime publications (4 tablas en vivo dashboard)
-- ─────────────────────────────────────────────────────────────────────

DROP PUBLICATION IF EXISTS supabase_realtime;

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete');
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equity_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rule_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMIT;
