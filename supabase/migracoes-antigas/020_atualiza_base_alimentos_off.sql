-- ============================================================
-- MIGRATION 020: ATUALIZA BASE ALIMENTOS (OPEN FOOD FACTS)
-- ============================================================
-- Adiciona suporte para código de barras, que é o identificador 
-- primário no Open Food Facts.

ALTER TABLE base_alimentos
ADD COLUMN codigo_barras TEXT UNIQUE;

-- Índice para busca super rápida quando o usuário usar o leitor de barras
CREATE INDEX idx_alimentos_codigo_barras ON base_alimentos(codigo_barras);

-- Nota: Como mantemos as constraints NOT NULL originais para garantir
-- integridade (calorias, proteinas, etc e categoria), o script de importação
-- Node.js será responsável por injetar dados default ou ignorar produtos incompletos.
