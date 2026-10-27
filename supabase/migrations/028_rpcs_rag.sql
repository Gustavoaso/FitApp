-- ============================================================
-- MIGRATION 028: RPCs PARA BUSCA SEMÂNTICA (RAG)
-- ============================================================
-- Funções Postgres usadas pela Edge Function gerar-plano
-- pra recuperar exercícios, alimentos e conhecimento
-- via similaridade de vetores (pgvector, cosine distance).
-- Embeddings: mxbai-embed-large, 1024 dimensões.
-- ============================================================

-- Garante extensão ativa
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. EXERCÍCIOS ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION buscar_exercicios_rag(
  query_embedding  vector(1024),
  filtro_equipamento text[],
  filtro_nivel      text[],
  limite           int DEFAULT 20
)
RETURNS TABLE (
  id               uuid,
  nome             text,
  grupo_primario   text,
  grupo_secundario text,
  equipamento      text,
  nivel            text,
  tipo_movimento   text,
  padrao_series    jsonb,
  similaridade     float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    nome,
    grupo_primario,
    grupo_secundario,
    equipamento,
    nivel,
    tipo_movimento,
    padrao_series,
    1 - (embedding <=> query_embedding) AS similaridade
  FROM base_exercicios
  WHERE
    embedding IS NOT NULL
    AND equipamento = ANY(filtro_equipamento)
    AND nivel       = ANY(filtro_nivel)
  ORDER BY embedding <=> query_embedding
  LIMIT limite;
$$;

-- ── 2. ALIMENTOS ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION buscar_alimentos_rag(
  query_embedding    vector(1024),
  categorias_excluidas text[],
  limite             int DEFAULT 20
)
RETURNS TABLE (
  id                uuid,
  nome              text,
  categoria         text,
  calorias_100g     numeric,
  proteinas_100g    numeric,
  carboidratos_100g numeric,
  gorduras_100g     numeric,
  porcao_descricao  text,
  porcao_gramas     numeric,
  similaridade      float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    nome,
    categoria,
    calorias_100g,
    proteinas_100g,
    carboidratos_100g,
    gorduras_100g,
    porcao_descricao,
    porcao_gramas,
    1 - (embedding <=> query_embedding) AS similaridade
  FROM base_alimentos
  WHERE
    embedding IS NOT NULL
    AND (
      categorias_excluidas IS NULL
      OR categoria != ALL(categorias_excluidas)
    )
  ORDER BY embedding <=> query_embedding
  LIMIT limite;
$$;

-- ── 3. CONHECIMENTO ────────────────────────────────────────
CREATE OR REPLACE FUNCTION buscar_conhecimento_rag(
  query_embedding vector(1024),
  filtro_tipo     text,
  limite          int DEFAULT 3
)
RETURNS TABLE (
  id           int,
  tipo         text,
  titulo       text,
  fonte        text,
  conteudo     text,
  similaridade float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    tipo,
    titulo,
    fonte,
    conteudo,
    1 - (embedding <=> query_embedding) AS similaridade
  FROM base_conhecimento
  WHERE
    embedding IS NOT NULL
    AND (filtro_tipo IS NULL OR tipo = filtro_tipo)
  ORDER BY embedding <=> query_embedding
  LIMIT limite;
$$;
