-- RN22 revogada: sem XP, nível, sequência ou conquistas. Os registros em sessoes_treino
-- continuam (alimentam a aderência RN28 e os grupos); só a função de resumo sai.
drop function if exists public.resumo_gamificacao(date);
