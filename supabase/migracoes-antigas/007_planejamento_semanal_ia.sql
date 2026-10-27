-- Garante as tabelas de planejamento caso o banco remoto tenha sido
-- inicializado sem a migration 003, sem apagar dados existentes.
CREATE TABLE IF NOT EXISTS public.planos_dieta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calorias_alvo INTEGER NOT NULL,
  proteinas_alvo_g INTEGER NOT NULL,
  carboidratos_alvo_g INTEGER NOT NULL,
  gorduras_alvo_g INTEGER NOT NULL,
  meta_agua_ml INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.refeicoes_plano (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_dieta_id UUID REFERENCES public.planos_dieta(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  horario_sugerido TEXT
);

CREATE TABLE IF NOT EXISTS public.alimentos_refeicao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  refeicao_plano_id UUID REFERENCES public.refeicoes_plano(id) ON DELETE CASCADE NOT NULL,
  alimento_id UUID REFERENCES public.base_alimentos(id) NOT NULL,
  nome TEXT NOT NULL,
  porcao_gramas NUMERIC(6,1) NOT NULL,
  calorias NUMERIC(7,1) NOT NULL,
  proteinas NUMERIC(6,1) NOT NULL,
  carboidratos NUMERIC(6,1) NOT NULL,
  gorduras NUMERIC(6,1) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_planos_dieta_usuario ON public.planos_dieta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refeicoes_plano_dieta ON public.refeicoes_plano(plano_dieta_id);
CREATE INDEX IF NOT EXISTS idx_alimentos_refeicao ON public.alimentos_refeicao(refeicao_plano_id);

-- Adiciona o dia da semana às refeições planejadas.
-- Um plano de dieta contém a rotina diária replicada de segunda a domingo.
ALTER TABLE refeicoes_plano
  ADD COLUMN IF NOT EXISTS dia_semana INTEGER NOT NULL DEFAULT 1
  CHECK (dia_semana >= 0 AND dia_semana <= 6);

CREATE INDEX IF NOT EXISTS idx_refeicoes_plano_dia
  ON refeicoes_plano(plano_dieta_id, dia_semana);

ALTER TABLE public.planos_dieta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refeicoes_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos_refeicao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios podem ver seus planos de dieta" ON public.planos_dieta;
CREATE POLICY "Usuarios podem ver seus planos de dieta"
  ON public.planos_dieta FOR SELECT USING (auth.uid() = usuario_id);
DROP POLICY IF EXISTS "Usuarios podem criar seus planos de dieta" ON public.planos_dieta;
CREATE POLICY "Usuarios podem criar seus planos de dieta"
  ON public.planos_dieta FOR INSERT WITH CHECK (auth.uid() = usuario_id);
DROP POLICY IF EXISTS "Usuarios podem atualizar seus planos de dieta" ON public.planos_dieta;
CREATE POLICY "Usuarios podem atualizar seus planos de dieta"
  ON public.planos_dieta FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem ver suas refeicoes planejadas" ON public.refeicoes_plano;
CREATE POLICY "Usuarios podem ver suas refeicoes planejadas"
  ON public.refeicoes_plano FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.planos_dieta
    WHERE planos_dieta.id = refeicoes_plano.plano_dieta_id
      AND planos_dieta.usuario_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Usuarios podem criar suas refeicoes planejadas" ON public.refeicoes_plano;
CREATE POLICY "Usuarios podem criar suas refeicoes planejadas"
  ON public.refeicoes_plano FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.planos_dieta
    WHERE planos_dieta.id = refeicoes_plano.plano_dieta_id
      AND planos_dieta.usuario_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuarios podem ver seus alimentos planejados" ON public.alimentos_refeicao;
CREATE POLICY "Usuarios podem ver seus alimentos planejados"
  ON public.alimentos_refeicao FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.refeicoes_plano
    JOIN public.planos_dieta ON planos_dieta.id = refeicoes_plano.plano_dieta_id
    WHERE refeicoes_plano.id = alimentos_refeicao.refeicao_plano_id
      AND planos_dieta.usuario_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Usuarios podem criar seus alimentos planejados" ON public.alimentos_refeicao;
CREATE POLICY "Usuarios podem criar seus alimentos planejados"
  ON public.alimentos_refeicao FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.refeicoes_plano
    JOIN public.planos_dieta ON planos_dieta.id = refeicoes_plano.plano_dieta_id
    WHERE refeicoes_plano.id = alimentos_refeicao.refeicao_plano_id
      AND planos_dieta.usuario_id = auth.uid()
  ));
