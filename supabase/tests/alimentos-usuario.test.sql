-- Alimentos cadastrados pelo usuário (RN17): só o dono vê e altera, nunca entra no plano,
-- e apagar um alimento não apaga a refeição. Rodar com: npx supabase test db (só local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@teste.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@teste.local');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fonte, criado_por)
    values (990101, 'Pão da vó fictício', 'Meus alimentos', 250, 8, 45, 3, 'usuario', '00000000-0000-0000-0000-0000000000a1')$$,
  'usuário cadastra o próprio alimento'
);

select throws_ok(
  $$insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fonte, criado_por)
    values (990102, 'Em nome do outro', 'Meus alimentos', 100, 1, 1, 1, 'usuario', '00000000-0000-0000-0000-0000000000a2')$$,
  '42501', null, 'não cadastra em nome de outra pessoa'
);

select throws_ok(
  $$insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fonte, criado_por, e_basico)
    values (990103, 'Quer ser básico', 'Meus alimentos', 100, 1, 1, 1, 'usuario', '00000000-0000-0000-0000-0000000000a1', true)$$,
  '42501', null, 'não se marca como básico'
);

select throws_ok(
  $$insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fonte, criado_por)
    values (990104, 'Macros impossíveis', 'Meus alimentos', 100, 60, 60, 10, 'usuario', '00000000-0000-0000-0000-0000000000a1')$$,
  '23514', null, 'macros somando mais de 100 g por 100 g são recusados'
);

select is((select count(*)::int from public.base_alimentos where id = 990101), 1, 'o dono vê o alimento');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is((select count(*)::int from public.base_alimentos where id = 990101), 0, 'outra pessoa não vê');

delete from public.base_alimentos where id = 990101;
reset role;
select is((select count(*)::int from public.base_alimentos where id = 990101), 1, 'outra pessoa não apaga');
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(
  (select count(*)::int from public.buscar_alimentos_rag(null::extensions.vector, null, null, 50)
    where nome = 'Pão da vó fictício'),
  0, 'alimento do usuário não entra no plano'
);

delete from public.base_alimentos where id = 990101;
select is((select count(*)::int from public.base_alimentos where id = 990101), 0, 'o dono apaga o próprio alimento');

select * from finish();
rollback;
