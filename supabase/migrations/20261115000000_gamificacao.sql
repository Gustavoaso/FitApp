-- Gamificação (RN22): o treino concluído passa a ir para o servidor e o XP, o nível, a
-- sequência semanal e as conquistas são CALCULADOS por função, sempre a partir dos
-- registros do próprio usuário. Não existe tabela de XP: o cliente não tem onde escrever.

-- O treino do app vem do plano local (ids que não existem no servidor): os vínculos
-- passam a ser opcionais e a sessão leva o nome, a duração e a estimativa de kcal (RN20).
alter table public.sessoes_treino
  alter column plano_treino_id drop not null,
  alter column dia_treino_id drop not null,
  add column nome_treino text,
  add column duracao_minutos integer check (duracao_minutos between 0 and 1440),
  add column kcal_estimadas integer check (kcal_estimadas >= 0);

create or replace function public.resumo_gamificacao(p_hoje date default current_date)
returns jsonb
language plpgsql stable security invoker
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_semana_hoje integer := (date_trunc('week', p_hoje)::date - date '2000-01-03') / 7;
  v_meta integer;
  v_treinos integer;
  v_dias date[];
  v_xp integer;
  v_atual integer := 0;
  v_melhor integer := 0;
  v_cumpridas integer[];
  v_semana integer;
  v_corrida integer := 0;
  v_anterior integer;
  v_nivel integer;
  v_nome text;
  v_minimo integer;
  v_proximo integer;
  v_conquistas text[] := '{}';
  v_xp_agua integer;
  v_xp_refeicoes integer;
  v_xp_peso integer;
begin
  if v_usuario is null then
    return null;
  end if;

  -- Treino concluído duas vezes no mesmo dia vale uma vez: conta-se por data.
  select coalesce(array_agg(distinct data), '{}'), count(distinct data) into v_dias, v_treinos
  from public.sessoes_treino
  where usuario_id = v_usuario and finalizado_em is not null;

  -- Meta semanal = dias por semana do plano ativo. Sem plano ativo não há semana cumprida.
  select coalesce(max(dias_por_semana), 0) into v_meta
  from public.planos_treino where usuario_id = v_usuario and ativo;

  select coalesce(array_agg(semana order by semana), '{}') into v_cumpridas
  from (
    select (date_trunc('week', data)::date - date '2000-01-03') / 7 as semana
    from unnest(v_dias) as data
    group by 1
    having v_meta > 0 and count(*) >= v_meta
  ) s;

  -- Sequências de semanas consecutivas: a atual vale se termina nesta semana ou na passada.
  foreach v_semana in array v_cumpridas loop
    if v_anterior is not null and v_semana = v_anterior + 1 then
      v_corrida := v_corrida + 1;
    else
      v_corrida := 1;
    end if;
    v_anterior := v_semana;
    v_melhor := greatest(v_melhor, v_corrida);
    if v_semana >= v_semana_hoje - 1 then
      v_atual := v_corrida;
    end if;
  end loop;
  if v_anterior is null or v_anterior < v_semana_hoje - 1 then
    v_atual := 0;
  end if;

  select count(*) * 20 into v_xp_agua from public.registros_agua
  where usuario_id = v_usuario and meta_ml > 0 and total_ml >= meta_ml;

  -- PREMISSA: "todas as refeições do dia" = ao menos 3 registradas e todas concluídas
  -- (o servidor não guarda quantas o plano previa para cada dia).
  select count(*) * 40 into v_xp_refeicoes from (
    select data from public.registro_refeicoes where usuario_id = v_usuario
    group by data having count(*) >= 3 and bool_and(concluida)
  ) d;

  select count(distinct date_trunc('week', data)) * 20 into v_xp_peso
  from public.historico_peso where usuario_id = v_usuario;

  v_xp := v_treinos * 100 + v_xp_agua + v_xp_refeicoes + v_xp_peso
          + coalesce(array_length(v_cumpridas, 1), 0) * 150;

  select n, nome, minimo into v_nivel, v_nome, v_minimo
  from (values
    (1, 'Iniciante', 0), (2, 'Aprendiz', 150), (3, 'Praticante', 400), (4, 'Dedicado', 800),
    (5, 'Consistente', 1400), (6, 'Forte', 2200), (7, 'Veterano', 3300), (8, 'Atleta', 4800),
    (9, 'Mestre', 6800), (10, 'Lenda', 9500)
  ) as t(n, nome, minimo)
  where minimo <= v_xp order by n desc limit 1;

  select minimo into v_proximo
  from (values (150), (400), (800), (1400), (2200), (3300), (4800), (6800), (9500)) as t(minimo)
  where minimo > v_xp order by minimo limit 1;

  if v_treinos >= 1 then v_conquistas := array_append(v_conquistas, 'primeiro_treino'); end if;
  if v_treinos >= 10 then v_conquistas := array_append(v_conquistas, 'treinos_10'); end if;
  if v_treinos >= 50 then v_conquistas := array_append(v_conquistas, 'treinos_50'); end if;
  if v_treinos >= 100 then v_conquistas := array_append(v_conquistas, 'treinos_100'); end if;
  if v_melhor >= 4 then v_conquistas := array_append(v_conquistas, 'semanas_4'); end if;
  if v_melhor >= 12 then v_conquistas := array_append(v_conquistas, 'semanas_12'); end if;

  -- Recorde de carga: num exercício, a maior carga de um dia supera tudo o que veio antes.
  if exists (
    select 1 from (
      select exercicio_id, executado_em::date as dia, max(carga_kg) as maxima
      from public.historico_series_executadas
      where usuario_id = v_usuario and carga_kg > 0
      group by exercicio_id, executado_em::date
    ) d
    where d.maxima > (
      select max(a.carga_kg) from public.historico_series_executadas a
      where a.usuario_id = v_usuario and a.exercicio_id = d.exercicio_id
        and a.executado_em::date < d.dia and a.carga_kg > 0
    )
  ) then
    v_conquistas := array_append(v_conquistas, 'recorde_carga');
  end if;

  return jsonb_build_object(
    'xp', v_xp,
    'nivel', v_nivel,
    'nome_nivel', v_nome,
    'xp_nivel_atual', v_minimo,
    'xp_proximo_nivel', v_proximo,
    'semanas_seguidas', v_atual,
    'melhor_sequencia', v_melhor,
    'treinos', v_treinos,
    'conquistas', to_jsonb(v_conquistas)
  );
end;
$$;

revoke execute on function public.resumo_gamificacao(date) from public, anon;
grant execute on function public.resumo_gamificacao(date) to authenticated;
