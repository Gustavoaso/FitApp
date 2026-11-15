-- Gamificação (RN22): XP calculado no banco, isolado por usuário, sem escrita do cliente.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.local');
-- Usuário 1: plano de 2 dias por semana.
insert into public.planos_treino (usuario_id, nome, dias_por_semana)
values ('00000000-0000-0000-0000-0000000000d1', 'Plano', 2);

-- Semana de 2026-11-09 (segunda): 2 dias, o segundo com 2 sessões (vale uma). Semana anterior: 2 dias.
insert into public.sessoes_treino (usuario_id, data, finalizado_em, nome_treino) values
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-09', now(), 'A'),
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-11', now(), 'B'),
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-11', now(), 'B'),
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-02', now(), 'A'),
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-04', now(), 'B'),
  ('00000000-0000-0000-0000-0000000000d1', '2026-11-13', null, 'C');
insert into public.historico_series_executadas (usuario_id, exercicio_id, nome_exercicio, numero_serie, carga_kg, executado_em) values
  ('00000000-0000-0000-0000-0000000000d1', 'x', 'Supino', 1, 40, '2026-11-02 10:00+00'),
  ('00000000-0000-0000-0000-0000000000d1', 'x', 'Supino', 1, 45, '2026-11-09 10:00+00');
insert into public.sessoes_treino (usuario_id, data, finalizado_em) values
  ('00000000-0000-0000-0000-0000000000d2', '2026-11-10', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);

-- 4 dias distintos = 400; 2 semanas cumpridas = 300 de bônus.
select is((public.resumo_gamificacao('2026-11-12')->>'xp')::int, 700, 'XP: treino conta uma vez por dia, mais bônus semanal');
select is((public.resumo_gamificacao('2026-11-12')->>'treinos')::int, 4, 'sessão não finalizada não conta');
select is((public.resumo_gamificacao('2026-11-12')->>'semanas_seguidas')::int, 2, 'sequência de 2 semanas');
select is((public.resumo_gamificacao('2026-11-24')->>'semanas_seguidas')::int, 0, 'sequência quebra depois de uma semana vazia');
select is((public.resumo_gamificacao('2026-11-24')->>'melhor_sequencia')::int, 2, 'melhor sequência é guardada');
select is(public.resumo_gamificacao('2026-11-12')->>'nome_nivel', 'Praticante', 'nível por XP (700 = Praticante)');
select is(public.resumo_gamificacao('2026-11-12')->'conquistas', '["primeiro_treino","recorde_carga"]'::jsonb, 'conquistas ganhas');

-- Isolamento: o usuário 2 só vê o dele (1 treino = 100 XP, sem plano, sem bônus).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select is((public.resumo_gamificacao('2026-11-12')->>'xp')::int, 100, 'cada usuário só vê o seu XP');
select is((select count(*)::int from public.sessoes_treino), 1, 'RLS: só as sessões do próprio usuário');

-- O cliente não escreve XP: não existe tabela de XP e não passa sessão em nome de outro.
select throws_ok(
  $$insert into public.sessoes_treino (usuario_id, finalizado_em) values ('00000000-0000-0000-0000-0000000000d1', now())$$,
  '42501', null, 'não grava treino em nome de outro usuário');
select is((select count(*)::int from pg_tables where schemaname = 'public' and tablename like '%xp%'), 0, 'não há tabela de XP para escrever');

reset role;
select is(has_function_privilege('anon', 'public.resumo_gamificacao(date)', 'execute'), false, 'anon não executa');

select * from finish();
rollback;
