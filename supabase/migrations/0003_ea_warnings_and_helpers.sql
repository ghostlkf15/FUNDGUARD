-- 0003: Extender enum rule_event_type con warnings de Bullfy (scalping) y FTMO (best_day_ratio consistency rule)
-- Además añadir campos faltantes a trades para scalping (duration_ms) y quitar NOT NULL de report_key_hash temporalmente en challenges
-- para permitir crear desafíos sin report_key en modo draft.

BEGIN;

-- 1) Añadir warnings al enum rule_event_type
ALTER TYPE public.rule_event_type ADD VALUE IF NOT EXISTS 'warning_best_day_ratio';
ALTER TYPE public.rule_event_type ADD VALUE IF NOT EXISTS 'warning_scalping';

-- 2) Hacer report_key_hash nullable para crear desafíos en modo 'draft' sin EA linkeado
ALTER TABLE public.challenges ALTER COLUMN report_key_hash DROP NOT NULL;

-- 3) Añadir campo duration_ms a trades para scalping rule (P.6 §5.4 Bullfy)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS duration_ms bigint;

-- 4) Índice adicional por fecha de snapshot (para gráficos Recharts rápido)
CREATE INDEX IF NOT EXISTS snapshots_created_desc_idx ON public.equity_snapshots(challenge_id, created_at DESC);

-- 5) Índice trades por external_id (evitar duplicados en upserts desde EA)
CREATE INDEX IF NOT EXISTS trades_challenge_external_idx ON public.trades(challenge_id, external_id);

COMMIT;
