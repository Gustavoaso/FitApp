-- Compatibilidade com o segundo formato legado de metas, que usa o sufixo _g.
ALTER TABLE public.planos_dieta
  ADD COLUMN IF NOT EXISTS meta_proteinas_g INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_carboidratos_g INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_gorduras_g INTEGER NOT NULL DEFAULT 0;
