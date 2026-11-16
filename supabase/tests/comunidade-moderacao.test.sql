-- Comunidade etapa 37: bloqueio nos dois sentidos, respostas, reposts, denúncias, filtro e limites.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.local'),
  ('00000000-0000-0000-0000-0000000000d3', 'd3@teste.local'),
  ('00000000-0000-0000-0000-0000000000d4', 'd4@teste.local'),
  ('00000000-0000-0000-0000-0000000000d5', 'd5@teste.local');
insert into public.apelidos_usuario (usuario_id, apelido, usuario, termos_comunidade_em) values
  ('00000000-0000-0000-0000-0000000000d1', 'Ana', 'ana_d', now()),
  ('00000000-0000-0000-0000-0000000000d2', 'Bia', 'bia_d', now()),
  ('00000000-0000-0000-0000-0000000000d3', 'Caio', 'caio_d', now()),
  ('00000000-0000-0000-0000-0000000000d4', 'Davi', 'davi_d', now()),
  ('00000000-0000-0000-0000-0000000000d5', 'Edu', 'edu_d', now());
insert into public.posts (id, autor_id, texto) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1', 'post da Ana');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select lives_ok($$insert into public.posts (texto, pai_id) values ('resposta', '00000000-0000-0000-0000-0000000000b1')$$, 'responde');
select lives_ok($$insert into public.posts (texto, repost_de) values ('', '00000000-0000-0000-0000-0000000000b1')$$, 'reposta sem comentário');
select throws_ok($$insert into public.posts (texto, repost_de) values ('', '00000000-0000-0000-0000-0000000000b1')$$, '23505', null, 'repost simples é único');
select is((select count(*) from public.feed_posts('respostas', null, null, 30, '00000000-0000-0000-0000-0000000000b1')), 2::bigint, 'post + resposta');
select is((select id from public.feed_posts('respostas', null, null, 30, '00000000-0000-0000-0000-0000000000b1') limit 1),
  '00000000-0000-0000-0000-0000000000b1'::uuid, 'post pai vem primeiro');
select throws_ok($$insert into public.posts (texto) values ('seu idiota')$$, 'P0001', 'texto_ofensivo', 'filtro de palavras');

-- Ana bloqueia Bia: some dos dois lados.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
insert into public.bloqueios (bloqueado_id) values ('00000000-0000-0000-0000-0000000000d2');
select is((select count(*) from public.posts where autor_id = '00000000-0000-0000-0000-0000000000d2'), 0::bigint, 'bloqueador não vê o bloqueado');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select is((select count(*) from public.posts where id = '00000000-0000-0000-0000-0000000000b1'), 0::bigint, 'bloqueado não vê o bloqueador');
select throws_ok($$insert into public.posts (texto, pai_id) values ('oi', '00000000-0000-0000-0000-0000000000b1')$$, '42501', null, 'bloqueado não responde');

-- 3 denúncias de pessoas diferentes ocultam o post de Davi.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
insert into public.posts (id, autor_id, texto) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d4', 'post ruim');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
insert into public.denuncias (post_id, motivo) values ('00000000-0000-0000-0000-0000000000b2', 'spam');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d3","role":"authenticated"}', true);
insert into public.denuncias (post_id, motivo) values ('00000000-0000-0000-0000-0000000000b2', 'spam');
select is((select count(*) from public.posts where id = '00000000-0000-0000-0000-0000000000b2'), 1::bigint, 'com 2 denúncias ainda aparece');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d5","role":"authenticated"}', true);
insert into public.denuncias (post_id, motivo) values ('00000000-0000-0000-0000-0000000000b2', 'ofensivo');
select is((select count(*) from public.posts where id = '00000000-0000-0000-0000-0000000000b2'), 0::bigint, 'com 3 denúncias fica oculto');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
select is((select count(*) from public.posts where id = '00000000-0000-0000-0000-0000000000b2'), 1::bigint, 'o autor ainda vê o seu');

-- Limite diário: 30 posts (Davi já fez 1); o 31º cai. A função do contador é fechada ao app.
select lives_ok($$insert into public.posts (texto) select 'p' || g from generate_series(1, 29) g$$, 'até 30 posts no dia');
select throws_ok($$insert into public.posts (texto) values ('31')$$, 'P0001', 'limite_diario', '31º post do dia é recusado');
select throws_ok($$select public.consumir_limite(auth.uid(), 'posts', 99)$$, '42501', null, 'app não chama consumir_limite');
select * from finish();
rollback;
