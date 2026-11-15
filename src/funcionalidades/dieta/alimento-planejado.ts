// ============================================================
// REGRA: texto de um alimento do plano na aba Dieta (RN19)
// ============================================================
// Gramas com a medida caseira ao lado quando o plano tem, e a
// troca equivalente. Plano antigo (sem os campos) mostra só gramas.
// ============================================================

import type { AlimentoPlanoIA, SubstituicaoAlimento } from '@/compartilhado/tipos';

/** "Arroz cozido • 180g (cerca de 7 colheres de sopa) • 230 kcal" */
export function descreverAlimentoPlanejado(alimento: AlimentoPlanoIA): string {
  const porcao = alimento.medidaCaseira
    ? `${alimento.porcao} (${alimento.medidaCaseira})`
    : alimento.porcao;
  return `${alimento.nome} • ${porcao} • ${Math.round(Number(alimento.calorias) || 0)} kcal`;
}

/** "Ou troque por: Batata cozida, 400g (cerca de 3 unidades)" */
export function descreverSubstituicao(troca: SubstituicaoAlimento): string {
  const medida = troca.medidaCaseira ? ` (${troca.medidaCaseira})` : '';
  return `Ou troque por: ${troca.nome}, ${troca.porcao}${medida}`;
}
