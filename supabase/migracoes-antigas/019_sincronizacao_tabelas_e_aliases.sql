-- ============================================================
-- MIGRATION 019: SINCRONIZAÇÃO DE TABELAS, ALIASES E CAMPOS EXPANDIDOS
-- ============================================================
-- Resolve todas as incompatibilidades identificadas entre o código do app e o Supabase:
-- 1. Cria a tabela historico_peso
-- 2. Cria a tabela historico_series_executadas
-- 3. Cria a tabela registro_refeicoes
-- 4. Expande a tabela perfis com objetivo, frequencia_semanal, sistema_unidades e preferencias_json
-- ============================================================

-- 1. Tabela: historico_peso
CREATE TABLE IF NOT EXISTS public.historico_peso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  peso_kg NUMERIC(5,1) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_historico_peso_usuario_data ON public.historico_peso(usuario_id, data);

-- 2. Tabela: historico_series_executadas
CREATE TABLE IF NOT EXISTS public.historico_series_executadas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercicio_id TEXT NOT NULL,
  nome_exercicio TEXT NOT NULL,
  numero_serie INTEGER NOT NULL,
  carga_kg NUMERIC(5,1) NOT NULL DEFAULT 0,
  repeticoes INTEGER NOT NULL DEFAULT 0,
  executado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_series_executadas_usuario ON public.historico_series_executadas(usuario_id, exercicio_id);

-- 3. Tabela: registro_refeicoes
CREATE TABLE IF NOT EXISTS public.registro_refeicoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  id_refeicao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  concluida BOOLEAN DEFAULT FALSE NOT NULL,
  alimentos JSONB NOT NULL DEFAULT '[]',
  registrado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registro_refeicoes_usuario_data ON public.registro_refeicoes(usuario_id, data);

-- 4. Expansão de colunas na tabela perfis
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS objetivo TEXT,
  ADD COLUMN IF NOT EXISTS frequencia_semanal INTEGER,
  ADD COLUMN IF NOT EXISTS sistema_unidades TEXT DEFAULT 'metrico',
  ADD COLUMN IF NOT EXISTS preferencias_json JSONB DEFAULT '{}'::jsonb;
