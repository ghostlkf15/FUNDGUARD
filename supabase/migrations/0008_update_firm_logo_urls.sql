-- =========================================================================
-- MIGRACIÓN 0008 · Actualizar logo_url a todas las firmas a partir de imágenes public/images
-- (firma Synthetic (Deriv) no tiene logo — queda NULL).
-- =========================================================================

BEGIN;

UPDATE public.firms SET logo_url = '/images/ftmo.png',               updated_at = NOW() WHERE id = 'firm-ftmo';
UPDATE public.firms SET logo_url = '/images/bullfy.jpg',             updated_at = NOW() WHERE id = 'firm-bullfy';
UPDATE public.firms SET logo_url = '/images/fxlivecapital.png',      updated_at = NOW() WHERE id = 'firm-fxlivecap';
UPDATE public.firms SET logo_url = '/images/upcommers.jpg',          updated_at = NOW() WHERE id = 'firm-upcomers-fx';
UPDATE public.firms SET logo_url = '/images/fundednext.png',         updated_at = NOW() WHERE id = 'firm-fundednext';
UPDATE public.firms SET logo_url = '/images/the5ers.jpg',            updated_at = NOW() WHERE id = 'firm-the5ers';
UPDATE public.firms SET logo_url = '/images/fundingpips.jpg',        updated_at = NOW() WHERE id = 'firm-fundingpips';

UPDATE public.firms SET logo_url = '/images/apex.png',               updated_at = NOW() WHERE id = 'firm-apex';
UPDATE public.firms SET logo_url = '/images/lucid.jpg',              updated_at = NOW() WHERE id = 'firm-lucid';
UPDATE public.firms SET logo_url = '/images/upcommers.jpg',          updated_at = NOW() WHERE id = 'firm-upcomers-fu';
UPDATE public.firms SET logo_url = '/images/topstep.png',            updated_at = NOW() WHERE id = 'firm-topstep';
UPDATE public.firms SET logo_url = '/images/myfundedfutures.png',    updated_at = NOW() WHERE id = 'firm-myfundedfu';

UPDATE public.firms SET logo_url = '/images/upcommers.jpg',          updated_at = NOW() WHERE id = 'firm-upcomers-crypto';

UPDATE public.firms SET logo_url = NULL,                             updated_at = NOW() WHERE id = 'firm-synthetic';
UPDATE public.firms SET logo_url = '/images/fxlivecapital.png',      updated_at = NOW() WHERE id = 'firm-fxlivecap-synth';

COMMIT;
