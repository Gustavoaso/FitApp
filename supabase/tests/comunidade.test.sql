-- Comunidade (RN30): só o autor apaga, curtida única, termos antes de postar, ordem do Para você.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'c1@teste.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'c2@teste.local');
insert into public.apelidos_usuario (usuario_id, apelido, usuario, termos_comunidade_em) values
  ('00000000-0000-0000-0000-0000000000c1', 'Ana', 'ana_c', now()),
  ('00000000-0000-0000-0000-0000000000c2', 'Bia', 'bia_c', null);
insert into public.posts (id, autor_id, texto, criado_em) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'velho popular', now() - interval '60 hours'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'novo sem curtida', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c1', 'novo curtido', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c1', 'fora da janela', now() - interval '100 hours');
insert into public.post_curtidas (post_id, usuario_id) values
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select throws_ok($$insert into public.posts (texto) values ('oi')$$, '42501', null, 'sem termos aceitos não posta');
select is((select count(*) from public.post_curtidas where usuario_id = '00000000-0000-0000-0000-0000000000c2'), 0::bigint, 'ponto de partida');
select lives_ok($$insert into public.post_curtidas (post_id) values ('00000000-0000-0000-0000-0000000000a3')$$, 'curte');
select throws_ok($$insert into public.post_curtidas (post_id) values ('00000000-0000-0000-0000-0000000000a3')$$, '23505', null, 'curtida única por pessoa');
select throws_ok($$insert into public.seguidores (seguido_id) values ('00000000-0000-0000-0000-0000000000c2')$$, '23514', null, 'não segue a si mesmo');
delete from public.posts where id = '00000000-0000-0000-0000-0000000000a2';
select is((select count(*) from public.posts), 4::bigint, 'outra pessoa não apaga post alheio');
select is((select array_agg(id order by criado_em) from public.feed_posts('para_voce') where id in
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a3')) is not null, true, 'feed responde');
select is((select id from public.feed_posts('para_voce') limit 1), '00000000-0000-0000-0000-0000000000a3'::uuid,
  'Para você: curtido e recente vence');
select is((select count(*) from public.feed_posts('para_voce')), 3::bigint, 'Para você só traz as últimas 72 h');

select * from finish();
rollback;
