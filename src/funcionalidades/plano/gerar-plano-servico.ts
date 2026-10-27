// ============================================================
// SERVIÇO: geração ponta a ponta (RN06, RN10, RN11, RN13, RN14)
// ============================================================
// 1. Travas de saúde e metas (código).
// 2. Candidatos por SQL e diretrizes por vetor (RAG).
// 3. LLM escolhe IDs; validação; 1 retry com os erros.
// 4. RPC salvar_plano_gerado grava tudo numa transação e
//    recusa a 6ª geração do dia. Falha antes daqui não grava nada.
// ============================================================

import { supabase } from '@/compartilhado/supabase';
import type { DadosQuestionario, PlanoIAGerado } from '@/compartilhado/tipos';
import { calcularTudo } from '@/compartilhado/utilidades';
import {
  mapearAlimento,
  mapearRespostas,
  paraPlanoGerado,
  type EntradaMotor,
  type LinhaAlimento,
  type LinhaExercicio,
} from './mapear-plano';
import { montarDivisaoSemanal, montarSlotsDia, prescrever } from './motor/divisao-semanal';
import { selecionarExercicios } from './selecionar-exercicios';
import { montarPrompt, montarSchemaEscolha } from './motor/schema-prompt';
import { MENSAGEM_PROFISSIONAL, verificarTravasSaude } from './motor/travas-saude';
import type { AlimentoCandidato, ExercicioCandidato } from './motor/tipos';
import { montarPlano, validarEscolha } from './motor/validador';
import { ErroOllama, gerarComSchema, gerarEmbedding, MODELO_GERACAO } from './ollama-cliente';

// PREMISSA (textos): mensagens da tela de geração.
export const MENSAGEM_FALHA = 'Não consegui montar um plano válido agora. Tente de novo em alguns minutos.';
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

async function buscarExercicios(): Promise<LinhaExercicio[]> {
  // Todos os níveis: a seleção amplia o nível quando um grupo fica vazio.
  const { data, error } = await supabase
    .from('base_exercicios')
    .select('id, nome, grupo_primario, grupo_secundario, equipamento, tipo_movimento, nivel')
    .eq('is_curado', true)
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as LinhaExercicio[];
}

async function buscarAlimentos(entrada: EntradaMotor): Promise<AlimentoCandidato[]> {
  const { data, error } = await supabase
    .from('base_alimentos')
    .select('id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g')
    .eq('is_curado', true)
    .limit(1000);
  if (error) throw error;
  const candidatos = ((data ?? []) as LinhaAlimento[])
    .map((linha) => mapearAlimento(linha, entrada.restricoes.includes('vegano')))
    .filter(
      (a): a is AlimentoCandidato =>
        a !== null && entrada.restricoes.every((r) => a.restricoesAtendidas.includes(r)),
    );
  return limitarPor(candidatos, (a) => a.slot, POR_SLOT);
}

interface Trecho {
  titulo: string;
  fonte: string;
  conteudo: string;
}

async function buscarDiretrizes(entrada: EntradaMotor): Promise<Trecho[]> {
  const embedding = await gerarEmbedding(
    `${PREFIXO_CONSULTA}treino e dieta para ${entrada.objetivo}, nível ${entrada.nivel}`,
  );
  const { data, error } = await supabase.rpc('buscar_conhecimento_rag', {
    query_embedding: JSON.stringify(embedding),
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

async function escolherComRetry(entrada: EntradaMotor, meta: ReturnType<typeof metaDe>, diretrizes: string[]) {
  const divisao = montarDivisaoSemanal(entrada.diasPorSemana);
  const [linhas, alimentos] = await Promise.all([buscarExercicios(), buscarAlimentos(entrada)]);
  const selecao = selecionarExercicios(
    linhas,
    entrada,
    divisao.map((d) => montarSlotsDia(d, entrada.nivel)),
    POR_GRUPO,
  );
  const { slots } = selecao;
  const { apelidados: exercicios, original } = apelidar(selecao.exercicios);
  const schema = montarSchemaEscolha(slots, exercicios, alimentos);
  const contexto = {
    objetivo: entrada.objetivo,
    nivel: entrada.nivel,
    diasPorSemana: entrada.diasPorSemana,
    equipamentos: entrada.equipamentos,
    restricoes: entrada.restricoes,
    diretrizes,
  };
  const restricoes = { equipamentos: entrada.equipamentos, restricoesAlimentares: entrada.restricoes };

  let erros: string[] = [];
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    const bruta = await gerarComSchema(montarPrompt(contexto, exercicios, alimentos, erros), schema);
    const validacao = validarEscolha(bruta, slots, exercicios, alimentos, restricoes);
    if (!validacao.escolha) {
      erros = validacao.erros;
      continue;
    }
    const montagem = montarPlano(validacao.escolha, slots, exercicios, alimentos, prescrever(entrada.objetivo, entrada.nivel), meta);
    if (montagem.plano) {
      const dias = montagem.plano.dias.map((d) => ({
        ...d,
        exercicios: d.exercicios.map((e) => ({ ...e, id: original.get(e.id) ?? e.id })),
      }));
      return { plano: { ...montagem.plano, dias }, divisao, avisos: selecao.avisos };
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
    throw new ErroGeracao(error.message.includes('limite_diario') ? MENSAGEM_LIMITE : MENSAGEM_SALVAR);
  }
  return String(data);
}

/** Passos 1 a 3 sem gravar nada. Exportado para o script de avaliação (etapa 13). */
export async function montarPlanoGerado(dados: DadosQuestionario): Promise<PlanoIAGerado> {
  const entrada = mapearRespostas(dados);
  const calculo = calcularTudo(entrada.pesoKg, entrada.alturaCm, entrada.idade, entrada.sexo, entrada.nivelAtividade, entrada.objetivo);
  const travas = verificarTravasSaude({ ...entrada, caloriasAlvo: calculo.caloriasAlvo });
  if (travas.length > 0) throw new ErroGeracao(MENSAGEM_PROFISSIONAL);

  const trechos = await buscarDiretrizes(entrada);
  const { plano, divisao, avisos } = await escolherComRetry(entrada, metaDe(calculo), trechos.map((t) => t.conteudo));
  const nomeDivisao = [...new Set(divisao.map((d) => d.nome))].join(' / ');
  return {
    ...paraPlanoGerado(plano, calculo, nomeDivisao, trechos.map((t) => `${t.titulo} (${t.fonte})`)),
    fundamentos: trechos.map(({ titulo, fonte, conteudo }) => ({ titulo, fonte, conteudo })),
    ...(avisos.length > 0 ? { avisos } : {}),
  };
}

export async function gerarPlano(dados: DadosQuestionario): Promise<{ plano: PlanoIAGerado; planoIaId: string }> {
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
