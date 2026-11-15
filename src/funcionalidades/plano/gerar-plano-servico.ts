// ============================================================
// SERVIÇO: geração ponta a ponta (RN06, RN10, RN11, RN13, RN14)
// ============================================================
// 1. Travas de saúde e metas (código).
// 2. RAG híbrido (RN14): um embedding da consulta ordena exercícios,
//    alimentos e diretrizes; filtros SQL tiram o que não pode entrar.
// 3. LLM escolhe IDs; validação; 1 retry com os erros. Se as gramas não
//    fecham, o código troca alimentos entre os candidatos (etapa 20).
// 4. RPC salvar_plano_gerado grava tudo numa transação e
//    recusa a 6ª geração do dia. Falha antes daqui não grava nada.
// ============================================================

import { supabase } from '@/compartilhado/supabase';
import type { DadosQuestionario, PlanoIAGerado } from '@/compartilhado/tipos';
import { calcularTudo } from '@/compartilhado/utilidades';
import {
  equipamentosDaBase,
  mapearAlimento,
  mapearRespostas,
  PROTEINA_VEGETAL,
  termosExcluidos,
  paraPlanoGerado,
  type EntradaMotor,
  type LinhaAlimento,
  type LinhaExercicio,
} from './mapear-plano';
import {
  diasDaSemana,
  montarDivisaoSemanal,
  montarSlotsDia,
  nomearDias,
} from './motor/divisao-semanal';
import { nomearRefeicoes } from './motor/dieta-rotina';
import { montarPorQue } from './motor/por-que';
import { montarAquecimento, montarProgressao, prescreverPorPapel } from './motor/prescricao';
import { selecionarExercicios } from './selecionar-exercicios';
import { montarPrompt, montarSchemaEscolha, refeicoesDoDia } from './motor/schema-prompt';
import { MENSAGEM_PROFISSIONAL, verificarTravasSaude } from './motor/travas-saude';
import type { AlimentoCandidato, ExercicioCandidato, NomeRefeicao } from './motor/tipos';
import { montarPlano, validarEscolha } from './motor/validador';
import { ErroOllama, gerarComSchema, gerarEmbedding, MODELO_GERACAO } from './ollama-cliente';

// PREMISSA (textos): mensagens da tela de geração.
export const MENSAGEM_FALHA =
  'Não consegui montar um plano válido com as suas respostas. Toque em "Tentar de novo"; se continuar, volte ao questionário e mude os dias de treino ou as restrições.';
export const MENSAGEM_LIMITE = 'Você já gerou 5 planos hoje. Tente de novo amanhã.';
export const MENSAGEM_SALVAR = 'Não consegui salvar o seu plano. Tente de novo.';

/** Erro com texto pronto para a tela. */
export class ErroGeracao extends Error {
  name = 'ErroGeracao';
}

// Poucos candidatos por grupo/slot: prompt curto, geração mais rápida (etapa 13b).
const POR_GRUPO = 4;
const POR_SLOT = 5;
const TENTATIVAS = 2;
// Prefixo de consulta recomendado para o mxbai-embed-large.
const PREFIXO_CONSULTA = 'Represent this sentence for searching relevant passages: ';

function limitarPor<T, K>(itens: T[], chave: (item: T) => K, maximo: number): T[] {
  const contagem = new Map<K, number>();
  return itens.filter((item) => {
    const n = contagem.get(chave(item)) ?? 0;
    contagem.set(chave(item), n + 1);
    return n < maximo;
  });
}

// PREMISSA: margem de candidatos vindos do banco por grupo/slot, para a
// seleção ainda ampliar nível e grupo secundário e filtrar restrição física.
const POR_GRUPO_BANCO = 30;
const POR_SLOT_BANCO = POR_SLOT * 4;

async function buscarExercicios(
  entrada: EntradaMotor,
  embedding: string,
): Promise<LinhaExercicio[]> {
  // Todos os níveis e já ordenados pelo vetor: a seleção amplia o nível quando um grupo fica vazio.
  const { data, error } = await supabase.rpc('buscar_exercicios_rag', {
    query_embedding: embedding,
    filtro_equipamento: equipamentosDaBase(entrada.equipamentos),
    limite_por_grupo: POR_GRUPO_BANCO,
  });
  if (error) throw error;
  return (data ?? []) as LinhaExercicio[];
}

async function buscarAlimentos(
  entrada: EntradaMotor,
  embedding: string,
): Promise<AlimentoCandidato[]> {
  const vegano = entrada.restricoes.includes('vegano');
  const { data, error } = await supabase.rpc('buscar_alimentos_rag', {
    query_embedding: embedding,
    termos_excluidos: termosExcluidos(entrada.restricoes),
    termos_proteina: vegano ? PROTEINA_VEGETAL : null,
    limite_por_slot: POR_SLOT_BANCO,
  });
  if (error) throw error;
  // O código confere de novo (slot e restrições): o banco só pré-filtra.
  const candidatos = ((data ?? []) as LinhaAlimento[])
    .map((linha) => mapearAlimento(linha, vegano))
    .filter(
      (a): a is AlimentoCandidato =>
        a !== null && entrada.restricoes.every((r) => a.restricoesAtendidas.includes(r)),
    );
  return comPorcoes(limitarPor(candidatos, (a) => a.slot, POR_SLOT));
}

/** Porção típica da base (RN17) para a medida caseira; sem ela o plano só mostra gramas. */
async function comPorcoes(alimentos: AlimentoCandidato[]): Promise<AlimentoCandidato[]> {
  try {
    const { data, error } = await supabase
      .from('base_alimentos')
      .select('id, porcao_descricao, porcao_gramas')
      .in(
        'id',
        alimentos.map((a) => Number(a.id)),
      );
    if (error) throw error;
    const porId = new Map((data ?? []).map((l) => [String(l.id), l]));
    return alimentos.map((a) => {
      const l = porId.get(a.id);
      return l?.porcao_descricao && Number(l.porcao_gramas) > 0
        ? { ...a, porcaoDescricao: l.porcao_descricao, porcaoGramas: Number(l.porcao_gramas) }
        : a;
    });
  } catch (erro) {
    console.warn('[geracao] porções caseiras indisponíveis:', erro);
    return alimentos;
  }
}

interface Trecho {
  titulo: string;
  fonte: string;
  conteudo: string;
}

/** Um só embedding por geração (o Ollama roda num Mac de 8 GB). */
async function embeddingDaConsulta(entrada: EntradaMotor): Promise<string> {
  const restricoes = entrada.restricoes.length > 0 ? `, ${entrada.restricoes.join(', ')}` : '';
  const vetor = await gerarEmbedding(
    `${PREFIXO_CONSULTA}treino e dieta para ${entrada.objetivo}, nível ${entrada.nivel}${restricoes}`,
  );
  return JSON.stringify(vetor);
}

async function buscarDiretrizes(entrada: EntradaMotor, embedding: string): Promise<Trecho[]> {
  const { data, error } = await supabase.rpc('buscar_conhecimento_rag', {
    query_embedding: embedding,
    filtro_objetivo: entrada.objetivo,
    filtro_nivel: entrada.nivel,
    limite: 3,
  });
  if (error) throw error;
  return (data ?? []) as Trecho[];
}

/** Troca os UUIDs por apelidos curtos (e1, e2...): bem menos tokens no prompt e na resposta. */
function apelidar(exercicios: ExercicioCandidato[]) {
  const original = new Map(exercicios.map((e, i) => [`e${i + 1}`, e.id]));
  return { apelidados: exercicios.map((e, i) => ({ ...e, id: `e${i + 1}` })), original };
}

async function escolherComRetry(
  entrada: EntradaMotor,
  meta: ReturnType<typeof metaDe>,
  diretrizes: string[],
  embedding: string,
  refeicoes: NomeRefeicao[],
) {
  const divisao = montarDivisaoSemanal(entrada.diasPorSemana);
  const [linhas, alimentos] = await Promise.all([
    buscarExercicios(entrada, embedding),
    buscarAlimentos(entrada, embedding),
  ]);
  const selecao = selecionarExercicios(
    linhas,
    entrada,
    divisao.map((d) => montarSlotsDia(d, entrada.nivel)),
    POR_GRUPO,
  );
  // Nome de cada dia pelo foco que sobrou depois da seleção (RN19).
  const nomes = nomearDias(selecao.slots.map((s) => s.porGrupo.map((p) => p.grupo)));
  const slots = selecao.slots.map((s, i) => ({ ...s, nome: nomes[i] }));
  const { apelidados: exercicios, original } = apelidar(selecao.exercicios);
  const schema = montarSchemaEscolha(slots, exercicios, alimentos, refeicoes);
  const contexto = {
    objetivo: entrada.objetivo,
    nivel: entrada.nivel,
    diasPorSemana: entrada.diasPorSemana,
    equipamentos: entrada.equipamentos,
    restricoes: entrada.restricoes,
    diretrizes,
  };
  const restricoes = {
    equipamentos: entrada.equipamentos,
    restricoesAlimentares: entrada.restricoes,
    refeicoes,
  };

  let erros: string[] = [];
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    const bruta = await gerarComSchema(
      montarPrompt(contexto, exercicios, alimentos, erros),
      schema,
    );
    const validacao = validarEscolha(bruta, slots, exercicios, alimentos, restricoes);
    if (!validacao.escolha) {
      erros = validacao.erros;
      continue;
    }
    const montagem = montarPlano(
      validacao.escolha,
      slots,
      exercicios,
      alimentos,
      (papel) => prescreverPorPapel(entrada.objetivo, entrada.nivel, papel),
      meta,
      refeicoes,
    );
    if (montagem.plano) {
      const dias = montagem.plano.dias.map((d) => ({
        ...d,
        exercicios: d.exercicios.map((e) => ({ ...e, id: original.get(e.id) ?? e.id })),
      }));
      const aquecimentos = montagem.plano.dias.map((d, i) =>
        montarAquecimento(
          slots[i].porGrupo.map((p) => p.grupo),
          d.exercicios[0],
          entrada.equipamentos,
          entrada.restricoesFisicas,
        ),
      );
      return {
        plano: { ...montagem.plano, dias },
        divisao,
        avisos: selecao.avisos,
        aquecimentos,
        alimentos,
      };
    }
    erros = montagem.erros;
  }
  console.warn('[geracao] recusada duas vezes:', erros);
  throw new ErroGeracao(MENSAGEM_FALHA);
}

function metaDe(calculo: ReturnType<typeof calcularTudo>) {
  return { ...calculo.macros, calorias: calculo.caloriasAlvo };
}

async function salvar(dados: DadosQuestionario, plano: PlanoIAGerado): Promise<string> {
  // O nome não precisa ficar no log da geração.
  const respostas = { ...dados, perfil: { ...dados.perfil, nome: undefined } };
  const { data, error } = await supabase.rpc('salvar_plano_gerado', {
    p_dados: { respostas, plano, modelo: MODELO_GERACAO },
  });
  if (error) {
    console.warn('[geracao] RPC salvar_plano_gerado:', error.message);
    throw new ErroGeracao(
      error.message.includes('limite_diario') ? MENSAGEM_LIMITE : MENSAGEM_SALVAR,
    );
  }
  return String(data);
}

/** Passos 1 a 3 sem gravar nada. Exportado para o script de avaliação (etapa 13). */
export async function montarPlanoGerado(dados: DadosQuestionario): Promise<PlanoIAGerado> {
  const entrada = mapearRespostas(dados);
  const calculo = calcularTudo(
    entrada.pesoKg,
    entrada.alturaCm,
    entrada.idade,
    entrada.sexo,
    entrada.nivelAtividade,
    entrada.objetivo,
  );
  const travas = verificarTravasSaude({ ...entrada, caloriasAlvo: calculo.caloriasAlvo });
  if (travas.length > 0) throw new ErroGeracao(MENSAGEM_PROFISSIONAL);

  const embedding = await embeddingDaConsulta(entrada);
  const trechos = await buscarDiretrizes(entrada, embedding);
  const refeicoes = refeicoesDoDia(Number(dados.dieta?.refeicoes_por_dia));
  const { plano, divisao, avisos, aquecimentos, alimentos } = await escolherComRetry(
    entrada,
    metaDe(calculo),
    trechos.map((t) => t.conteudo),
    embedding,
    refeicoes,
  );
  const nomeDivisao = [...new Set(divisao.map((d) => d.nome))].join(' / ');
  const principal = prescreverPorPapel(entrada.objetivo, entrada.nivel, 'principal');
  const porQue = montarPorQue({
    ...entrada,
    caloriasAlvo: calculo.caloriasAlvo,
    tdee: calculo.tdee,
    proteinasG: calculo.macros.proteinas,
    dias: plano.dias.map((d) => d.nome[0].toLowerCase() + d.nome.slice(1)),
    repeticoesPrincipal: principal.repeticoes,
    repeticoesReserva: principal.repeticoesReserva,
    refeicoes: refeicoes.length,
    fontes: trechos.map((t) => t.fonte),
  });
  return {
    ...paraPlanoGerado(
      plano,
      calculo,
      nomeDivisao,
      trechos.map((t) => `${t.titulo} (${t.fonte})`),
      {
        diasDaSemana: diasDaSemana(plano.dias.length),
        aquecimentos,
        refeicoesNomeadas: nomearRefeicoes(refeicoes, entrada.nivelAtividade),
        alimentos,
        progressao: montarProgressao(entrada.nivel, entrada.equipamentos),
        inicioEm: new Date().toISOString(),
        porQue,
      },
    ),
    fundamentos: trechos.map(({ titulo, fonte, conteudo }) => ({ titulo, fonte, conteudo })),
    ...(avisos.length > 0 ? { avisos } : {}),
  };
}

export async function gerarPlano(
  dados: DadosQuestionario,
): Promise<{ plano: PlanoIAGerado; planoIaId: string }> {
  try {
    const gerado = await montarPlanoGerado(dados);
    return { plano: gerado, planoIaId: await salvar(dados, gerado) };
  } catch (erro) {
    if (erro instanceof ErroGeracao || erro instanceof ErroOllama) throw erro;
    // Falha de banco ou base sem candidatos: detalhe no log, texto simples na tela.
    console.warn('[geracao]', erro);
    throw new ErroGeracao(MENSAGEM_FALHA);
  }
}
