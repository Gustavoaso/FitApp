// ============================================================
// EDGE FUNCTION: gerar-plano
// ============================================================
// Função serverless hospedada na infraestrutura Edge do Supabase.
//
// FLUXO:
// 1. Recebe as respostas do questionário do cliente (mobile/web)
// 2. Valida os dados de entrada
// 3. Executa a lógica determinística de cálculo: TMB, TDEE, macros, água
// 4. Constrói um prompt detalhado e chama a Claude API (Anthropic)
// 5. Retorna o plano completo de treino e dieta em JSON estruturado
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS Headers para permitir requisições do mobile e web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface simplificada para payload do questionário
interface PayloadQuestionario {
  nome: string;
  idade: number;
  sexo: 'masculino' | 'feminino';
  pesoKg: number;
  alturaCm: number;
  objetivo: 'hipertrofia' | 'definicao' | 'forca' | 'emagrecimento' | 'condicionamento';
  nivelExperiencia: 'iniciante' | 'intermediario' | 'avancado';
  nivelAtividade: 'sedentario' | 'leve' | 'moderado' | 'ativo' | 'muito_ativo';
  frequenciaSemanal: number;
  restricoesAlimentares: string[];
  equipamentos: 'academia_completa' | 'home_gym' | 'peso_corporal';
}

// ──────────────────────────────────────────────
// CÁLCULOS DETERMINÍSTICOS (TMB & MACROS)
// ──────────────────────────────────────────────

function calcularTMB(pesoKg: number, alturaCm: number, idade: number, sexo: string): number {
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
    hipertrofia: 1.10,
    definicao: 0.85,
    forca: 1.05,
    emagrecimento: 0.80,
    condicionamento: 1.0,
  };
  return Math.round(tdee * (ajustes[objetivo] || 1.0));
}

function calcularMacros(calorias: number, objetivo: string) {
  const distrib: Record<string, { p: number; c: number; g: number }> = {
    hipertrofia: { p: 0.30, c: 0.45, g: 0.25 },
    definicao: { p: 0.35, c: 0.35, g: 0.30 },
    forca: { p: 0.30, c: 0.45, g: 0.25 },
    emagrecimento: { p: 0.35, c: 0.35, g: 0.30 },
    condicionamento: { p: 0.25, c: 0.50, g: 0.25 },
  };
  const d = distrib[objetivo] || distrib.condicionamento;
  return {
    proteinas: Math.round((calorias * d.p) / 4),
    carboidratos: Math.round((calorias * d.c) / 4),
    gorduras: Math.round((calorias * d.g) / 9),
  };
}

// ──────────────────────────────────────────────
// SERVIDOR HTTP DA EDGE FUNCTION
// ──────────────────────────────────────────────

serve(async (req: Request) => {
  // Trata requisição Preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: PayloadQuestionario = await req.json();

    // 1. Validações básicas
    if (!body.pesoKg || !body.alturaCm || !body.idade || !body.objetivo) {
      return new Response(
        JSON.stringify({ erro: 'Dados incompletos no questionário.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Executa fórmulas de nutrição
    const tmb = calcularTMB(body.pesoKg, body.alturaCm, body.idade, body.sexo);
    const tdee = calcularTDEE(tmb, body.nivelAtividade);
    const caloriasAlvo = calcularCaloriasAlvo(tdee, body.objetivo);
    const macros = calcularMacros(caloriasAlvo, body.objetivo);
    const metaAguaMl = Math.round(body.pesoKg * 35);

    // 3. Monta o Prompt para a API do Claude
    const promptSystem = `Você é um nutricionista esportivo e personal trainer especialista. 
Sua tarefa é montar um plano estruturado de treino semanal e plano alimentar diário personalizado em formato JSON estrito, sem markdown ao redor.`;

    const promptUser = `Gere o plano fitness completo para:
- Nome: ${body.nome}
- Idade: ${body.idade} anos, Sexo: ${body.sexo}
- Peso: ${body.pesoKg}kg, Altura: ${body.alturaCm}cm
- Objetivo: ${body.objetivo}
- Frequência de treino: ${body.frequenciaSemanal}x por semana
- Equipamentos disponíveis: ${body.equipamentos}
- Restrições alimentares: ${body.restricoesAlimentares.join(', ') || 'Nenhuma'}
- Meta Calórica Calculada: ${caloriasAlvo} kcal (Proteínas: ${macros.proteinas}g, Carbs: ${macros.carboidratos}g, Gorduras: ${macros.gorduras}g)

Formato JSON esperado de saída:
{
  "resumo": {
    "tmb": ${tmb},
    "tdee": ${tdee},
    "caloriasAlvo": ${caloriasAlvo},
    "macros": { "proteinas": ${macros.proteinas}, "carboidratos": ${macros.carboidratos}, "gorduras": ${macros.gorduras} },
    "metaAguaMl": ${metaAguaMl}
  },
  "treino": {
    "nomeDivisao": "string",
    "dias": [
      {
        "diaSemana": 1,
        "nome": "string",
        "exercicios": [
          { "nome": "string", "series": 4, "repeticoes": 12, "descansoSegundos": 60 }
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
          { "nome": "Ovos mexidos", "porcao": "3 unidades", "calorias": 210 }
        ]
      }
    ]
  }
}`;

    const apiKeyGemini = Deno.env.get('GEMINI_API_KEY');
    const apiKeyClaude = Deno.env.get('CLAUDE_API_KEY');

    let planoGerado;

    if (apiKeyGemini) {
      // Chamada real para a API do Google Gemini (Interactions API)
      const responseGemini = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/interactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKeyGemini,
          },
          body: JSON.stringify({
            model: 'gemini-3.5-flash',
            input: promptUser,
            system_instruction: promptSystem,
            response_format: {
              type: 'text',
              mime_type: 'application/json',
            },
          }),
        }
      );

      if (!responseGemini.ok) {
        const errTxt = await responseGemini.text();
        throw new Error(`HTTP ${responseGemini.status}: ${errTxt}`);
      }

      const resJson = await responseGemini.json();
      if (resJson.status !== 'completed') {
        throw new Error(`Interactions API respondeu com status ${resJson.status}`);
      }

      const modelStep = resJson.steps?.find((step: any) => step.type === 'model_output');
      const textContent = modelStep?.content?.find((item: any) => item.type === 'text');
      const rawText = textContent?.text || '{}';
      planoGerado = JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
    } else if (apiKeyClaude) {
      // Chamada fallback para a API Anthropic Claude se configurada
      const responseClaude = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKeyClaude,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          system: promptSystem,
          messages: [{ role: 'user', content: promptUser }],
        }),
      });

      const resJson = await responseClaude.json();
      const rawText = resJson.content?.[0]?.text || '{}';
      planoGerado = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
    } else {
      // Fallback determinístico seguro caso nenhuma chave de API esteja configurada
      planoGerado = {
        resumo: { tmb, tdee, caloriasAlvo, macros, metaAguaMl },
        treino: {
          nomeDivisao: `Divisão ${body.frequenciaSemanal}x — ${body.objetivo.toUpperCase()}`,
          dias: [
            {
              diaSemana: 1,
              nome: 'Treino A — Peito & Tríceps',
              exercicios: [
                { nome: 'Supino Reto com Barra', series: 4, repeticoes: 10, descansoSegundos: 90 },
                { nome: 'Supino Inclinado com Halteres', series: 3, repeticoes: 12, descansoSegundos: 60 },
                { nome: 'Tríceps Pulley com Corda', series: 4, repeticoes: 12, descansoSegundos: 60 }
              ]
            }
          ]
        },
        dieta: {
          refeicoes: [
            {
              nome: 'Café da Manhã',
              horario: '07:30',
              alimentos: [
                { nome: 'Ovos mexidos', porcao: '3 unidades (150g)', calorias: 219 },
                { nome: 'Pão de Forma Integral', porcao: '2 fatias (50g)', calorias: 126 }
              ]
            },
            {
              nome: 'Almoço',
              horario: '12:30',
              alimentos: [
                { nome: 'Peito de Frango Grelhado', porcao: '1 filé médio (150g)', calorias: 247 },
                { nome: 'Arroz Branco Cozido', porcao: '2 colheres de servir (100g)', calorias: 128 },
                { nome: 'Feijão Carioca Cozido', porcao: '1 concha (86g)', calorias: 65 }
              ]
            }
          ]
        }
      };
    }

    return new Response(JSON.stringify(planoGerado), {
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
