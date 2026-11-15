// ============================================================
// REGRA: orientação do treino a partir do plano gerado (RN19)
// ============================================================
// O detalhe do treino lê do plano gerado o aquecimento, as
// repetições na reserva e a semana da progressão. Liga o dia pelo
// nome (o cache local guarda o nome como foco). Plano antigo, ou
// treino criado à mão, não tem nada disso: devolve só o que houver.
// ============================================================

import type { PlanoIAGerado, SemanaProgressao } from '@/compartilhado/tipos';
import { progressaoDaSemana } from '@/compartilhado/utilidades';

export interface OrientacaoTreino {
  aquecimento: string[];
  /** Repetições na reserva por nome de exercício. */
  reservaPorExercicio: Record<string, number>;
  semana: { atual: SemanaProgressao; proxima: SemanaProgressao } | null;
}

export function orientacaoDoTreino(
  plano: PlanoIAGerado | null | undefined,
  foco: string | null | undefined,
  agora: Date,
): OrientacaoTreino {
  const dia = plano?.treino?.dias?.find((d) => d.nome === foco);
  const reservaPorExercicio: Record<string, number> = {};
  for (const ex of dia?.exercicios ?? []) {
    if (typeof ex.repeticoesReserva === 'number')
      reservaPorExercicio[ex.nome] = ex.repeticoesReserva;
  }
  return {
    aquecimento: Array.isArray(dia?.aquecimento) ? dia.aquecimento : [],
    reservaPorExercicio,
    // A progressão só vale para o treino que veio deste plano.
    semana: dia
      ? progressaoDaSemana(plano?.treino?.progressao, plano?.treino?.inicioEm, agora)
      : null,
  };
}

/** "3 séries · 8-12 reps · 90s descanso · 2 na reserva" */
export function descreverPrescricao(
  series: number,
  repeticoes: number | string,
  descansoSegundos: number,
  reserva?: number,
): string {
  const partes = [
    `${series} ${series === 1 ? 'série' : 'séries'}`,
    `${String(repeticoes || '—')} reps`,
    `${descansoSegundos || 60}s descanso`,
  ];
  if (typeof reserva === 'number') partes.push(`${reserva} na reserva`);
  return partes.join(' · ');
}
