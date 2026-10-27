// Avaliação da qualidade dos planos (etapa 13): gera o plano de perfis fictícios
// fixos com o motor e o serviço reais (Ollama local + Supabase local, sem gravar
// nada), confere cada plano de novo com as regras do validador e salva o
// relatório em docs/avaliacoes/. Fora do `npm test` de propósito: é lento e usa rede local.
//
// COMO RODAR (perfis em sequência; o Mac de 8 GB não aguenta em paralelo):
//   npx supabase start && bash scripts/preparar-bases-locais.sh
//   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY do `npx supabase status`> \
//     node --import ./scripts/avaliacao/carregador.mjs scripts/avaliar-planos.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { supabase } from '@/compartilhado/supabase';
import type { DadosQuestionario, PlanoIAGerado } from '@/compartilhado/tipos';
import { montarPlanoGerado } from '@/funcionalidades/plano/gerar-plano-servico';
import {
  mapearAlimento,
  mapearExercicio,
  mapearRespostas,
  type LinhaAlimento,
  type LinhaExercicio,
} from '@/funcionalidades/plano/mapear-plano';
import { conferirTolerancia } from '@/funcionalidades/plano/motor/gramas';
import { EQUIPAMENTOS_PERMITIDOS } from '@/funcionalidades/plano/motor/validador';
import { MODELO_EMBEDDING, MODELO_GERACAO, OLLAMA_URL, TIMEOUT_MS } from '@/funcionalidades/plano/ollama-cliente';

interface Perfil {
  rotulo: string;
  dados: DadosQuestionario;
}

// Perfis fictícios. O nome nunca chega ao prompt (RN12), mas fica vazio mesmo assim.
function perfil(
  rotulo: string,
  p: { sexo: string; idade: number; peso: number; altura: number; objetivo: string; atividade: string; nivel: string },
  t: { dias: number; local: string; restricaoFisica?: string[] },
  restricaoAlimentar: string[] = ['Nenhuma'],
): Perfil {
  return {
    rotulo,
    dados: {
      perfil: { nome: '', sexo_biologico: p.sexo, idade: p.idade, peso_atual: p.peso, altura: p.altura },
      objetivo: { objetivo_principal: p.objetivo, atividade_fora_treino: p.atividade, nivel_experiencia: p.nivel },
      treino: {
        dias_disponiveis_semana: t.dias,
        local_treino: t.local,
        tempo_sessao: '60 min',
        divisao_preferida: 'Sem preferência',
        restricao_fisica: t.restricaoFisica ?? ['Nenhuma'],
      },
      dieta: { restricao_alimentar: restricaoAlimentar, refeicoes_por_dia: 4 },
    },
  };
}

const PERFIS: Perfil[] = [
  perfil('Iniciante em casa', { sexo: 'Masculino', idade: 28, peso: 78, altura: 176, objetivo: 'Hipertrofia', atividade: 'Sedentário', nivel: 'Iniciante' }, { dias: 3, local: 'Casa' }),
  perfil('Avançado 6x', { sexo: 'Masculino', idade: 31, peso: 85, altura: 182, objetivo: 'Hipertrofia', atividade: 'Moderado', nivel: 'Avançado' }, { dias: 6, local: 'Academia' }),
  perfil('Mulher 50+ emagrecimento', { sexo: 'Feminino', idade: 54, peso: 76, altura: 162, objetivo: 'Emagrecimento', atividade: 'Leve', nivel: 'Iniciante' }, { dias: 3, local: 'Academia' }),
  perfil('Vegano', { sexo: 'Feminino', idade: 26, peso: 60, altura: 165, objetivo: 'Definição', atividade: 'Moderado', nivel: 'Intermediário' }, { dias: 4, local: 'Academia' }, ['Vegano']),
  perfil('Sem lactose', { sexo: 'Masculino', idade: 40, peso: 90, altura: 178, objetivo: 'Força', atividade: 'Leve', nivel: 'Intermediário' }, { dias: 4, local: 'Academia' }, ['Lactose']),
  perfil('2x por semana', { sexo: 'Feminino', idade: 35, peso: 68, altura: 168, objetivo: 'Condicionamento', atividade: 'Leve', nivel: 'Iniciante' }, { dias: 2, local: 'Academia' }),
  perfil('Restrição no joelho', { sexo: 'Masculino', idade: 45, peso: 92, altura: 175, objetivo: 'Emagrecimento', atividade: 'Sedentário', nivel: 'Iniciante' }, { dias: 3, local: 'Academia', restricaoFisica: ['Joelho'] }),
  perfil('Peso do corpo intermediário', { sexo: 'Feminino', idade: 30, peso: 58, altura: 160, objetivo: 'Condicionamento', atividade: 'Moderado', nivel: 'Intermediário' }, { dias: 4, local: 'Peso do corpo' }),
];

// PREMISSA: nomes que carregam o joelho. O motor ainda não lê restricao_fisica;
// a avaliação só aponta, não reprova.
const CARGA_JOELHO = ['agachamento', 'afundo', 'avanco', 'leg press', 'extensora', 'salto', 'pliometr', 'passada', 'lunge', 'squat'];

// O app desiste em TIMEOUT_MS (60 s). Aqui o limite é maior para medir a qualidade
// mesmo quando a geração é lenta; o que passa de TIMEOUT_MS vira problema no relatório.
const LIMITE_AVALIACAO_MS = 300_000;
const fetchOriginal = globalThis.fetch;
globalThis.fetch = (url, init) =>
  fetchOriginal(url, String(url).startsWith(OLLAMA_URL) ? { ...init, signal: AbortSignal.timeout(LIMITE_AVALIACAO_MS) } : init);

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function falhar(mensagem: string): never {
  console.error(`Erro: ${mensagem}`);
  process.exit(1);
}

async function conferirOllama() {
  if (!['localhost', '127.0.0.1'].includes(new URL(OLLAMA_URL).hostname)) {
    falhar(`o Ollama precisa ser local; EXPO_PUBLIC_OLLAMA_URL aponta para ${OLLAMA_URL}.`);
  }
  let resposta: Response;
  try {
    resposta = await fetch(`${OLLAMA_URL}/api/tags`);
  } catch {
    falhar(`o Ollama não respondeu em ${OLLAMA_URL}. Ligue com \`ollama serve\` e rode de novo.`);
  }
  const corpo = (await resposta.json()) as { models?: { name: string }[] };
  const nomes = (corpo.models ?? []).map((m) => m.name.split(':')[0]);
  for (const modelo of [MODELO_GERACAO, MODELO_EMBEDDING]) {
    if (!nomes.includes(modelo)) falhar(`modelo ${modelo} ausente. Baixe com \`ollama pull ${modelo}\`.`);
  }
}

async function conferirBases() {
  for (const tabela of ['base_exercicios', 'base_alimentos', 'base_conhecimento'] as const) {
    const consulta = supabase.from(tabela).select('id', { count: 'exact', head: true });
    const { count, error } = tabela === 'base_conhecimento' ? await consulta : await consulta.eq('is_curado', true);
    if (error) falhar(`Supabase local não respondeu (${error.message}). Rode \`npx supabase start\`.`);
    if (!count) falhar(`${tabela} vazia no banco local. Rode \`bash scripts/preparar-bases-locais.sh\`.`);
  }
}

/** Confere o plano pronto de novo, pelas regras do validador, a partir das linhas do banco. */
async function checar(dados: DadosQuestionario, plano: PlanoIAGerado) {
  const entrada = mapearRespostas(dados);
  const problemas: string[] = [];
  const alertas: string[] = [];
  const dias = plano.treino.dias;
  if (dias.length !== entrada.diasPorSemana) problemas.push(`${dias.length} dias de treino (pedidos ${entrada.diasPorSemana}).`);

  const idsExercicios = [...new Set(dias.flatMap((d) => d.exercicios.map((e) => e.exercicioId ?? '')))];
  const { data: linhasEx } = await supabase
    .from('base_exercicios')
    .select('id, nome, grupo_primario, equipamento, tipo_movimento')
    .in('id', idsExercicios);
  const permitidos = EQUIPAMENTOS_PERMITIDOS[entrada.equipamentos];
  for (const linha of (linhasEx ?? []) as LinhaExercicio[]) {
    const ex = mapearExercicio(linha);
    if (ex && !permitidos.includes(ex.equipamento)) problemas.push(`${linha.nome}: equipamento ${linha.equipamento} fora de ${entrada.equipamentos}.`);
  }
  for (const d of dias) {
    const ids = d.exercicios.map((e) => e.exercicioId);
    if (new Set(ids).size !== ids.length) problemas.push(`${d.nome}: exercício repetido no mesmo dia.`);
  }

  const alimentos = plano.dieta.refeicoes.flatMap((r) => r.alimentos);
  const { data: linhasAl } = await supabase
    .from('base_alimentos')
    .select('id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g')
    .in('id', alimentos.map((a) => Number(a.alimentoId)));
  for (const linha of (linhasAl ?? []) as LinhaAlimento[]) {
    const al = mapearAlimento(linha);
    const quebradas = entrada.restricoes.filter((r) => !al?.restricoesAtendidas.includes(r));
    if (quebradas.length) problemas.push(`${linha.nome} quebra ${quebradas.join(', ')}.`);
  }

  const soma = (k: 'calorias' | 'proteinas' | 'carboidratos' | 'gorduras') => alimentos.reduce((t, a) => t + (a[k] ?? 0), 0);
  const { caloriasAlvo, macros } = plano.resumo;
  problemas.push(
    ...conferirTolerancia(
      { calorias: soma('calorias'), proteinas: soma('proteinas'), carboidratos: soma('carboidratos'), gorduras: soma('gorduras') },
      { calorias: caloriasAlvo, ...macros },
    ),
  );

  if (dados.treino.restricao_fisica.includes('Joelho')) {
    const pesados = dias.flatMap((d) => d.exercicios.map((e) => e.nome)).filter((n) => CARGA_JOELHO.some((p) => semAcento(n).includes(p)));
    if (pesados.length) alertas.push(`Joelho: o motor ignora restricao_fisica; saíram ${[...new Set(pesados)].join(', ')}.`);
  }
  if (!plano.fundamentos?.length) alertas.push('Sem fundamentos da base de conhecimento.');
  return { problemas, alertas };
}

interface Resultado {
  rotulo: string;
  segundos: number;
  situacao: 'aprovado' | 'reprovado' | 'falhou';
  detalhes: string[];
  resumo?: string;
}

async function avaliar({ rotulo, dados }: Perfil): Promise<Resultado> {
  // O serviço só loga o motivo da recusa (console.warn): guardamos para o relatório.
  const avisos: string[] = [];
  const warnOriginal = console.warn;
  console.warn = (...args: unknown[]) => avisos.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  const inicio = Date.now();
  try {
    const plano = await montarPlanoGerado(dados);
    const segundos = Math.round((Date.now() - inicio) / 1000);
    const { problemas, alertas } = await checar(dados, plano);
    if (segundos * 1000 > TIMEOUT_MS) problemas.push(`Levou ${segundos} s: no app estouraria o limite de ${TIMEOUT_MS / 1000} s.`);
    const exercicios = plano.treino.dias.reduce((t, d) => t + d.exercicios.length, 0);
    const resumo = `${plano.treino.nomeDivisao}; ${plano.treino.dias.length} dias, ${exercicios} exercícios; ${plano.resumo.caloriasAlvo} kcal; ${plano.fundamentos?.length ?? 0} fundamentos`;
    return { rotulo, segundos, situacao: problemas.length ? 'reprovado' : 'aprovado', detalhes: [...problemas, ...alertas], resumo };
  } catch (erro) {
    const segundos = Math.round((Date.now() - inicio) / 1000);
    return { rotulo, segundos, situacao: 'falhou', detalhes: [erro instanceof Error ? erro.message : String(erro), ...avisos] };
  } finally {
    console.warn = warnOriginal;
  }
}

function relatorio(resultados: Resultado[], data: string): string {
  const aprovados = resultados.filter((r) => r.situacao === 'aprovado').length;
  const linhas = [
    `# Avaliação dos planos: ${data}`,
    '',
    `Modelo ${MODELO_GERACAO} (embeddings ${MODELO_EMBEDDING}), Ollama e Supabase locais, ${resultados.length} perfis fictícios em sequência.`,
    `**${aprovados} de ${resultados.length} aprovados.** Reprovado = o plano saiu, mas a reconferência achou problema; falhou = o serviço não entregou plano.`,
    '',
    '| Perfil | Situação | Tempo | Plano |',
    '|---|---|---|---|',
    ...resultados.map((r) => `| ${r.rotulo} | ${r.situacao} | ${r.segundos} s | ${r.resumo ?? '-'} |`),
    '',
    '## Detalhes',
  ];
  for (const r of resultados) {
    linhas.push('', `### ${r.rotulo}`, ...(r.detalhes.length ? r.detalhes.map((d) => `- ${d}`) : ['- Sem observações.']));
  }
  return linhas.join('\n') + '\n';
}

async function principal() {
  await conferirOllama();
  await conferirBases();
  const resultados: Resultado[] = [];
  for (const p of PERFIS) {
    console.log(`Gerando: ${p.rotulo}...`);
    const r = await avaliar(p);
    console.log(`  ${r.situacao} em ${r.segundos} s`);
    resultados.push(r);
  }
  const data = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local
  const pasta = new URL('../docs/avaliacoes/', import.meta.url);
  mkdirSync(pasta, { recursive: true });
  const arquivo = new URL(`${data}-avaliacao-planos.md`, pasta);
  writeFileSync(arquivo, relatorio(resultados, data));
  console.log(`Relatório salvo em docs/avaliacoes/${data}-avaliacao-planos.md`);
}

principal();
