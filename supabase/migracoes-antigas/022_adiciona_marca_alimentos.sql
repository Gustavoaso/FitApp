-- ============================================================
-- MIGRATION 022: ADICIONA MARCA NA BASE DE ALIMENTOS
-- ============================================================

-- Adiciona a coluna para armazenar a marca do produto (ex: Nestlé, Barilla)
ALTER TABLE public.base_alimentos ADD COLUMN IF NOT EXISTS marca TEXT;
