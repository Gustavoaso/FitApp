-- Storage (RN31): só o dono lê/grava na própria pasta; avatar é legível por logados.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 's1@teste.local'),
  ('00000000-0000-0000-0000-0000000000a2', 's2@teste.local');
insert into storage.objects (bucket_id, name, owner_id) values
  ('evolucao', '00000000-0000-0000-0000-0000000000a1/f.jpg', '00000000-0000-0000-0000-0000000000a1'),
  ('avatares', '00000000-0000-0000-0000-0000000000a1/a.jpg', '00000000-0000-0000-0000-0000000000a1');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is((select count(*) from storage.objects where bucket_id = 'evolucao'), 0::bigint, 'outro não lê foto de evolução');
select is((select count(*) from storage.objects where bucket_id = 'avatares'), 1::bigint, 'logado lê avatar');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('posts', '00000000-0000-0000-0000-0000000000a1/x.jpg')$$,
  '42501', null, 'não grava na pasta de outro');
select lives_ok($$insert into storage.objects (bucket_id, name) values ('posts', '00000000-0000-0000-0000-0000000000a2/x.jpg')$$, 'grava na própria pasta');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select count(*) from storage.objects where bucket_id = 'evolucao'), 1::bigint, 'dono lê a própria foto');

select * from finish();
rollback;
