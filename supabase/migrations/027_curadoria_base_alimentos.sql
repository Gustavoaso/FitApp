-- ============================================================
-- MIGRATION 027: CURADORIA E LIMPEZA DA BASE DE ALIMENTOS
-- ============================================================
-- 1. Remove 148 registros com macros impossíveis (erro de importação
--    do Open Food Facts — valores por embalagem, não por 100g)
-- 2. Adiciona coluna is_curado para marcar alimentos confiáveis
--    e comuns do dia a dia brasileiro
-- 3. Marca automaticamente alimentos comuns por padrão de nome
--    + macros dentro de faixas fisiológicas
-- ============================================================

-- PASSO 1: Deletar registros corrompidos (macros fora do possível)
-- Gorduras > 100g/100g é fisicamente impossível (gordura pura = 100g)
-- Proteínas > 100g/100g idem
-- Carboidratos > 100g/100g idem
-- Calorias > 900 kcal/100g só é possível em gordura pura (óleo = ~884)
-- → registros acima de 900 kcal têm valores de embalagem, não por 100g
DELETE FROM base_alimentos
WHERE calorias_100g > 900
   OR proteinas_100g > 100
   OR carboidratos_100g > 100
   OR gorduras_100g > 100;

-- PASSO 2: Adicionar coluna de curadoria
ALTER TABLE base_alimentos
  ADD COLUMN IF NOT EXISTS is_curado BOOLEAN NOT NULL DEFAULT false;

-- PASSO 3: Marcar alimentos curados por categoria de nome (PT-BR)
-- Critério: alimento simples, comum no dia a dia brasileiro,
-- sem nome de marca ou produto industrializado específico,
-- com macros dentro de faixas fisiológicas válidas

-- Proteínas animais
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome ILIKE 'Frango Grelhado%'
    OR nome = 'Frango Grelhado'
    OR nome ILIKE 'Peito De Frango%'
    OR nome ILIKE 'Filé De Frango%'
    OR nome ILIKE 'Frango Cozido%'
    OR nome ILIKE 'Ovo Cozido%'
    OR nome ILIKE 'Ovo Inteiro%'
    OR nome ILIKE 'Ovo Mexido%'
    OR nome ILIKE 'Clara De Ovo%'
    OR nome ILIKE 'Atum Em Água%'
    OR nome ILIKE 'Atum Em Óleo%'
    OR nome = 'Atum'
    OR nome ILIKE 'Tilápia%'
    OR nome ILIKE 'Filé De Tilápia%'
    OR nome ILIKE 'Salmão%'
    OR nome ILIKE 'Filé De Salmão%'
    OR nome ILIKE 'Sardinha%'
    OR nome ILIKE 'Carne Moída%'
    OR nome ILIKE 'Patinho Moído%'
    OR nome ILIKE 'Alcatra%'
    OR nome ILIKE 'Filé Mignon%'
    OR nome ILIKE 'Músculo Bovino%'
    OR nome ILIKE 'Contrafilé%'
    OR nome ILIKE 'Fraldinha%'
    OR nome ILIKE 'Costela%'
    OR nome ILIKE 'Porco%'
    OR nome ILIKE 'Lombo De Porco%'
    OR nome ILIKE 'Peito De Peru%'
    OR nome ILIKE 'Albumina%'
  );

-- Laticínios
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome ILIKE 'Leite Desnatado%'
    OR nome ILIKE 'Leite Integral%'
    OR nome ILIKE 'Leite Semidesnatado%'
    OR nome = 'Leite'
    OR nome ILIKE 'Iogurte Natural%'
    OR nome ILIKE 'Iogurte Grego%'
    OR nome ILIKE 'Queijo Minas Frescal%'
    OR nome ILIKE 'Queijo Cottage%'
    OR nome ILIKE 'Queijo Mussarela%'
    OR nome ILIKE 'Requeijão%'
    OR nome ILIKE 'Manteiga%'
  );

-- Carboidratos complexos
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome = 'Arroz'
    OR nome ILIKE 'Arroz Branco Cozido%'
    OR nome ILIKE 'Arroz Integral Cozido%'
    OR nome ILIKE 'Arroz Parboilizado%'
    OR nome = 'Feijão'
    OR nome ILIKE 'Feijão Cozido%'
    OR nome ILIKE 'Feijão Preto%'
    OR nome ILIKE 'Feijão Carioca%'
    OR nome ILIKE 'Batata-Doce%'
    OR nome ILIKE 'Batata Doce%'
    OR nome ILIKE 'Batata Inglesa%'
    OR nome ILIKE 'Batata Cozida%'
    OR nome ILIKE 'Macarrão%'
    OR nome ILIKE 'Macarrão Integral%'
    OR nome ILIKE 'Aveia%'
    OR nome ILIKE 'Farinha De Aveia%'
    OR nome ILIKE 'Aveia Em Flocos%'
    OR nome ILIKE 'Tapioca%'
    OR nome ILIKE 'Cuscuz%'
    OR nome ILIKE 'Inhame%'
    OR nome ILIKE 'Mandioca%'
    OR nome ILIKE 'Aipim%'
    OR nome ILIKE 'Milho Cozido%'
    OR nome ILIKE 'Milho Verde%'
    OR nome ILIKE 'Lentilha%'
    OR nome ILIKE 'Grão-De-Bico%'
    OR nome ILIKE 'Grão De Bico%'
    OR nome ILIKE 'Ervilha%'
    OR nome ILIKE 'Pão Integral%'
    OR nome ILIKE 'Pão De Forma Integral%'
  );

-- Frutas
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome = 'Banana'
    OR nome ILIKE 'Banana Prata%'
    OR nome ILIKE 'Banana Nanica%'
    OR nome = 'Maçã'
    OR nome ILIKE 'Maçã Verde%'
    OR nome = 'Laranja'
    OR nome ILIKE 'Laranja Pera%'
    OR nome = 'Mamão'
    OR nome ILIKE 'Mamão Papaya%'
    OR nome = 'Manga'
    OR nome ILIKE 'Abacate%'
    OR nome = 'Morango'
    OR nome ILIKE 'Uva%'
    OR nome = 'Melancia'
    OR nome = 'Abacaxi'
    OR nome ILIKE 'Pera%'
    OR nome = 'Pêssego'
  );

-- Vegetais e verduras
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome ILIKE 'Brócolis%'
    OR nome ILIKE 'Espinafre%'
    OR nome ILIKE 'Cenoura%'
    OR nome ILIKE 'Tomate%'
    OR nome ILIKE 'Alface%'
    OR nome ILIKE 'Couve%'
    OR nome ILIKE 'Abobrinha%'
    OR nome ILIKE 'Pepino%'
    OR nome ILIKE 'Chuchu%'
    OR nome ILIKE 'Vagem%'
    OR nome ILIKE 'Repolho%'
    OR nome ILIKE 'Couve-Flor%'
    OR nome ILIKE 'Berinjela%'
    OR nome ILIKE 'Pimentão%'
  );

-- Gorduras saudáveis e sementes
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome ILIKE 'Azeite De Oliva%'
    OR nome ILIKE 'Amendoim%'
    OR nome ILIKE 'Pasta De Amendoim%'
    OR nome ILIKE 'Castanha%'
    OR nome ILIKE 'Castanha-Do-Pará%'
    OR nome ILIKE 'Castanha De Caju%'
    OR nome ILIKE 'Amêndoa%'
    OR nome ILIKE 'Linhaça%'
    OR nome ILIKE 'Chia%'
    OR nome ILIKE 'Abóbora%'
  );

-- Suplementos comuns
UPDATE base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome ILIKE 'Whey Protein%'
    OR nome ILIKE 'Proteína De Soja%'
    OR nome ILIKE 'Proteína Vegetal%'
    OR nome ILIKE 'Albumina%'
  );

-- Índice para acelerar queries com is_curado
CREATE INDEX IF NOT EXISTS idx_base_alimentos_curado
  ON base_alimentos (is_curado)
  WHERE is_curado = true;

-- Verificação: contar quantos ficaram marcados
-- (Rodar manualmente após migration pra conferir)
-- SELECT COUNT(*) FROM base_alimentos WHERE is_curado = true;
