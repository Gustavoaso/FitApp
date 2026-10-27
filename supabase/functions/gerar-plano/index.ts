// ============================================================
// EDGE FUNCTION: gerar-plano
// ============================================================
// Função serverless que gera planos de treino e dieta usando
// Llama self-hosted com RAG da base real de exercícios e
// alimentos, knowledge base de ciência do treinamento e
// nutrição, e validação rigorosa de schema.
//
// FLUXO:
// 1. Recebe respostas do questionário
// 2. Valida dados de entrada
// 3. Calcula TMB, TDEE, macros, água (determinístico)
// 4. Busca exercícios/alimentos da base via RAG
// 5. Monta prompt expert com knowledge base
// 6. Chama Llama API (servidor próprio)
// 7. Valida resposta (IDs, macros, contagens)
// 8. Retry 1x se falhar validação
// 9. Persiste plano normalizado no Supabase
// 10. Retorna plano pro cliente
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { selecionarContextoRAG } from './seletor-rag.ts';
import { validarPlanoGerado, gerarMensagemCorrecao } from './validador.ts';
import { CONHECIMENTO_TREINO } from './knowledge/treino-knowledge.ts';
import { CONHECIMENTO_NUTRICAO } from './knowledge/nutricao-knowledge.ts';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────

interface PayloadQuestionario {
  nome: string;
  idade: number;
  sexo: 'masculino' | 'feminino';
  pesoKg: number;
  alturaCm: number;
  objetivo:
  | 'hipertrofia'
  | 'definicao'
  | 'forca'
  | 'emagrecimento'
  | 'condicionamento';
  nivelExperiencia: 'iniciante' | 'intermediario' | 'avancado';
  nivelAtividade: 'sedentario' | 'leve' | 'moderado' | 'ativo' | 'muito_ativo';
  frequenciaSemanal: number;
  numRefeicoes: number;
  restricoesAlimentares: string[];
  equipamentos: 'academia_completa' | 'home_gym' | 'peso_corporal';
}

// ──────────────────────────────────────────────
// CÁLCULOS DETERMINÍSTICOS
// ──────────────────────────────────────────────

function calcularTMB(
  pesoKg: number,
  alturaCm: number,
  idade: number,
  sexo: string
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  return sexo === 'masculino' ? Math.round(base + 5) : Math.round(base - 161);
}

function calcularTDEE(tmb: number, atividade: string): number {
  const fatores: Record<string, number> = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    ativo: 1.725,
    muito_ativo: 1.9,
  };
  return Math.round(tmb * (fatores[atividade] || 1.2));
}

function calcularCaloriasAlvo(tdee: number, objetivo: string): number {
  const ajustes: Record<string, number> = {
    hipertrofia: 1.1,
    definicao: 0.85,
    forca: 1.05,
    emagrecimento: 0.8,
    condicionamento: 1.0,
  };
  return Math.round(tdee * (ajustes[objetivo] || 1.0));
}

function calcularMacros(calorias: number, objetivo: string) {
  const distrib: Record<string, { p: number; c: number; g: number }> = {
    hipertrofia: { p: 0.3, c: 0.45, g: 0.25 },
    definicao: { p: 0.35, c: 0.35, g: 0.3 },
    forca: { p: 0.3, c: 0.45, g: 0.25 },
    emagrecimento: { p: 0.35, c: 0.35, g: 0.3 },
    condicionamento: { p: 0.25, c: 0.5, g: 0.25 },
  };
  const d = distrib[objetivo] || distrib.condicionamento;
  return {
    proteinas: Math.round((calorias * d.p) / 4),
    carboidratos: Math.round((calorias * d.c) / 4),
    gorduras: Math.round((calorias * d.g) / 9),
  };
}

// ──────────────────────────────────────────────
// CONSTRUTOR DE PROMPTS
// ──────────────────────────────────────────────

function montarPromptSystem(
  frequenciaSemanal: number,
  numRefeicoes: number,
  caloriasAlvo: number,
  macros: { proteinas: number; carboidratos: number; gorduras: number }
): string {
  const nomesRefeicoes = CONHECIMENTO_NUTRICAO.nomeacaoRefeicoes(numRefeicoes);

  return `Você é um personal trainer CREF e nutricionista esportivo CRN com 15 anos de experiência em montagem de protocolos individualizados.

REGRAS INVIOLÁVEIS:
1. Use APENAS exercícios e alimentos da lista RAG fornecida pelo usuário. Cada item tem um "id" — você DEVE incluir esse id na resposta.
2. NÃO invente exercícios nem alimentos. Se precisar de algo que não está na lista, substitua pelo mais próximo disponível.
3. Plano de treino: exatamente 7 dias (0=domingo a 6=sábado), ${frequenciaSemanal} dias de treino e o restante como descanso.
4. Plano alimentar: exatamente 7 dias, ${numRefeicoes} refeições por dia nomeadas: ${nomesRefeicoes.join(', ')}.
5. Macros IGUAIS todos os 7 dias. Calorias diárias entre 95% e 105% de ${caloriasAlvo} kcal.
6. Distribuição de macros: proteínas ${macros.proteinas}g (±10%), carboidratos ${macros.carboidratos}g (±15%), gorduras ${macros.gorduras}g (±15%).
7. Ao calcular os macros de um alimento, use os valores por 100g fornecidos e calcule proporcionalmente à porção em gramas que você escolher.

CONHECIMENTO DE TREINO:
${JSON.stringify(CONHECIMENTO_TREINO, null, 0)}

CONHECIMENTO DE NUTRIÇÃO:
${JSON.stringify({
    regrasDieta: CONHECIMENTO_NUTRICAO.regrasDieta,
    principios: CONHECIMENTO_NUTRICAO.principios,
  }, null, 0)}

FORMATO DE SAÍDA — JSON puro, sem markdown, sem backticks:
{
  "treino": {
    "nomeDivisao": "string",
    "justificativa": "string — 1-2 frases",
    "dias": [
      {
        "diaSemana": 0-6,
        "tipo": "treino" | "descanso",
        "nome": "string",
        "exercicios": [
          {
            "exercicioId": número inteiro da base (não UUID)",
            "nome": "string",
            "grupoMuscular": "string",
            "series": number,
            "repeticoes": "string",
            "descansoSegundos": number,
            "observacao": "string opcional"
          }
        ]
      }
    ]
  },
  "dieta": {
    "justificativa": "string — 1-2 frases",
    "refeicoes": [
      {
        "nome": "Refeição N",
        "horario": "08:00",
        "alimentos": [
          {
            "alimentoId": "UUID da base",
            "nome": "string",
            "porcao": "string — ex: '150g' ou '2 fatias (50g)'",
            "porcaoGramas": number,
            "calorias": number,
            "proteinas": number,
            "carboidratos": number,
            "gorduras": number
          }
        ],
        "totalRefeicao": { "calorias": N, "proteinas": N, "carboidratos": N, "gorduras": N }
      }
    ]
  },
  "comentarios": ["string — dicas personalizadas"]
}`;
}

function montarPromptUser(
  body: PayloadQuestionario,
  tmb: number,
  tdee: number,
  caloriasAlvo: number,
  macros: { proteinas: number; carboidratos: number; gorduras: number },
  metaAguaMl: number,
  contextoRag: { exercicios: any[]; alimentos: any[]; conhecimento: any[] }
): string {
  return `PERFIL DO USUÁRIO:
- Nome: ${body.nome}
- Idade: ${body.idade}, Sexo: ${body.sexo}
- Peso: ${body.pesoKg}kg, Altura: ${body.alturaCm}cm
- Objetivo: ${body.objetivo}
- Experiência: ${body.nivelExperiencia}
- Atividade: ${body.nivelAtividade}
- Frequência: ${body.frequenciaSemanal}x/semana
- Equipamentos: ${body.equipamentos}
- Restrições: ${body.restricoesAlimentares.join(', ') || 'Nenhuma'}
- Refeições por dia: ${body.numRefeicoes}

METAS CALCULADAS:
- TMB: ${tmb} kcal | TDEE: ${tdee} kcal | Meta: ${caloriasAlvo} kcal
- Proteínas: ${macros.proteinas}g | Carboidratos: ${macros.carboidratos}g | Gorduras: ${macros.gorduras}g
- Água: ${metaAguaMl}ml/dia

CONHECIMENTO CIENTÍFICO RECUPERADO (baseie o plano nestas diretrizes):
${contextoRag.conhecimento.map(c => `[${c.titulo}] ${c.conteudo}`).join('\n\n')}

EXERCÍCIOS DISPONÍVEIS (use APENAS estes, cada um tem "id"):
${JSON.stringify(contextoRag.exercicios, null, 0)}

ALIMENTOS DISPONÍVEIS (use APENAS estes, calcule macros proporcionais à porção):
${JSON.stringify(contextoRag.alimentos, null, 0)}

Monte o plano completo seguindo TODAS as regras do system prompt.`;
}

// ──────────────────────────────────────────────
// CHAMADA AO LLAMA
// ──────────────────────────────────────────────

async function chamarLlama(
  promptSystem: string,
  promptUser: string
): Promise<any> {
  const ollamaUrl = Deno.env.get('OLLAMA_URL');
  if (!ollamaUrl) {
    throw new Error('OLLAMA_URL não configurada nas variáveis de ambiente');
  }

  const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OLLAMA_MODEL') || 'llama3.2',
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: promptUser },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errTxt = await response.text();
    throw new Error(`Llama API HTTP ${response.status}: ${errTxt}`);
  }

  const resJson = await response.json();
  const rawText = resJson.choices?.[0]?.message?.content || '{}';
  return JSON.parse(
    rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
  );
}

// ──────────────────────────────────────────────
// PERSISTÊNCIA (ACEITE)
// ──────────────────────────────────────────────

async function persistirPlano(
  supabase: any,
  usuarioId: string,
  plano: any,
  caloriasAlvo: number,
  macros: { proteinas: number; carboidratos: number; gorduras: number },
  metaAguaMl: number
): Promise<void> {
  // 1. Desativar planos anteriores
  await supabase
    .from('planos_treino')
    .update({ ativo: false })
    .eq('usuario_id', usuarioId)
    .eq('ativo', true);

  await supabase
    .from('planos_dieta')
    .update({ ativo: false })
    .eq('usuario_id', usuarioId)
    .eq('ativo', true);

  // 2. Inserir plano de treino
  const { data: planoTreino, error: erroPT } = await supabase
    .from('planos_treino')
    .insert({
      usuario_id: usuarioId,
      nome: plano.treino.nomeDivisao,
      dias_por_semana: plano.treino.dias.filter(
        (d: any) => d.tipo === 'treino'
      ).length,
      ativo: true,
    })
    .select('id')
    .single();

  if (erroPT) throw new Error(`Erro ao criar plano_treino: ${erroPT.message}`);

  // 3. Inserir dias e exercícios
  for (const dia of plano.treino.dias) {
    const { data: diaTreino, error: erroDT } = await supabase
      .from('dias_treino')
      .insert({
        plano_treino_id: planoTreino.id,
        dia_semana: dia.diaSemana,
        nome: dia.nome || (dia.tipo === 'descanso' ? 'Descanso' : dia.nome),
      })
      .select('id')
      .single();

    if (erroDT)
      throw new Error(`Erro ao criar dia_treino: ${erroDT.message}`);

    if (dia.tipo === 'treino' && dia.exercicios) {
      const exerciciosInsert = dia.exercicios.map((ex: any, idx: number) => ({
        dia_treino_id: diaTreino.id,
        exercicio_id: ex.exercicioId,
        nome: ex.nome,
        ordem: idx + 1,
        series: JSON.stringify(
          Array.from({ length: ex.series }, (_, i) => ({
            numero: i + 1,
            repeticoes:
              typeof ex.repeticoes === 'string'
                ? parseInt(ex.repeticoes)
                : ex.repeticoes,
            cargaKg: null,
            descansoSegundos: ex.descansoSegundos,
          }))
        ),
      }));

      const { error: erroEP } = await supabase
        .from('exercicios_plano')
        .insert(exerciciosInsert);

      if (erroEP)
        throw new Error(`Erro ao criar exercicios_plano: ${erroEP.message}`);
    }
  }

  // 4. Inserir plano de dieta
  const { data: planoDieta, error: erroPD } = await supabase
    .from('planos_dieta')
    .insert({
      usuario_id: usuarioId,
      calorias_alvo: caloriasAlvo,
      proteinas_alvo_g: macros.proteinas,
      carboidratos_alvo_g: macros.carboidratos,
      gorduras_alvo_g: macros.gorduras,
      meta_agua_ml: metaAguaMl,
      ativo: true,
    })
    .select('id')
    .single();

  if (erroPD) throw new Error(`Erro ao criar plano_dieta: ${erroPD.message}`);

  // 5. Inserir refeições e alimentos replicados para os 7 dias da semana (0 a 6)
  if (plano.dieta && Array.isArray(plano.dieta.refeicoes)) {
    for (let diaSemana = 0; diaSemana <= 6; diaSemana++) {
      for (const refeicao of plano.dieta.refeicoes) {
        const { data: refeicaoPlano, error: erroRP } = await supabase
          .from('refeicoes_plano')
          .insert({
            plano_dieta_id: planoDieta.id,
            tipo: (refeicao.nome || 'refeicao').toLowerCase().replace(/\s+/g, '_'),
            nome: refeicao.nome,
            horario_sugerido: refeicao.horario || null,
            dia_semana: diaSemana,
          })
          .select('id')
          .single();

        if (erroRP)
          throw new Error(`Erro ao criar refeicao_plano: ${erroRP.message}`);

        if (refeicao.alimentos && refeicao.alimentos.length > 0) {
          const alimentosInsert = refeicao.alimentos.map((al: any) => ({
            refeicao_plano_id: refeicaoPlano.id,
            alimento_id: al.alimentoId,
            nome: al.nome,
            porcao_gramas: al.porcaoGramas || parseFloat(al.porcao) || 100,
            calorias: al.calorias,
            proteinas: al.proteinas,
            carboidratos: al.carboidratos,
            gorduras: al.gorduras,
          }));

          const { error: erroAR } = await supabase
            .from('alimentos_refeicao')
            .insert(alimentosInsert);

          if (erroAR)
            throw new Error(`Erro ao criar alimentos_refeicao: ${erroAR.message}`);
        }
      }
    }
  }

  // 6. Salvar JSON bruto pra auditoria
  await supabase.from('planos_ia_gerados').insert({
    usuario_id: usuarioId,
    respostas_questionario: {},
    plano_gerado: plano,
    modelo_ia: Deno.env.get('OLLAMA_MODEL') || 'llama3.2',
  });
}

// ──────────────────────────────────────────────
// SERVIDOR HTTP
// ──────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: PayloadQuestionario = await req.json();

    // 1. Validação de entrada
    if (!body.pesoKg || !body.alturaCm || !body.idade || !body.objetivo) {
      return new Response(
        JSON.stringify({ erro: 'Dados incompletos no questionário.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Cálculos determinísticos
    const tmb = calcularTMB(body.pesoKg, body.alturaCm, body.idade, body.sexo);
    const tdee = calcularTDEE(tmb, body.nivelAtividade);
    const caloriasAlvo = calcularCaloriasAlvo(tdee, body.objetivo);
    const macros = calcularMacros(caloriasAlvo, body.objetivo);
    const metaAguaMl = Math.round(body.pesoKg * 35);
    const numRefeicoes = body.numRefeicoes || 5;

    // 3. Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Seletor RAG
    const contextoRag = await selecionarContextoRAG(supabase, {
      equipamentos: body.equipamentos,
      nivelExperiencia: body.nivelExperiencia,
      restricoesAlimentares: body.restricoesAlimentares,
      objetivo: body.objetivo,
      objetivoNutricional: body.objetivo, // mesmo campo por ora
    });

    // 5. Montar prompts
    const promptSystem = montarPromptSystem(
      body.frequenciaSemanal,
      numRefeicoes,
      caloriasAlvo,
      macros
    );
    const promptUser = montarPromptUser(
      body,
      tmb,
      tdee,
      caloriasAlvo,
      macros,
      metaAguaMl,
      contextoRag
    );

    // 6. Chamar Llama + validação com 1 retry
    let planoGerado = await chamarLlama(promptSystem, promptUser);

    let resultado = validarPlanoGerado(planoGerado, {
      frequenciaSemanal: body.frequenciaSemanal,
      numRefeicoes,
      caloriasAlvo,
      proteinasAlvo: macros.proteinas,
      carboidratosAlvo: macros.carboidratos,
      gordurasAlvo: macros.gorduras,
      restricoesAlimentares: body.restricoesAlimentares,
      contextoRag,
    });

    // Retry se falhar validação
    if (!resultado.valido) {
      const mensagemCorrecao = gerarMensagemCorrecao(resultado);
      planoGerado = await chamarLlama(promptSystem, `${promptUser}\n\nCORREÇÕES NECESSÁRIAS:\n${mensagemCorrecao}`);

      resultado = validarPlanoGerado(planoGerado, {
        frequenciaSemanal: body.frequenciaSemanal,
        numRefeicoes,
        caloriasAlvo,
        proteinasAlvo: macros.proteinas,
        carboidratosAlvo: macros.carboidratos,
        gordurasAlvo: macros.gorduras,
        restricoesAlimentares: body.restricoesAlimentares,
        contextoRag,
      });

      if (!resultado.valido) {
        return new Response(
          JSON.stringify({
            erro: 'IA não conseguiu gerar plano válido após retry',
            detalhes: resultado.erros,
          }),
          {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 7. Extrair usuario_id do token JWT
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user } } = await supabaseAuth.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ erro: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 8. Persistir plano normalizado
    await persistirPlano(
      supabase,
      user.id,
      planoGerado,
      caloriasAlvo,
      macros,
      metaAguaMl
    );

    // 9. Retornar plano completo com resumo
    const resposta = {
      resumo: { tmb, tdee, caloriasAlvo, macros, metaAguaMl },
      ...planoGerado,
    };

    return new Response(JSON.stringify(resposta), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({ erro: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
