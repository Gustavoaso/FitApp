// ============================================================
// SERVIÇO: Histórico (servicos/historicoServico.ts)
// ============================================================
// Persistência local via AsyncStorage para histórico por data (YYYY-MM-DD)
// de refeições e sessões de treino concluídas.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegistroRefeicaoDiaria {
  idRefeicao: string;
  data: string; // Formato YYYY-MM-DD
  concluida: boolean;
  alimentos: Array<{
    id: string;
    nome: string;
    porcao: string;
    calorias: number;
    proteinas: number;
    carbos: number;
    gorduras: number;
  }>;
}

export interface RegistroTreinoDiario {
  idSessao: string;
  data: string; // Formato YYYY-MM-DD
  foco: string;
  duracaoMinutos: number;
  exerciciosConcluidos: number;
  totalExercicios: number;
  concluido: boolean;
}

const CHAVE_HISTORICO_DIETA = '@fitapp_historico_dieta_v1';
const CHAVE_HISTORICO_TREINO = '@fitapp_historico_treino_v1';

/**
 * Salva o estado de refeições para uma data específica.
 */
export async function salvarHistoricoDieta(
  data: string,
  refeicoes: RegistroRefeicaoDiaria[]
): Promise<void> {
  try {
    const dadosExistentes = await obterHistoricoDietaCompleto();
    dadosExistentes[data] = refeicoes;
    await AsyncStorage.setItem(CHAVE_HISTORICO_DIETA, JSON.stringify(dadosExistentes));
  } catch (erro) {
    console.error('Erro ao salvar histórico de dieta:', erro);
  }
}

/**
 * Obtém as refeições salvas para uma data específica.
 */
export async function obterHistoricoDieta(data: string): Promise<RegistroRefeicaoDiaria[] | null> {
  try {
    const dadosExistentes = await obterHistoricoDietaCompleto();
    return dadosExistentes[data] || null;
  } catch (erro) {
    console.error('Erro ao obter histórico de dieta:', erro);
    return null;
  }
}

/**
 * Obtém todo o mapa de histórico de dieta.
 */
export async function obterHistoricoDietaCompleto(): Promise<Record<string, RegistroRefeicaoDiaria[]>> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_HISTORICO_DIETA);
    return json ? JSON.parse(json) : {};
  } catch (erro) {
    console.error('Erro ao obter histórico completo de dieta:', erro);
    return {};
  }
}

/**
 * Salva o registro de treino finalizado em uma data.
 */
export async function salvarHistoricoTreino(
  data: string,
  treino: RegistroTreinoDiario
): Promise<void> {
  try {
    const dadosExistentes = await obterHistoricoTreinoCompleto();
    dadosExistentes[data] = treino;
    await AsyncStorage.setItem(CHAVE_HISTORICO_TREINO, JSON.stringify(dadosExistentes));
  } catch (erro) {
    console.error('Erro ao salvar histórico de treino:', erro);
  }
}

/**
 * Obtém o registro de treino para uma data.
 */
export async function obterHistoricoTreino(data: string): Promise<RegistroTreinoDiario | null> {
  try {
    const dadosExistentes = await obterHistoricoTreinoCompleto();
    return dadosExistentes[data] || null;
  } catch (erro) {
    console.error('Erro ao obter histórico de treino:', erro);
    return null;
  }
}

/**
 * Obtém todo o mapa de histórico de treinos.
 */
export async function obterHistoricoTreinoCompleto(): Promise<Record<string, RegistroTreinoDiario>> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_HISTORICO_TREINO);
    return json ? JSON.parse(json) : {};
  } catch (erro) {
    console.error('Erro ao obter histórico completo de treinos:', erro);
    return {};
  }
}
