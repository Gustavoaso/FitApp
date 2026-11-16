// ============================================================
// SERVIÇO: Progresso & Estatísticas (servicos/progressoServico.ts)
// ============================================================
// Gerencia histórico de pesagens, progressão de carga por exercício
// e a METROLOGIA REAL de metas x progresso semanal (Treinos, Exercícios e Refeições).
// ============================================================

// Chaves separadas por usuário (mesma interface do AsyncStorage).
import { armazenamentoUsuario as AsyncStorage } from './armazenamento-usuario';
import { obterMapeamentoSemanal, obterPlanoTreinoCustomizado } from './plano-gestao-servico';
import { repositorioTreino } from './repositorio';

export interface EntradaPeso {
  id: string;
  data: string; // Formato YYYY-MM-DD
  pesoKg: number;
}

export interface RegistroSerie {
  numeroSerie: number;
  cargaKg: number;
  repeticoes: number;
  data: string;
}

export interface EvolucaoCargaExercicio {
  idExercicio: string;
  nomeExercicio: string;
  historicoCargas: Array<{
    data: string;
    cargaKg: number;
    repeticoes: number;
  }>;
  seriesUltimaExecucao?: Record<number, { cargaKg: number; repeticoes: number }>;
}

export interface MetaSemanal {
  inicioSemana: string; // YYYY-MM-DD da Segunda-feira da semana
  treinosPlanejados: number;
  exerciciosPlanejados: number;
  refeicoesPlanejadas: number;
  origem: 'auto' | 'manual';
}

export interface ProgressoSemanalReal {
  inicioSemana: string;
  treinosRealizados: number;
  exerciciosRealizados: number;
  refeicoesRealizadas: number;
  refeicoesContabilizadasPorDia: Record<string, string[]>; // { '2026-07-27': ['Refeição 1', 'Almoço'] }
}

export interface EstatisticasAderencia {
  diasTreinados: number;
  metaDiasTreino: number;
  exerciciosRealizados: number;
  metaExercicios: number;
  refeicoesConcluidas: number;
  totalRefeicoesPrevistas: number;
  porcentagemAderenciaGeral: number;
}

const CHAVE_PESO = '@fitapp_progresso_peso_v1';
const CHAVE_CARGAS = '@fitapp_progresso_cargas_v1';
const CHAVE_METAS_SEMANAIS = '@fitapp_metas_semanais_v2';
const CHAVE_PROGRESSO_SEMANAL = '@fitapp_progresso_semanal_v2';

/**
 * Retorna a data (YYYY-MM-DD) da segunda-feira correspondente a qualquer data informada.
 */
export function obterInicioSemanaAtual(dataRef?: string | Date): string {
  const d = dataRef ? new Date(dataRef) : new Date();
  const diaSemana = d.getDay(); // 0 = Dom, 1 = Seg, ...
  const diff = d.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Ajusta para Segunda
  const segunda = new Date(d.setDate(diff));
  return segunda.toISOString().split('T')[0];
}

// ------------------------------------------------------------
// 1. GESTÃO DE METAS SEMANAIS (AUTOMÁTICA E MANUAL)
// ------------------------------------------------------------

export async function obterMetasSemanaisTodas(): Promise<Record<string, MetaSemanal>> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_METAS_SEMANAIS);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

/**
 * Calcula automaticamente a meta com base no cronograma semanal vigente.
 */
export async function calcularMetaDoCronograma(inicioSemana: string): Promise<MetaSemanal> {
  const treinos = await obterPlanoTreinoCustomizado();
  const mapSemana = await obterMapeamentoSemanal();

  const diasAbrev = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  let treinosPlanejados = 0;
  let exerciciosPlanejados = 0;

  for (const abrev of diasAbrev) {
    const idTreinoAlocado = mapSemana[abrev];
    if (idTreinoAlocado && idTreinoAlocado !== 'descanso') {
      const tObj = treinos.find((p) => p.id === idTreinoAlocado);
      if (tObj && tObj.foco && !tObj.foco.toLowerCase().includes('descanso')) {
        treinosPlanejados++;
        if (Array.isArray(tObj.exercicios)) {
          exerciciosPlanejados += tObj.exercicios.length;
        }
      }
    }
  }

  // RN28: sem cronograma de refeições não há meta (nunca um número fixo).
  let refeicoesPlanejadas = 0;
  try {
    const jsonQtd = await AsyncStorage.getItem('@fitapp_cronograma_refeicoes_v1');
    if (jsonQtd) {
      const mapaRef = JSON.parse(jsonQtd);
      refeicoesPlanejadas = Object.values(mapaRef).reduce(
        (acc: number, v: any) => acc + Number(v || 0),
        0,
      );
    }
  } catch {
    refeicoesPlanejadas = 0;
  }

  return {
    inicioSemana,
    treinosPlanejados,
    exerciciosPlanejados,
    refeicoesPlanejadas,
    origem: 'auto',
  };
}

/**
 * Obtém ou gera o snapshot da meta da semana informada.
 */
export async function obterOuGerarMetaSemanal(inicioSemanaStr?: string): Promise<MetaSemanal> {
  const inicioSemana = inicioSemanaStr || obterInicioSemanaAtual();
  const todasMetas = await obterMetasSemanaisTodas();

  // Só a meta manual fica congelada; a automática acompanha o plano ativo
  // (antes ficava presa em 0 treinos quando o plano chegava depois).
  if (todasMetas[inicioSemana]?.origem === 'manual') {
    return todasMetas[inicioSemana];
  }

  const novaMeta = await calcularMetaDoCronograma(inicioSemana);
  todasMetas[inicioSemana] = novaMeta;
  await AsyncStorage.setItem(CHAVE_METAS_SEMANAIS, JSON.stringify(todasMetas));
  return novaMeta;
}

/**
 * Recalcula e atualiza a meta da semana a partir do cronograma modificado.
 */
export async function recalcularMetaSemanalAuto(
  inicioSemanaStr?: string,
  forcarRecalculo: boolean = false,
): Promise<MetaSemanal> {
  const inicioSemana = inicioSemanaStr || obterInicioSemanaAtual();
  const todasMetas = await obterMetasSemanaisTodas();

  const metaAtual = todasMetas[inicioSemana];
  if (metaAtual && metaAtual.origem === 'manual' && !forcarRecalculo) {
    return metaAtual;
  }

  const novaMeta = await calcularMetaDoCronograma(inicioSemana);
  todasMetas[inicioSemana] = novaMeta;
  await AsyncStorage.setItem(CHAVE_METAS_SEMANAIS, JSON.stringify(todasMetas));
  return novaMeta;
}

/**
 * Sobrescreve manualmente a meta da semana atual.
 */
export async function salvarMetaSemanalManual(
  inicioSemanaStr: string,
  treinos: number,
  exercicios: number,
  refeicoes: number,
): Promise<MetaSemanal> {
  const inicioSemana = inicioSemanaStr || obterInicioSemanaAtual();
  const todasMetas = await obterMetasSemanaisTodas();

  const metaAtualizada: MetaSemanal = {
    inicioSemana,
    treinosPlanejados: Math.max(1, treinos),
    exerciciosPlanejados: Math.max(1, exercicios),
    refeicoesPlanejadas: Math.max(1, refeicoes),
    origem: 'manual',
  };

  todasMetas[inicioSemana] = metaAtualizada;
  await AsyncStorage.setItem(CHAVE_METAS_SEMANAIS, JSON.stringify(todasMetas));
  return metaAtualizada;
}

// ------------------------------------------------------------
// 2. GESTÃO DE PROGRESSO SEMANAL REAL (INCREMENTAL)
// ------------------------------------------------------------

export async function obterProgressoSemanalTodos(): Promise<Record<string, ProgressoSemanalReal>> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_PROGRESSO_SEMANAL);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

export async function obterProgressoSemanal(
  inicioSemanaStr?: string,
): Promise<ProgressoSemanalReal> {
  const inicioSemana = inicioSemanaStr || obterInicioSemanaAtual();
  const todos = await obterProgressoSemanalTodos();

  if (todos[inicioSemana]) {
    return todos[inicioSemana];
  }

  const inicial: ProgressoSemanalReal = {
    inicioSemana,
    treinosRealizados: 0,
    exerciciosRealizados: 0,
    refeicoesRealizadas: 0,
    refeicoesContabilizadasPorDia: {},
  };

  todos[inicioSemana] = inicial;
  await AsyncStorage.setItem(CHAVE_PROGRESSO_SEMANAL, JSON.stringify(todos));
  return inicial;
}

/**
 * Incrementa a contagem de treinos concluídos na semana.
 */
export async function incrementarTreinoRealizado(inicioSemanaStr?: string): Promise<void> {
  const inicioSemana = inicioSemanaStr || obterInicioSemanaAtual();
  const todos = await obterProgressoSemanalTodos();
  const progresso = todos[inicioSemana] || (await obterProgressoSemanal(inicioSemana));

  progresso.treinosRealizados += 1;
  todos[inicioSemana] = progresso;
  await AsyncStorage.setItem(CHAVE_PROGRESSO_SEMANAL, JSON.stringify(todos));
}

/**
 * Incrementa a contagem de exercícios concluídos na semana.
 */
export async function incrementarExercicioRealizado(inicioSemanaStr?: string): Promise<void> {
  const inicioSemana = inicioSemanaStr || obterInicioSemanaAtual();
  const todos = await obterProgressoSemanalTodos();
  const progresso = todos[inicioSemana] || (await obterProgressoSemanal(inicioSemana));

  progresso.exerciciosRealizados += 1;
  todos[inicioSemana] = progresso;
  await AsyncStorage.setItem(CHAVE_PROGRESSO_SEMANAL, JSON.stringify(todos));
}

/**
 * Atualiza o progresso de refeições com contagem estrita por refeição com alimentos.
 */
export async function atualizarContagemRefeicao(
  dataStr: string,
  nomeRefeicao: string,
  possuiAlimentos: boolean,
): Promise<void> {
  const inicioSemana = obterInicioSemanaAtual(dataStr);
  const todos = await obterProgressoSemanalTodos();
  const progresso = todos[inicioSemana] || (await obterProgressoSemanal(inicioSemana));

  if (!progresso.refeicoesContabilizadasPorDia) {
    progresso.refeicoesContabilizadasPorDia = {};
  }

  const refeicoesDoDia = progresso.refeicoesContabilizadasPorDia[dataStr] || [];
  const jaContada = refeicoesDoDia.includes(nomeRefeicao);

  if (possuiAlimentos && !jaContada) {
    progresso.refeicoesContabilizadasPorDia[dataStr] = [...refeicoesDoDia, nomeRefeicao];
    progresso.refeicoesRealizadas += 1;
  } else if (!possuiAlimentos && jaContada) {
    progresso.refeicoesContabilizadasPorDia[dataStr] = refeicoesDoDia.filter(
      (r) => r !== nomeRefeicao,
    );
    progresso.refeicoesRealizadas = Math.max(0, progresso.refeicoesRealizadas - 1);
  }

  todos[inicioSemana] = progresso;
  await AsyncStorage.setItem(CHAVE_PROGRESSO_SEMANAL, JSON.stringify(todos));
}

// ------------------------------------------------------------
// 3. CÁLCULO E CONEXÃO COM O CARD DE ADERÊNCIA SEMANAL
// ------------------------------------------------------------

export async function calcularAderenciaSemanal(): Promise<EstatisticasAderencia> {
  try {
    const inicioSemana = obterInicioSemanaAtual();
    const meta = await obterOuGerarMetaSemanal(inicioSemana);
    const progresso = await obterProgressoSemanal(inicioSemana);

    // O treino concluído vai para o local e para o servidor: somar contaria em dobro.
    // O maior dos dois cobre outro aparelho e o treino feito offline.
    const sessoesServidor = await repositorioTreino.contarSessoesConcluidas(inicioSemana);
    const treinosRealizados = Math.max(progresso.treinosRealizados || 0, sessoesServidor);
    const metaTreinos = meta.treinosPlanejados;

    const exerciciosRealizados = progresso.exerciciosRealizados || 0;
    const metaExercicios = meta.exerciciosPlanejados;

    const refeicoesRealizadas = progresso.refeicoesRealizadas || 0;
    const metaRefeicoes = meta.refeicoesPlanejadas;

    // Cálculo estrito das porcentagens (sem inflar números fictícios)
    const pct = (feito: number, meta: number) =>
      meta > 0 ? Math.min(100, (feito / meta) * 100) : 0;
    const pctTreino = pct(treinosRealizados, metaTreinos);
    const pctExercicios = pct(exerciciosRealizados, metaExercicios);
    const pctRefeicoes = pct(refeicoesRealizadas, metaRefeicoes);

    const porcentagemAderenciaGeral = Math.round((pctTreino + pctExercicios + pctRefeicoes) / 3);

    return {
      diasTreinados: treinosRealizados,
      metaDiasTreino: metaTreinos,
      exerciciosRealizados,
      metaExercicios,
      refeicoesConcluidas: refeicoesRealizadas,
      totalRefeicoesPrevistas: metaRefeicoes,
      porcentagemAderenciaGeral,
    };
  } catch (erro) {
    console.error('Erro ao calcular aderência semanal:', erro);
    return {
      diasTreinados: 0,
      metaDiasTreino: 0,
      exerciciosRealizados: 0,
      metaExercicios: 0,
      refeicoesConcluidas: 0,
      totalRefeicoesPrevistas: 0,
      porcentagemAderenciaGeral: 0,
    };
  }
}

// ------------------------------------------------------------
// 4. HISTÓRICO DE PESO E SÉRIES (MANTIDOS DA ESTRUTURA EXISTENTE)
// ------------------------------------------------------------

export async function obterHistoricoPeso(): Promise<EntradaPeso[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_PESO);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function adicionarEntradaPeso(
  pesoKg: number,
  dataStr?: string,
): Promise<EntradaPeso[]> {
  try {
    const data = dataStr || new Date().toISOString().split('T')[0];
    const historicoAtual = await obterHistoricoPeso();
    const novo: EntradaPeso = {
      id: `p-${Date.now()}`,
      data,
      pesoKg,
    };
    const atualizado = [...historicoAtual.filter((p) => p.data !== data), novo].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    );
    await AsyncStorage.setItem(CHAVE_PESO, JSON.stringify(atualizado));
    return atualizado;
  } catch (erro) {
    console.error('Erro ao registrar peso:', erro);
    return [];
  }
}

export async function registrarExecucaoSerie(
  idExercicio: string,
  nomeExercicio: string,
  numeroSerie: number,
  cargaKg: number,
  repeticoes: number,
  dataStr?: string,
): Promise<void> {
  try {
    const data = dataStr || new Date().toISOString().split('T')[0];
    const json = await AsyncStorage.getItem(CHAVE_CARGAS);
    const mapa: Record<string, EvolucaoCargaExercicio> = json ? JSON.parse(json) : {};

    if (!mapa[idExercicio]) {
      mapa[idExercicio] = {
        idExercicio,
        nomeExercicio,
        historicoCargas: [],
        seriesUltimaExecucao: {},
      };
    }

    if (!mapa[idExercicio].seriesUltimaExecucao) {
      mapa[idExercicio].seriesUltimaExecucao = {};
    }

    mapa[idExercicio].seriesUltimaExecucao![numeroSerie] = { cargaKg, repeticoes };
    mapa[idExercicio].historicoCargas.push({ data, cargaKg, repeticoes });

    await AsyncStorage.setItem(CHAVE_CARGAS, JSON.stringify(mapa));

    // Incrementa contagem de exercícios realizados no progresso semanal
    await incrementarExercicioRealizado();
  } catch (erro) {
    console.error('Erro ao registrar série do exercício:', erro);
  }
}

export async function registrarCargaExercicio(
  idExercicio: string,
  nomeExercicio: string,
  cargaKg: number,
  repeticoes: number,
  dataStr?: string,
): Promise<void> {
  return registrarExecucaoSerie(idExercicio, nomeExercicio, 1, cargaKg, repeticoes, dataStr);
}

export async function obterEvolucaoCargas(): Promise<EvolucaoCargaExercicio[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_CARGAS);
    if (!json) return [];
    const mapa: Record<string, EvolucaoCargaExercicio> = JSON.parse(json);
    return Object.values(mapa);
  } catch (erro) {
    console.error('Erro ao obter evolução de cargas:', erro);
    return [];
  }
}

export async function obterSeriesUltimaExecucao(
  idExercicio: string,
): Promise<Record<number, { cargaKg: number; repeticoes: number }> | null> {
  try {
    const evolucoes = await obterEvolucaoCargas();
    const ex = evolucoes.find((e) => e.idExercicio === idExercicio);
    if (ex && ex.seriesUltimaExecucao) {
      return ex.seriesUltimaExecucao;
    }
    return null;
  } catch {
    return null;
  }
}
