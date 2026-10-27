-- Atualiza o contrato para contemplar todos os nomes legados conhecidos.
CREATE OR REPLACE FUNCTION public.validar_compatibilidade_planejamento()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY INVOKER
AS $$
  WITH grupos(tabela, colunas) AS (
    VALUES
      ('planos_treino', 'usuario_id,nome,dias_por_semana,ativo,criado_em,dia_semana,foco,exercicios'),
      ('dias_treino', 'plano_treino_id,dia_semana,nome'),
      ('exercicios_plano', 'dia_treino_id,exercicio_id,nome,ordem,series'),
      ('planos_dieta', 'usuario_id,calorias_alvo,proteinas_alvo_g,carboidratos_alvo_g,gorduras_alvo_g,meta_agua_ml,meta_calorias,meta_proteinas,meta_carboidratos,meta_gorduras,meta_proteinas_g,meta_carboidratos_g,meta_gorduras_g,meta_protein_g,meta_carbs_g,meta_fat_g,meta_fats_g,meta_calories,water_goal_ml,meta_agua,ativo,criado_em'),
      ('refeicoes_plano', 'plano_dieta_id,dia_semana,tipo,nome,horario_sugerido'),
      ('alimentos_refeicao', 'refeicao_plano_id,alimento_id,nome,porcao_gramas,calorias,proteinas,carboidratos,gorduras')
  ), esperado AS (
    SELECT tabela, trim(coluna) AS coluna
    FROM grupos, unnest(string_to_array(colunas, ',')) AS coluna
  ), faltantes AS (
    SELECT e.tabela, e.coluna
    FROM esperado e
    LEFT JOIN information_schema.columns c
      ON c.table_schema = 'public'
     AND c.table_name = e.tabela
     AND c.column_name = e.coluna
    WHERE c.column_name IS NULL
  )
  SELECT jsonb_build_object(
    'valido', NOT EXISTS (SELECT 1 FROM faltantes),
    'faltantes', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('tabela', tabela, 'coluna', coluna) ORDER BY tabela, coluna) FROM faltantes),
      '[]'::jsonb
    )
  );
$$;
