-- ============================================================
-- MIGRATION 006: RECEITAS, FAVORITOS E EDIÇÃO MANUAL DO PLANO
-- ============================================================
-- Adiciona suporte a:
-- - receitas do usuário persistidas no banco
-- - alimentos favoritados pelo usuário
-- - snapshot editável do planejamento alimentar
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Receitas criadas pelo usuário
CREATE TABLE IF NOT EXISTS receitas_usuario (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  alimentos JSONB NOT NULL DEFAULT '[]',
  total_calorias NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_proteinas NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_carboidratos NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_gorduras NUMERIC(6,1) NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receitas_usuario ON receitas_usuario(usuario_id);

-- Favoritos por usuário e alimento base
CREATE TABLE IF NOT EXISTS alimentos_favoritos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alimento_id UUID REFERENCES base_alimentos(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(usuario_id, alimento_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON alimentos_favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_alimento ON alimentos_favoritos(alimento_id);

-- Snapshot editável do plano diário gerado pela IA
CREATE TABLE IF NOT EXISTS planos_dieta_editaveis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plano_ia_id UUID REFERENCES planos_ia_gerados(id) ON DELETE SET NULL,
  plano_json JSONB NOT NULL,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_planos_dieta_editaveis_usuario ON planos_dieta_editaveis(usuario_id);
CREATE INDEX IF NOT EXISTS idx_planos_dieta_editaveis_ativo ON planos_dieta_editaveis(usuario_id, ativo);

ALTER TABLE receitas_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE alimentos_favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_dieta_editaveis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios podem ver suas receitas" ON receitas_usuario;
CREATE POLICY "Usuarios podem ver suas receitas"
  ON receitas_usuario FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem criar suas receitas" ON receitas_usuario;
CREATE POLICY "Usuarios podem criar suas receitas"
  ON receitas_usuario FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar suas receitas" ON receitas_usuario;
CREATE POLICY "Usuarios podem atualizar suas receitas"
  ON receitas_usuario FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar suas receitas" ON receitas_usuario;
CREATE POLICY "Usuarios podem deletar suas receitas"
  ON receitas_usuario FOR DELETE
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem ver seus favoritos" ON alimentos_favoritos;
CREATE POLICY "Usuarios podem ver seus favoritos"
  ON alimentos_favoritos FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem criar favoritos" ON alimentos_favoritos;
CREATE POLICY "Usuarios podem criar favoritos"
  ON alimentos_favoritos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem remover favoritos" ON alimentos_favoritos;
CREATE POLICY "Usuarios podem remover favoritos"
  ON alimentos_favoritos FOR DELETE
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem ver seus planos editaveis" ON planos_dieta_editaveis;
CREATE POLICY "Usuarios podem ver seus planos editaveis"
  ON planos_dieta_editaveis FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem criar seus planos editaveis" ON planos_dieta_editaveis;
CREATE POLICY "Usuarios podem criar seus planos editaveis"
  ON planos_dieta_editaveis FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar seus planos editaveis" ON planos_dieta_editaveis;
CREATE POLICY "Usuarios podem atualizar seus planos editaveis"
  ON planos_dieta_editaveis FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
