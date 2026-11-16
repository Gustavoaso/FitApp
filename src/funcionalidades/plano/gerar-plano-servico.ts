// ============================================================
// SERVIÇO: geração ponta a ponta (RN06, RN10, RN11, RN13, RN14)
// ============================================================
// 1. Travas de saúde e metas (código).
// 2. RAG híbrido (RN14): a Edge Function gerar-plano faz o embedding da
//    consulta (gte-small) e busca candidatos; filtros SQL tiram o que não
//    pode entrar.
// 3. A mesma function chama a Groq (RN06), que escolhe IDs; o app valida;
//    1 retry com os erros. Se as gramas não fecham, o código troca
//    alimentos entre os candidatos (etapa 20).
// 4. RPC salvar_plano_gerado grava tudo numa transação e
//    recusa a 6ª geração do dia. Falha antes daqui não grava nada.
// ============================================================

import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
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
import { refeicoesDoDia, SLOTS } from './motor/schema-prompt';
import { MENSAGEM_PROFISSIONAL, verificarTravasSaude } from './motor/travas-saude';
import type { AlimentoCandidato, ExercicioCandidato, NomeRefeicao } from './motor/tipos';
import { montarPlano, validarEscolha } from './motor/validador';

// PREMISSA (textos): mensagens da tela de geração.
export const MENSAGEM_FALHA =
  'Não consegui montar um plano válido com as suas respostas. Toque em "Tentar de novo"; se continuar, volte ao questionário e mude os dias de treino ou as restrições.';
export const MENSAGEM_LIMITE = 'Você já gerou 5 planos hoje. Tente de novo amanhã.';
export const MENSAGEM_SALVAR = 'Não consegui salvar o seu plano. Tente de novo.';
export const MENSAGEM_SEM_REDE =
  'Sem conexão com a internet. Confira o Wi-Fi ou os dados móveis e tente de novo.';
export const MENSAGEM_SERVICO_OCUPADO =
  'O gerador de planos está com muita procura agora. Espere um minuto e tente de novo.';
export const MENSAGEM_SERVICO_FORA =
  'O gerador de planos está fora do ar. Tente de novo em alguns minutos.';
export const MENSAGEM_SESSAO = 'Sua sessão expirou. Entre de novo para gerar o plano.';

// Modelo da Groq (RN06), gravado junto de cada plano gerado.
export const MODELO_GERACAO = 'llama-3.3-70b-versatile';

/** Erro com texto pronto para a tela. */
export class ErroGeracao extends Error {
  name = 'ErroGeracao';
}

// Poucos candidatos por grupo/slot: prompt curto, geração mais rápida (etapa 13b).
const POR_GRUPO = 4;
const POR_SLOT = 5;
const TENTATIVAS = 2;

function limitarPor<T, K>(itens: T[], chave: (item: T) => K, maximo: number): T[] {
  const contagem = new Map<K, number>();
  return itens.filter((item) => {
    const n = contagem.get(chave(item)) ?? 0;
    contagem.set(chave(item), n + 1);
    return n < maximo;
  });
}

interface Trecho {
  id: number;
  titulo: string;
  fonte: string;
  conteudo: string;
}

interface Candidatos {
  exercicios: LinhaExercicio[];
  alimentos: LinhaAlimento[];
  trechos: Trecho[];
}

/** Erro do invoke da function → texto pronto para a tela. */
async function erroDaFuncao(erro: unknown): Promise<ErroGeracao> {
  if (erro instanceof FunctionsFetchError) return new ErroGeracao(MENSAGEM_SEM_REDE);
  if (erro instanceof FunctionsHttpError) {
    const status: unknown = erro.context?.status;
    if (status === 401) return new ErroGeracao(MENSAGEM_SESSAO);
    if (status === 429) return new ErroGeracao(MENSAGEM_LIMITE);
    if (status === 503) return new ErroGeracao(MENSAGEM_SERVICO_OCUPADO);
  }
  console.warn('[geracao] gerar-plano:', erro);
  return new ErroGeracao(MENSAGEM_SERVICO_FORA);
}

async function chamarFuncao<T>(corpo: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('gerar-plano', { body: corpo });
  if (error) throw await erroDaFuncao(error);
  return data as T;
}

/** Embedding da consulta e as 3 buscas por vetor (RN14), todas dentro da function. */
async function buscarCandidatos(entrada: EntradaMotor): Promise<Candidatos> {
  const vegano = entrada.restricoes.includes('vegano');
  const dados = await chamarFuncao<Partial<Candidatos>>({
    acao: 'buscar',
    objetivo: entrada.objetivo,
    nivel: entrada.nivel,
    restricoes: entrada.restricoes,
    // Todos os níveis e já ordenados pelo vetor: a seleção amplia o nível quando um grupo fica vazio.
    filtroEquipamento: equipamentosDaBase(entrada.equipamentos),
    termosExcluidos: termosExcluidos(entrada.restricoes),
    termosProteina: vegano ? PROTEINA_VEGETAL : null,
  });
  return {
    exercicios: dados.exercicios ?? [],
    alimentos: dados.alimentos ?? [],
    trechos: dados.trechos ?? [],
  };
}

async function candidatosDeAlimento(
  linhas: LinhaAlimento[],
  entrada: EntradaMotor,
): Promise<AlimentoCandidato[]> {
  const vegano = entrada.restricoes.includes('vegano');
  // O código confere de novo (slot e restrições): o banco só pré-filtra.
  const candidatos = linhas
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

async function escolherComRetry(
  entrada: EntradaMotor,
  meta: ReturnType<typeof metaDe>,
  candidatos: Candidatos,
  refeicoes: NomeRefeicao[],
) {
  const divisao = montarDivisaoSemanal(entrada.diasPorSemana);
  const alimentos = await candidatosDeAlimento(candidatos.alimentos, entrada);
  const selecao = selecionarExercicios(
    candidatos.exercicios,
    entrada,
    divisao.map((d) => montarSlotsDia(d, entrada.nivel)),
    POR_GRUPO,
  );
  // Nome de cada dia pelo foco que sobrou depois da seleção (RN19).
  const nomes = nomearDias(selecao.slots.map((s) => s.porGrupo.map((p) => p.grupo)));
  const slots = selecao.slots.map((s, i) => ({ ...s, nome: nomes[i] }));
  const exercicios = selecao.exercicios;
  // Falta de candidato num slot de alimento ou na seleção inteira não tem o que escolher.
  if (exercicios.length === 0 || SLOTS.some((s) => !alimentos.some((a) => a.slot === s))) {
    console.warn('[geracao] base sem candidatos suficientes');
    throw new ErroGeracao(MENSAGEM_FALHA);
  }
  const restricoes = {
    equipamentos: entrada.equipamentos,
    restricoesAlimentares: entrada.restricoes,
    refeicoes,
  };

  let erros: string[] = [];
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    // A function só recebe IDs e enums: nomes e diretrizes ela lê do banco (não vira proxy da Groq).
    const { escolha: bruta } = await chamarFuncao<{ escolha: unknown }>({
      acao: 'escolher',
      objetivo: entrada.objetivo,
      nivel: entrada.nivel,
      diasPorSemana: entrada.diasPorSemana,
      equipamentos: entrada.equipamentos,
      restricoes: entrada.restricoes,
      refeicoes,
      slots: slots.map((s) => ({ porGrupo: s.porGrupo })),
      exercicios: exercicios.map((e) => ({ id: e.id, grupo: e.grupo })),
      alimentos: alimentos.map((a) => ({ id: a.id, slot: a.slot })),
      trechos: candidatos.trechos.map((t) => t.id),
      // Mensagens do validador (sem dado pessoal), no máximo 5 de 200 caracteres.
      erros: erros.slice(0, 5).map((e) => e.slice(0, 200)),
    });
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
      const aquecimentos = montagem.plano.dias.map((d, i) =>
        montarAquecimento(
          slots[i].porGrupo.map((p) => p.grupo),
          d.exercicios[0],
          entrada.equipamentos,
          entrada.restricoesFisicas,
        ),
      );
      return {
        plano: montagem.plano,
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

  const candidatos = await buscarCandidatos(entrada);
  const trechos = candidatos.trechos;
  const refeicoes = refeicoesDoDia(Number(dados.dieta?.refeicoes_por_dia));
  const { plano, divisao, avisos, aquecimentos, alimentos } = await escolherComRetry(
    entrada,
    metaDe(calculo),
    candidatos,
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
    if (erro instanceof ErroGeracao) throw erro;
    // Falha de banco ou base sem candidatos: detalhe no log, texto simples na tela.
    console.warn('[geracao]', erro);
    throw new ErroGeracao(MENSAGEM_FALHA);
  }
}
