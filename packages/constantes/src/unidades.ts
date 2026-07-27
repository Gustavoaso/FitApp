// ============================================================
// UNIDADES E CONVERSÕES
// ============================================================
// Funções de conversão entre sistemas de unidades.
// O app usa o sistema métrico (kg, cm) internamente,
// mas oferece opção de exibição em imperial (lb, in).
// ============================================================

/**
 * Converte quilogramas para libras (pounds).
 * 1 kg = 2.20462 lb
 */
export function kgParaLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Converte libras para quilogramas.
 * 1 lb = 0.453592 kg
 */
export function lbParaKg(lb: number): number {
  return Math.round(lb * 0.453592 * 10) / 10;
}

/**
 * Converte centímetros para pés e polegadas.
 * Retorna string formatada: ex: 5'10"
 */
export function cmParaFtIn(cm: number): string {
  const totalPolegadas = cm / 2.54;
  const pes = Math.floor(totalPolegadas / 12);
  const polegadas = Math.round(totalPolegadas % 12);
  return `${pes}'${polegadas}"`;
}

/**
 * Converte pés e polegadas para centímetros.
 */
export function ftInParaCm(pes: number, polegadas: number): number {
  return Math.round((pes * 12 + polegadas) * 2.54);
}

/** Unidades de peso suportadas */
export type UnidadePeso = 'kg' | 'lb';

/** Unidades de altura suportadas */
export type UnidadeAltura = 'cm' | 'ft_in';
