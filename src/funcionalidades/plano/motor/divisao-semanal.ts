// ============================================================
// MOTOR: divisão semanal e volume (RN07, RN08)
// ============================================================
// Divisão fixa por frequência, montada com blocos que não
// repetem grupo em dias seguidos (nem da última para a
// primeira sessão, porque a semana se repete).
// ============================================================

import type { GrupoMuscular, NivelExperiencia, ObjetivoTreino } from '@/compartilhado/tipos';
import type { DiaDivisao, Prescricao, SlotDia } from './tipos';

const SUPERIOR: DiaDivisao = {
  nome: 'Superior',
  grupos: ['peito', 'costas', 'ombros', 'biceps', 'triceps'],
};
const INFERIOR: DiaDivisao = {
  nome: 'Inferior',
  grupos: ['quadriceps', 'posterior', 'gluteos', 'panturrilha', 'abdomen'],
};
const EMPURRAR: DiaDivisao = { nome: 'Empurrar', grupos: ['peito', 'ombros', 'triceps'] };
const PUXAR: DiaDivisao = { nome: 'Puxar', grupos: ['costas', 'biceps', 'antebraco'] };
const PERNAS: DiaDivisao = {
  nome: 'Pernas',
  grupos: ['quadriceps', 'posterior', 'gluteos', 'panturrilha', 'abdomen'],
};
// O 7º dia não pode repetir Pernas (dia 6) nem Empurrar (dia 1).
const CONDICIONAMENTO: DiaDivisao = { nome: 'Condicionamento', grupos: ['corpo_inteiro'] };

const DIVISOES: Record<number, DiaDivisao[]> = {
  2: [SUPERIOR, INFERIOR],
  3: [EMPURRAR, PUXAR, PERNAS],
  4: [SUPERIOR, INFERIOR, SUPERIOR, INFERIOR],
  5: [EMPURRAR, PUXAR, PERNAS, SUPERIOR, INFERIOR],
  6: [EMPURRAR, PUXAR, PERNAS, EMPURRAR, PUXAR, PERNAS],
  7: [EMPURRAR, PUXAR, PERNAS, EMPURRAR, PUXAR, PERNAS, CONDICIONAMENTO],
};

export function montarDivisaoSemanal(dias: number): DiaDivisao[] {
  const divisao = DIVISOES[dias];
  if (!Number.isInteger(dias) || !divisao) {
    throw new Error('Frequência semanal deve ser um inteiro de 2 a 7.');
  }
  return divisao;
}

// PREMISSA: faixas clássicas por objetivo (Schoenfeld/ACSM); revisável.
const REPS_DESCANSO: Record<ObjetivoTreino, { repeticoes: string; descansoSegundos: number }> = {
  forca: { repeticoes: '3-6', descansoSegundos: 180 },
  hipertrofia: { repeticoes: '8-12', descansoSegundos: 90 },
  definicao: { repeticoes: '10-15', descansoSegundos: 60 },
  emagrecimento: { repeticoes: '12-15', descansoSegundos: 60 },
  condicionamento: { repeticoes: '15-20', descansoSegundos: 45 },
};

// PREMISSA: séries e exercícios por sessão crescem com o nível.
const SERIES: Record<NivelExperiencia, number> = { iniciante: 3, intermediario: 3, avancado: 4 };
const EXERCICIOS_POR_DIA: Record<NivelExperiencia, number> = {
  iniciante: 4,
  intermediario: 5,
  avancado: 6,
};

export function prescrever(objetivo: ObjetivoTreino, nivel: NivelExperiencia): Prescricao {
  const base = REPS_DESCANSO[objetivo];
  const series = SERIES[nivel];
  if (!base || !series) throw new Error('Objetivo ou nível inválido.');
  return { series, ...base };
}

/** Reparte o total de exercícios do dia entre os grupos, na ordem (grupos grandes primeiro). */
export function montarSlotsDia(dia: DiaDivisao, nivel: NivelExperiencia): SlotDia {
  const total = EXERCICIOS_POR_DIA[nivel];
  if (!total) throw new Error('Nível inválido.');
  const contagem = new Map<GrupoMuscular, number>();
  for (let i = 0; i < Math.max(total, dia.grupos.length); i++) {
    const grupo = dia.grupos[i % dia.grupos.length];
    contagem.set(grupo, (contagem.get(grupo) ?? 0) + 1);
  }
  return {
    nome: dia.nome,
    porGrupo: dia.grupos.map((grupo) => ({ grupo, quantidade: contagem.get(grupo) ?? 0 })),
  };
}
