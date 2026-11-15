// ============================================================
// MOTOR: prescrição, aquecimento e progressão (RN19)
// ============================================================
// Tudo por código, a partir das respostas: o papel de cada
// exercício na sessão (principal, acessório, isolado) define a
// faixa de repetições e o descanso; o nível define as séries e
// as repetições na reserva. O aquecimento sai do foco do dia e
// a progressão é um ciclo fixo de 4 semanas de dupla progressão.
// ============================================================

import type {
  EquipamentosDisponiveis,
  GrupoMuscular,
  NivelExperiencia,
  ObjetivoTreino,
  PapelExercicio,
  SemanaProgressao,
} from '@/compartilhado/tipos';
import { listar } from './divisao-semanal';
import type { ExercicioCandidato, PrescricaoExercicio, RestricaoFisica } from './tipos';

export const PAPEIS: PapelExercicio[] = ['principal', 'acessorio', 'isolado'];

// PREMISSA: faixas por objetivo (ACSM 2009; Schoenfeld 2017): o composto principal é o mais
// pesado e descansa mais; o isolado fecha a sessão com mais repetições e menos descanso.
const FAIXAS: Record<
  ObjetivoTreino,
  Record<PapelExercicio, { repeticoes: string; descansoSegundos: number }>
> = {
  forca: {
    principal: { repeticoes: '3-5', descansoSegundos: 180 },
    acessorio: { repeticoes: '6-8', descansoSegundos: 120 },
    isolado: { repeticoes: '8-12', descansoSegundos: 90 },
  },
  hipertrofia: {
    principal: { repeticoes: '6-10', descansoSegundos: 120 },
    acessorio: { repeticoes: '8-12', descansoSegundos: 90 },
    isolado: { repeticoes: '10-15', descansoSegundos: 60 },
  },
  definicao: {
    principal: { repeticoes: '8-12', descansoSegundos: 90 },
    acessorio: { repeticoes: '10-15', descansoSegundos: 60 },
    isolado: { repeticoes: '12-15', descansoSegundos: 45 },
  },
  emagrecimento: {
    principal: { repeticoes: '10-12', descansoSegundos: 75 },
    acessorio: { repeticoes: '12-15', descansoSegundos: 60 },
    isolado: { repeticoes: '12-15', descansoSegundos: 45 },
  },
  condicionamento: {
    principal: { repeticoes: '12-15', descansoSegundos: 60 },
    acessorio: { repeticoes: '15-20', descansoSegundos: 45 },
    isolado: { repeticoes: '15-20', descansoSegundos: 30 },
  },
};

// PREMISSA: séries por nível e papel; o iniciante faz menos volume nos isolados.
const SERIES: Record<NivelExperiencia, Record<PapelExercicio, number>> = {
  iniciante: { principal: 3, acessorio: 3, isolado: 2 },
  intermediario: { principal: 4, acessorio: 3, isolado: 3 },
  avancado: { principal: 4, acessorio: 4, isolado: 3 },
};

// PREMISSA: repetições na reserva. Iniciante para longe da falha para aprender a técnica;
// o avançado chega mais perto, menos no composto principal (falha com carga alta custa caro).
const RESERVA: Record<NivelExperiencia, Record<PapelExercicio, number>> = {
  iniciante: { principal: 3, acessorio: 3, isolado: 3 },
  intermediario: { principal: 2, acessorio: 2, isolado: 2 },
  avancado: { principal: 2, acessorio: 1, isolado: 1 },
};

export function prescreverPorPapel(
  objetivo: ObjetivoTreino,
  nivel: NivelExperiencia,
  papel: PapelExercicio,
): PrescricaoExercicio {
  const faixa = FAIXAS[objetivo]?.[papel];
  const series = SERIES[nivel]?.[papel];
  if (!faixa || !series) throw new Error('Objetivo, nível ou papel inválido.');
  return { series, ...faixa, repeticoesReserva: RESERVA[nivel][papel] };
}

// Grupos que sustentam um composto principal; os pequenos ficam para o fim da sessão.
const GRUPOS_GRANDES: GrupoMuscular[] = [
  'peito',
  'costas',
  'quadriceps',
  'posterior',
  'gluteos',
  'ombros',
  'corpo_inteiro',
];
const GRUPOS_FINAIS: GrupoMuscular[] = ['antebraco', 'panturrilha', 'abdomen'];
// PREMISSA: até 2 compostos principais por sessão; os outros compostos são acessórios.
const MAX_PRINCIPAIS = 2;

/**
 * Ordena a sessão em compostos principais → acessórios → isolados (RN19) e diz o papel de
 * cada um. Principal = o primeiro composto de cada grupo grande, até 2 por sessão.
 */
export function ordenarSessao<T extends Pick<ExercicioCandidato, 'grupo' | 'composto'>>(
  exercicios: T[],
): (T & { papel: PapelExercicio })[] {
  const gruposComPrincipal = new Set<GrupoMuscular>();
  const comPapel = exercicios.map((e) => {
    let papel: PapelExercicio = e.composto ? 'acessorio' : 'isolado';
    if (
      e.composto &&
      GRUPOS_GRANDES.includes(e.grupo) &&
      !gruposComPrincipal.has(e.grupo) &&
      gruposComPrincipal.size < MAX_PRINCIPAIS
    ) {
      gruposComPrincipal.add(e.grupo);
      papel = 'principal';
    }
    return { ...e, papel };
  });
  const peso = (e: { papel: PapelExercicio; grupo: GrupoMuscular }) =>
    PAPEIS.indexOf(e.papel) * 2 + (GRUPOS_FINAIS.includes(e.grupo) ? 1 : 0);
  // sort é estável: dentro do mesmo papel, vale a ordem dos grupos do dia.
  return comPapel.sort((a, b) => peso(a) - peso(b));
}

const SUPERIORES: GrupoMuscular[] = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco'];
const INFERIORES: GrupoMuscular[] = ['quadriceps', 'posterior', 'gluteos', 'panturrilha'];
const NOME_RESTRICAO: Record<RestricaoFisica, string> = {
  joelho: 'joelho',
  ombro: 'ombro',
  coluna: 'coluna',
};

/** Passos do aquecimento do dia (RN19): geral, mobilidade do foco e séries de preparação. */
export function montarAquecimento(
  grupos: GrupoMuscular[],
  primeiro: Pick<ExercicioCandidato, 'nome' | 'equipamento'> | undefined,
  equipamentos: EquipamentosDisponiveis,
  restricoesFisicas: RestricaoFisica[] = [],
): string[] {
  const joelho = restricoesFisicas.includes('joelho');
  const superior = grupos.some((g) => SUPERIORES.includes(g));
  const inferior = grupos.some((g) => INFERIORES.includes(g)) || grupos.includes('corpo_inteiro');
  const passos = [
    equipamentos === 'academia_completa'
      ? '5 minutos de bicicleta ou esteira em ritmo leve.'
      : joelho
        ? '5 minutos de caminhada no lugar, sem saltar.'
        : '5 minutos de caminhada rápida no lugar ou polichinelos leves.',
  ];
  if (superior || grupos.includes('corpo_inteiro')) {
    passos.push('10 círculos de braço para a frente, 10 para trás e 10 rotações de ombro.');
  }
  if (inferior) {
    passos.push(
      joelho
        ? '10 elevações de quadril no chão e 10 balanços de perna de cada lado.'
        : '10 agachamentos sem peso e 10 elevações de quadril no chão.',
    );
  }
  if (primeiro) {
    passos.push(
      primeiro.equipamento === 'peso_corporal'
        ? `1 série leve de ${primeiro.nome}: metade das repetições, sem cansar.`
        : `2 séries de preparação em ${primeiro.nome}: 12 repetições com metade da carga e 6 com cerca de 75%. Só depois começam as séries que valem.`,
    );
  }
  // Só avisa da região que o dia realmente usa (coluna entra em qualquer dia).
  const emUso = restricoesFisicas.filter(
    (r) => r === 'coluna' || (r === 'joelho' && inferior) || (r === 'ombro' && superior),
  );
  if (emUso.length > 0) {
    passos.push(
      `Você marcou ${listar(emUso.map((r) => NOME_RESTRICAO[r]))}: aqueça sem dor. Se doer, pare o exercício.`,
    );
  }
  return passos;
}

/**
 * Ciclo de 4 semanas de dupla progressão (RN19): sobe repetição até o teto da faixa, depois
 * carga. A semana 4 é mais leve para o iniciante. Sem carga (peso do corpo), sobe a dificuldade.
 */
export function montarProgressao(
  nivel: NivelExperiencia,
  equipamentos: EquipamentosDisponiveis,
): SemanaProgressao[] {
  const semCarga = equipamentos === 'peso_corporal';
  const reserva = RESERVA[nivel];
  if (!reserva) throw new Error('Nível inválido.');
  const sobra = reserva.principal === 1 ? '1 repetição' : `${reserva.principal} repetições`;
  return [
    {
      semana: 1,
      titulo: semCarga ? 'Ajuste da variação' : 'Ajuste de carga',
      orientacao: semCarga
        ? `Ache a variação de cada exercício que deixa ${sobra} sobrando no piso da faixa. Anote o que fez em cada série.`
        : `Ache a carga que deixa ${sobra} sobrando no piso da faixa. Anote a carga de cada série.`,
    },
    {
      semana: 2,
      titulo: 'Mais repetições',
      orientacao: semCarga
        ? 'Mesma variação da semana 1. Some 1 repetição por série, sem passar do teto da faixa.'
        : 'Mesma carga da semana 1. Some 1 repetição por série, sem passar do teto da faixa.',
    },
    {
      semana: 3,
      titulo: semCarga ? 'Sobe a dificuldade' : 'Sobe a carga',
      orientacao: semCarga
        ? 'Bateu o teto da faixa em todas as séries? Passe para uma variação mais difícil ou desça em 3 segundos, e volte ao piso. Onde não bateu, continue somando repetições.'
        : 'Bateu o teto da faixa em todas as séries? Suba a carga no menor passo (2 a 5%) e volte ao piso. Onde não bateu, continue somando repetições.',
    },
    nivel === 'iniciante'
      ? {
          semana: 4,
          titulo: 'Semana leve',
          orientacao:
            'Mesmo treino, com 1 série a menos em cada exercício. É a semana de recuperar; depois o ciclo recomeça da semana 1.',
        }
      : {
          semana: 4,
          titulo: 'Consolidação',
          orientacao:
            'Repita o treino da semana 3 buscando o teto da faixa. Depois o ciclo recomeça da semana 1, já no nível novo.',
        },
  ];
}
