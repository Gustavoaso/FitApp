-- Compatibilidade com instalações antigas que já possuíam planos_treino,
-- mas sem os campos usados pelo fluxo atual de planejamento.
ALTER TABLE public.planos_treino
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_planos_treino_ativo
  ON public.planos_treino(usuario_id, ativo);
