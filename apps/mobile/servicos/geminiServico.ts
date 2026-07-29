// ============================================================
// SERVIÇO: Gemini — Geração de Planos com IA
// (servicos/geminiServico.ts)
// ============================================================
// Serviço client-side que chama a Gemini API diretamente para
// gerar planos personalizados de treino e dieta.
//
// FLUXO:
// 1. Recebe as respostas do questionário
// 2. Executa cálculos determinísticos (TMB, TDEE, macros, água)
//    usando as funções do pacote @fitapp/utilidades
// 3. Busca alimentos/exercícios do cache (Supabase) para
//    enriquecer o prompt com dados reais
// 4. Monta prompt detalhado e chama Gemini API
// 5. Valida a resposta com validadorPlanoIA
// 6. Persiste o plano no Supabase (planos_ia_gerados)
// 7. Retorna o plano tipado (PlanoIAGerado)
//
// CONCEITOS:
// - Gemini API: API REST do Google para modelos de linguagem.
//   Diferente do Claude, usa o endpoint generateContent
//   e suporta response_mime_type para forçar JSON.
// - Retry com backoff: se a primeira tentativa falhar,
//   espera um tempo crescente antes de tentar de novo.
// - Prompt engineering: o prompt inclui dados calculados
//   (parte determinística) + exemplos de alimentos/exercícios
//   reais do cache (parte contextual).
// ============================================================

import { calcularTudo } from '@fitapp/utilidades';
import type { PlanoIAGerado, ObjetivoTreino, NivelAtividade, SexoBiologico } from '@fitapp/tipos';
import { supabase } from './supabase';
import { validarPlanoIA, sanitizarPlanoIA } from './validadorPlanoIA';
import { buscarAlimentosParaPrompt } from './tacoSincronizacaoServico';
import { buscarExerciciosParaPrompt } from './exerciseDBSincronizacaoServico';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODELO_PADRAO = 'gemini-2.0-flash';
const MAX_TENTATIVAS = 2;

/**
 * Dados de entrada do questionário para geração do plano.
 * Espelha os campos coletados na tela do questionário.
 */
export interface DadosQuestionario {
  nome: string;
  idade: number;
  sexo: SexoBiologico;
  pesoKg: number;
  alturaCm: number;
  objetivo: ObjetivoTreino;
  nivelExperiencia: string;
  nivelAtividade: NivelAtividade;
  frequenciaSemanal: number;
  equipamentos: string;
  restricoesAlimentares: string[];
}

/**
 * Monta o prompt do sistema (system instruction) para o Gemini.
 * Define o papel e as regras de saída do LLM.
 */
function montarPromptSistema(): string {
  return `Você é um nutricionista esportivo e personal trainer certificado.
Sua tarefa é montar um plano de treino semanal e plano alimentar diário personalizado.

REGRAS OBRIGATÓRIAS:
1. Responda EXCLUSIVAMENTE em JSON válido, sem markdown, sem backticks, sem texto fora do JSON.
2. Use APENAS alimentos brasileiros comuns (arroz, feijão, frango, etc.) e exercícios reais de academia.
3. Respeite as restrições alimentares do usuário (se houver).
4. Os exercícios devem ser compatíveis com os equipamentos disponíveis.
5. Os macronutrientes do plano alimentar devem somar aproximadamente as calorias-alvo fornecidas.
6. Inclua de 3 a 6 exercícios por dia de treino.
7. Inclua de 4 a 6 refeições no plano alimentar.
8. Cada refeição deve ter de 2 a 5 alimentos.`;
}

/**
 * Monta o prompt do usuário com todos os dados do questionário,
 * cálculos determinísticos e exemplos de alimentos/exercícios reais.
 */
function montarPromptUsuario(
  dados: DadosQuestionario,
  calculo: ReturnType<typeof calcularTudo>,
  alimentosCache: string[],
  exerciciosCache: string[],
): string {
  const restricoesTexto = dados.restricoesAlimentares.length > 0
    ? dados.restricoesAlimentares.join(', ')
    : 'Nenhuma';

  const equipamentoTexto = {
    academia_completa: 'Academia completa (barras, halteres, máquinas, cabos)',
    halteres_home: 'Em casa com halteres e elásticos',
    peso_corpo: 'Apenas peso do corpo (calistenia)',
  }[dados.equipamentos] || dados.equipamentos;

  let promptContexto = '';

  // Enriquece com alimentos reais do cache (se disponíveis)
  if (alimentosCache.length > 0) {
    promptContexto += `\n\nALIMENTOS DISPONÍVEIS NA BASE (use preferencialmente estes):\n${alimentosCache.join('\n')}`;
  }

  // Enriquece com exercícios reais do cache (se disponíveis)
  if (exerciciosCache.length > 0) {
    promptContexto += `\n\nEXERCÍCIOS DISPONÍVEIS NA BASE (use preferencialmente estes):\n${exerciciosCache.join('\n')}`;
  }

  return `Gere o plano fitness completo para este perfil:

DADOS DO USUÁRIO:
- Nome: ${dados.nome}
- Idade: ${dados.idade} anos
- Sexo: ${dados.sexo}
- Peso: ${dados.pesoKg}kg
- Altura: ${dados.alturaCm}cm
- Objetivo: ${dados.objetivo}
- Nível de experiência: ${dados.nivelExperiencia}
- Equipamentos: ${equipamentoTexto}
- Frequência de treino: ${dados.frequenciaSemanal}x por semana
- Restrições alimentares: ${restricoesTexto}

CÁLCULOS NUTRICIONAIS (já calculados — use estes valores exatos no resumo):
- TMB: ${calculo.tmb} kcal
- TDEE: ${calculo.tdee} kcal
- Calorias-alvo: ${calculo.caloriasAlvo} kcal
- Proteínas: ${calculo.macros.proteinas}g
- Carboidratos: ${calculo.macros.carboidratos}g
- Gorduras: ${calculo.macros.gorduras}g
- Meta de água: ${calculo.metaAguaMl}ml
${promptContexto}

FORMATO JSON DE SAÍDA (siga exatamente esta estrutura):
{
  "resumo": {
    "tmb": ${calculo.tmb},
    "tdee": ${calculo.tdee},
    "caloriasAlvo": ${calculo.caloriasAlvo},
    "macros": {
      "proteinas": ${calculo.macros.proteinas},
      "carboidratos": ${calculo.macros.carboidratos},
      "gorduras": ${calculo.macros.gorduras}
    },
    "metaAguaMl": ${calculo.metaAguaMl}
  },
  "treino": {
    "nomeDivisao": "string descritiva (ex: Push Pull Legs 4x)",
    "dias": [
      {
        "diaSemana": 1,
        "nome": "Peito + Tríceps",
        "exercicios": [
          {
            "nome": "Supino Reto com Barra",
            "series": 4,
            "repeticoes": 10,
            "descansoSegundos": 90,
            "grupoMuscular": "Peito"
          }
        ]
      }
    ]
  },
  "dieta": {
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "07:30",
        "alimentos": [
          {
            "nome": "Ovos mexidos",
            "porcao": "3 unidades (150g)",
            "calorias": 219,
            "proteinas": 18,
            "carboidratos": 2,
            "gorduras": 15
          }
        ]
      }
    ]
  }
}`;
}

/**
 * Chama a Gemini API com retry e backoff exponencial.
 * Usa response_mime_type para forçar resposta em JSON.
 */
async function chamarGeminiAPI(
  promptSistema: string,
  promptUsuario: string,
  tentativa: number = 1,
): Promise<unknown> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'SUA_CHAVE_GEMINI_AQUI') {
    throw new Error('Chave da Gemini API não configurada. Insira em .env (EXPO_PUBLIC_GEMINI_API_KEY).');
  }

  const url = `${GEMINI_BASE_URL}/models/${MODELO_PADRAO}:generateContent?key=${apiKey}`;

  const corpo = {
    systemInstruction: {
      parts: [{ text: promptSistema }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: promptUsuario }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  try {
    console.log(`🤖 Gemini: Chamando API (tentativa ${tentativa}/${MAX_TENTATIVAS})...`);

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      throw new Error(`HTTP ${resposta.status}: ${erroTexto}`);
    }

    const json = await resposta.json();

    // Extrai o texto da resposta do Gemini
    const textoResposta = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoResposta) {
      throw new Error('Resposta da Gemini sem conteúdo válido.');
    }

    // Faz parse do JSON retornado
    const planoRaw = JSON.parse(textoResposta);
    return planoRaw;
  } catch (erro) {
    if (tentativa < MAX_TENTATIVAS) {
      // Backoff exponencial: espera 2s na primeira retry, 4s na segunda, etc.
      const espera = Math.pow(2, tentativa) * 1000;
      console.log(`⏳ Gemini: Erro na tentativa ${tentativa}, aguardando ${espera / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, espera));
      return chamarGeminiAPI(promptSistema, promptUsuario, tentativa + 1);
    }
    throw erro;
  }
}

/**
 * Gera o plano completo com fallback determinístico.
 * Se a Gemini não estiver disponível (sem chave ou erro), retorna
 * um plano baseado apenas nos cálculos matemáticos.
 */
function gerarPlanoFallback(
  dados: DadosQuestionario,
  calculo: ReturnType<typeof calcularTudo>,
): PlanoIAGerado {
  return {
    resumo: {
      tmb: calculo.tmb,
      tdee: calculo.tdee,
      caloriasAlvo: calculo.caloriasAlvo,
      macros: {
        proteinas: calculo.macros.proteinas,
        carboidratos: calculo.macros.carboidratos,
        gorduras: calculo.macros.gorduras,
      },
      metaAguaMl: calculo.metaAguaMl,
    },
    treino: {
      nomeDivisao: `Divisão ${dados.frequenciaSemanal}x — ${dados.objetivo.toUpperCase()}`,
      dias: [
        {
          diaSemana: 1,
          nome: 'Treino A — Peito & Tríceps',
          exercicios: [
            { nome: 'Supino Reto com Barra', series: 4, repeticoes: 10, descansoSegundos: 90 },
            { nome: 'Supino Inclinado com Halteres', series: 3, repeticoes: 12, descansoSegundos: 60 },
            { nome: 'Crossover com Cabo', series: 3, repeticoes: 15, descansoSegundos: 45 },
            { nome: 'Tríceps Pulley com Corda', series: 4, repeticoes: 12, descansoSegundos: 60 },
          ],
        },
        {
          diaSemana: 2,
          nome: 'Treino B — Costas & Bíceps',
          exercicios: [
            { nome: 'Puxada Frontal', series: 4, repeticoes: 10, descansoSegundos: 90 },
            { nome: 'Remada Curvada com Barra', series: 4, repeticoes: 10, descansoSegundos: 75 },
            { nome: 'Rosca Direta com Barra W', series: 3, repeticoes: 12, descansoSegundos: 60 },
            { nome: 'Rosca Martelo', series: 3, repeticoes: 12, descansoSegundos: 60 },
          ],
        },
        {
          diaSemana: 3,
          nome: 'Treino C — Pernas & Ombros',
          exercicios: [
            { nome: 'Agachamento Livre com Barra', series: 4, repeticoes: 8, descansoSegundos: 120 },
            { nome: 'Leg Press 45°', series: 4, repeticoes: 12, descansoSegundos: 90 },
            { nome: 'Desenvolvimento com Halteres', series: 4, repeticoes: 10, descansoSegundos: 60 },
            { nome: 'Elevação Lateral', series: 4, repeticoes: 15, descansoSegundos: 45 },
          ],
        },
      ],
    },
    dieta: {
      refeicoes: [
        {
          nome: 'Café da Manhã',
          horario: '07:30',
          alimentos: [
            { nome: 'Ovos mexidos', porcao: '3 unidades (150g)', calorias: 219, proteinas: 18, carboidratos: 2, gorduras: 15 },
            { nome: 'Pão de Forma Integral', porcao: '2 fatias (50g)', calorias: 126, proteinas: 5, carboidratos: 22, gorduras: 2 },
          ],
        },
        {
          nome: 'Almoço',
          horario: '12:30',
          alimentos: [
            { nome: 'Peito de Frango Grelhado', porcao: '1 filé médio (150g)', calorias: 247, proteinas: 45, carboidratos: 0, gorduras: 6 },
            { nome: 'Arroz Branco Cozido', porcao: '2 colheres de servir (100g)', calorias: 128, proteinas: 3, carboidratos: 28, gorduras: 0 },
            { nome: 'Feijão Carioca Cozido', porcao: '1 concha (86g)', calorias: 65, proteinas: 4, carboidratos: 12, gorduras: 0 },
          ],
        },
        {
          nome: 'Lanche da Tarde',
          horario: '16:00',
          alimentos: [
            { nome: 'Banana', porcao: '1 unidade (120g)', calorias: 107, proteinas: 1, carboidratos: 27, gorduras: 0 },
            { nome: 'Whey Protein', porcao: '1 scoop (30g)', calorias: 120, proteinas: 24, carboidratos: 3, gorduras: 1 },
          ],
        },
        {
          nome: 'Jantar',
          horario: '19:30',
          alimentos: [
            { nome: 'Filé de Tilápia Grelhado', porcao: '1 filé (150g)', calorias: 155, proteinas: 33, carboidratos: 0, gorduras: 2 },
            { nome: 'Batata Doce Cozida', porcao: '1 unidade média (150g)', calorias: 135, proteinas: 2, carboidratos: 31, gorduras: 0 },
            { nome: 'Salada Verde', porcao: '1 prato (100g)', calorias: 20, proteinas: 2, carboidratos: 3, gorduras: 0 },
          ],
        },
      ],
    },
  };
}

/**
 * FUNÇÃO PRINCIPAL: Gera o plano personalizado com IA.
 *
 * Fluxo:
 * 1. Calcula TMB, TDEE, macros, água (determinístico)
 * 2. Busca alimentos/exercícios do cache para enriquecer prompt
 * 3. Chama Gemini API (com retry)
 * 4. Valida e sanitiza a resposta
 * 5. Persiste no banco (planos_ia_gerados)
 * 6. Retorna PlanoIAGerado tipado
 */
export async function gerarPlanoComIA(dados: DadosQuestionario): Promise<PlanoIAGerado> {
  // 1. Cálculos determinísticos
  const calculo = calcularTudo(
    dados.pesoKg,
    dados.alturaCm,
    dados.idade,
    dados.sexo,
    dados.nivelAtividade,
    dados.objetivo,
  );

  // 2. Busca dados do cache para enriquecer o prompt (fire-and-forget se falhar)
  let alimentosCache: string[] = [];
  let exerciciosCache: string[] = [];

  try {
    [alimentosCache, exerciciosCache] = await Promise.all([
      buscarAlimentosParaPrompt(50),
      buscarExerciciosParaPrompt(dados.equipamentos, 80),
    ]);
  } catch {
    console.log('⚠️ Gemini: Não foi possível buscar cache, seguindo sem enriquecimento.');
  }

  // 3. Tenta chamar a Gemini API
  let plano: PlanoIAGerado;

  try {
    const promptSistema = montarPromptSistema();
    const promptUsuario = montarPromptUsuario(dados, calculo, alimentosCache, exerciciosCache);

    const respostaRaw = await chamarGeminiAPI(promptSistema, promptUsuario);

    // 4. Valida a resposta
    const validacao = validarPlanoIA(respostaRaw);

    if (validacao.valido) {
      plano = sanitizarPlanoIA(respostaRaw)!;
      console.log('✅ Gemini: Plano gerado e validado com sucesso.');
    } else {
      console.warn('⚠️ Gemini: Resposta com problemas, tentando sanitizar:', validacao.erros);
      const sanitizado = sanitizarPlanoIA(respostaRaw);

      if (sanitizado) {
        plano = sanitizado;
        console.log('✅ Gemini: Plano sanitizado com sucesso.');
      } else {
        console.warn('❌ Gemini: Plano irrecuperável, usando fallback determinístico.');
        plano = gerarPlanoFallback(dados, calculo);
      }
    }
  } catch (erro) {
    console.error('❌ Gemini: Erro ao gerar plano, usando fallback:', erro);
    plano = gerarPlanoFallback(dados, calculo);
  }

  // 5. Persiste no banco (fire-and-forget — não bloqueia o retorno)
  persistirPlanoNoBanco(dados, plano).catch(err =>
    console.error('⚠️ Gemini: Erro ao persistir plano:', err)
  );

  return plano;
}

/**
 * Persiste o plano gerado na tabela planos_ia_gerados.
 * Salva tanto as respostas do questionário (para reprodutibilidade)
 * quanto o plano completo (para consulta futura).
 */
async function persistirPlanoNoBanco(
  dados: DadosQuestionario,
  plano: PlanoIAGerado,
): Promise<void> {
  try {
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase
      .from('planos_ia_gerados')
      .insert([{
        usuario_id: userId,
        respostas_questionario: dados,
        plano_gerado: plano,
        modelo_ia: MODELO_PADRAO,
      }]);

    if (error) {
      console.error('❌ Erro ao persistir plano no banco:', error.message);
    } else {
      console.log('✅ Plano persistido na tabela planos_ia_gerados.');
    }
  } catch (erro) {
    console.error('❌ Erro de rede ao persistir plano:', erro);
  }
}
