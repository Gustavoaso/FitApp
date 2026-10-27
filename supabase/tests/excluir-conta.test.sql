-- Exclusão de conta (PROJETO.md seção 4): apagar o usuário do Auth, como faz a
-- Edge Function excluir-conta, não deixa nenhuma linha dele em tabela nenhuma.
-- Rodar com: npx supabase test db (só no banco local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

-- Contagem de linhas de cada tabela do schema public antes do usuário existir.
create temp table contagem (tabela text primary key, antes bigint, depois bigint);
create or replace function pg_temp.contar(nome text) returns bigint
language plpgsql as $$
declare total bigint;
begin
  execute format('select count(*) from public.%I', nome) into total;
  return total;
end;
$$;
insert into contagem (tabela, antes)
select tablename, pg_temp.contar(tablename) from pg_tables where schemaname = 'public';

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd@teste.local');
insert into public.base_exercicios (id, nome, grupo_primario, equipamento, nivel, is_curado)
values ('00000000-0000-0000-0000-0000000000e1', 'Supino Teste', 'peito', 'barra', 'iniciante', true);
insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, is_curado)
values (990001, 'Frango Teste', 'carnes', 159, 32, 0, 3.2, true);

-- Dados fictícios: perfil com aceite e um plano completo (treino e dieta).
insert into public.perfis (usuario_id, nome, idade, sexo, peso_kg, altura_cm,
  nivel_experiencia, nivel_atividade, consentimento_saude_em)
values ('00000000-0000-0000-0000-0000000000d1', 'Pessoa Teste', 30, 'feminino', 60, 165,
  'iniciante', 'moderado', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select public.salvar_plano_gerado($json${
  "modelo": "llama3.2",
  "respostas": {"objetivo": {"objetivo_principal": "Hipertrofia"}},
  "plano": {
    "resumo": {"tmb": 1700, "tdee": 2600, "caloriasAlvo": 2860, "metaAguaMl": 2625,
               "macros": {"proteinas": 215, "carboidratos": 322, "gorduras": 79}},
    "treino": {"nomeDivisao": "Full body", "dias": [
      {"diaSemana": 1, "nome": "A", "tipo": "treino", "exercicios": [
        {"exercicioId": "00000000-0000-0000-0000-0000000000e1", "nome": "Supino Teste",
         "series": 3, "repeticoes": "8-12", "descansoSegundos": 90}]},
      {"diaSemana": 3, "nome": "B", "tipo": "treino", "exercicios": []}]},
    "dieta": {"refeicoes": [
      {"nome": "Almoço", "horario": "12:00", "alimentos": [
        {"alimentoId": "990001", "nome": "Frango Teste", "porcao": "150g",
         "calorias": 239, "proteinas": 48, "carboidratos": 0, "gorduras": 4.8}]}]}
  }
}$json$::jsonb);
-- Sessão de treino (referencia o plano sem cascade próprio) e registros avulsos.
insert into public.sessoes_treino (usuario_id, plano_treino_id, dia_treino_id)
select p.usuario_id, p.id, d.id from public.planos_treino p join public.dias_treino d on d.plano_treino_id = p.id limit 1;
insert into public.historico_peso (usuario_id, peso_kg)
values ('00000000-0000-0000-0000-0000000000d1', 60);
reset role;

select ok(
  (select count(*) from contagem c where pg_temp.contar(c.tabela) > c.antes) >= 8,
  'o usuário fictício tem linhas em várias tabelas antes da exclusão'
);

delete from auth.users where id = '00000000-0000-0000-0000-0000000000d1';

update contagem set depois = pg_temp.contar(tabela);
select is(
  (select string_agg(tabela, ', ') from contagem
   where depois <> antes and tabela not in ('base_exercicios', 'base_alimentos')),
  null,
  'nenhuma tabela ficou com linha do usuário excluído'
);
select is((select count(*)::int from auth.identities
  where user_id = '00000000-0000-0000-0000-0000000000d1'), 0, 'nada sobra no Auth');

select * from finish();
rollback;
