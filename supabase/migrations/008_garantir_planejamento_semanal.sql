-- Garante que projetos cujo schema remoto ficou atrasado tenham a coluna
-- necessária para persistir a dieta em todos os dias da semana.
ALTER TABLE public.refeicoes_plano
  ADD COLUMN IF NOT EXISTS dia_semana INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.refeicoes_plano'::regclass
      AND conname = 'refeicoes_plano_dia_semana_check'
  ) THEN
    ALTER TABLE public.refeicoes_plano
      ADD CONSTRAINT refeicoes_plano_dia_semana_check
      CHECK (dia_semana >= 0 AND dia_semana <= 6);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_refeicoes_plano_dia
  ON public.refeicoes_plano(plano_dieta_id, dia_semana);
