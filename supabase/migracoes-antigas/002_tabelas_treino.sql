-- ============================================================
-- MIGRATION 002: TABELAS DE TREINO
-- ============================================================
-- Cria a estrutura para planos de treino e registro de sessões.
--
-- HIERARQUIA:
-- planos_treino (plano semanal)
--   └── dias_treino (um dia da semana)
--        └── exercicios_plano (exercício com séries/reps)
--
-- sessoes_treino (registro de uma sessão executada)
--   └── series_executadas (cada série com carga real usada)
-- ============================================================

-- ────────────────────────────────────
-- TABELA: base_exercicios
-- ────────────────────────────────────
-- Base de dados de todos os exercícios disponíveis no app.
-- Populada via seed (arquivo JSON importado).
-- Não é editável pelo usuário — é referência.

CREATE TABLE base_exercicios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  grupo_primario TEXT NOT NULL,
  grupo_secundario TEXT,
  equipamento TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  instrucoes TEXT NOT NULL DEFAULT ''
);

-- Índice para busca por nome (fuzzy search com pg_trgm)
CREATE INDEX idx_exercicios_nome_trgm ON base_exercicios USING gin(nome gin_trgm_ops);
-- Índice para filtro por grupo muscular
CREATE INDEX idx_exercicios_grupo ON base_exercicios(grupo_primario);

-- ────────────────────────────────────
-- TABELA: planos_treino
-- ────────────────────────────────────

CREATE TABLE planos_treino (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  dias_por_semana INTEGER NOT NULL CHECK (dias_por_semana >= 2 AND dias_por_semana <= 6),
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_planos_treino_usuario ON planos_treino(usuario_id);

-- ────────────────────────────────────
-- TABELA: dias_treino
-- ────────────────────────────────────

CREATE TABLE dias_treino (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plano_treino_id UUID REFERENCES planos_treino(id) ON DELETE CASCADE NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  nome TEXT NOT NULL  -- Ex: "Peito + Tríceps"
);

CREATE INDEX idx_dias_treino_plano ON dias_treino(plano_treino_id);

-- ────────────────────────────────────
-- TABELA: exercicios_plano
-- ────────────────────────────────────
-- Um exercício dentro de um dia de treino, com suas séries.
-- As séries ficam em JSONB para simplicidade (evita uma tabela
-- extra só para séries do plano).

CREATE TABLE exercicios_plano (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dia_treino_id UUID REFERENCES dias_treino(id) ON DELETE CASCADE NOT NULL,
  exercicio_id UUID REFERENCES base_exercicios(id) NOT NULL,
  nome TEXT NOT NULL,          -- Cópia do nome para exibição rápida
  ordem INTEGER NOT NULL,      -- Posição no dia (1, 2, 3...)
  series JSONB NOT NULL        -- Array de { numero, repeticoes, cargaKg, descansoSegundos }
);

CREATE INDEX idx_exercicios_plano_dia ON exercicios_plano(dia_treino_id);

-- ────────────────────────────────────
-- TABELA: sessoes_treino
-- ────────────────────────────────────
-- Registro de cada sessão de treino executada pelo usuário.

CREATE TABLE sessoes_treino (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plano_treino_id UUID REFERENCES planos_treino(id) NOT NULL,
  dia_treino_id UUID REFERENCES dias_treino(id) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  iniciado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  finalizado_em TIMESTAMPTZ,
  exercicios_executados JSONB NOT NULL DEFAULT '[]'
  -- Array de { exercicioPlanoId, nome, series: [{ numero, repeticoes, cargaKg, concluida }] }
);

CREATE INDEX idx_sessoes_usuario ON sessoes_treino(usuario_id);
CREATE INDEX idx_sessoes_data ON sessoes_treino(data);
