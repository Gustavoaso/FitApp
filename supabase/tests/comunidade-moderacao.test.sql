-- Comunidade etapa 37: bloqueio nos dois sentidos, respostas, reposts, denúncias, filtro e limites.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.local'),
  ('00000000-0000-0000-0000-0000000000d3', 'd3@teste.local'),
  ('00000000-0000-0000-0000-0000000000d4', 'd4@teste.local'),
  ('00000000-0000-0000-0000-0000000000d5', 'd5@teste.local');
update auth.users set created_at = now() - interval '2 days';
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
-- Endurecimento: bloqueio_entre só responde sobre a própria pessoa.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
select is(public.bloqueio_entre('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2'), false, 'terceiros: sempre false');
-- Filtro sem acento.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select throws_ok($$insert into public.posts (texto) values ('seu otário')$$, 'P0001', 'texto_ofensivo', 'acento não burla o filtro');
-- Avatar na pasta de outro é recusado.
select throws_ok($$update public.apelidos_usuario set avatar_caminho = '00000000-0000-0000-0000-0000000000d1/a.jpg' where usuario_id = auth.uid()$$, '23514', null, 'avatar só na própria pasta');
select lives_ok($$update public.apelidos_usuario set avatar_caminho = '00000000-0000-0000-0000-0000000000d2/a.jpg' where usuario_id = auth.uid()$$, 'avatar na própria pasta');
-- Bloquear remove o seguir nos dois sentidos.
insert into public.seguidores (seguido_id) values ('00000000-0000-0000-0000-0000000000d3');
insert into public.bloqueios (bloqueado_id) values ('00000000-0000-0000-0000-0000000000d3');
select is((select count(*) from public.seguidores where seguidor_id = auth.uid()), 0::bigint, 'bloquear desfaz o seguir');
-- Limite de seguir (200) e de denúncias (20).
reset role;
insert into public.uso_diario (usuario_id, dia, tipo, n) values
  ('00000000-0000-0000-0000-0000000000d5', (now() at time zone 'America/Sao_Paulo')::date, 'seguir', 200),
  ('00000000-0000-0000-0000-0000000000d5', (now() at time zone 'America/Sao_Paulo')::date, 'denuncias', 20)
  on conflict (usuario_id, dia, tipo) do update set n = excluded.n;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d5","role":"authenticated"}', true);
select throws_ok($$insert into public.seguidores (seguido_id) values ('00000000-0000-0000-0000-0000000000d1')$$, 'P0001', 'limite_diario', 'limite de seguir');
select throws_ok($$insert into public.denuncias (usuario_denunciado_id, motivo) values ('00000000-0000-0000-0000-0000000000d1', 'spam')$$, 'P0001', 'limite_diario', 'limite de denúncias');
-- Conta nova (<24 h) não conta para ocultar.
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'e1@teste.local'), ('00000000-0000-0000-0000-0000000000e2', 'e2@teste.local'),
  ('00000000-0000-0000-0000-0000000000e3', 'e3@teste.local');
insert into public.posts (id, autor_id, texto) values ('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-0000000000d1', 'alvo');
insert into public.denuncias (denunciante_id, post_id, motivo) select id, '00000000-0000-0000-0000-0000000000b9', 'spam'
  from auth.users where id::text like '%00e_';
select is((select oculto from public.posts where id = '00000000-0000-0000-0000-0000000000b9'), false, '3 contas novas não ocultam');
-- Foto de post oculto some do bucket.
insert into storage.objects (bucket_id, name) values ('posts', '00000000-0000-0000-0000-0000000000d1/f.jpg');
update public.posts set foto_caminho = '00000000-0000-0000-0000-0000000000d1/f.jpg', oculto = true where id = '00000000-0000-0000-0000-0000000000b9';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d3","role":"authenticated"}', true);
select is((select count(*) from storage.objects where name = '00000000-0000-0000-0000-0000000000d1/f.jpg'), 0::bigint, 'foto de post oculto não é legível');
select * from finish();
rollback;
