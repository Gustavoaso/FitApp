-- ============================================================
-- SEED DE EXERCÍCIOS DA ACADEMIA (BASE CURADA)
-- ============================================================
-- Popula a tabela `base_exercicios` com exercícios comuns em
-- academias brasileiras, organizados por grupo muscular.
-- ============================================================

INSERT INTO base_exercicios (nome, grupo_primario, grupo_secundario, equipamento, nivel, instrucoes) VALUES
-- PEITO
('Supino Reto com Barra', 'peito', 'triceps', 'barra', 'iniciante', 'Deite no banco reto, segure a barra com pegada ligeiramente mais larga que os ombros, desça até o peito e empurre.'),
('Supino Inclinado com Halteres', 'peito', 'ombros', 'halteres', 'iniciante', 'Ajuste o banco a 30-45 graus. Mantenha os cotovelos a 45 graus do corpo ao descer e empurrar.'),
('Crossover no Cabo (Peito)', 'peito', 'ombros', 'cabo', 'intermediario', 'Ajuste as polias no alto, dê um passo à frente e cruze as mãos à frente do peito.'),
('Flexão de Braço', 'peito', 'triceps', 'peso_corporal', 'iniciante', 'Mantenha o corpo alinhado, mãos na largura dos ombros, desça o tórax até quase tocar o chão.'),

-- COSTAS
('Puxada Frontal no Pulley', 'costas', 'biceps', 'cabo', 'iniciante', 'Segure a barra com pegada aberta, puxe em direção ao peitoral abrindo o peito e fechando as escápulas.'),
('Remada Curvada com Barra', 'costas', 'biceps', 'barra', 'intermediario', 'Incline o tronco a 45 graus com joelhos semi-flexionados, puxe a barra em direção ao umbigo.'),
('Remada Baixa no Cabo (Triângulo)', 'costas', 'biceps', 'cabo', 'iniciante', 'Mantenha a postura ereta, puxe o puxador triângulo até a cintura contraindo as costas.'),
('Barra Fixa (Pronada)', 'costas', 'biceps', 'barra_fixa', 'avancado', 'Segure a barra fixa acima da cabeça e puxe o próprio corpo até o queixo passar da barra.'),

-- OMBROS
('Desenvolvimento com Halteres', 'ombros', 'triceps', 'halteres', 'iniciante', 'Sentado com apoio nas costas, eleve os halteres acima da cabeça até quase estender os cotovelos.'),
('Elevação Lateral com Halteres', 'ombros', NULL, 'halteres', 'iniciante', 'Mantenha os cotovelos levemente flexionados, eleve os braços até a altura dos ombros.'),
('Elevação Frontal na Polia', 'ombros', NULL, 'cabo', 'iniciante', 'Puxe o cabo à frente do corpo até a linha dos olhos com os braços estendidos.'),

-- BÍCEPS & TRÍCEPS
('Rosca Direta com Barra W', 'biceps', 'antebraco', 'barra', 'iniciante', 'Mantenha os cotovelos colados ao tronco e dobre os braços elevando a barra.'),
('Rosca Alternada com Halteres', 'biceps', 'antebraco', 'halteres', 'iniciante', 'Alterne os braços girando o pulso para cima durante a sobida (supinação).'),
('Tríceps Pulley com Corda', 'triceps', NULL, 'cabo', 'iniciante', 'Estenda os cotovelos para baixo abrindo a corda no final do movimento.'),
('Tríceps Testa com Barra W', 'triceps', NULL, 'barra', 'intermediario', 'Deitado no banco, flexione os cotovelos descendo a barra em direção à testa e estenda.'),

-- PERNAS (QUADRÍCEPS, POSTERIOR, GLÚTEOS, PANTURRILHA)
('Agachamento Livre com Barra', 'quadriceps', 'gluteos', 'barra', 'intermediario', 'Posicione a barra no trapézio, flexione joelhos e quadril descendo até 90 graus mantendo a coluna neutra.'),
('Leg Press 45°', 'quadriceps', 'gluteos', 'maquina', 'iniciante', 'Posicione os pés na largura do quadril, destrave a máquina e flexione os joelhos até 90 graus.'),
('Cadeira Extensora', 'quadriceps', NULL, 'maquina', 'iniciante', 'Ajuste o rolo no tornozelo e estenda as pernas contraindo o quadríceps no topo.'),
('Mesa Flexora', 'posterior', NULL, 'maquina', 'iniciante', 'Deitado de bruços, dobre os joelhos puxando o rolo em direção aos glúteos.'),
('Stiff com Barra', 'posterior', 'gluteos', 'barra', 'intermediario', 'Mantenha joelhos levemente flexionados, incline o quadril para trás descendo a barra rente às pernas.'),
('Gêmeos Sentado (Panturrilha)', 'panturrilha', NULL, 'maquina', 'iniciante', 'Apoie as pontas dos pés na plataforma e eleve os calcanhares o máximo possível.'),

-- ABDÔMEN
('Abdominal Supra no Chão', 'abdomen', NULL, 'peso_corporal', 'iniciante', 'Deitado com joelhos dobrados, eleve a escápula do chão contraindo o abdômen.'),
('Prancha Abdominal', 'abdomen', 'corpo_inteiro', 'peso_corporal', 'iniciante', 'Apoie antebraços e pontas dos pés no chão mantendo o tronco totalmente alinhado.');
