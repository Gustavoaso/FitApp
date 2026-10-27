-- RPC salvar_plano_gerado: transação inteira (RN11) e limite diário (RN13).
-- Rodar com: npx supabase test db (só no banco local).
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'c@teste.local');
insert into public.base_exercicios (id, nome, grupo_primario, equipamento, nivel, is_curado)
values ('00000000-0000-0000-0000-0000000000e1', 'Supino Teste', 'peito', 'barra', 'iniciante', true);
insert into public.base_alimentos (id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, is_curado)
values (990001, 'Frango Teste', 'carnes', 159, 32, 0, 3.2, true);

-- Plano fictício mínimo no formato que o app envia.
create temp table dados (valor jsonb);
insert into dados values ($json${
  "modelo": "llama3.2",
  "respostas": {"objetivo": {"objetivo_principal": "Hipertrofia"}},
  "plano": {
    "resumo": {"tmb": 1700, "tdee": 2600, "caloriasAlvo": 2860, "metaAguaMl": 2625,
               "macros": {"proteinas": 215, "carboidratos": 322, "gorduras": 79}},
    "treino": {"nomeDivisao": "Superior / Inferior", "dias": [
      {"diaSemana": 1, "nome": "Superior", "tipo": "treino", "exercicios": [
        {"exercicioId": "00000000-0000-0000-0000-0000000000e1", "nome": "Supino Teste",
         "series": 3, "repeticoes": "8-12", "descansoSegundos": 90}]},
      {"diaSemana": 2, "nome": "Inferior", "tipo": "treino", "exercicios": []}]},
    "dieta": {"refeicoes": [
      {"nome": "Almoço", "horario": "12:00", "alimentos": [
        {"alimentoId": "990001", "nome": "Frango Teste", "porcao": "150g",
         "calorias": 239, "proteinas": 48, "carboidratos": 0, "gorduras": 4.8}]}]}
  }
}$json$);
grant select on dados to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

-- Sucesso: grava log, treino e dieta juntos.
select lives_ok($$select public.salvar_plano_gerado((select valor from dados))$$, 'salva um plano válido');
select is((select count(*)::int from public.planos_ia_gerados), 1, 'log da geração gravado');
select is((select count(*)::int from public.exercicios_plano), 1, 'exercício gravado no dia');
select is((select count(*)::int from public.alimentos_refeicao), 7, 'refeição nos 7 dias da semana');

-- Transação: um exercício inexistente no meio desfaz tudo, inclusive o log.
select throws_ok(
  $$select public.salvar_plano_gerado(jsonb_set((select valor from dados),
    '{plano,treino,dias,0,exercicios,0,exercicioId}', '"00000000-0000-0000-0000-00000000dead"'))$$,
  '22023', 'plano_invalido', 'exercício fora da base é recusado sem detalhe interno'
);

-- Corpo malformado (dia sem nome): erro genérico, não o 23502 com a coluna.
select throws_ok(
  $$select public.salvar_plano_gerado((select valor from dados) #- '{plano,treino,dias,0,nome}')$$,
  '22023', 'plano_invalido', 'campo obrigatório ausente vira plano_invalido'
);
select is((select count(*)::int from public.planos_ia_gerados), 1, 'falha não deixou log a mais');
select is((select count(*)::int from public.planos_treino), 1, 'falha não deixou plano pela metade');

-- O contador não pode ser zerado pelo usuário.
delete from public.planos_ia_gerados;
select is((select count(*)::int from public.planos_ia_gerados), 1, 'usuário não apaga o log das gerações');

-- Limite: 2ª a 5ª passam, a 6ª no mesmo dia é recusada.
select public.salvar_plano_gerado((select valor from dados)) from generate_series(2, 5);
select is((select count(*)::int from public.planos_ia_gerados), 5, 'cinco gerações no dia');
select throws_ok($$select public.salvar_plano_gerado((select valor from dados))$$,
  'P0001', 'limite_diario', 'a 6ª geração do dia é recusada');
select is((select count(*)::int from public.planos_treino where ativo), 1, 'só o último plano fica ativo');

select * from finish();
rollback;
