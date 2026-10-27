-- Etapa 9: salva o plano gerado numa transação só (RN11) e limita
-- a 5 gerações por usuário por dia no fuso de São Paulo (RN13).
-- security invoker: cada insert passa pela RLS de quem chama.

-- O contador mora em planos_ia_gerados: o usuário não pode apagá-lo nem
-- alterá-lo, senão zera o limite. Ler e criar continuam (a RPC cria).
drop policy planos_ia_gerados_alterar on public.planos_ia_gerados;
drop policy planos_ia_gerados_apagar on public.planos_ia_gerados;

-- O modelo passa a ser o local; o default antigo era de nuvem.
alter table public.planos_ia_gerados alter column modelo_ia set default 'llama3.2';

create function public.salvar_plano_gerado(p_dados jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_plano jsonb := p_dados -> 'plano';
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_plano_ia uuid;
  v_plano_treino uuid;
  v_plano_dieta uuid;
  v_dia jsonb;
  v_dia_id uuid;
  v_refeicao jsonb;
  v_refeicao_id uuid;
  v_dia_semana int;
begin
  if v_usuario is null then
    raise exception 'nao_autenticado' using errcode = '42501';
  end if;
  if jsonb_typeof(v_plano -> 'treino' -> 'dias') <> 'array'
     or jsonb_typeof(v_plano -> 'dieta' -> 'refeicoes') <> 'array'
     or jsonb_typeof(v_plano -> 'resumo') <> 'object' then
    raise exception 'plano_invalido' using errcode = '22023';
  end if;

  -- Uma geração por vez por usuário: sem isso, duas chamadas juntas
  -- contariam 4 e gravariam a 5ª e a 6ª.
  perform pg_advisory_xact_lock(hashtext('salvar_plano_gerado:' || v_usuario::text));
  if (select count(*) from planos_ia_gerados
      where usuario_id = v_usuario
        and (criado_em at time zone 'America/Sao_Paulo')::date = v_hoje) >= 5 then
    raise exception 'limite_diario' using errcode = 'P0001';
  end if;

  insert into planos_ia_gerados (usuario_id, respostas_questionario, plano_gerado, modelo_ia)
  values (v_usuario, coalesce(p_dados -> 'respostas', '{}'), v_plano, coalesce(p_dados ->> 'modelo', 'llama3.2'))
  returning id into v_plano_ia;

  -- Treino: o anterior fica inativo (não apaga, as sessões apontam para ele).
  update planos_treino set ativo = false where usuario_id = v_usuario and ativo;
  insert into planos_treino (usuario_id, nome, dias_por_semana, foco, exercicios)
  values (
    v_usuario,
    coalesce(v_plano -> 'treino' ->> 'nomeDivisao', 'Plano de treino'),
    jsonb_array_length(v_plano -> 'treino' -> 'dias'),
    coalesce(v_plano -> 'treino' ->> 'nomeDivisao', 'Plano de treino'),
    v_plano -> 'treino' -> 'dias'
  )
  returning id into v_plano_treino;

  for v_dia in select * from jsonb_array_elements(v_plano -> 'treino' -> 'dias') loop
    insert into dias_treino (plano_treino_id, dia_semana, nome)
    values (v_plano_treino, (v_dia ->> 'diaSemana')::int, v_dia ->> 'nome')
    returning id into v_dia_id;

    insert into exercicios_plano (dia_treino_id, exercicio_id, nome, ordem, series)
    select v_dia_id, (e ->> 'exercicioId')::uuid, e ->> 'nome', ordem::int,
           jsonb_build_array(jsonb_build_object(
             'numero', 1,
             'quantidade', (e ->> 'series')::int,
             'repeticoes', e ->> 'repeticoes',
             'descansoSegundos', (e ->> 'descansoSegundos')::int))
    from jsonb_array_elements(v_dia -> 'exercicios') with ordinality as x(e, ordem);
  end loop;

  -- Dieta: metas nos nomes novos e nos aliases que o app ainda lê.
  update planos_dieta set ativo = false where usuario_id = v_usuario and ativo;
  insert into planos_dieta (
    usuario_id, calorias_alvo, proteinas_alvo_g, carboidratos_alvo_g, gorduras_alvo_g, meta_agua_ml,
    meta_calorias, meta_calories, meta_proteinas_g, meta_protein_g, meta_carboidratos_g, meta_carbs_g,
    meta_gorduras_g, meta_fat_g, water_goal_ml
  )
  select v_usuario, kcal, p, c, g, agua, kcal, kcal, p, p, c, c, g, g, agua
  from (select
    round((v_plano -> 'resumo' ->> 'caloriasAlvo')::numeric)::int as kcal,
    round((v_plano -> 'resumo' -> 'macros' ->> 'proteinas')::numeric)::int as p,
    round((v_plano -> 'resumo' -> 'macros' ->> 'carboidratos')::numeric)::int as c,
    round((v_plano -> 'resumo' -> 'macros' ->> 'gorduras')::numeric)::int as g,
    round((v_plano -> 'resumo' ->> 'metaAguaMl')::numeric)::int as agua) as metas
  returning id into v_plano_dieta;

  -- A mesma dieta nos 7 dias da semana, como o fluxo antigo.
  for v_dia_semana in 0..6 loop
    for v_refeicao in select * from jsonb_array_elements(v_plano -> 'dieta' -> 'refeicoes') loop
      insert into refeicoes_plano (plano_dieta_id, tipo, nome, horario_sugerido, dia_semana)
      values (
        v_plano_dieta,
        case v_refeicao ->> 'nome'
          when 'Café da manhã' then 'cafe_da_manha'
          when 'Almoço' then 'almoco'
          when 'Jantar' then 'jantar'
          else 'lanche_tarde'
        end,
        v_refeicao ->> 'nome',
        v_refeicao ->> 'horario',
        v_dia_semana
      )
      returning id into v_refeicao_id;

      insert into alimentos_refeicao (refeicao_plano_id, alimento_id, nome, porcao_gramas, calorias, proteinas, carboidratos, gorduras)
      select v_refeicao_id, (a ->> 'alimentoId')::bigint, a ->> 'nome',
             replace(a ->> 'porcao', 'g', '')::numeric,
             (a ->> 'calorias')::numeric, (a ->> 'proteinas')::numeric,
             (a ->> 'carboidratos')::numeric, (a ->> 'gorduras')::numeric
      from jsonb_array_elements(v_refeicao -> 'alimentos') as a;
    end loop;
  end loop;

  return v_plano_ia;
end;
$$;

revoke execute on function public.salvar_plano_gerado(jsonb) from public, anon;
grant execute on function public.salvar_plano_gerado(jsonb) to authenticated;
