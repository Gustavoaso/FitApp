-- ============================================================
-- MIGRATION 003: TABELAS DE DIETA
-- ============================================================
-- Cria a estrutura para planos alimentares e registro de
-- refeições consumidas.
--
-- HIERARQUIA:
-- planos_dieta (plano alimentar diário)
--   └── refeicoes_plano (uma refeição: café, almoço, etc.)
--        └── alimentos_refeicao (alimento com porção e macros)
--
-- refeicoes_registradas (registro real de consumo)
-- registros_agua (registro de consumo de água)
-- ============================================================

-- ────────────────────────────────────
-- TABELA: base_alimentos
-- ────────────────────────────────────
-- Base de dados de alimentos (TACO + extras).
-- Valores nutricionais por 100g de parte comestível.

CREATE TABLE base_alimentos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  calorias_100g NUMERIC(7,1) NOT NULL,    -- kcal por 100g
  proteinas_100g NUMERIC(6,1) NOT NULL,   -- gramas por 100g
  carboidratos_100g NUMERIC(6,1) NOT NULL,
  gorduras_100g NUMERIC(6,1) NOT NULL,
  fibras_100g NUMERIC(6,1),               -- Opcional
  porcao_descricao TEXT,                   -- Ex: "1 colher de sopa"
  porcao_gramas NUMERIC(6,1)              -- Ex: 30 (gramas da porção)
);

-- Índice para busca fuzzy por nome
CREATE INDEX idx_alimentos_nome_trgm ON base_alimentos USING gin(nome gin_trgm_ops);
-- Índice para filtro por categoria
CREATE INDEX idx_alimentos_categoria ON base_alimentos(categoria);

-- ────────────────────────────────────
-- TABELA: planos_dieta
-- ────────────────────────────────────

CREATE TABLE planos_dieta (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calorias_alvo INTEGER NOT NULL,
  proteinas_alvo_g INTEGER NOT NULL,
  carboidratos_alvo_g INTEGER NOT NULL,
  gorduras_alvo_g INTEGER NOT NULL,
  meta_agua_ml INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_planos_dieta_usuario ON planos_dieta(usuario_id);

-- ────────────────────────────────────
-- TABELA: refeicoes_plano
-- ────────────────────────────────────

CREATE TABLE refeicoes_plano (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plano_dieta_id UUID REFERENCES planos_dieta(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia')),
  nome TEXT NOT NULL,           -- Ex: "Café da Manhã"
  horario_sugerido TEXT         -- Ex: "07:00"
);

CREATE INDEX idx_refeicoes_plano_dieta ON refeicoes_plano(plano_dieta_id);

-- ────────────────────────────────────
-- TABELA: alimentos_refeicao
-- ────────────────────────────────────
-- Alimento dentro de uma refeição do plano, com porção e macros calculados.

CREATE TABLE alimentos_refeicao (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  refeicao_plano_id UUID REFERENCES refeicoes_plano(id) ON DELETE CASCADE NOT NULL,
  alimento_id UUID REFERENCES base_alimentos(id) NOT NULL,
  nome TEXT NOT NULL,                      -- Cópia para exibição rápida
  porcao_gramas NUMERIC(6,1) NOT NULL,
  calorias NUMERIC(7,1) NOT NULL,
  proteinas NUMERIC(6,1) NOT NULL,
  carboidratos NUMERIC(6,1) NOT NULL,
  gorduras NUMERIC(6,1) NOT NULL
);

CREATE INDEX idx_alimentos_refeicao ON alimentos_refeicao(refeicao_plano_id);

-- ────────────────────────────────────
-- TABELA: refeicoes_registradas
-- ────────────────────────────────────
-- Registro real do que o usuário comeu.

CREATE TABLE refeicoes_registradas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia')),
  alimentos JSONB NOT NULL DEFAULT '[]',
  -- Array de { alimentoId, nome, porcaoGramas, calorias, proteinas, carboidratos, gorduras }
  total_calorias NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_proteinas NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_carboidratos NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_gorduras NUMERIC(6,1) NOT NULL DEFAULT 0,
  registrado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_refeicoes_reg_usuario ON refeicoes_registradas(usuario_id);
CREATE INDEX idx_refeicoes_reg_data ON refeicoes_registradas(data);

-- ────────────────────────────────────
-- TABELA: registros_agua
-- ────────────────────────────────────

CREATE TABLE registros_agua (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ml INTEGER NOT NULL DEFAULT 0,
  meta_ml INTEGER NOT NULL,
  UNIQUE(usuario_id, data)  -- Só 1 registro de água por dia
);

CREATE INDEX idx_agua_usuario_data ON registros_agua(usuario_id, data);
