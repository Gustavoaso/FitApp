// ============================================================
// FORMATADORES
// ============================================================
// Funções para formatar valores numéricos de forma legível
// na interface do usuário. Usam o padrão brasileiro (pt-BR):
// - Separador de milhar: ponto (1.847)
// - Separador decimal: vírgula (72,5)
// ============================================================

/**
 * Formata um número de calorias para exibição.
 * Ex: 1847 → "1.847 kcal"
 */
export function formatarCalorias(kcal: number): string {
  return `${kcal.toLocaleString('pt-BR')} kcal`;
}

/**
 * Formata um valor em gramas para exibição.
 * Ex: 124.5 → "124,5g" ou 124 → "124g"
 */
export function formatarGramas(gramas: number): string {
  // Se o número é inteiro, não mostra decimais
  if (Number.isInteger(gramas)) {
    return `${gramas}g`;
  }
  // Se tem decimal, mostra no máximo 1 casa
  return `${gramas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}g`;
}

/**
 * Formata um valor em mililitros para exibição.
 * Ex: 2450 → "2,4L" (se >= 1000ml, converte para litros)
 *     350 → "350ml"
 */
export function formatarAgua(ml: number): string {
  if (ml >= 1000) {
    const litros = ml / 1000;
    return `${litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L`;
  }
  return `${ml}ml`;
}

/**
 * Formata segundos em minutos:segundos para o timer de descanso.
 * Ex: 90 → "01:30"
 *     45 → "00:45"
 */
export function formatarTempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

/**
 * Formata peso em kg para exibição.
 * Ex: 72.5 → "72,5 kg" ou 80 → "80 kg"
 */
export function formatarPeso(kg: number): string {
  if (Number.isInteger(kg)) {
    return `${kg} kg`;
  }
  return `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
}

/**
 * Calcula e formata o percentual de progresso.
 * Ex: formatarProgresso(1200, 2400) → "50%"
 */
export function formatarProgresso(atual: number, meta: number): string {
  if (meta === 0) return '0%';
  const percentual = Math.round((atual / meta) * 100);
  return `${Math.min(percentual, 100)}%`;
}
