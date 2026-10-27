-- ============================================================
-- MIGRATION 026: CAMPOS ADICIONAIS EM BASE_EXERCICIOS
-- ============================================================
-- Adiciona tipo_movimento (composto/isolado/funcional) e
-- padrao_series (JSONB com séries/reps/descanso padrão).
-- Usados pelo seletor RAG e pelo prompt da IA pra montar
-- divisões inteligentes.
-- ============================================================

ALTER TABLE base_exercicios
  ADD COLUMN IF NOT EXISTS tipo_movimento TEXT
    NOT NULL DEFAULT 'composto'
    CHECK (tipo_movimento IN ('composto', 'isolado', 'funcional'));

ALTER TABLE base_exercicios
  ADD COLUMN IF NOT EXISTS padrao_series JSONB
    NOT NULL DEFAULT '[{"series":3,"repeticoes":"8-12","descanso_seg":60}]';

-- Atualiza tipo_movimento dos exercícios isolados já existentes
UPDATE base_exercicios SET tipo_movimento = 'isolado' WHERE grupo_primario IN ('biceps', 'triceps', 'panturrilha', 'antebraco');
UPDATE base_exercicios SET tipo_movimento = 'isolado' WHERE nome ILIKE '%elevação lateral%' OR nome ILIKE '%elevação frontal%' OR nome ILIKE '%crucifixo%' OR nome ILIKE '%fly%' OR nome ILIKE '%extensora%' OR nome ILIKE '%flexora%' OR nome ILIKE '%rosca%' OR nome ILIKE '%encolhimento%' OR nome ILIKE '%adutora%' OR nome ILIKE '%abdutora%';
UPDATE base_exercicios SET tipo_movimento = 'funcional' WHERE grupo_primario = 'corpo_inteiro';
UPDATE base_exercicios SET tipo_movimento = 'funcional' WHERE nome ILIKE '%burpee%' OR nome ILIKE '%kettlebell%' OR nome ILIKE '%turkish%' OR nome ILIKE '%bear crawl%' OR nome ILIKE '%farmer%';

-- Atualiza padrao_series pra exercícios compostos pesados (menos reps, mais descanso)
UPDATE base_exercicios SET padrao_series = '[{"series":4,"repeticoes":"6-8","descanso_seg":120}]'
WHERE nome ILIKE '%agachamento livre%' OR nome ILIKE '%levantamento terra%' OR nome ILIKE '%supino reto com barra%' OR nome ILIKE '%desenvolvimento com barra%';

-- Atualiza padrao_series pra exercícios de isolamento (mais reps, menos descanso)
UPDATE base_exercicios SET padrao_series = '[{"series":3,"repeticoes":"12-15","descanso_seg":45}]'
WHERE tipo_movimento = 'isolado';

-- Atualiza padrao_series pra exercícios abdominais
UPDATE base_exercicios SET padrao_series = '[{"series":3,"repeticoes":"15-20","descanso_seg":30}]'
WHERE grupo_primario = 'abdomen';
