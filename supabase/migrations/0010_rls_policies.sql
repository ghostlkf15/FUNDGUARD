-- ========================================================================
-- 0010_rls_policies.sql
-- Seguridad por filas (RLS) para tablas usuario-user data.
-- Catalogos (firms, firm_presets) son public readonly (anon + auth).
-- Tablas user-scoped (challenges, rule_events, trades, equity_snapshots,
--   notifications, profiles) solo son accesibles si el requestee user.id
--   coincide con el user_id de la fila (o el creador via trigger profiles).
-- Service Role (SUPABASE_SERVICE_ROLE_KEY) siempre bypass RLS — usado en
--   /api/report, /api/worker/pull-crypto, server-actions insert presets.
-- ========================================================================

-- 1) Activar RLS en todas las tablas que lo soporten -----------------------

ALTER TABLE IF EXISTS public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.challenges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rule_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equity_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.firms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.firm_presets      ENABLE ROW LEVEL SECURITY;


-- 2) Tablas de catálogo: READONLY para anon y authenticated users ---------
--    Solo escritura/borrado desde service role o usuarios admin via policy admin.

CREATE POLICY IF NOT EXISTS firms_select_public
    ON public.firms
    FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS firm_presets_select_public
    ON public.firm_presets
    FOR SELECT
    USING (true);


-- 3) Profiles (1 row per auth.uid) ----------------------------------------
--    Inserción automática vía trigger on auth.users.created; actualización y
--    borrado solo por el propio usuario.

CREATE POLICY IF NOT EXISTS profiles_select_self
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS profiles_update_self
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS profiles_insert_self
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS profiles_delete_self
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);


-- 4) Challenges · scope challenge.user_id = auth.uid() --------------------

CREATE POLICY IF NOT EXISTS challenges_select_own
    ON public.challenges
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS challenges_insert_own
    ON public.challenges
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS challenges_update_own
    ON public.challenges
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS challenges_delete_own
    ON public.challenges
    FOR DELETE
    USING (auth.uid() = user_id);


-- 5) Child tables via challenge_id → join challenges.user_id --------------

CREATE POLICY IF NOT EXISTS rule_events_select_own
    ON public.rule_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = rule_events.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS rule_events_insert_own
    ON public.rule_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = rule_events.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS rule_events_update_own
    ON public.rule_events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = rule_events.challenge_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = rule_events.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS rule_events_delete_own
    ON public.rule_events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = rule_events.challenge_id
              AND c.user_id = auth.uid()
        )
    );


CREATE POLICY IF NOT EXISTS trades_select_own
    ON public.trades
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = trades.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS trades_insert_own
    ON public.trades
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = trades.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS trades_update_own
    ON public.trades
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = trades.challenge_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = trades.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS trades_delete_own
    ON public.trades
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = trades.challenge_id
              AND c.user_id = auth.uid()
        )
    );


CREATE POLICY IF NOT EXISTS equity_snapshots_select_own
    ON public.equity_snapshots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = equity_snapshots.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS equity_snapshots_insert_own
    ON public.equity_snapshots
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = equity_snapshots.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS equity_snapshots_update_own
    ON public.equity_snapshots
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = equity_snapshots.challenge_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = equity_snapshots.challenge_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS equity_snapshots_delete_own
    ON public.equity_snapshots
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = equity_snapshots.challenge_id
              AND c.user_id = auth.uid()
        )
    );


-- 6) Notifications direct user_id = auth.uid() ----------------------------

CREATE POLICY IF NOT EXISTS notifications_select_own
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS notifications_insert_own
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS notifications_update_own
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS notifications_delete_own
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);


-- 7) Admin-only write policies para firms / firm_presets ------------------
--    Solo users con profiles.is_admin = true pueden editar catálogos via RLS.
--    (De todas formas el panel admin usa server role key pero esto evita que
--    un atacante que se haga pasar por cualquiera escriba firms/firm_presets).

CREATE POLICY IF NOT EXISTS firms_insert_admin
    ON public.firms
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS firms_update_admin
    ON public.firms
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS firms_delete_admin
    ON public.firms
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );


CREATE POLICY IF NOT EXISTS firm_presets_insert_admin
    ON public.firm_presets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS firm_presets_update_admin
    ON public.firm_presets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

CREATE POLICY IF NOT EXISTS firm_presets_delete_admin
    ON public.firm_presets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );


-- 8) Garantía: perfil siempre exista via trigger auth.users ----------------
--    Si este trigger NO existe en la instancia, la migración 0000_init ya lo
--    debió crear. Lo re-aseguramos aquí.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created_create_profile'
    ) THEN
        EXECUTE $T$
            CREATE FUNCTION public.handle_new_user()
            RETURNS trigger
            LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
            AS $$
            BEGIN
                INSERT INTO public.profiles (id, full_name, is_admin, created_at, updated_at)
                VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)), false, now(), now())
                ON CONFLICT (id) DO NOTHING;
                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER on_auth_user_created_create_profile
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        $T$;
    END IF;
END $$;
