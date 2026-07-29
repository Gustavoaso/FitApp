// ============================================================
// TIPOS DO QUESTIONÁRIO
// ============================================================
// Representam as respostas coletadas no fluxo de onboarding.
// Esses dados alimentam as funções de cálculo (TMB, TDEE, macros)
// e o prompt enviado à Gemini API para gerar o plano.
// ============================================================

import type { SexoBiologico, NivelExperiencia, NivelAtividade } from './usuario';

/** Objetivos de treino suportados pelo app */
export type ObjetivoTreino =
  | 'hipertrofia'       // Ganho de massa muscular
  | 'definicao'         // Perda de gordura mantendo músculo
  | 'forca'             // Aumento de força máxima
  | 'emagrecimento'     // Perda de peso geral
  | 'condicionamento';  // Melhora da resistência e saúde

/** Restrições alimentares do usuário */
export type RestricaoAlimentar =
  | 'nenhuma'
  | 'vegetariano'
  | 'vegano'
  | 'sem_lactose'
  | 'sem_gluten';

/** Preferência de tipo de treino */
export type PreferenciaTreino = 'musculacao' | 'calistenia' | 'misto';

/** Equipamentos disponíveis para treino */
export type EquipamentosDisponiveis =
  | 'academia_completa'
  | 'home_gym'
  | 'peso_corporal';

/** Todas as respostas do questionário reunidas */
export interface RespostaQuestionario {
  // Dados pessoais
  nome: string;
  idade: number;
  sexo: SexoBiologico;

  // Dados físicos
  pesoKg: number;
  alturaCm: number;
  gorduraCorporal?: number;

  // Objetivos e preferências
  objetivo: ObjetivoTreino;
  nivelExperiencia: NivelExperiencia;
  nivelAtividade: NivelAtividade;
  frequenciaSemanal: number; // 2 a 6 dias por semana
  preferenciasTreino: PreferenciaTreino;
  equipamentos: EquipamentosDisponiveis;

  // Restrições alimentares (pode ter mais de uma)
  restricoesAlimentares: RestricaoAlimentar[];
}

// ============================================================
// TIPOS DO PLANO GERADO PELA IA (Gemini)
// ============================================================

/** Resumo nutricional calculado (parte determinística) */
export interface ResumoNutricionalIA {
  tmb: number;
  tdee: number;
  caloriasAlvo: number;
  macros: {
    proteinas: number;
    carboidratos: number;
    gorduras: number;
  };
  metaAguaMl: number;
}

/** Exercício dentro de um dia no plano gerado pela IA */
export interface ExercicioPlanoIA {
  nome: string;
  series: number;
  repeticoes: number;
  descansoSegundos: number;
  grupoMuscular?: string;
}

/** Dia de treino no plano gerado pela IA */
export interface DiaTreinoIA {
  diaSemana: number;
  nome: string;
  exercicios: ExercicioPlanoIA[];
}

/** Alimento dentro de uma refeição no plano gerado pela IA */
export interface AlimentoPlanoIA {
  nome: string;
  porcao: string;
  calorias: number;
  proteinas?: number;
  carboidratos?: number;
  gorduras?: number;
}

/** Refeição no plano gerado pela IA */
export interface RefeicaoPlanoIA {
  nome: string;
  horario: string;
  alimentos: AlimentoPlanoIA[];
}

/** Estrutura completa do plano gerado pela IA (Gemini) */
export interface PlanoIAGerado {
  resumo: ResumoNutricionalIA;
  treino: {
    nomeDivisao: string;
    dias: DiaTreinoIA[];
  };
  dieta: {
    refeicoes: RefeicaoPlanoIA[];
  };
}

