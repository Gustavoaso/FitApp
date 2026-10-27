-- ============================================================
-- MIGRATION 005: TABELAS E CAMPOS PARA IA E SINCRONIZAÇÃO
-- ============================================================
-- Prepara a infraestrutura para o sistema de geração de planos
-- com IA (Gemini), sincronização da TacoAPI e ExerciseDB.
-- Autossuficiente: cria as tabelas base caso ainda não existam.
-- ============================================================

-- Extensão para gerar UUIDs automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────
-- TABELA: base_exercicios
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS base_exercicios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  grupo_primario TEXT NOT NULL,
  grupo_secundario TEXT,
  equipamento TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'iniciante',
  instrucoes TEXT NOT NULL DEFAULT ''
);

ALTER TABLE base_exercicios
  ADD COLUMN IF NOT EXISTS id_externo TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS gif_url TEXT;

CREATE INDEX IF NOT EXISTS idx_exercicios_id_externo ON base_exercicios(id_externo);

-- ────────────────────────────────────
-- TABELA: base_alimentos
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS base_alimentos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  calorias_100g NUMERIC(7,1) NOT NULL DEFAULT 0,
  proteinas_100g NUMERIC(6,1) NOT NULL DEFAULT 0,
  carboidratos_100g NUMERIC(6,1) NOT NULL DEFAULT 0,
  gorduras_100g NUMERIC(6,1) NOT NULL DEFAULT 0,
  fibras_100g NUMERIC(6,1),
  porcao_descricao TEXT,
  porcao_gramas NUMERIC(6,1)
);

ALTER TABLE base_alimentos
  ADD COLUMN IF NOT EXISTS id_externo TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_alimentos_id_externo ON base_alimentos(id_externo);

-- ────────────────────────────────────
-- TABELA: planos_ia_gerados
-- ────────────────────────────────────
CREATE TABLE IF NOT EXISTS planos_ia_gerados (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  respostas_questionario JSONB NOT NULL,
  plano_gerado JSONB NOT NULL,
  modelo_ia TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_planos_ia_usuario ON planos_ia_gerados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_planos_ia_criado ON planos_ia_gerados(criado_em DESC);
