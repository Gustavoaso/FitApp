-- Contrato de schema para impedir que o app comece uma gravacao parcial
-- quando o banco estiver atrasado ou incompleto.
CREATE OR REPLACE FUNCTION public.validar_compatibilidade_planejamento()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY INVOKER
AS $$
  WITH esperado(tabela, coluna) AS (
    VALUES
      ('planos_treino', 'usuario_id'), ('planos_treino', 'nome'),
      ('planos_treino', 'dias_por_semana'), ('planos_treino', 'ativo'),
      ('planos_treino', 'criado_em'), ('planos_treino', 'dia_semana'),
      ('planos_treino', 'foco'), ('planos_treino', 'exercicios'),
      ('dias_treino', 'plano_treino_id'), ('dias_treino', 'dia_semana'),
      ('dias_treino', 'nome'),
      ('exercicios_plano', 'dia_treino_id'), ('exercicios_plano', 'exercicio_id'),
      ('exercicios_plano', 'nome'), ('exercicios_plano', 'ordem'),
      ('exercicios_plano', 'series'),
      ('planos_dieta', 'usuario_id'), ('planos_dieta', 'calorias_alvo'),
      ('planos_dieta', 'proteinas_alvo_g'), ('planos_dieta', 'carboidratos_alvo_g'),
      ('planos_dieta', 'gorduras_alvo_g'), ('planos_dieta', 'meta_agua_ml'),
      ('planos_dieta', 'meta_calorias'), ('planos_dieta', 'meta_proteinas'),
      ('planos_dieta', 'meta_carboidratos'), ('planos_dieta', 'meta_gorduras'),
      ('planos_dieta', 'meta_proteinas_g'), ('planos_dieta', 'meta_carboidratos_g'),
      ('planos_dieta', 'meta_gorduras_g'),
      ('planos_dieta', 'meta_agua'), ('planos_dieta', 'ativo'),
      ('planos_dieta', 'criado_em'),
      ('refeicoes_plano', 'plano_dieta_id'), ('refeicoes_plano', 'dia_semana'),
      ('refeicoes_plano', 'tipo'), ('refeicoes_plano', 'nome'),
      ('refeicoes_plano', 'horario_sugerido'),
      ('alimentos_refeicao', 'refeicao_plano_id'), ('alimentos_refeicao', 'alimento_id'),
      ('alimentos_refeicao', 'nome'), ('alimentos_refeicao', 'porcao_gramas'),
      ('alimentos_refeicao', 'calorias'), ('alimentos_refeicao', 'proteinas'),
      ('alimentos_refeicao', 'carboidratos'), ('alimentos_refeicao', 'gorduras')
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

GRANT EXECUTE ON FUNCTION public.validar_compatibilidade_planejamento() TO anon, authenticated;
