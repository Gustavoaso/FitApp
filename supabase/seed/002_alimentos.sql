-- ============================================================
-- SEED DE ALIMENTOS BRASILEIROS (TACO + SUPLEMENTOS)
-- ============================================================
-- Popula a tabela `base_alimentos` com valores por 100g.
-- Fonte: TACO (UNICAMP) 4ª Edição + itens comuns do dia a dia.
-- ============================================================

INSERT INTO base_alimentos (nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fibras_100g, porcao_descricao, porcao_gramas) VALUES
-- CEREAIS E GRÃOS
('Arroz Branco Cozido', 'cereais', 128.0, 2.5, 28.1, 0.2, 1.6, '1 colher de servir', 45.0),
('Arroz Integral Cozido', 'cereais', 124.0, 2.6, 25.8, 1.0, 2.7, '1 colher de servir', 45.0),
('Aveia em Flocos', 'cereais', 394.0, 13.9, 66.6, 8.5, 9.1, '2 colheres de sopa', 30.0),
('Pão de Forma Integral', 'cereais', 253.0, 9.4, 49.9, 3.7, 6.9, '2 fatias', 50.0),
('Pão Francês', 'cereais', 300.0, 8.0, 58.6, 3.1, 2.3, '1 unidade', 50.0),
('Tapioca (Goma)', 'cereais', 240.0, 0.0, 60.0, 0.0, 0.0, '3 colheres de sopa', 60.0),

-- LEGUMINOSAS
('Feijão Carioca Cozido', 'leguminosas', 76.0, 4.8, 13.6, 0.5, 8.5, '1 concha média', 86.0),
('Feijão Preto Cozido', 'leguminosas', 77.0, 4.5, 14.0, 0.5, 8.4, '1 concha média', 86.0),
('Grão-de-Bico Cozido', 'leguminosas', 164.0, 8.9, 27.4, 2.6, 7.6, '1 concha pequena', 70.0),

-- CARNES E PEIXES
('Peito de Frango Grelhado', 'carnes', 165.0, 31.0, 0.0, 3.6, 0.0, '1 filé médio', 120.0),
('Carne Moída Patinho Cozida', 'carnes', 219.0, 35.9, 0.0, 7.3, 0.0, '3 colheres de sopa', 90.0),
('Ovo de Galinha Cozido', 'ovos_laticinios', 146.0, 13.3, 0.6, 9.5, 0.0, '1 unidade média', 50.0),
('Clara de Ovo Cozida', 'ovos_laticinios', 59.0, 13.4, 0.0, 0.1, 0.0, '1 unidade', 30.0),
('Filé de Tilápia Grelhado', 'peixes_frutos_mar', 128.0, 26.0, 0.0, 2.7, 0.0, '1 filé médio', 120.0),
('Atum em Conserva em Água', 'peixes_frutos_mar', 116.0, 25.5, 0.0, 0.8, 0.0, '1 lata escorrida', 120.0),

-- LEITE E DERIVADOS
('Leite Desnatado', 'ovos_laticinios', 35.0, 3.4, 5.0, 0.1, 0.0, '1 copo (200ml)', 200.0),
('Iogurte Natural Desnatado', 'ovos_laticinios', 41.0, 3.8, 5.8, 0.3, 0.0, '1 potinho', 170.0),
('Queijo Cottage', 'ovos_laticinios', 98.0, 11.1, 3.4, 4.3, 0.0, '2 colheres de sopa', 50.0),
('Queijo Minas Frescal', 'ovos_laticinios', 264.0, 17.4, 3.2, 20.2, 0.0, '1 fatia média', 30.0),

-- FRUTAS E HORTALIÇAS
('Banana Prata', 'frutas', 98.0, 1.3, 26.0, 0.1, 2.0, '1 unidade média', 90.0),
('Maçã Fuji', 'frutas', 56.0, 0.3, 15.2, 0.2, 1.3, '1 unidade média', 130.0),
('Mamão Papaia', 'frutas', 40.0, 0.5, 10.4, 0.1, 1.0, '1/2 unidade', 140.0),
('Abacate', 'frutas', 96.0, 1.2, 6.0, 8.4, 6.3, '2 colheres de sopa', 60.0),
('Batata Doce Cozida', 'hortalicas', 77.0, 0.6, 18.4, 0.1, 2.2, '1 rodelas grandes', 100.0),
('Brócolis Cozido', 'hortalicas', 25.0, 2.1, 4.4, 0.5, 3.4, '1 xícara', 80.0),

-- GORDURAS E OLEAGINOSAS
('Azeite de Oliva Extra Virgem', 'gorduras_oleos', 884.0, 0.0, 0.0, 100.0, 0.0, '1 colher de sopa', 12.0),
('Pasta de Amendoim Integral', 'nozes_sementes', 588.0, 25.0, 20.0, 50.0, 6.0, '1 colher de sopa', 15.0),
('Castanha-do-Pará', 'nozes_sementes', 643.0, 14.5, 15.1, 63.5, 7.9, '2 unidades', 10.0),

-- SUPLEMENTOS
('Whey Protein Concentrado 80%', 'suplementos', 400.0, 80.0, 6.6, 6.6, 0.0, '1 dosador (scoop)', 30.0),
('Creatina Monohidratada', 'suplementos', 0.0, 0.0, 0.0, 0.0, 0.0, '1 dosador (5g)', 5.0);
