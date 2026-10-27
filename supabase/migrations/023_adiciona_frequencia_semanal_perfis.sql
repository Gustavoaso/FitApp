-- ============================================================
-- MIGRATION 023: ADICIONA FREQUENCIA SEMANAL NO PERFIL
-- ============================================================

ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS frequencia_semanal INTEGER DEFAULT 4;
