// ============================================================
// SERVIÇO: IA Local (Ollama + Llama 3.2 3B) — Geração de Planos
// (servicos/iaLocalServico.ts)
// ============================================================
// Serviço client-side que chama a API REST do Ollama localmente
// para gerar planos personalizados de treino e dieta com o Llama 3.2.
// ============================================================

import { calcularTudo } from '@fitapp/utilidades';
import type { PlanoIAGerado, ObjetivoTreino, NivelAtividade, SexoBiologico } from '@fitapp/tipos';
import { supabase } from './supabase';
import { validarPlanoIA, sanitizarPlanoIA } from './validadorPlanoIA';

const OLLAMA_BASE_URL = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
const MODELO_PADRAO = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'fitapp-expert';
const MAX_TENTATIVAS = 2;

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

DADOS CALCULADOS DETERMINISTICAMENTE:
- TMB: ${calculo.tmb} kcal
PERFIL DO USUÁRIO:
- Nome: ${dados.perfil.nome}
- Idade: ${dados.perfil.idade} anos | Sexo: ${dados.perfil.sexo_biologico}
- Peso: ${dados.perfil.peso_atual}kg | Altura: ${dados.perfil.altura}cm
- Objetivo: ${dados.objetivo.objetivo_principal}
- Nível de Experiência: ${dados.objetivo.nivel_experiencia}
- Frequência de Treino: ${dados.treino.dias_disponiveis_semana}x na semana
- Tempo Disponível por Sessão: ${dados.treino.tempo_sessao}
- Local do Treino: ${dados.treino.local_treino}
- Divisão de Treino Preferida: ${dados.treino.divisao_preferida} (se "deixar a IA decidir", escolher a divisão mais adequada com base em Frequência e Tempo Disponível)
- Restrições Físicas/Lesões: ${restricoesFisicasTexto}
- Restrições Alimentares: ${restricoesTexto}
- Quantidade de refeições por dia OBRIGATÓRIA: ${qtdRefeicoes} (Gere exatamente ${qtdRefeicoes} refeições distintas no JSON)

ESTRUTURA JSON EXIGIDA (retorne apenas este JSON com exatamente ${qtdRefeicoes} refeições):
{
  "treino": {
    "nomeDivisao": "ABC",
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
        "horario": "08:00",
        "alimentos": [
          {
            "nome": "Ovos mexidos",
            "porcao": "100g",
            "calorias": 150,
            "proteinas": 20,
            "carboidratos": 10,
            "gorduras": 3
          }
        ]
      },
      {
        "nome": "Almoço",
        "horario": "13:00",
        "alimentos": [
          {
            "nome": "Frango grelhado",
            "porcao": "100g",
            "calorias": 150,
            "proteinas": 20,
            "carboidratos": 10,
            "gorduras": 3
          }
        ]
      }
    ]
  },
  "comentarios": ["Comentário explicativo"]
}`;
}

async function chamarOllamaAPI(promptUsuario: string): Promise<unknown> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;

  let erroUltimo: Error | null = null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODELO_PADRAO,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.0,
            num_predict: -1,
            num_ctx: 4096
          },
          messages: [
            { role: 'user', content: promptUsuario },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const conteudo = data?.message?.content;

      if (!conteudo) {
        throw new Error('Ollama respondeu mas o conteúdo da mensagem veio vazio.');
      }

      // Tenta parsear o JSON retornado pelo Llama 3.2
      const jsonParsed = typeof conteudo === 'string' ? JSON.parse(conteudo) : conteudo;
      return jsonParsed;
    } catch (erro) {
      erroUltimo = erro instanceof Error ? erro : new Error(String(erro));
      console.warn(`⚠️ Ollama: Tentativa ${tentativa}/${MAX_TENTATIVAS} falhou:`, erroUltimo.message);
    }
  }

  throw new Error(`Ollama API falhou após ${MAX_TENTATIVAS} tentativas: ${erroUltimo?.message}`);
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

export async function gerarPlanoComIALocal(dados: DadosQuestionario): Promise<PlanoIAGerado> {
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

  const promptUsuario = montarPromptUsuario(dados, calculo);
  
  console.log('\n\n=================================================');
  console.log(' PROMPT ENVIADO AO OLLAMA (COPIE TUDO ABAIXO):');
  console.log('=================================================');
  console.log(promptUsuario);
  console.log('=================================================\n\n');

  const respostaRaw = await chamarOllamaAPI(promptUsuario);

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

  const validacao = validarPlanoIA(respostaRaw);

  if (!validacao.valido) {
    throw new Error(`Resposta do Llama 3.2 local inválida: ${validacao.erros.join('; ')}`);
  }

  const plano = sanitizarPlanoIA(respostaRaw)!;
  await persistirPlanoNoBanco(dados, plano);
  return plano;
}

async function persistirPlanoNoBanco(
  dados: DadosQuestionario,
  plano: PlanoIAGerado,
): Promise<void> {
  try {
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) return;

    await supabase.from('planos_ia_gerados').insert([{
      usuario_id: userId,
      respostas_questionario: dados,
      plano_gerado: plano,
      modelo_ia: `ollama-${MODELO_PADRAO}`,
    }]);
    console.log('✅ Plano gerado pelo Llama 3.2 local persistido no Supabase.');
  } catch (erro) {
    console.error('❌ Erro ao persistir plano no Supabase:', erro);
  }
}
