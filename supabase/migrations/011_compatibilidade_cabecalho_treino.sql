-- Completa o cabecalho de planos_treino usado pelo fluxo atual.
ALTER TABLE public.planos_treino
  ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Plano de treino',
  ADD COLUMN IF NOT EXISTS dias_por_semana INTEGER NOT NULL DEFAULT 2;

CREATE INDEX IF NOT EXISTS idx_planos_treino_usuario_ativo
  ON public.planos_treino(usuario_id, ativo, criado_em DESC);
