-- Compatibilidade com a nomenclatura usada pelo schema legado de dieta.
ALTER TABLE public.planos_dieta
  ADD COLUMN IF NOT EXISTS meta_calorias INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_proteinas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_carboidratos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_gorduras INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_agua INTEGER NOT NULL DEFAULT 0;
