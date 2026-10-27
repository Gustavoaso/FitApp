// ============================================================
// REGRAS DA TELA DE RESULTADO (sem React, sem rede)
// ============================================================
// Divide o anel do orbe pelas kcal de cada macro e descreve
// o balanço calórico (meta - gasto) em texto curto.
// ============================================================

export type MacroAnel = 'proteina' | 'carboidrato' | 'gordura';

export interface SegmentoAnel {
  macro: MacroAnel;
  /** Comprimento do traço no círculo. */
  comprimento: number;
  /** Onde o traço começa, a partir do topo. */
  inicio: number;
}

const KCAL_POR_GRAMA: Record<MacroAnel, number> = { proteina: 4, carboidrato: 4, gordura: 9 };

function valido(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

/**
 * Segmentos do anel na ordem proteína, carboidrato, gordura, com um
 * espaço entre eles. Gramas inválidas ou todas zero → anel vazio.
 */
export function segmentosAnel(
  gramas: { proteinas: number; carboidratos: number; gorduras: number },
  circunferencia: number,
  espaco: number,
): SegmentoAnel[] {
  const valores: [MacroAnel, unknown][] = [
    ['proteina', gramas?.proteinas],
    ['carboidrato', gramas?.carboidratos],
    ['gordura', gramas?.gorduras],
  ];
  if (!valores.every(([, g]) => valido(g)) || !valido(circunferencia) || !valido(espaco)) return [];
  const kcal = valores.map(([macro, g]) => (g as number) * KCAL_POR_GRAMA[macro]);
  const total = kcal.reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  let inicio = 0;
  return valores.map(([macro], i) => {
    const fatia = (kcal[i] / total) * circunferencia;
    const segmento = { macro, comprimento: Math.max(fatia - espaco, 0), inicio };
    inicio += fatia;
    return segmento;
  });
}

/** "+300 de superávit", "-400 de déficit" ou "manutenção". */
export function descreverBalanco(caloriasAlvo: number, gastoDiario: number): string {
  if (!valido(caloriasAlvo) || !valido(gastoDiario)) return '';
  const diferenca = Math.round(caloriasAlvo - gastoDiario);
  if (diferenca > 0) return `+${diferenca.toLocaleString('pt-BR')} de superávit`;
  if (diferenca < 0) return `${diferenca.toLocaleString('pt-BR')} de déficit`;
  return 'manutenção';
}
