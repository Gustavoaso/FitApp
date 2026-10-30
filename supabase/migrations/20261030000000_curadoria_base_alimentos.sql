-- Marca os alimentos curados (lista da antiga 027, que nunca rodou em produção).
-- Só liga is_curado; não apaga nada. Idempotente.
UPDATE public.base_alimentos SET is_curado = true
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
UPDATE public.base_alimentos SET is_curado = true
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
UPDATE public.base_alimentos SET is_curado = true
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
UPDATE public.base_alimentos SET is_curado = true
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
UPDATE public.base_alimentos SET is_curado = true
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
UPDATE public.base_alimentos SET is_curado = true
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
UPDATE public.base_alimentos SET is_curado = true
WHERE is_curado = false
  AND calorias_100g BETWEEN 1 AND 900
  AND (
    nome ILIKE 'Whey Protein%'
    OR nome ILIKE 'Proteína De Soja%'
    OR nome ILIKE 'Proteína Vegetal%'
    OR nome ILIKE 'Albumina%'
  );
