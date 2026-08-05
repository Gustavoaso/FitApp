-- Compatibilidade com versões antigas das tabelas de treino.
CREATE TABLE IF NOT EXISTS public.dias_treino (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_treino_id UUID NOT NULL,
  dia_semana INTEGER,
  nome TEXT
);

CREATE TABLE IF NOT EXISTS public.exercicios_plano (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_treino_id UUID NOT NULL,
  exercicio_id UUID,
  nome TEXT,
  ordem INTEGER,
  series JSONB
);

ALTER TABLE public.dias_treino
  ADD COLUMN IF NOT EXISTS plano_treino_id UUID,
  ADD COLUMN IF NOT EXISTS dia_semana INTEGER,
  ADD COLUMN IF NOT EXISTS nome TEXT;

ALTER TABLE public.exercicios_plano
  ADD COLUMN IF NOT EXISTS dia_treino_id UUID,
  ADD COLUMN IF NOT EXISTS exercicio_id UUID,
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS ordem INTEGER,
  ADD COLUMN IF NOT EXISTS series JSONB;

CREATE INDEX IF NOT EXISTS idx_dias_treino_plano_compat
  ON public.dias_treino(plano_treino_id);
CREATE INDEX IF NOT EXISTS idx_exercicios_plano_dia_compat
  ON public.exercicios_plano(dia_treino_id);
