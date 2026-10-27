// ============================================================
// KNOWLEDGE BASE: NUTRIÇÃO
// ============================================================
// Conhecimento condensado de ciência da nutrição esportiva,
// injetado no system prompt da IA pra guiar a montagem de
// planos alimentares personalizados.
// ============================================================

export const CONHECIMENTO_NUTRICAO = {
  regrasDieta: [
    'Distribuir proteína entre refeições: 0.3-0.5g/kg por refeição (Jäger 2017)',
    'Pré-treino: carb + proteína 1-2h antes',
    'Pós-treino: 30-40g proteína + carb dentro de 2h',
    'Fibra mínima: 25-30g/dia. Incluir verduras/legumes nas refeições principais',
    'Gordura saudável: azeite, abacate, castanhas. Mín 20% calorias de gordura',
    'Incluir proteína em todas as refeições (ovos, whey, iogurte, carnes, leguminosas)',
    'Última refeição pode ser leve: caseína ou proteína de digestão lenta (cottage, iogurte)',
    'Veganos: combinar leguminosas + cereais pra aminoácidos completos',
    'Sem lactose: versões sem lactose ou vegetais',
    'Sem glúten: tapioca, arroz, batata doce',
  ],

  /** Refeições nomeadas sequencialmente: "Refeição 1", "Refeição 2", etc. */
  nomeacaoRefeicoes: (quantidade: number): string[] =>
    Array.from({ length: quantidade }, (_, i) => `Refeição ${i + 1}`),

  principios: [
    'Proteína total diária importa mais que timing exato (Schoenfeld 2013)',
    '1.6-2.2g/kg/dia maximiza síntese proteica (Morton 2018)',
    'Deficit calórico = único fator obrigatório pra perda de peso',
    'Superávit necessário pra ganho máximo de massa',
    'Hidratação: 35ml/kg/dia base, +500-1000ml dia de treino',
    'Creatina 3-5g/dia: único suplemento classe A (ISSN)',
  ],
};
