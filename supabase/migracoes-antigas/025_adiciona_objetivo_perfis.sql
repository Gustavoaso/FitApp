-- ============================================================
-- MIGRATION 025: ADICIONA OBJETIVO NO PERFIL
-- ============================================================

ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS objetivo TEXT DEFAULT 'hipertrofia';
