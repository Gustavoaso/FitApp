// ============================================================
// SELEÇÃO DE CANDIDATOS DE EXERCÍCIO (regra pura, sem rede)
// ============================================================
// Filtra as linhas da base pelo equipamento e pelas restrições
// físicas da pessoa e, quando um grupo fica sem candidato,
// amplia em degraus: 1) nível dela; 2) qualquer nível; 3) quem
// trabalha o grupo como secundário. O equipamento nunca é
// ampliado (a pessoa não teria como fazer o exercício). Grupo
// que continua vazio sai do dia, com um aviso no plano.
// ============================================================

import type { GrupoMuscular, NivelExperiencia } from '@/compartilhado/tipos';
import {
  grupoDaBase,
  mapearExercicio,
  respeitaRestricoesFisicas,
  type EntradaMotor,
  type LinhaExercicio,
} from './mapear-plano';
import type { ExercicioCandidato, SlotDia } from './motor/tipos';
import { EQUIPAMENTOS_PERMITIDOS } from './motor/validador';

const NIVEIS_ACEITOS: Record<NivelExperiencia, string[]> = {
  iniciante: ['iniciante'],
  intermediario: ['iniciante', 'intermediario'],
  avancado: ['iniciante', 'intermediario', 'avancado'],
};

const NOME_GRUPO: Record<GrupoMuscular, string> = {
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

export interface Selecao {
  exercicios: ExercicioCandidato[];
  /** Slots sem os grupos que ficaram vazios. */
  slots: SlotDia[];
  avisos: string[];
}

export function selecionarExercicios(
  linhas: LinhaExercicio[],
  entrada: EntradaMotor,
  slots: SlotDia[],
  porGrupo: number,
): Selecao {
  const permitidos = EQUIPAMENTOS_PERMITIDOS[entrada.equipamentos];
  const possiveis = linhas.flatMap((linha) => {
    const ex = mapearExercicio(linha);
    const ok = ex && permitidos.includes(ex.equipamento) && respeitaRestricoesFisicas(linha.nome, entrada.restricoesFisicas);
    return ok ? [{ linha, ex }] : [];
  });
  const aceitos = NIVEIS_ACEITOS[entrada.nivel];
  const secundarios = (l: LinhaExercicio) => (l.grupo_secundario ?? '').split(',').map(grupoDaBase);

  const usados = new Set<string>();
  const exercicios: ExercicioCandidato[] = [];
  const vazios = new Set<GrupoMuscular>();
  const grupos = [...new Set(slots.flatMap((s) => s.porGrupo.map((p) => p.grupo)))];

  for (const grupo of grupos) {
    const degraus = [
      possiveis.filter(({ linha, ex }) => ex.grupo === grupo && aceitos.includes(linha.nivel ?? '')),
      possiveis.filter(({ ex }) => ex.grupo === grupo),
      possiveis.filter(({ linha }) => secundarios(linha).includes(grupo)),
    ];
    // Um exercício só entra numa lista: o validador confere o grupo pelo ID.
    const achados = (degraus.find((d) => d.some(({ ex }) => !usados.has(ex.id))) ?? [])
      .filter(({ ex }) => !usados.has(ex.id))
      .map(({ ex }) => ({ ...ex, grupo }))
      // Compostos primeiro, para eles sobrarem no corte.
      .sort((a, b) => Number(b.composto) - Number(a.composto))
      .slice(0, porGrupo);
    if (achados.length === 0) vazios.add(grupo);
    for (const ex of achados) usados.add(ex.id);
    exercicios.push(...achados);
  }

  return {
    exercicios,
    slots: slots.map((s) => ({ ...s, porGrupo: s.porGrupo.filter((p) => !vazios.has(p.grupo)) })),
    avisos: [...vazios].map(
      (g) => `Não achei exercício de ${NOME_GRUPO[g]} para o seu equipamento e as suas restrições; o grupo ficou fora do treino.`,
    ),
  };
}
