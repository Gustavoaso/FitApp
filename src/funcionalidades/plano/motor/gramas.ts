// ============================================================
// MOTOR: gramas por mínimos quadrados com limites (RN09)
// ============================================================
// Para cada refeição, acha as gramas dos alimentos que deixam
// kcal, proteína, carboidrato e gordura mais perto da meta,
// minimizando a soma dos erros relativos ao quadrado.
// Método: descida por coordenadas com corte nos limites (cada
// passo resolve uma variável exatamente e corta no intervalo).
// Converge porque o problema é convexo e a caixa é separável.
// ============================================================

import type { AlimentoCandidato, MetaDia, NomeRefeicao, SlotAlimento } from './tipos';

// PREMISSA: peso de cada refeição nas calorias do dia; a fração real é o peso dividido
// pela soma das refeições que a pessoa faz (com 4 refeições: 25/35/15/25%).
export const FRACAO_REFEICAO: Record<NomeRefeicao, number> = {
  cafe: 0.25,
  lanche_manha: 0.1,
  almoco: 0.35,
  lanche: 0.15,
  jantar: 0.25,
  ceia: 0.1,
};

// PREMISSA: porção mínima e máxima de um alimento numa refeição, por slot
// (RN09): complemento é gordura concentrada (azeite, castanhas), então 40 g já
// é muito; 500 g cabe o almoço de quem precisa de ~3.700 kcal só com arroz cozido ou de
// quem come proteína vegetal diluída (soja cozida, 16 g/100 g).
export const LIMITES_GRAMAS: Record<SlotAlimento, readonly [number, number]> = {
  proteina: [50, 500],
  carboidrato: [30, 500],
  complemento: [5, 40],
};
export const GRAMAS_MIN = 5;
export const GRAMAS_MAX = 500;
export const TOLERANCIA = 0.05;

const CHAVES = ['calorias', 'proteinas', 'carboidratos', 'gorduras'] as const;

function vetor(a: AlimentoCandidato): number[] {
  // Valores por grama, na ordem de CHAVES.
  return [a.kcal / 100, a.proteina / 100, a.carboidrato / 100, a.gordura / 100];
}

export function calcularGramas(alimentos: AlimentoCandidato[], meta: MetaDia): number[] {
  const alvo = CHAVES.map((k) => meta[k]);
  if (alimentos.length === 0 || alvo.some((v) => !Number.isFinite(v) || v <= 0)) {
    throw new Error('Meta ou alimentos inválidos.');
  }
  // Peso 1/alvo² torna o erro relativo, para kcal não dominar os gramas.
  const pesos = alvo.map((v) => 1 / (v * v));
  const colunas = alimentos.map(vetor);
  const gramas = alimentos.map(() => 100);

  for (let iter = 0; iter < 500; iter++) {
    for (let i = 0; i < gramas.length; i++) {
      // Resíduo sem a contribuição do alimento i.
      let num = 0;
      let den = 0;
      for (let k = 0; k < alvo.length; k++) {
        let soma = 0;
        for (let j = 0; j < gramas.length; j++) if (j !== i) soma += colunas[j][k] * gramas[j];
        num += pesos[k] * colunas[i][k] * (alvo[k] - soma);
        den += pesos[k] * colunas[i][k] * colunas[i][k];
      }
      const otimo = den > 0 ? num / den : GRAMAS_MIN;
      const [min, max] = LIMITES_GRAMAS[alimentos[i].slot];
      gramas[i] = Math.min(max, Math.max(min, otimo));
    }
  }
  return gramas.map((g) => Math.round(g));
}

export function somarMacros(itens: { alimento: AlimentoCandidato; gramas: number }[]): MetaDia {
  const total: MetaDia = { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
  for (const { alimento, gramas } of itens) {
    const v = vetor(alimento);
    CHAVES.forEach((k, i) => (total[k] += v[i] * gramas));
  }
  return total;
}

/** Erros de cada macro do dia fora de ±5% da meta. Lista vazia = ok. */
export function conferirTolerancia(total: MetaDia, meta: MetaDia): string[] {
  return CHAVES.filter((k) => Math.abs(total[k] - meta[k]) > TOLERANCIA * meta[k]).map(
    (k) => `${k} do dia fora de ±5% da meta (${Math.round(total[k])} de ${Math.round(meta[k])}).`,
  );
}

export function metaDaRefeicao(
  meta: MetaDia,
  refeicao: NomeRefeicao,
  refeicoesDoDia: NomeRefeicao[] = ['cafe', 'almoco', 'lanche', 'jantar'],
): MetaDia {
  const soma = refeicoesDoDia.reduce((t, r) => t + FRACAO_REFEICAO[r], 0);
  const f = FRACAO_REFEICAO[refeicao] / soma;
  return {
    calorias: meta.calorias * f,
    proteinas: meta.proteinas * f,
    carboidratos: meta.carboidratos * f,
    gorduras: meta.gorduras * f,
  };
}
