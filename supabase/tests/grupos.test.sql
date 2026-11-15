-- Grupos (RN23, RN24): isolamento, só apelido/check-ins/pontos, código, limites, sair apaga check-ins.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email) select
  ('00000000-0000-0000-0000-00000000e' || lpad(n::text, 3, '0'))::uuid, 'g' || n || '@teste.local'
from generate_series(1, 33) n;

create function pg_temp.como(n int) returns void language sql as $$
  select set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-00000000e' || lpad($1::text, 3, '0') || '","role":"authenticated"}', true);
$$;

set local role authenticated;
select pg_temp.como(1);

-- Apelido: inválidos recusados.
select throws_ok($$insert into public.apelidos_usuario (apelido) values ('a@b.com')$$, '23514', null, 'apelido com arroba recusado');
select throws_ok($$insert into public.apelidos_usuario (apelido) values ('ab')$$, '23514', null, 'apelido curto recusado');
select lives_ok($$insert into public.apelidos_usuario (apelido) values ('Ana Forte')$$, 'apelido válido');

-- Sem apelido não cria grupo (usuário 2 ainda não tem).
select pg_temp.como(2);
select throws_ok($$select public.criar_grupo('Grupo X', 'treinos')$$, null, 'apelido_obrigatorio', 'criar exige apelido');
select pg_temp.como(1);

create temp table g as select (public.criar_grupo('Galera da Academia', 'treinos', 4)) as r;
grant all on g to authenticated;
select is(length((select r->>'codigo' from g)), 6, 'código tem 6 caracteres');

-- Usuário 2 entra por código; código inválido não entra.
select pg_temp.como(2);
insert into public.apelidos_usuario (apelido) values ('Beto');
select throws_ok($$select public.entrar_grupo('ZZZZZZ')$$, null, 'codigo_invalido', 'código inexistente não entra');
select throws_ok($$select public.entrar_grupo(null)$$, null, 'codigo_invalido', 'código nulo não entra');
select lives_ok(format($$select public.entrar_grupo(%L)$$, lower((select r->>'codigo' from g))), 'entra por código (minúsculas ok)');

-- Usuário 3 sem entrar: não lê nada.
select pg_temp.como(3);
select throws_ok(format($$select * from public.ranking_grupo(%L)$$, (select r->>'id' from g)), null, 'nao_membro', 'não membro não lê o ranking');
select throws_ok(format($$select * from public.feed_grupo(%L)$$, (select r->>'id' from g)), null, 'nao_membro', 'não membro não lê o feed');
select throws_ok($$select count(*) from public.grupos$$, '42501', null, 'tabela grupos fechada para o cliente');
select is((select count(*)::int from public.meus_grupos()), 0, 'não membro não lista o grupo');

-- Check-ins automáticos (o trigger lê a sessão do próprio usuário). Rodamos como dono.
reset role;
insert into public.sessoes_treino (usuario_id, data, finalizado_em, nome_treino, duracao_minutos, kcal_estimadas) values
  ('00000000-0000-0000-0000-00000000e001', current_date, now(), 'Peito', 50, 300),
  ('00000000-0000-0000-0000-00000000e002', current_date, now(), 'Costas', 40, 250);
insert into public.sessoes_treino (usuario_id, data, nome_treino) values
  ('00000000-0000-0000-0000-00000000e001', current_date, 'Sem finalizar');
select is((select count(*)::int from public.grupo_checkins), 2, 'check-in só de treino finalizado, um por membro');

set local role authenticated;
select pg_temp.como(2);
select is((select count(*)::int from public.feed_grupo((select (r->>'id')::uuid from g))), 2, 'membro vê o feed do grupo');
select is((select count(*)::int from public.ranking_grupo((select (r->>'id')::uuid from g)) where posicao = 1), 2, 'ranking: empate divide a primeira posição');
select is(
  (select count(*)::int from (select * from public.ranking_grupo((select (r->>'id')::uuid from g))) r
   where r.apelido in ('Ana Forte', 'Beto')), 2, 'ranking mostra apenas apelidos');
select is((select codigo from public.meus_grupos()), null, 'só o criador vê o código');

-- Desligar o check-in automático: novo treino do usuário 2 não conta.
select lives_ok($$select public.definir_checkin_automatico((select (r->>'id')::uuid from g), false)$$, 'desliga o check-in automático');
reset role;
insert into public.sessoes_treino (usuario_id, data, finalizado_em, nome_treino, duracao_minutos)
values ('00000000-0000-0000-0000-00000000e002', current_date - 0, now(), 'Pernas', 30);
select is((select count(*)::int from public.grupo_checkins where usuario_id = '00000000-0000-0000-0000-00000000e002'), 1, 'check-in desligado não registra');

-- Sair apaga os check-ins da pessoa no grupo (conferido como dono, o cliente não lê a tabela).
select pg_temp.como(2);
select public.sair_grupo((select (r->>'id')::uuid from g));
reset role;
select is((select count(*)::int from public.grupo_checkins where usuario_id = '00000000-0000-0000-0000-00000000e002'), 0, 'sair apaga os check-ins');

-- Limite de 30 membros: usuários 2..30 entram (com o criador são 30); o 31 é recusado.
insert into public.apelidos_usuario (usuario_id, apelido)
select ('00000000-0000-0000-0000-00000000e' || lpad(n::text, 3, '0'))::uuid, 'Atleta' || n
from generate_series(3, 33) n;
set local role authenticated;
do $$
begin
  for n in 2..30 loop
    perform pg_temp.como(n);
    perform public.entrar_grupo((select r->>'codigo' from g));
  end loop;
end $$;
select pg_temp.como(31);
select throws_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), null, 'grupo_cheio', 'o 31º membro é recusado');

-- Limite de 5 grupos por pessoa: o usuário 1 já tem 1, cria mais 4 e o sexto falha.
select pg_temp.como(1);
select public.criar_grupo('Grupo ' || n, 'minutos') from generate_series(1, 4) n;
select throws_ok($$select public.criar_grupo('Grupo extra', 'xp')$$, null, 'limite_grupos', 'sexto grupo recusado');

-- Só o criador remove e encerra.
select pg_temp.como(5);
select throws_ok(format($$select public.encerrar_grupo(%L)$$, (select r->>'id' from g)), null, 'nao_criador', 'membro não encerra');
select throws_ok(format($$select public.remover_membro(%L, gen_random_uuid())$$, (select r->>'id' from g)), null, 'nao_criador', 'membro não remove');
select pg_temp.como(1);
select lives_ok(format($$select public.encerrar_grupo(%L)$$, (select r->>'id' from g)), 'criador encerra');
select pg_temp.como(32);
select throws_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), null, 'codigo_invalido', 'grupo encerrado não aceita entrada');

-- Anon não tem acesso.
reset role;
set local role anon;
select throws_ok($$select * from public.meus_grupos()$$, '42501', null, 'anon não chama as funções');

reset role;
select * from finish();
rollback;
