-- Limite de tentativas de código, removido não reentra, valores forjados em sessoes_treino.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) select
  ('00000000-0000-0000-0000-00000000f' || lpad(n::text, 3, '0'))::uuid, 'h' || n || '@teste.local'
from generate_series(1, 3) n;
insert into public.apelidos_usuario (usuario_id, apelido) values
  ('00000000-0000-0000-0000-00000000f001', 'Dona'),
  ('00000000-0000-0000-0000-00000000f002', 'Visita'),
  ('00000000-0000-0000-0000-00000000f003', 'Chutador');

create function pg_temp.como(n int) returns void language sql as $$
  select set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-00000000f' || lpad($1::text, 3, '0') || '","role":"authenticated"}', true);
$$;

set local role authenticated;
select pg_temp.como(1);
create temp table g as select public.criar_grupo('Grupo Teste', 'treinos') as r;
grant all on g to authenticated;

-- Tentativas: 5 falhas, a 6ª já é bloqueada, até com o código certo.
select pg_temp.como(3);
select is(public.entrar_grupo('AAAAAA'), null, 'falha 1 devolve null');
select is(public.entrar_grupo('BBBBBB'), null, 'falha 2');
select is(public.entrar_grupo('CCCCCC'), null, 'falha 3');
select is(public.entrar_grupo('DDDDDD'), null, 'falha 4');
select is(public.entrar_grupo('EEEEEE'), null, 'falha 5');
select throws_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), null, 'muitas_tentativas', 'bloqueia após 5 falhas, mesmo com o código certo');
select throws_ok($$select count(*) from public.tentativas_entrar_grupo$$, '42501', null, 'cliente não lê as tentativas');
reset role;
update public.tentativas_entrar_grupo set criado_em = now() - interval '16 minutes';
set local role authenticated;
select pg_temp.como(3);
select lives_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), 'depois de 15 minutos volta a poder entrar');

-- Removido não reentra.
select pg_temp.como(2);
select lives_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), 'visita entra');
reset role;
create temp table alvo as select id from public.grupo_membros where usuario_id = '00000000-0000-0000-0000-00000000f002';
grant all on alvo to authenticated;
set local role authenticated;
select pg_temp.como(1);
select lives_ok(format($$select public.remover_membro(%L, %L)$$, (select r->>'id' from g), (select id from alvo)), 'criador remove');
select pg_temp.como(2);
select throws_ok(format($$select public.entrar_grupo(%L)$$, (select r->>'codigo' from g)), null, 'removido_do_grupo', 'removido não reentra');

-- Sessões forjadas (como cliente).
select pg_temp.como(1);
select lives_ok($$insert into public.sessoes_treino (usuario_id, nome_treino, duracao_minutos, kcal_estimadas) values ('00000000-0000-0000-0000-00000000f001', 'Ok', 60, 400)$$, 'sessão válida entra (data padrão = hoje)');
select throws_ok($$insert into public.sessoes_treino (usuario_id, data, duracao_minutos) values ('00000000-0000-0000-0000-00000000f001', current_date - 5, 60)$$, '23514', 'sessao_data_invalida', 'data antiga recusada');
select throws_ok($$insert into public.sessoes_treino (usuario_id, duracao_minutos, kcal_estimadas) values ('00000000-0000-0000-0000-00000000f001', 241, 100)$$, '23514', 'sessao_duracao_invalida', 'duração acima de 240 recusada');
select throws_ok($$insert into public.sessoes_treino (usuario_id, kcal_estimadas) values ('00000000-0000-0000-0000-00000000f001', 3001)$$, '23514', 'sessao_kcal_invalida', 'kcal acima de 3000 recusada');

reset role;
select * from finish();
rollback;
