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

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODELO_PADRAO = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash';
const MODELO_RESERVA = 'gemini-3.5-flash-lite';
const MAX_TENTATIVAS = 3;

/**
 * Dados de entrada do questionário para geração do plano.
 * Espelha os campos coletados na tela do questionário.
 */
export interface DadosQuestionario {
  perfil: {
    nome: string;
    sexo_biologico: string;
    idade: number;
    peso_atual: number;
    altura: number;
  };
  objetivo: {
    objetivo_principal: string;
    atividade_fora_treino: string;
    nivel_experiencia: string;
  };
  treino: {
    dias_disponiveis_semana: number;
    local_treino: string;
    tempo_sessao: string;
    divisao_preferida: string;
    restricao_fisica: string[];
  };
  dieta: {
    restricao_alimentar: string[];
    refeicoes_por_dia: number;
  };
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
2. Os exercícios devem ser compatíveis com os equipamentos e local disponíveis.
3. Os macronutrientes do plano alimentar devem somar aproximadamente as calorias-alvo fornecidas.
4. OBRIGATÓRIO: O array "dias" deve conter exatamente 7 posições, uma para cada dia da semana ("diaSemana" de 0 a 6, onde 0 = segunda-feira e 6 = domingo), mesmo nos dias sem treino (marcados com "tipo": "descanso" e "exercicios": []).
5. Nos dias de treino, detalhe todos os exercícios, séries, repetições, descanso e grupo muscular.
6. OBRIGATÓRIO: Retorne exatamente a quantidade de refeições solicitada em "refeicoes_por_dia", com alimentos, porções e macros.
7. Antes de montar o plano, avalie se a combinação de Frequência, Tempo Disponível por Sessão e Divisão de Treino Preferida é viável e eficaz. Se não for (ex: divisão inadequada para o tempo/dias disponíveis), gere ainda assim um plano ajustado à realidade informada, mas registre um alerta claro e específico no array "comentarios" explicando o motivo e, se fizer sentido, sugerindo um ajuste. Não invente restrições — o alerta deve ser sobre a viabilidade prática, não uma opinião genérica.
8. Aja como consultoria: explique decisões, alertas de coerência e adaptações no campo comentarios.
9. O plano é educacional e não substitui avaliação de profissional de saúde.`;
}

/**
 * Monta o prompt do usuário com todos os dados do questionário e
 * cálculos determinísticos.
 */
function montarPromptUsuario(
  dados: DadosQuestionario,
  calculo: ReturnType<typeof calcularTudo>
): string {
  const restricoesTexto = dados.dieta.restricao_alimentar.length > 0 
    ? dados.dieta.restricao_alimentar.join(', ') 
    : 'Nenhuma';

  const restricoesFisicasTexto = dados.treino.restricao_fisica.length > 0
    ? dados.treino.restricao_fisica.join(', ')
    : 'Nenhuma';

  const qtdRefeicoes = Math.max(2, dados.dieta.refeicoes_por_dia || 4);

  return `Gere o plano de treino e dieta em JSON para este perfil:

DADOS DO USUÁRIO:
- Nome: ${dados.perfil.nome}
- Idade: ${dados.perfil.idade} anos
- Sexo: ${dados.perfil.sexo_biologico}
- Peso: ${dados.perfil.peso_atual}kg
- Altura: ${dados.perfil.altura}cm
- Objetivo: ${dados.objetivo.objetivo_principal}
- Nível de experiência: ${dados.objetivo.nivel_experiencia}
- Frequência de treino: ${dados.treino.dias_disponiveis_semana}x por semana
- Tempo Disponível por Sessão: ${dados.treino.tempo_sessao}
- Local de treino: ${dados.treino.local_treino}
- Divisão de Treino Preferida: ${dados.treino.divisao_preferida} (se "deixar a IA decidir", escolher a divisão mais adequada com base em Frequência e Tempo Disponível)
- Restrições Físicas/Lesões: ${restricoesFisicasTexto}
- Restrições Alimentares: ${restricoesTexto}
- Quantidade de refeições por dia OBRIGATÓRIA: ${qtdRefeicoes} (Gere exatamente ${qtdRefeicoes} refeições distintas no JSON)

ESTRUTURA JSON EXIGIDA (retorne apenas este JSON com exatamente ${qtdRefeicoes} refeições):
{
  "treino": {
    "nomeDivisao": "string descritiva (ex: Push Pull Legs 4x)",
    "dias": [
        {
          "diaSemana": 0,
          "nome": "Treino A - Superiores",
          "tipo": "treino",
          "exercicios": [
            {
              "nome": "Supino reto com barra",
              "series": 4,
              "repeticoes": "8-10",
              "descansoSegundos": 90
            }
          ]
        },
        {
          "diaSemana": 1,
          "nome": "Descanso",
          "tipo": "descanso",
          "exercicios": []
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
            "nome": "Ovos",
            "porcao": "3 unidades",
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
 * Schema JSON estrito do plano para validação nativa da Interactions API.
 */
const SCHEMA_PLANO_JSON = {
  type: 'object',
  properties: {
    resumo: {
      type: 'object',
      properties: {
        tmb: { type: 'number' },
        tdee: { type: 'number' },
        caloriasAlvo: { type: 'number' },
        macros: {
          type: 'object',
          properties: {
            proteinas: { type: 'number' },
            carboidratos: { type: 'number' },
            gorduras: { type: 'number' },
          },
          required: ['proteinas', 'carboidratos', 'gorduras'],
        },
        metaAguaMl: { type: 'number' },
      },
      required: ['tmb', 'tdee', 'caloriasAlvo', 'macros', 'metaAguaMl'],
    },
    treino: {
      type: 'object',
      properties: {
        nomeDivisao: { type: 'string' },
        dias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              diaSemana: { type: 'number' },
              nome: { type: 'string' },
              tipo: { type: 'string', enum: ['treino', 'descanso'] },
              exercicios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nome: { type: 'string' },
                    series: { type: 'number' },
                  repeticoes: { type: 'string' },
                  descansoSegundos: { type: 'number' },
                  },
                  required: ['nome', 'series', 'repeticoes', 'descansoSegundos'],
                },
              },
            },
            required: ['diaSemana', 'nome', 'exercicios'],
          },
        },
      },
      required: ['nomeDivisao', 'dias'],
    },
    dieta: {
      type: 'object',
      properties: {
        refeicoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string' },
              horario: { type: 'string' },
              alimentos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nome: { type: 'string' },
                    porcao: { type: 'string' },
                    calorias: { type: 'number' },
                    proteinas: { type: 'number' },
                    carboidratos: { type: 'number' },
                    gorduras: { type: 'number' },
                  },
                  required: ['nome', 'porcao', 'calorias', 'proteinas', 'carboidratos', 'gorduras'],
                },
              },
            },
            required: ['nome', 'horario', 'alimentos'],
          },
        },
      },
      required: ['refeicoes'],
    },
    comentarios: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['resumo', 'treino', 'dieta'],
};

/**
 * Chama a Gemini Interactions API com formato oficial de saída estruturada.
 * Realiza parse estrito do nó steps -> model_output -> content -> text.
 */
async function chamarGeminiAPI(
  promptSistema: string,
  promptUsuario: string,
  tentativa: number = 1,
  modelo: string = MODELO_PADRAO,
): Promise<unknown> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'SUA_CHAVE_GEMINI_AQUI') {
    throw new Error('Chave da Gemini API não configurada. Insira em .env (EXPO_PUBLIC_GEMINI_API_KEY).');
  }

  const urlInteractions = `${GEMINI_BASE_URL}/interactions`;
  const corpoInteractions = {
    model: modelo,
    input: promptUsuario,
    system_instruction: promptSistema,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: SCHEMA_PLANO_JSON,
    },
  };

  try {
    console.log(`🤖 Gemini: ${modelo} (tentativa ${tentativa}/${MAX_TENTATIVAS})...`);

    const resposta = await fetch(urlInteractions, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(corpoInteractions),
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      throw new Error(`HTTP ${resposta.status}: ${erroTexto}`);
    }

    const json = await resposta.json();

    if (json.status !== 'completed') {
      throw new Error(`Interactions API respondeu com status não concluído: ${json.status || 'desconhecido'}`);
    }

    const modelStep = json.steps?.find((step: any) => step.type === 'model_output');
    const textContent = modelStep?.content?.find((item: any) => item.type === 'text');
    const texto = textContent?.text;

    if (!texto) {
      throw new Error('Resposta da Interactions API não contém texto válido.');
    }

    const limpo = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(limpo);
  } catch (erro) {
    const mensagem = String(erro instanceof Error ? erro.message : erro);
    const erroTransitorio = /HTTP (429|500|502|503)|high demand|temporar/i.test(mensagem);
    if (erroTransitorio && tentativa < MAX_TENTATIVAS) {
      const espera = Math.pow(2, tentativa) * 1000 + Math.round(Math.random() * 500);
      console.log(`⏳ Gemini: nova tentativa em ${espera}ms.`, erro);
      await new Promise(resolve => setTimeout(resolve, espera));
      return chamarGeminiAPI(promptSistema, promptUsuario, tentativa + 1, modelo);
    }
    if (erroTransitorio && modelo !== MODELO_RESERVA) {
      console.log(`🔁 Gemini: alternando para ${MODELO_RESERVA}.`);
      return chamarGeminiAPI(promptSistema, promptUsuario, 1, MODELO_RESERVA);
    }
    throw erro;
  }
}

function mapearSexo(s: string): SexoBiologico {
  return s.toLowerCase().includes('feminino') ? 'feminino' : 'masculino';
}

function mapearNivelAtividade(a: string): NivelAtividade {
  const t = a.toLowerCase();
  if (t.includes('sedent')) return 'sedentario';
  if (t.includes('leve')) return 'leve';
  if (t.includes('moderado')) return 'moderado';
  if (t.includes('muito')) return 'muito_ativo';
  if (t.includes('ativo')) return 'ativo';
  return 'moderado';
}

function mapearObjetivo(o: string): ObjetivoTreino {
  const t = o.toLowerCase();
  if (t.includes('emagrecimento')) return 'emagrecimento';
  if (t.includes('defini')) return 'definicao';
  if (t.includes('forç') || t.includes('forc')) return 'forca';
  if (t.includes('condicionamento')) return 'condicionamento';
  return 'hipertrofia';
}

export async function gerarPlanoComIAGemini(dados: DadosQuestionario): Promise<PlanoIAGerado> {
  const p = Number(dados.perfil?.peso_atual);
  const pesoSeguro = isNaN(p) || p <= 0 ? 70 : p;
  
  const a = Number(dados.perfil?.altura);
  const alturaSegura = isNaN(a) || a <= 0 ? 170 : a;
  
  const i = Number(dados.perfil?.idade);
  const idadeSegura = isNaN(i) || i <= 0 ? 30 : i;

  const calculo = calcularTudo(
    pesoSeguro,
    alturaSegura,
    idadeSegura,
    mapearSexo(dados.perfil.sexo_biologico),
    mapearNivelAtividade(dados.objetivo.atividade_fora_treino),
    mapearObjetivo(dados.objetivo.objetivo_principal),
  );

  let plano: PlanoIAGerado;

  try {
    const promptSistema = montarPromptSistema();
    const promptUsuario = montarPromptUsuario(dados, calculo);

    const respostaRaw = await chamarGeminiAPI(promptSistema, promptUsuario);

    // Injeção de dependência determinística: o LLM não precisa mais gerar o resumo!
    if (typeof respostaRaw === 'object' && respostaRaw !== null) {
      (respostaRaw as Record<string, unknown>).resumo = {
        tmb: calculo.tmb,
        tdee: calculo.tdee,
        caloriasAlvo: calculo.caloriasAlvo,
        macros: {
          proteinas: calculo.macros.proteinas,
          carboidratos: calculo.macros.carboidratos,
          gorduras: calculo.macros.gorduras
        },
        metaAguaMl: calculo.metaAguaMl
      };
    }

    // 4. Valida a resposta
    const validacao = validarPlanoIA(respostaRaw);

    if (validacao.valido) {
      plano = sanitizarPlanoIA(respostaRaw)!;
      validarCompatibilidadePlano(plano, dados);
      console.log('✅ Gemini: Plano gerado e validado com sucesso.');
    } else {
      throw new Error(`Resposta da IA inválida: ${validacao.erros.join('; ')}`);
    }
  } catch (erro) {
    console.error('❌ Gemini: Erro ao gerar plano:', erro);
    throw erro;
  }

  // 5. Aguarda a persistência para nunca exibir um plano que não foi salvo.
  await persistirPlanoNoBanco(dados, plano);

  return plano;
}

function validarCompatibilidadePlano(plano: PlanoIAGerado, dados: DadosQuestionario): void {
  if (plano.treino.dias.length !== 7) {
    throw new Error(`O planejamento deve conter 7 dias, mas retornou ${plano.treino.dias.length}.`);
  }

  const quantidade = dados.dieta.refeicoes_por_dia;
  if (quantidade && plano.dieta.refeicoes.length !== quantidade) {
    throw new Error(`A IA retornou ${plano.dieta.refeicoes.length} refeições; o usuário solicitou ${quantidade}.`);
  }

  const diasValidos = new Set(plano.treino.dias.map((dia) => dia.diaSemana));
  if (diasValidos.size !== 7 || [...diasValidos].some((dia) => dia < 0 || dia > 6)) {
    throw new Error('O cronograma precisa conter os dias 0 a 6 sem repetição.');
  }
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
    const userId = userRes.data.user?.id;
    if (!userId) throw new Error('Não foi possível persistir o plano: usuário não autenticado.');

    const { error } = await supabase
      .from('planos_ia_gerados')
      .insert([{
        usuario_id: userId,
        respostas_questionario: dados,
        plano_gerado: plano,
        modelo_ia: MODELO_PADRAO,
      }]);

    if (error) throw new Error(`Não foi possível persistir o plano gerado: ${error.message}`);
    console.log('✅ Plano persistido na tabela planos_ia_gerados.');
  } catch (erro) {
    console.error('❌ Erro de rede ao persistir plano:', erro);
    throw erro;
  }
}
