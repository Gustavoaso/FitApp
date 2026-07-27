-- ============================================================
-- MIGRATION 001: TABELAS INICIAIS
-- ============================================================
-- Cria as tabelas de usuário e perfil.
--
-- CONCEITOS SQL IMPORTANTES:
--
-- CREATE TABLE: cria uma tabela no banco de dados.
-- Uma tabela é como uma planilha: linhas são registros,
-- colunas são campos.
--
-- uuid: tipo de dado que gera um identificador único universal.
-- Ex: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
-- Usamos em vez de números sequenciais (1, 2, 3) porque são
-- mais seguros (não dá para adivinhar IDs) e funcionam bem
-- em sistemas distribuídos.
--
-- PRIMARY KEY: identifica unicamente cada linha da tabela.
--
-- REFERENCES: cria uma "chave estrangeira" — garante que o
-- valor existe na outra tabela. Ex: perfil.usuario_id deve
-- existir na tabela auth.users.
--
-- DEFAULT: valor padrão se o campo não for preenchido.
--
-- NOT NULL: o campo é obrigatório (não pode ser vazio).
--
-- CHECK: validação no banco — ex: idade entre 14 e 100.
-- ============================================================

-- Extensão para gerar UUIDs automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensão para busca fuzzy (buscar "frango" digitando "frnago")
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ────────────────────────────────────
-- TABELA: perfis
-- ────────────────────────────────────
-- Dados físicos do usuário. Separada da tabela auth.users
-- (que é gerenciada pelo Supabase Auth) para não misturar
-- dados de autenticação com dados do app.

CREATE TABLE perfis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  idade INTEGER NOT NULL CHECK (idade >= 14 AND idade <= 100),
  sexo TEXT NOT NULL CHECK (sexo IN ('masculino', 'feminino')),
  peso_kg NUMERIC(5,1) NOT NULL CHECK (peso_kg >= 30 AND peso_kg <= 300),
  altura_cm NUMERIC(5,1) NOT NULL CHECK (altura_cm >= 100 AND altura_cm <= 250),
  gordura_corporal NUMERIC(4,1) CHECK (gordura_corporal >= 3 AND gordura_corporal <= 60),
  nivel_experiencia TEXT NOT NULL CHECK (nivel_experiencia IN ('iniciante', 'intermediario', 'avancado')),
  nivel_atividade TEXT NOT NULL CHECK (nivel_atividade IN ('sedentario', 'leve', 'moderado', 'ativo', 'muito_ativo')),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para buscar perfil pelo usuario_id (usado o tempo todo)
CREATE INDEX idx_perfis_usuario_id ON perfis(usuario_id);

-- ────────────────────────────────────
-- TABELA: questionarios
-- ────────────────────────────────────
-- Armazena as respostas completas do questionário.
-- Guardamos em JSONB para flexibilidade (se adicionarmos
-- novas perguntas, não precisamos alterar a tabela).

CREATE TABLE questionarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  respostas JSONB NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_questionarios_usuario_id ON questionarios(usuario_id);

-- ────────────────────────────────────
-- TRIGGER: atualizar atualizado_em automaticamente
-- ────────────────────────────────────
-- Sempre que um registro for atualizado, o campo atualizado_em
-- recebe a data/hora atual automaticamente.

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_perfis_atualizado_em
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();
