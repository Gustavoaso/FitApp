// ============================================================
// SERVIÇO: Gestão de Planos (servicos/planoGestaoServico.ts)
// ============================================================
// Rodada 2 — Ajuste 3:
// Suporte a criação de treinos personalizados, mapeamento de treino por dia da semana
// e pré-seleção automática baseada no dia da semana atual do sistema.
// ============================================================

// Chaves separadas por usuário (mesma interface do AsyncStorage).
import { armazenamentoUsuario as AsyncStorage } from './armazenamento-usuario';
import { obterEvolucaoCargas } from './progresso-servico';
// Estático: o import dinâmico não roda no Jest (só a chamada usa o módulo, o ciclo é seguro).
import { repositorioTreino } from './repositorio';

export interface ExercicioCustomizado {
  id: string;
  nome: string;
  grupoMuscular: string;
  series: number;
  // Faixa do plano gerado ("8-12", "30s") ou número digitado pela pessoa.
  repeticoes: number | string;
  // 0 = sem carga definida no plano.
  cargaKg: number;
  tempoDescansoSegundos: number;
}

export interface DiaTreinoCustomizado {
  id: string;
  diaSemana: string;
  foco: string;
  // Dia da semana do plano no servidor (0 = domingo); ausente em treino criado à mão.
  diaSemanaIndice?: number;
  exercicios: ExercicioCustomizado[];
}

const ABREVIACOES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Mapa semanal (abreviação → id do treino) a partir dos dias do plano ativo. */
export function derivarMapeamentoSemanal(planos: DiaTreinoCustomizado[]): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const dia of planos) {
    const indice = dia.diaSemanaIndice;
    if (typeof indice === 'number' && indice >= 0 && indice <= 6) {
      mapa[ABREVIACOES_DIAS[indice]] = dia.id;
    }
  }
  return mapa;
}

/**
 * Treino de um dia: a troca feita para a data vence o mapa semanal.
 * Sem treino no dia (ou id que não existe mais no plano), null = descanso.
 */
export function treinoDoDia(
  planos: DiaTreinoCustomizado[],
  mapaSemanal: Record<string, string>,
  abrevDia: string,
  idTroca?: string | null,
): DiaTreinoCustomizado | null {
  const porId = (id?: string | null) =>
    id && id !== 'descanso' ? (planos.find((p) => p.id === id) ?? null) : null;
  return porId(idTroca) ?? porId(mapaSemanal?.[abrevDia]);
}

/** Texto de séries de um exercício: "20 kg × 8-12 reps", ou só as reps sem carga definida. */
export function descreverSerie(cargaKg: number, repeticoes: number | string): string {
  const reps = String(repeticoes ?? '').trim() || '—';
  return cargaKg > 0 ? `${cargaKg} kg × ${reps} reps` : `${reps} reps`;
}

/** Repetições-alvo numéricas para registrar a série ("8-12" → 8; sem número → 0). */
export function repeticoesAlvo(repeticoes: number | string): number {
  if (typeof repeticoes === 'number') return Number.isFinite(repeticoes) ? repeticoes : 0;
  const numero = parseInt(String(repeticoes ?? ''), 10);
  return Number.isFinite(numero) ? numero : 0;
}

const CHAVE_PLANO_TREINO = '@fitapp_plano_treino_custom_v1';
const CHAVE_TROCAS_DIARIAS = '@fitapp_trocas_treino_diarias_v1';
const CHAVE_MAPEAMENTO_SEMANAL = '@fitapp_mapeamento_semanal_v1';

const TREINOS_PADRAO: DiaTreinoCustomizado[] = [
  {
    id: 'dia-1',
    diaSemana: 'Segunda-feira',
    foco: 'Peito & Tríceps',
    exercicios: [
      {
        id: 'ex-1',
        nome: 'Supino Reto com Barra',
        grupoMuscular: 'Peito',
        series: 4,
        repeticoes: 10,
        cargaKg: 60,
        tempoDescansoSegundos: 90,
      },
      {
        id: 'ex-2',
        nome: 'Supino Inclinado com Halteres',
        grupoMuscular: 'Peito',
        series: 3,
        repeticoes: 12,
        cargaKg: 22,
        tempoDescansoSegundos: 60,
      },
      {
        id: 'ex-3',
        nome: 'Crossover com Cabo',
        grupoMuscular: 'Peito',
        series: 3,
        repeticoes: 15,
        cargaKg: 15,
        tempoDescansoSegundos: 45,
      },
      {
        id: 'ex-4',
        nome: 'Tríceps Pulley na Corda',
        grupoMuscular: 'Tríceps',
        series: 4,
        repeticoes: 12,
        cargaKg: 25,
        tempoDescansoSegundos: 60,
      },
    ],
  },
  {
    id: 'dia-2',
    diaSemana: 'Terça-feira',
    foco: 'Costas & Bíceps',
    exercicios: [
      {
        id: 'ex-5',
        nome: 'Puxada Frontal',
        grupoMuscular: 'Costas',
        series: 4,
        repeticoes: 10,
        cargaKg: 55,
        tempoDescansoSegundos: 90,
      },
      {
        id: 'ex-6',
        nome: 'Remada Curvada com Barra',
        grupoMuscular: 'Costas',
        series: 4,
        repeticoes: 10,
        cargaKg: 50,
        tempoDescansoSegundos: 75,
      },
      {
        id: 'ex-7',
        nome: 'Rosca Direta com Barra W',
        grupoMuscular: 'Bíceps',
        series: 3,
        repeticoes: 12,
        cargaKg: 24,
        tempoDescansoSegundos: 60,
      },
      {
        id: 'ex-8',
        nome: 'Rosca Martelo',
        grupoMuscular: 'Bíceps',
        series: 3,
        repeticoes: 12,
        cargaKg: 14,
        tempoDescansoSegundos: 60,
      },
    ],
  },
  {
    id: 'dia-3',
    diaSemana: 'Quarta-feira',
    foco: 'Pernas & Ombros',
    exercicios: [
      {
        id: 'ex-9',
        nome: 'Agachamento Livre com Barra',
        grupoMuscular: 'Pernas',
        series: 4,
        repeticoes: 8,
        cargaKg: 80,
        tempoDescansoSegundos: 120,
      },
      {
        id: 'ex-10',
        nome: 'Leg Press 45°',
        grupoMuscular: 'Pernas',
        series: 4,
        repeticoes: 12,
        cargaKg: 160,
        tempoDescansoSegundos: 90,
      },
      {
        id: 'ex-11',
        nome: 'Desenvolvimento com Halteres',
        grupoMuscular: 'Ombros',
        series: 4,
        repeticoes: 10,
        cargaKg: 18,
        tempoDescansoSegundos: 60,
      },
      {
        id: 'ex-12',
        nome: 'Elevação Lateral',
        grupoMuscular: 'Ombros',
        series: 4,
        repeticoes: 15,
        cargaKg: 10,
        tempoDescansoSegundos: 45,
      },
    ],
  },
];

/**
 * Obtém os dias de treino customizados.
 */
export async function obterPlanoTreinoCustomizado(): Promise<DiaTreinoCustomizado[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_PLANO_TREINO);
    if (json) {
      return JSON.parse(json);
    }

    const doBanco = await repositorioTreino.buscarPlanosTreino();
    if (doBanco && doBanco.length > 0) {
      await AsyncStorage.setItem(CHAVE_PLANO_TREINO, JSON.stringify(doBanco));
      return doBanco;
    }

    return [];
  } catch (erro) {
    console.error('Erro ao obter plano de treino:', erro);
    return [];
  }
}

/**
 * Salva o plano de treino atualizado localmente e no Supabase.
 */
export async function salvarPlanoTreinoCustomizado(planos: DiaTreinoCustomizado[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE_PLANO_TREINO, JSON.stringify(planos));
    await repositorioTreino.salvarPlanosTreino(planos);
  } catch (erro) {
    console.error('Erro ao salvar plano de treino:', erro);
  }
}

/**
 * Rodada 2 — Ajuste 3: Salva o mapeamento semanal de treinos (ex: seg -> dia-1).
 */
export async function salvarMapeamentoSemanal(mapeamento: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE_MAPEAMENTO_SEMANAL, JSON.stringify(mapeamento));
  } catch (erro) {
    console.error('Erro ao salvar mapeamento semanal:', erro);
  }
}

/**
 * Mapa semanal de treinos. O que a pessoa ajustou no aparelho vale como override;
 * sem ajuste, vem dos dias do plano ativo (servidor).
 */
export async function obterMapeamentoSemanal(): Promise<Record<string, string>> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_MAPEAMENTO_SEMANAL);
    const local: Record<string, string> = json ? JSON.parse(json) : {};
    if (Object.keys(local).length > 0) return local;
    return derivarMapeamentoSemanal(await obterPlanoTreinoCustomizado());
  } catch {
    return {};
  }
}

/**
 * Permite trocar o treino planejado para uma data específica.
 */
export async function definirTreinoEspecialParaData(
  dataStr: string,
  idTreino: string,
): Promise<void> {
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
 * Obtém a troca de treino para uma data (se houver).
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

/** Treino de hoje como a aba Treino mostra (com a troca do dia), para o Início e o treino ao vivo. */
export async function obterTreinoDeHoje(): Promise<DiaTreinoCustomizado | null> {
  const hoje = new Date().toISOString().split('T')[0];
  const abrev = ABREVIACOES_DIAS[new Date(`${hoje}T12:00:00`).getDay()];
  const [planos, mapa, troca] = await Promise.all([
    obterPlanoTreinoCustomizado(),
    obterMapeamentoSemanal(),
    obterTreinoEspecialParaData(hoje),
  ]);
  return treinoDoDia(planos, mapa, abrev, troca);
}

/**
 * Obtém a última carga e repetições utilizadas em um exercício.
 */
export async function obterUltimaCargaExercicio(
  idExercicio: string,
): Promise<{ cargaKg: number; repeticoes: number; data: string } | null> {
  try {
    const evolucoes = await obterEvolucaoCargas();
    const ex = evolucoes.find((e) => e.idExercicio === idExercicio);
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
  novoExercicio: Omit<ExercicioCustomizado, 'id'>,
): Promise<DiaTreinoCustomizado[]> {
  const planos = await obterPlanoTreinoCustomizado();
  const atualizado = planos.map((dia) => {
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
  exercicioAtualizado: ExercicioCustomizado,
): Promise<DiaTreinoCustomizado[]> {
  const planos = await obterPlanoTreinoCustomizado();
  const atualizado = planos.map((dia) => {
    if (dia.id === idDia) {
      return {
        ...dia,
        exercicios: dia.exercicios.map((ex) =>
          ex.id === exercicioAtualizado.id ? exercicioAtualizado : ex,
        ),
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
export async function removerExercicio(
  idDia: string,
  idExercicio: string,
): Promise<DiaTreinoCustomizado[]> {
  const planos = await obterPlanoTreinoCustomizado();
  const atualizado = planos.map((dia) => {
    if (dia.id === idDia) {
      return {
        ...dia,
        exercicios: dia.exercicios.filter((ex) => ex.id !== idExercicio),
      };
    }
    return dia;
  });

  await salvarPlanoTreinoCustomizado(atualizado);
  return atualizado;
}
