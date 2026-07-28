// ============================================================
// SERVIÇO: Gestão de Planos (servicos/planoGestaoServico.ts)
// ============================================================
// Gerencia treinos personalizados, tempo de descanso entre séries,
// histórico da última carga/reps utilizada e troca de treino por dia.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { obterEvolucaoCargas } from './progressoServico';

export interface ExercicioCustomizado {
  id: string;
  nome: string;
  grupoMuscular: string;
  series: number;
  repeticoes: number;
  cargaKg: number;
  tempoDescansoSegundos: number; // Ajuste 2: Tempo de descanso em segundos (ex: 60)
}

export interface DiaTreinoCustomizado {
  id: string;
  diaSemana: string;
  foco: string;
  exercicios: ExercicioCustomizado[];
}

const CHAVE_PLANO_TREINO = '@fitapp_plano_treino_custom_v1';
const CHAVE_TROCAS_DIARIAS = '@fitapp_trocas_treino_diarias_v1';

const TREINOS_PADRAO: DiaTreinoCustomizado[] = [
  {
    id: 'dia-1',
    diaSemana: 'Segunda-feira',
    foco: 'Peito & Tríceps',
    exercicios: [
      { id: 'ex-1', nome: 'Supino Reto com Barra', grupoMuscular: 'Peito', series: 4, repeticoes: 10, cargaKg: 60, tempoDescansoSegundos: 90 },
      { id: 'ex-2', nome: 'Supino Inclinado com Halteres', grupoMuscular: 'Peito', series: 3, repeticoes: 12, cargaKg: 22, tempoDescansoSegundos: 60 },
      { id: 'ex-3', nome: 'Crossover com Cabo', grupoMuscular: 'Peito', series: 3, repeticoes: 15, cargaKg: 15, tempoDescansoSegundos: 45 },
      { id: 'ex-4', nome: 'Tríceps Pulley na Corda', grupoMuscular: 'Tríceps', series: 4, repeticoes: 12, cargaKg: 25, tempoDescansoSegundos: 60 },
    ],
  },
  {
    id: 'dia-2',
    diaSemana: 'Terça-feira',
    foco: 'Costas & Bíceps',
    exercicios: [
      { id: 'ex-5', nome: 'Puxada Frontal', grupoMuscular: 'Costas', series: 4, repeticoes: 10, cargaKg: 55, tempoDescansoSegundos: 90 },
      { id: 'ex-6', nome: 'Remada Curvada com Barra', grupoMuscular: 'Costas', series: 4, repeticoes: 10, cargaKg: 50, tempoDescansoSegundos: 75 },
      { id: 'ex-7', nome: 'Rosca Direta com Barra W', grupoMuscular: 'Bíceps', series: 3, repeticoes: 12, cargaKg: 24, tempoDescansoSegundos: 60 },
      { id: 'ex-8', nome: 'Rosca Martelo', grupoMuscular: 'Bíceps', series: 3, repeticoes: 12, cargaKg: 14, tempoDescansoSegundos: 60 },
    ],
  },
  {
    id: 'dia-3',
    diaSemana: 'Quarta-feira',
    foco: 'Pernas & Ombros',
    exercicios: [
      { id: 'ex-9', nome: 'Agachamento Livre com Barra', grupoMuscular: 'Pernas', series: 4, repeticoes: 8, cargaKg: 80, tempoDescansoSegundos: 120 },
      { id: 'ex-10', nome: 'Leg Press 45°', grupoMuscular: 'Pernas', series: 4, repeticoes: 12, cargaKg: 160, tempoDescansoSegundos: 90 },
      { id: 'ex-11', nome: 'Desenvolvimento com Halteres', grupoMuscular: 'Ombros', series: 4, repeticoes: 10, cargaKg: 18, tempoDescansoSegundos: 60 },
      { id: 'ex-12', nome: 'Elevação Lateral', grupoMuscular: 'Ombros', series: 4, repeticoes: 15, cargaKg: 10, tempoDescansoSegundos: 45 },
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
 * Ajuste 2: Permite trocar o treino planejado para uma data específica.
 */
export async function definirTreinoEspecialParaData(dataStr: string, idTreino: string): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_TROCAS_DIARIAS);
    const mapa: Record<string, string> = json ? JSON.parse(json) : {};
    mapa[dataStr] = idTreino;
    await AsyncStorage.setItem(CHAVE_TROCAS_DIARIAS, JSON.stringify(mapa));
  } catch (erro) {
    console.error('Erro ao definir treino para a data:', erro);
  }
}

/**
 * Ajuste 2: Obtém a troca de treino para uma data (se houver).
 */
export async function obterTreinoEspecialParaData(dataStr: string): Promise<string | null> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_TROCAS_DIARIAS);
    if (!json) return null;
    const mapa: Record<string, string> = JSON.parse(json);
    return mapa[dataStr] || null;
  } catch (erro) {
    return null;
  }
}

/**
 * Ajuste 2: Obtém a última carga e repetições utilizadas em um exercício.
 */
export async function obterUltimaCargaExercicio(idExercicio: string): Promise<{ cargaKg: number; repeticoes: number; data: string } | null> {
  try {
    const evolucoes = await obterEvolucaoCargas();
    const ex = evolucoes.find(e => e.idExercicio === idExercicio);
    if (ex && ex.historicoCargas.length > 0) {
      const ultimo = ex.historicoCargas[ex.historicoCargas.length - 1];
      return { cargaKg: ultimo.cargaKg, repeticoes: ultimo.repeticoes, data: ultimo.data };
    }
    return null;
  } catch (erro) {
    return null;
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
 * Atualiza um exercício existente (séries, repetições, carga, descanso).
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
