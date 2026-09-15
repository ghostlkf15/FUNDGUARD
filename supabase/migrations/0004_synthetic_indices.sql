-- =========================================================================
-- MIGRACIÓN 0004 · Synthetic Indices (Deriv / DBot)
-- -------------------------------------------------------------------------
-- Importante (Postgres): ALTER TYPE ... ADD VALUE debe ejecutarse ANTES y
-- fuera de cualquier BEGIN/COMMIT que use el nuevo valor. Este fichero se
-- envía con múltiples statements independientes (cada uno autocommit).
-- =========================================================================

-- STEP 1: ampliar enum (statement 1, autocommit)
ALTER TYPE public.market_type ADD VALUE IF NOT EXISTS 'synthetic_indices';
