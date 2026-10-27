-- Completa o cabecalho de planos_dieta usado pelo fluxo atual.
-- A migration e idempotente para bancos criados por versoes antigas.
ALTER TABLE public.planos_dieta
  ADD COLUMN IF NOT EXISTS calorias_alvo INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proteinas_alvo_g INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carboidratos_alvo_g INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gorduras_alvo_g INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_agua_ml INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_planos_dieta_usuario_ativo
  ON public.planos_dieta(usuario_id, ativo, criado_em DESC);
