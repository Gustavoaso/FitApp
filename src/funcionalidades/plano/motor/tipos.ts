// ============================================================
// MOTOR DE GERAÇÃO ASSISTIDA: tipos
// ============================================================
// Tipos locais do motor (RN07). Candidatos chegam já filtrados
// por SQL (RN14); aqui só o formato que o motor precisa, sem
// depender dos tipos gerados do banco.
// ============================================================

import type {
  GrupoMuscular,
  Macros,
  NivelExperiencia,
  ObjetivoTreino,
  RestricaoAlimentar,
  EquipamentosDisponiveis,
  SexoBiologico,
} from '@/compartilhado/tipos';

export interface ExercicioCandidato {
  id: string;
  nome: string;
  grupo: GrupoMuscular;
  composto: boolean;
  equipamento: EquipamentosDisponiveis;
}

export type SlotAlimento = 'proteina' | 'carboidrato' | 'complemento';

/** Valores por 100 g. `restricoesAtendidas` lista as restrições que o alimento respeita. */
export interface AlimentoCandidato {
  id: string;
  nome: string;
  slot: SlotAlimento;
  kcal: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  restricoesAtendidas: RestricaoAlimentar[];
}

export interface DiaDivisao {
  nome: string;
  grupos: GrupoMuscular[];
}

export interface Prescricao {
  series: number;
  repeticoes: string;
  descansoSegundos: number;
}

/** Quantos exercícios a LLM escolhe por grupo em cada dia. */
export interface SlotDia {
  nome: string;
  porGrupo: { grupo: GrupoMuscular; quantidade: number }[];
}

export type NomeRefeicao = 'cafe' | 'almoco' | 'lanche' | 'jantar';

/** O que a LLM devolve: só IDs (RN07). */
export interface EscolhaLLM {
  dias: { exercicios: Partial<Record<GrupoMuscular, string[]>> }[];
  refeicoes: Record<NomeRefeicao, Record<SlotAlimento, string>>;
}

/** Só o que pode ir para o prompt (RN12): nada que identifique a pessoa. */
export interface ContextoPrompt {
  objetivo: ObjetivoTreino;
  nivel: NivelExperiencia;
  diasPorSemana: number;
  equipamentos: EquipamentosDisponiveis;
  restricoes: RestricaoAlimentar[];
  diretrizes: string[];
}

export interface DadosSaude {
  idade: number;
  sexo: SexoBiologico;
  pesoKg: number;
  alturaCm: number;
  caloriasAlvo: number;
}

export type MetaDia = Pick<Macros, 'calorias' | 'proteinas' | 'carboidratos' | 'gorduras'>;

/** Restrições físicas que o motor sabe tratar (joelho, ombro, coluna lombar). */
export type RestricaoFisica = 'joelho' | 'ombro' | 'coluna';
