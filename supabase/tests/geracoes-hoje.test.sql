-- RPC geracoes_hoje (etapa 28): conta só as gerações do próprio usuário no dia de São Paulo (RN13).
-- Rodar com: npx supabase test db (só no banco local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.local');
insert into public.planos_ia_gerados (usuario_id, respostas_questionario, plano_gerado, criado_em) values
  ('00000000-0000-0000-0000-0000000000d1', '{}', '{}', now()),
  ('00000000-0000-0000-0000-0000000000d1', '{}', '{}', now()),
  ('00000000-0000-0000-0000-0000000000d1', '{}', '{}', now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000d2', '{}', '{}', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select is(public.geracoes_hoje(), 2, 'conta as de hoje e ignora as de dias antes e as de outra pessoa');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select is(public.geracoes_hoje(), 1, 'cada pessoa vê só a sua contagem');

reset role;
set local role anon;
select throws_ok($$select public.geracoes_hoje()$$, '42501', null, 'anon não chama');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}', true);
select is(public.geracoes_hoje(), 0, 'quem nunca gerou tem zero');

select * from finish();
rollback;
