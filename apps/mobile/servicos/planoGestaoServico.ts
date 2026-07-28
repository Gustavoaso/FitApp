// ============================================================
// SERVIÇO: Gestão de Planos (servicos/planoGestaoServico.ts)
// ============================================================
// Gerencia a customização do plano de treino e dieta pelo usuário
// (adicionar/remover exercícios, alterar séries/cargas, criar refeições).
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExercicioCustomizado {
  id: string;
  nome: string;
  grupoMuscular: string;
  series: number;
  repeticoes: number;
  cargaKg: number;
}

export interface DiaTreinoCustomizado {
  id: string;
  diaSemana: string;
  foco: string;
  exercicios: ExercicioCustomizado[];
}

const CHAVE_PLANO_TREINO = '@fitapp_plano_treino_custom_v1';

const TREINOS_PADRAO: DiaTreinoCustomizado[] = [
  {
    id: 'dia-1',
    diaSemana: 'Segunda-feira',
    foco: 'Peito & Tríceps',
    exercicios: [
      { id: 'ex-1', nome: 'Supino Reto com Barra', grupoMuscular: 'Peito', series: 4, repeticoes: 10, cargaKg: 60 },
      { id: 'ex-2', nome: 'Supino Inclinado com Halteres', grupoMuscular: 'Peito', series: 3, repeticoes: 12, cargaKg: 22 },
      { id: 'ex-3', nome: 'Crossover com Cabo', grupoMuscular: 'Peito', series: 3, repeticoes: 15, cargaKg: 15 },
      { id: 'ex-4', nome: 'Tríceps Pulley na Corda', grupoMuscular: 'Tríceps', series: 4, repeticoes: 12, cargaKg: 25 },
    ],
  },
  {
    id: 'dia-2',
    diaSemana: 'Terça-feira',
    foco: 'Costas & Bíceps',
    exercicios: [
      { id: 'ex-5', nome: 'Puxada Frontal', grupoMuscular: 'Costas', series: 4, repeticoes: 10, cargaKg: 55 },
      { id: 'ex-6', nome: 'Remada Curvada com Barra', grupoMuscular: 'Costas', series: 4, repeticoes: 10, cargaKg: 50 },
      { id: 'ex-7', nome: 'Rosca Direta com Barra W', grupoMuscular: 'Bíceps', series: 3, repeticoes: 12, cargaKg: 24 },
      { id: 'ex-8', nome: 'Rosca Martelo', grupoMuscular: 'Bíceps', series: 3, repeticoes: 12, cargaKg: 14 },
    ],
  },
  {
    id: 'dia-3',
    diaSemana: 'Quarta-feira',
    foco: 'Pernas & Ombros',
    exercicios: [
      { id: 'ex-9', nome: 'Agachamento Livre com Barra', grupoMuscular: 'Pernas', series: 4, repeticoes: 8, cargaKg: 80 },
      { id: 'ex-10', nome: 'Leg Press 45°', grupoMuscular: 'Pernas', series: 4, repeticoes: 12, cargaKg: 160 },
      { id: 'ex-11', nome: 'Desenvolvimento com Halteres', grupoMuscular: 'Ombros', series: 4, repeticoes: 10, cargaKg: 18 },
      { id: 'ex-12', nome: 'Elevação Lateral', grupoMuscular: 'Ombros', series: 4, repeticoes: 15, cargaKg: 10 },
    ],
  },
];

/**
 * Obtém os dias de treino customizados.
 */
export async function obterPlanoTreinoCustomizado(): Promise<DiaTreinoCustomizado[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_PLANO_TREINO);
    if (!json) {
      await AsyncStorage.setItem(CHAVE_PLANO_TREINO, JSON.stringify(TREINOS_PADRAO));
      return TREINOS_PADRAO;
    }
    return JSON.parse(json);
  } catch (erro) {
    console.error('Erro ao obter plano de treino:', erro);
    return TREINOS_PADRAO;
  }
}

/**
 * Salva o plano de treino atualizado.
 */
export async function salvarPlanoTreinoCustomizado(planos: DiaTreinoCustomizado[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE_PLANO_TREINO, JSON.stringify(planos));
  } catch (erro) {
    console.error('Erro ao salvar plano de treino:', erro);
  }
}

/**
 * Adiciona um novo exercício a um dia de treino específico.
 */
export async function adicionarExercicioAoDia(
  idDia: string,
  novoExercicio: Omit<ExercicioCustomizado, 'id'>
): Promise<DiaTreinoCustomizado[]> {
  const planos = await obterPlanoTreinoCustomizado();
  const atualizado = planos.map(dia => {
    if (dia.id === idDia) {
      const exercicioCompleto: ExercicioCustomizado = {
        ...novoExercicio,
        id: `ex-${Date.now()}`,
      };
      return {
        ...dia,
        exercicios: [...dia.exercicios, exercicioCompleto],
      };
    }
    return dia;
  });

  await salvarPlanoTreinoCustomizado(atualizado);
  return atualizado;
}

/**
 * Atualiza um exercício existente (séries, repetições, carga).
 */
export async function atualizarExercicio(
  idDia: string,
  exercicioAtualizado: ExercicioCustomizado
): Promise<DiaTreinoCustomizado[]> {
  const planos = await obterPlanoTreinoCustomizado();
  const atualizado = planos.map(dia => {
    if (dia.id === idDia) {
      return {
        ...dia,
        exercicios: dia.exercicios.map(ex => (ex.id === exercicioAtualizado.id ? exercicioAtualizado : ex)),
      };
    }
    return dia;
  });

  await salvarPlanoTreinoCustomizado(atualizado);
  return atualizado;
}

/**
 * Remove um exercício de um dia de treino.
 */
export async function removerExercicio(idDia: string, idExercicio: string): Promise<DiaTreinoCustomizado[]> {
  const planos = await obterPlanoTreinoCustomizado();
  const atualizado = planos.map(dia => {
    if (dia.id === idDia) {
      return {
        ...dia,
        exercicios: dia.exercicios.filter(ex => ex.id !== idExercicio),
      };
    }
    return dia;
  });

  await salvarPlanoTreinoCustomizado(atualizado);
  return atualizado;
}
