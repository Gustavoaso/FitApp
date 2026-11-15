// ============================================================
// UTILIDADE: semana atual do ciclo de progressão (RN19)
// ============================================================
// O plano guarda o dia em que começou e as 4 semanas do ciclo.
// A semana atual sai da data: a cada 7 dias avança, e depois da
// 4ª o ciclo recomeça (5ª semana = semana 1 com as cargas novas).
// ============================================================

import type { SemanaProgressao } from '@/compartilhado/tipos';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Número da semana (1 a N) do ciclo. Data inválida ou no futuro = semana 1. */
export function semanaDaProgressao(
  inicioEm: string | null | undefined,
  agora: Date,
  semanasDoCiclo = 4,
): number {
  const inicio = new Date(inicioEm ?? '').getTime();
  const dias = Math.floor((agora.getTime() - inicio) / MS_POR_DIA);
  if (!Number.isFinite(dias) || dias < 0 || !(semanasDoCiclo > 0)) return 1;
  return (Math.floor(dias / 7) % semanasDoCiclo) + 1;
}

/** Semana atual e a próxima do ciclo; null em plano sem progressão (antigo). */
export function progressaoDaSemana(
  progressao: SemanaProgressao[] | null | undefined,
  inicioEm: string | null | undefined,
  agora: Date,
): { atual: SemanaProgressao; proxima: SemanaProgressao } | null {
  if (!Array.isArray(progressao) || progressao.length === 0) return null;
  const indice = semanaDaProgressao(inicioEm, agora, progressao.length) - 1;
  return { atual: progressao[indice], proxima: progressao[(indice + 1) % progressao.length] };
}
