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

// PREMISSA: dias da semana de cada frequência (0 = domingo), com descanso espalhado.
const DIAS_DA_SEMANA: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};

/** Dia da semana de cada sessão; frequência desconhecida cai em dias seguidos desde segunda. */
export function diasDaSemana(sessoes: number): number[] {
  return DIAS_DA_SEMANA[sessoes] ?? Array.from({ length: sessoes }, (_, i) => (1 + i) % 7);
}

export const NOME_GRUPO: Record<GrupoMuscular, string> = {
  peito: 'peito',
  costas: 'costas',
  ombros: 'ombros',
  biceps: 'bíceps',
  triceps: 'tríceps',
  quadriceps: 'quadríceps',
  posterior: 'posterior de coxa',
  gluteos: 'glúteos',
  panturrilha: 'panturrilha',
  abdomen: 'abdômen',
  antebraco: 'antebraço',
  corpo_inteiro: 'corpo inteiro',
};

/** "a, b e c" */
export function listar(itens: string[]): string {
  return itens.length <= 1
    ? (itens[0] ?? '')
    : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

// Grupos pequenos não dão nome ao dia quando há um grupo grande.
const GRUPOS_DE_APOIO: GrupoMuscular[] = ['panturrilha', 'abdomen', 'antebraco'];

/** Nome do dia pelo foco (RN19): "Peito, ombros e tríceps", "Pernas e glúteos". */
export function focoDoDia(grupos: GrupoMuscular[]): string {
  const tem = (g: GrupoMuscular) => grupos.includes(g);
  let nomes: string[];
  if (tem('quadriceps') && tem('posterior')) {
    const superiores = grupos.filter(
      (g) => !['quadriceps', 'posterior', 'gluteos', ...GRUPOS_DE_APOIO].includes(g),
    );
    nomes = [
      'pernas',
      ...(tem('gluteos') ? ['glúteos'] : []),
      ...superiores.map((g) => NOME_GRUPO[g]),
    ];
  } else {
    const principais = grupos.filter((g) => !GRUPOS_DE_APOIO.includes(g));
    const base = principais.length > 0 ? principais : grupos;
    // Bíceps e tríceps juntos num dia cheio viram "braços", para o nome caber no card.
    const juntarBracos = base.length > 3 && tem('biceps') && tem('triceps');
    nomes = juntarBracos
      ? [
          ...base.filter((g) => g !== 'biceps' && g !== 'triceps').map((g) => NOME_GRUPO[g]),
          'braços',
        ]
      : base.map((g) => NOME_GRUPO[g]);
  }
  const texto = listar(nomes.slice(0, 4));
  return texto ? texto[0].toUpperCase() + texto.slice(1) : 'Treino';
}

/** Um nome por sessão; focos repetidos na semana ganham A, B... para não se confundirem. */
export function nomearDias(gruposPorDia: GrupoMuscular[][]): string[] {
  const focos = gruposPorDia.map(focoDoDia);
  const vistos = new Map<string, number>();
  return focos.map((foco) => {
    if (focos.filter((f) => f === foco).length === 1) return foco;
    const n = vistos.get(foco) ?? 0;
    vistos.set(foco, n + 1);
    return `${foco} ${String.fromCharCode(65 + n)}`;
  });
}

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
