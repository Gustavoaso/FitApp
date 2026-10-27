-- ============================================================
-- MIGRATION 024: LIMPEZA DE NOMES E CAPITALIZACAO
-- ============================================================

UPDATE public.base_alimentos
SET nome = initcap(
  regexp_replace(
    replace(
      replace(
        replace(nome, '&quot;', '"'), 
        '&amp;', '&'
      ), 
      '&#039;', ''''
    ),
    '^[^a-zA-Z0-9]+', 
    ''
  )
);
