-- Grupos (RN23, RN24): isolamento, só apelido/check-ins/pontos, código, limites, sair apaga check-ins.
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

insert into auth.users (id, email) select
  ('00000000-0000-0000-0000-00000000e' || lpad(n::text, 3, '0'))::uuid, 'g' || n || '@teste.local'
from generate_series(1, 53) n;

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
select throws_ok($$select public.criar_grupo('Grupo X')$$, null, 'apelido_obrigatorio', 'criar exige apelido');
select pg_temp.como(1);

create temp table g as select (public.criar_grupo('Galera da Academia', 4, 'Desafio de 4 semanas', 'capa:3')) as r;
grant all on g to authenticated;
select is(length((select r->>'codigo' from g)), 6, 'código tem 6 caracteres');

-- Usuário 2 entra por código; código inválido não entra.
select pg_temp.como(2);
insert into public.apelidos_usuario (apelido) values ('Beto');
select is(public.entrar_grupo('ZZZZZZ'), null, 'código inexistente não entra');
select is(public.entrar_grupo(null), null, 'código nulo não entra');
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

-- Regras novas: manual hoje ok, anteontem recusado, 1 ponto por dia, curtir/comentar só membro.
select pg_temp.como(1);
select lives_ok(format($$select public.registrar_checkin_manual(%L, 'corrida', 30, (now() at time zone 'America/Sao_Paulo')::date, 'Parque', '00000000-0000-0000-0000-00000000e001/c.jpg')$$, (select r->>'id' from g)), 'check-in manual de hoje');
select throws_ok(format($$select public.registrar_checkin_manual(%L, 'corrida', 30, (now() at time zone 'America/Sao_Paulo')::date - 2)$$, (select r->>'id' from g)), null, 'data_invalida', 'manual de anteontem recusado');
select throws_ok(format($$select public.registrar_checkin_manual(%L, 'corrida', 30, current_date, null, '00000000-0000-0000-0000-00000000e002/c.jpg')$$, (select r->>'id' from g)), null, 'foto_invalida', 'foto de outra pasta recusada');
select is((select pontos from public.ranking_grupo((select (r->>'id')::uuid from g)) where eh_voce), 1, '2 check-ins no mesmo dia valem 1 ponto');
create temp table ck as select id from public.feed_grupo((select (r->>'id')::uuid from g)) limit 1;
grant all on ck to authenticated;
select lives_ok($$select public.comentar_checkin((select id from ck), 'Boa!')$$, 'membro comenta');
select is(public.alternar_curtida_checkin((select id from ck)), true, 'membro curte');
select is((select curtidas from public.feed_grupo((select (r->>'id')::uuid from g)) where id = (select id from ck)), 1, 'feed conta a curtida');
select pg_temp.como(3);
select throws_ok($$select public.comentar_checkin((select id from ck), 'oi')$$, '42501', 'nao_membro', 'não membro não comenta');
select throws_ok($$select public.alternar_curtida_checkin((select id from ck))$$, '42501', 'nao_membro', 'não membro não curte');
select pg_temp.como(1);

-- Limite de 50 membros: usuários 2..50 entram (com o criador são 50); o 51 é recusado.
insert into public.apelidos_usuario (usuario_id, apelido)
select ('00000000-0000-0000-0000-00000000e' || lpad(n::text, 3, '0'))::uuid, 'Atleta' || n
from generate_series(3, 53) n;
set local role authenticated;
do $$
begin
  for n in 2..50 loop
    perform pg_temp.como(n);
    perform public.entrar_grupo((select r->>'codigo' from g));
  end loop;
end $$;
select pg_temp.como(51);
select throws_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), null, 'grupo_cheio', 'o 51º membro é recusado');

-- Foto de check-in: membro lê, não membro não.
reset role;
insert into storage.objects (bucket_id, name, owner_id) values
  ('checkins', '00000000-0000-0000-0000-00000000e001/c.jpg', '00000000-0000-0000-0000-00000000e001');
set local role authenticated;
select pg_temp.como(7);
select is((select count(*)::int from storage.objects where bucket_id = 'checkins'), 1, 'membro lê foto de check-in do grupo');
select pg_temp.como(51);
select is((select count(*)::int from storage.objects where bucket_id = 'checkins'), 0, 'não membro não lê foto de check-in');

-- Limite de 10 grupos por pessoa: o usuário 1 já tem 1, cria mais 9 e o 11º falha.
select pg_temp.como(1);
select public.criar_grupo('Grupo ' || n) from generate_series(1, 9) n;
select throws_ok($$select public.criar_grupo('Grupo extra')$$, null, 'limite_grupos', '11º grupo recusado');

-- Só o criador remove e encerra.
select pg_temp.como(5);
select throws_ok(format($$select public.encerrar_grupo(%L)$$, (select r->>'id' from g)), null, 'nao_criador', 'membro não encerra');
select throws_ok(format($$select public.remover_membro(%L, gen_random_uuid())$$, (select r->>'id' from g)), null, 'nao_criador', 'membro não remove');
select pg_temp.como(1);
select lives_ok(format($$select public.encerrar_grupo(%L)$$, (select r->>'id' from g)), 'criador encerra');
select pg_temp.como(52);
select is(public.entrar_grupo((select r->>'codigo' from g)), null, 'grupo encerrado não aceita entrada');

-- Anon não tem acesso.
reset role;
set local role anon;
select throws_ok($$select * from public.meus_grupos()$$, '42501', null, 'anon não chama as funções');

reset role;
select * from finish();
rollback;
