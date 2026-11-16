-- Fotos de evolução (RN29): privada nunca aparece; compartilhada só nos grupos escolhidos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'e1@teste.local'),
  ('00000000-0000-0000-0000-0000000000e2', 'e2@teste.local'),
  ('00000000-0000-0000-0000-0000000000e3', 'e3@teste.local');
insert into public.apelidos_usuario (usuario_id, apelido) values
  ('00000000-0000-0000-0000-0000000000e1', 'Ana'),
  ('00000000-0000-0000-0000-0000000000e2', 'Bia'),
  ('00000000-0000-0000-0000-0000000000e3', 'Caio');
insert into public.grupos (id, criador_id, nome, codigo, inicio) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Grupo 1', 'AAAAAA', current_date),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', 'Grupo 2', 'BBBBBB', current_date);
insert into public.grupo_membros (grupo_id, usuario_id) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2');
insert into public.evolucao_registros (id, usuario_id, peso_kg, mostrar_peso, foto_frente) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', 80, false,
   '00000000-0000-0000-0000-0000000000e1/p.jpg'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e1', 79, true,
   '00000000-0000-0000-0000-0000000000e1/c.jpg');
insert into public.evolucao_compartilhamentos values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f1');
insert into storage.objects (bucket_id, name, owner_id) values
  ('evolucao', '00000000-0000-0000-0000-0000000000e1/p.jpg', '00000000-0000-0000-0000-0000000000e1'),
  ('evolucao', '00000000-0000-0000-0000-0000000000e1/c.jpg', '00000000-0000-0000-0000-0000000000e1');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e2","role":"authenticated"}', true);
select is((select count(*) from public.evolucao_registros), 0::bigint, 'membro não lê a tabela de outro');
select is((select count(*) from public.evolucao_grupo('00000000-0000-0000-0000-0000000000f1')), 1::bigint,
  'membro vê só o compartilhado (a privada nunca aparece)');
select is((select peso_kg from public.evolucao_grupo('00000000-0000-0000-0000-0000000000f1')), 79::numeric, 'peso aparece se marcado');
select is((select count(*) from storage.objects where bucket_id = 'evolucao'), 1::bigint,
  'membro lê só a foto compartilhada');
select is((select count(*) from public.evolucao_grupo('00000000-0000-0000-0000-0000000000f2')), 0::bigint,
  'grupo não escolhido não mostra nada');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e3","role":"authenticated"}', true);
select is((select count(*) from public.evolucao_grupo('00000000-0000-0000-0000-0000000000f1')), 0::bigint,
  'não membro não lê nada');
select throws_ok($$insert into public.evolucao_compartilhamentos values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1')$$,
  '42501', null, 'não compartilha registro de outro');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
select throws_ok($$insert into public.evolucao_registros (foto_frente) values (null)$$,
  '23514', null, 'registro exige pelo menos 1 foto');

select * from finish();
rollback;
