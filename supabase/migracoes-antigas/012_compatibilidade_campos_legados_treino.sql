-- Mantém compatibilidade com instalações que exigem os campos legados
-- no registro principal de planos_treino.
ALTER TABLE public.planos_treino
  ADD COLUMN IF NOT EXISTS dia_semana TEXT NOT NULL DEFAULT 'semanal',
  ADD COLUMN IF NOT EXISTS foco TEXT NOT NULL DEFAULT 'Plano de treino',
  ADD COLUMN IF NOT EXISTS exercicios JSONB NOT NULL DEFAULT '[]'::jsonb;
