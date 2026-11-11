// Progresso ESTIMADO da geração (o serviço não informa o real): sobe suave
// com o tempo, com piso por fase, e nunca passa de 95% enquanto gera.
const TAU_SEGUNDOS = 25;
const TETO = 95;

export function progressoEstimado(segundos: number, fase: number, totalFases: number): number {
  const tempo = Number.isFinite(segundos) ? Math.max(0, segundos) : 0;
  const curva = Math.min(TETO, 100 * (1 - Math.exp(-tempo / TAU_SEGUNDOS)));
  const piso = totalFases > 0 ? Math.min(TETO, (Math.max(0, fase) / totalFases) * 100) : 0;
  return Math.round(Math.max(curva, piso));
}
