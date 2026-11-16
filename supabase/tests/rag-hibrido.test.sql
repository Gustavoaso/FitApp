-- RPCs buscar_exercicios_rag e buscar_alimentos_rag (etapa 17, RN14 revista).
-- Embeddings fictícios: um "eixo" por vetor, para a ordem ser previsível.
-- Rodar com: npx supabase test db (só no banco local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Vetor com `peso` na posição p (a consulta é o eixo 1).
create function pg_temp.eixo(p int, peso real default 1) returns extensions.vector
language sql as $$
  select (array_fill(0::real, array[p - 1]) || array[peso] || array_fill(0::real, array[384 - p]))::extensions.vector
$$;

-- Isola das bases do seed (a transação é desfeita no fim).
truncate public.base_exercicios, public.base_alimentos cascade;

insert into public.base_exercicios (id, nome, grupo_primario, equipamento, nivel, is_curado, embedding_384) values
  ('00000000-0000-0000-0000-0000000000e1', 'Supino perto', 'peito', 'barra', 'iniciante', true,
   pg_temp.eixo(1)),
  ('00000000-0000-0000-0000-0000000000e2', 'Flexão longe', 'peito', 'peso-do-corpo', 'iniciante', true,
   (array[0.2::real, 1::real] || array_fill(0::real, array[382]))::extensions.vector),
  ('00000000-0000-0000-0000-0000000000e3', 'Crucifixo sem vetor', 'peito', 'halteres', 'iniciante', true, null),
  ('00000000-0000-0000-0000-0000000000e4', 'Supino não curado', 'peito', 'barra', 'iniciante', false,
   pg_temp.eixo(1)),
  ('00000000-0000-0000-0000-0000000000e5', 'Remada', 'dorsais', 'barra', 'iniciante', true,
   pg_temp.eixo(2));

insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, is_curado, e_basico, embedding_384) values
  (9001, 'Frango fictício', 'carnes', 160, 32, 0, 3, false, true, pg_temp.eixo(1)),
  (9002, 'Ovo fictício', 'ovos', 150, 13, 1, 10, true, true, pg_temp.eixo(3)),
  (9003, 'Arroz fictício', 'cereais', 130, 2.5, 28, 0.2, true, true, pg_temp.eixo(1)),
  (9004, 'Feijão fictício', 'leguminosas', 76, 4.8, 13.6, 0.5, true, true, pg_temp.eixo(2)),
  (9005, 'Água fictícia', 'bebidas', 0, 0, 0, 0, true, true, pg_temp.eixo(1)),
  (9006, 'Pão fictício', 'Pães', 270, 8, 50, 3, true, true, pg_temp.eixo(1)),
  (9007, 'Leite fictício', 'laticinios', 35, 3.4, 5, 0.2, true, true, pg_temp.eixo(1)),
  (9008, 'Batata fictícia', 'tuberculos', 80, 1, 18, 0.1, true, true, pg_temp.eixo(2)),
  (9009, 'Barra proteica fictícia', 'suplementos', 380, 35, 30, 12, true, false, pg_temp.eixo(1));

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select results_eq(
  $$select nome from public.buscar_exercicios_rag(pg_temp.eixo(1), null, 10) where grupo_primario = 'peito'$$,
  array['Supino perto', 'Flexão longe', 'Crucifixo sem vetor'],
  'ordena por similaridade; sem embedding vai para o fim; não curado fica de fora'
);

select set_eq(
  $$select nome from public.buscar_exercicios_rag(pg_temp.eixo(1), array['peso-do-corpo', 'halteres'], 10)$$,
  array['Flexão longe', 'Crucifixo sem vetor'],
  'filtro de equipamento tira barra'
);

select is(
  (select count(*)::int from public.buscar_exercicios_rag(pg_temp.eixo(1), null, 1) where grupo_primario = 'peito'),
  1, 'limite por grupo'
);

select is(
  (select count(*)::int from public.buscar_exercicios_rag(pg_temp.eixo(1), null, 1)),
  2, 'o limite vale para cada grupo, não para o total'
);

select results_eq(
  $$select nome from public.buscar_alimentos_rag(pg_temp.eixo(1), null, null, 10) where slot = 'proteina'$$,
  array['Frango fictício'],
  'alimento não curado entra; proteína pelo macro'
);

select set_eq(
  $$select nome from public.buscar_alimentos_rag(pg_temp.eixo(1), null, null, 10)$$,
  array['Frango fictício', 'Ovo fictício', 'Arroz fictício', 'Feijão fictício', 'Pão fictício', 'Batata fictícia'],
  'kcal zero e carboidrato abaixo de 12 g/100 g (leite) ficam de fora'
);

select is(
  (select count(*)::int from public.buscar_alimentos_rag(pg_temp.eixo(1), null, null, 10) where nome like 'Barra proteica%'),
  0, 'alimento que não é básico (e_basico = false) nunca entra'
);

select results_eq(
  $$select nome from public.buscar_alimentos_rag(pg_temp.eixo(1), null, null, 10) where slot = 'carboidrato'$$,
  array['Arroz fictício', 'Pão fictício', 'Feijão fictício', 'Batata fictícia'],
  'carboidratos ordenados por similaridade'
);

select set_eq(
  $$select nome from public.buscar_alimentos_rag(pg_temp.eixo(1), array['frango', 'ovo', 'pao'], null, 10)$$,
  array['Arroz fictício', 'Feijão fictício', 'Batata fictícia'],
  'restrição tira pelo termo, sem acento e sem caixa (Pão)'
);

select is(
  (select slot from public.buscar_alimentos_rag(pg_temp.eixo(1), null, array['leguminosas'], 10) where nome = 'Feijão fictício'),
  'proteina', 'termos_proteina põem a leguminosa no slot de proteína'
);

select is(
  (select count(*)::int from public.buscar_alimentos_rag(pg_temp.eixo(1), null, null, 1) where slot = 'carboidrato'),
  1, 'limite por slot'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.buscar_exercicios_rag(pg_temp.eixo(1), null, 10)$$,
  '42501', null, 'anon não chama buscar_exercicios_rag'
);
select throws_ok(
  $$select * from public.buscar_alimentos_rag(pg_temp.eixo(1), null, null, 10)$$,
  '42501', null, 'anon não chama buscar_alimentos_rag'
);

select * from finish();
rollback;
