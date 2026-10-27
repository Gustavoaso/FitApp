-- Testes de RLS: o usuário A não lê nem escreve dados do usuário B.
-- Rodar com: npx supabase test db (só no banco local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Usuários e dados fictícios, criados como postgres (sem RLS).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.local');

insert into public.perfis (usuario_id, nome, idade, sexo, peso_kg, altura_cm, nivel_experiencia, nivel_atividade)
values ('00000000-0000-0000-0000-00000000000b', 'Pessoa B', 30, 'feminino', 60, 165, 'iniciante', 'leve');
insert into public.historico_peso (usuario_id, peso_kg)
values ('00000000-0000-0000-0000-00000000000b', 60);
insert into public.planos_treino (id, usuario_id, nome, dias_por_semana)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'Plano B', 3);
insert into public.dias_treino (id, plano_treino_id, dia_semana, nome)
values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1', 1, 'Dia A');
insert into public.base_exercicios (nome, grupo_primario, equipamento, nivel)
values ('Agachamento Teste', 'quadriceps', 'barra', 'iniciante');

-- O seed já põe exercícios na base: guarda o total para comparar sem depender dele.
select set_config('teste.total_exercicios', (select count(*)::text from public.base_exercicios), true);

-- Todas as tabelas de public com RLS ligada.
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0, 'toda tabela de public tem RLS ligada'
);

-- Toda função de public com search_path fixo.
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind = 'f'
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
     and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')),
  0, 'toda função própria de public tem search_path fixo'
);

-- Agora como o usuário A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is((select count(*)::int from public.perfis), 0, 'A não lê o perfil de B');
select is((select count(*)::int from public.historico_peso), 0, 'A não lê o histórico de peso de B');
select is((select count(*)::int from public.planos_treino), 0, 'A não lê o plano de B');
select is((select count(*)::int from public.dias_treino), 0, 'A não lê os dias do plano de B');

select throws_ok(
  $$insert into public.historico_peso (usuario_id, peso_kg) values ('00000000-0000-0000-0000-00000000000b', 99)$$,
  '42501', null, 'A não cria registro em nome de B'
);
select throws_ok(
  $$insert into public.dias_treino (plano_treino_id, dia_semana, nome) values ('00000000-0000-0000-0000-0000000000b1', 2, 'Intruso')$$,
  '42501', null, 'A não cria dia no plano de B'
);

update public.planos_treino set nome = 'Alterado por A' where usuario_id = '00000000-0000-0000-0000-00000000000b';
delete from public.historico_peso where usuario_id = '00000000-0000-0000-0000-00000000000b';

-- A consegue o que é dele.
select lives_ok(
  $$insert into public.historico_peso (usuario_id, peso_kg) values ('00000000-0000-0000-0000-00000000000a', 80)$$,
  'A cria o próprio registro'
);
select is((select count(*)::int from public.historico_peso), 1, 'A lê só o próprio registro');
select throws_ok(
  $$update public.historico_peso set usuario_id = '00000000-0000-0000-0000-00000000000b'$$,
  '42501', null, 'A não passa o próprio registro para B'
);

-- Bases: leitura sim, escrita não.
select is((select count(*)::int from public.base_exercicios), current_setting('teste.total_exercicios')::int, 'A lê a base de exercícios inteira');
select throws_ok(
  $$insert into public.base_exercicios (nome, grupo_primario, equipamento, nivel) values ('x', 'peito', 'barra', 'iniciante')$$,
  '42501', null, 'A não escreve na base de exercícios'
);
select throws_ok(
  $$insert into public.base_conhecimento (tipo, titulo, fonte, conteudo) values ('treino', 'x', 'x', 'x')$$,
  '42501', null, 'A não escreve na base de conhecimento'
);
update public.base_exercicios set nome = 'Alterado por A';

-- Visitante sem login não lê nada.
reset role;
set local role anon;
select is((select count(*)::int from public.base_exercicios), 0, 'anon não lê a base de exercícios');
select is((select count(*)::int from public.perfis), 0, 'anon não lê perfis');

-- Conferência como postgres: os dados de B continuam intactos.
reset role;
select is((select nome from public.planos_treino where usuario_id = '00000000-0000-0000-0000-00000000000b'), 'Plano B', 'update de A não alterou o plano de B');
select is((select count(*)::int from public.historico_peso where usuario_id = '00000000-0000-0000-0000-00000000000b'), 1, 'delete de A não apagou o registro de B');
select is((select count(*)::int from public.base_exercicios where nome = 'Alterado por A'), 0, 'update de A não alterou a base');

select * from finish();
rollback;
