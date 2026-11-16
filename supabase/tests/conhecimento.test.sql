-- RPC buscar_conhecimento_rag: filtra por objetivo e nível (trecho geral vale para todos).
-- Rodar com: npx supabase test db (só no banco local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- Isola dos trechos ingeridos: o teste roda numa transação desfeita no fim.
delete from public.base_conhecimento;

insert into public.base_conhecimento (tipo, tema, titulo, fonte, conteudo, objetivos, niveis, embedding_384)
values
  ('diretriz', 'volume', 'T geral', 'Fonte fictícia A', 'x', '{}', '{}',
   array_fill(0.1::real, array[384])::extensions.vector),
  ('diretriz', 'volume', 'T hipertrofia iniciante', 'Fonte fictícia B', 'x', '{hipertrofia}', '{iniciante}',
   array_fill(0.2::real, array[384])::extensions.vector),
  ('diretriz', 'forca', 'T forca avancado', 'Fonte fictícia C', 'x', '{forca}', '{avancado}',
   array_fill(0.3::real, array[384])::extensions.vector),
  ('diretriz', 'forca', 'T sem embedding', 'Fonte fictícia D', 'x', '{}', '{}', null);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select set_eq(
  $$select titulo from public.buscar_conhecimento_rag(array_fill(0.1::real, array[384])::extensions.vector, 'hipertrofia', 'iniciante', 10)$$,
  array['T geral', 'T hipertrofia iniciante'],
  'hipertrofia/iniciante traz o geral e o específico, não o de força'
);

select set_eq(
  $$select titulo from public.buscar_conhecimento_rag(array_fill(0.1::real, array[384])::extensions.vector, 'forca', 'avancado', 10)$$,
  array['T geral', 'T forca avancado'],
  'forca/avancado traz o geral e o de força'
);

select set_eq(
  $$select titulo from public.buscar_conhecimento_rag(array_fill(0.1::real, array[384])::extensions.vector, 'hipertrofia', 'avancado', 10)$$,
  array['T geral'],
  'objetivo certo com nível errado fica de fora'
);

select is(
  (select count(*)::int from public.buscar_conhecimento_rag(array_fill(0.1::real, array[384])::extensions.vector, null, null, 10)),
  3, 'sem filtro traz todos com embedding'
);

select is(
  (select count(*)::int from public.buscar_conhecimento_rag(array_fill(0.1::real, array[384])::extensions.vector, null, null, 1)),
  1, 'respeita o limite'
);

select throws_ok(
  $$insert into public.base_conhecimento (tipo, titulo, fonte, conteudo) values ('d', 'invasor', 'f', 'x')$$,
  '42501', null, 'authenticated não escreve na base de conhecimento'
);

select * from finish();
rollback;
