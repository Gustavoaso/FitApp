// ============================================================
// SERVIÇO: Geração de Planos com OpenRouter (Nemotron Ultra)
// (servicos/iaLocalServico.ts)
// ============================================================
// Arquitetura RAG manual:
//   1. Busca exercícios e alimentos reais do banco (filtrados)
//   2. Monta prompt com IDs reais — IA só escolhe, não inventa
//   3. Enrichment determinístico: macros calculados pelo app
// ============================================================

import { calcularTudo } from '@fitapp/utilidades';
import type { PlanoIAGerado, ObjetivoTreino, NivelAtividade, SexoBiologico } from '@fitapp/tipos';
import { supabase } from './supabase';
import { validarPlanoIA, sanitizarPlanoIA } from './validadorPlanoIA';

// Groq: hardware LPU customizado — inferência em ~2-3s, free tier generoso, sem fila
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';
const MODELO = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 60_000; // 1 minuto (Groq é muito mais rápido)

// ============================================================
// INTERFACES PÚBLICAS
// ============================================================

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

// ============================================================
// TIPOS INTERNOS
// ============================================================

interface ExercicioBase {
  id: string;
  nome: string;
  grupo_primario: string;
  equipamento: string | null;
}

interface AlimentoBase {
  id: number;
  nome: string;
  calorias_100g: number;
  proteinas_100g: number;
  carboidratos_100g: number;
  gorduras_100g: number;
  porcao_gramas: number | null;
}

interface RespostaIA {
  treino: {
    nomeDivisao: string;
    dias: Array<{
      diaSemana: number;
      nome: string;
      tipo: 'treino' | 'descanso';
      exercicios: Array<{
        id: string;
        series: number;
        repeticoes: string | number;
        descansoSegundos: number;
      }>;
    }>;
  };
  dieta: {
    refeicoes: Array<{
      nome: string;
      horario: string;
      alimentos: Array<{ id: number; porcaoGramas: number }>;
    }>;
  };
  comentarios?: string[];
}

interface EstruturaDivisao {
  nomeDivisao: string;
  descricaoRegra: string;
  exemploDias: Array<{ diaSemana: number; tipo: 'treino' | 'descanso'; nome: string }>;
}

// ============================================================
// ESTRUTURA DA DIVISÃO (determina distribuição dos dias)
// ============================================================

function obterEstruturaDivisao(divisaoPref: string, diasSemana: number): EstruturaDivisao {
  const nDias = Math.max(1, Math.min(7, Number(diasSemana) || 5));

  if (nDias <= 2) {
    return {
      nomeDivisao: 'Full Body',
      descricaoRegra: 'Cada dia treina o corpo inteiro com exercícios compostos.',
      exemploDias: [
        { diaSemana: 0, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 1, tipo: 'treino', nome: 'Full Body A - Corpo Inteiro' },
        { diaSemana: 2, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 3, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 4, tipo: 'treino', nome: 'Full Body B - Corpo Inteiro' },
        { diaSemana: 5, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 6, tipo: 'descanso', nome: 'Descanso' },
      ],
    };
  }

  if (nDias === 3) {
    return {
      nomeDivisao: 'Push/Pull/Legs',
      descricaoRegra: 'Push: Peito, Ombros, Tríceps | Pull: Costas, Bíceps | Legs: Pernas completas.',
      exemploDias: [
        { diaSemana: 0, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 1, tipo: 'treino', nome: 'Push - Peito, Ombros e Tríceps' },
        { diaSemana: 2, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 3, tipo: 'treino', nome: 'Pull - Costas, Bíceps e Trapézio' },
        { diaSemana: 4, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 5, tipo: 'treino', nome: 'Legs - Pernas Completas e Panturrilha' },
        { diaSemana: 6, tipo: 'descanso', nome: 'Descanso' },
      ],
    };
  }

  if (nDias === 4) {
    return {
      nomeDivisao: 'Upper/Lower',
      descricaoRegra: 'Upper: Peito, Costas, Ombros, Braços | Lower: Quadríceps, Posterior, Glúteos, Panturrilha.',
      exemploDias: [
        { diaSemana: 0, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 1, tipo: 'treino', nome: 'Upper A - Superiores (Peito, Costas, Braços)' },
        { diaSemana: 2, tipo: 'treino', nome: 'Lower A - Inferiores (Quadríceps, Panturrilha)' },
        { diaSemana: 3, tipo: 'descanso', nome: 'Descanso' },
        { diaSemana: 4, tipo: 'treino', nome: 'Upper B - Superiores (Costas, Ombros, Braços)' },
        { diaSemana: 5, tipo: 'treino', nome: 'Lower B - Inferiores (Posterior, Glúteos, Panturrilha)' },
        { diaSemana: 6, tipo: 'descanso', nome: 'Descanso' },
      ],
    };
  }

  // 5 dias (Segunda a Sexta treino, Sábado e Domingo descanso)
  return {
    nomeDivisao: 'Push/Pull/Legs/Upper/Lower',
    descricaoRegra: '5 dias de treino de segunda a sexta: Push, Pull, Legs, Upper, Lower.',
    exemploDias: [
      { diaSemana: 0, tipo: 'descanso', nome: 'Descanso' },
      { diaSemana: 1, tipo: 'treino', nome: 'Push - Peito, Ombros e Tríceps' },
      { diaSemana: 2, tipo: 'treino', nome: 'Pull - Costas, Bíceps e Trapézio' },
      { diaSemana: 3, tipo: 'treino', nome: 'Legs - Pernas Completas e Panturrilha' },
      { diaSemana: 4, tipo: 'treino', nome: 'Upper - Superiores' },
      { diaSemana: 5, tipo: 'treino', nome: 'Lower - Inferiores' },
      { diaSemana: 6, tipo: 'descanso', nome: 'Descanso' },
    ],
  };
}

// ============================================================
// GRUPOS MUSCULARES POR SPLIT (para filtrar exercícios no banco)
// ============================================================

function obterGruposDaSplit(nomeDivisao: string): string[] {
  if (nomeDivisao === 'Full Body') {
    return ['quadriceps', 'peito', 'dorsais', 'ombros', 'biceps', 'triceps',
      'isquiotibiais', 'gluteos', 'panturrilhas', 'abdominais', 'meio-das-costas'];
  }
  return ['peito', 'ombros', 'triceps', 'dorsais', 'biceps', 'trapezio',
    'meio-das-costas', 'quadriceps', 'isquiotibiais', 'gluteos', 'panturrilhas'];
}

// ============================================================
// BUSCA DE DADOS DO BANCO (RAG manual balanceado)
// ============================================================

async function buscarDadosParaPrompt(
  grupos: string[],
): Promise<{ exercicios: ExercicioBase[]; alimentos: AlimentoBase[] }> {
  // Busca balanceada: 4 exercícios por grupamento muscular para garantir opções variadas
  const promisesEx = grupos.map(grupo =>
    supabase
      .from('base_exercicios')
      .select('id, nome, grupo_primario, equipamento')
      .eq('grupo_primario', grupo)
      .limit(4)
  );

  const [resultadosEx, { data: alimentos }] = await Promise.all([
    Promise.all(promisesEx),
    supabase
      .from('base_alimentos')
      .select('id, nome, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, porcao_gramas')
      .eq('is_curado', true)
      .limit(30),
  ]);

  const exercicios = resultadosEx.flatMap(r => (r.data ?? []) as ExercicioBase[]);

  return {
    exercicios,
    alimentos: (alimentos ?? []) as AlimentoBase[],
  };
}

// ============================================================
// MONTAGEM DO PROMPT
// ============================================================

function nomeDiaSemana(dia: number): string {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dia] ?? 'Dia';
}

function montarPrompt(
  dados: DadosQuestionario,
  calculo: ReturnType<typeof calcularTudo>,
  estrutura: EstruturaDivisao,
  exercicios: ExercicioBase[],
  alimentos: AlimentoBase[],
): { system: string; user: string } {
  const qtdRefeicoes = Math.max(2, dados.dieta.refeicoes_por_dia || 4);
  const restricoesTexto = dados.dieta.restricao_alimentar.length > 0
    ? dados.dieta.restricao_alimentar.join(', ')
    : 'Nenhuma';
  const restricoesFisicasTexto = dados.treino.restricao_fisica.length > 0
    ? dados.treino.restricao_fisica.join(', ')
    : 'Nenhuma';

  // Exercícios compactados (só campos essenciais)
  const listaExercicios = exercicios.map(ex => ({
    i: ex.id,
    n: ex.nome,
    g: ex.grupo_primario,
    e: ex.equipamento ?? 'livre',
  }));

  // Alimentos compactados
  const listaAlimentos = alimentos.map(a => ({
    i: a.id,
    n: a.nome,
    k: Math.round(Number(a.calorias_100g)),
    p: Math.round(Number(a.proteinas_100g) * 10) / 10,
    c: Math.round(Number(a.carboidratos_100g) * 10) / 10,
    g: Math.round(Number(a.gorduras_100g) * 10) / 10,
    pg: a.porcao_gramas ?? 100,
  }));

  const estruturaDias = estrutura.exemploDias
    .map(d => `  Dia ${d.diaSemana} (${nomeDiaSemana(d.diaSemana)}): ${d.tipo === 'descanso' ? 'DESCANSO' : d.nome}`)
    .join('\n');

  const system = `Você é um treinador de musculação e nutricionista esportivo especialista. Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON. Idioma obrigatório: Português do Brasil.`;

  const user = `PERFIL DO ATLETA:
Nome:${dados.perfil.nome}|Idade:${dados.perfil.idade}|Sexo:${dados.perfil.sexo_biologico}|Peso:${dados.perfil.peso_atual}kg|Altura:${dados.perfil.altura}cm
Objetivo:${dados.objetivo.objetivo_principal}|Nível:${dados.objetivo.nivel_experiencia}
Calorias:${calculo.caloriasAlvo}kcal|Prot:${calculo.macros.proteinas}g|Carb:${calculo.macros.carboidratos}g|Gord:${calculo.macros.gorduras}g
Restrições alimentares:${restricoesTexto}|Restrições físicas:${restricoesFisicasTexto}
Refeições/dia:${qtdRefeicoes}|Divisão:${estrutura.nomeDivisao}

CALENDÁRIO SEMANAL:
${estruturaDias}

BANCO DE EXERCÍCIOS (i=id, n=nome, g=grupo, e=equipamento):
${JSON.stringify(listaExercicios)}

BANCO DE ALIMENTOS (i=id, n=nome, k=kcal/100g, p=prot, c=carb, g=gord, pg=porção_g):
${JSON.stringify(listaAlimentos)}

BOAS PRÁTICAS E REGRAS DE PRESCRIÇÃO:
1. QUANTIDADE DE EXERCÍCIOS: Cada dia de treino DEVE conter OBRIGATORIAMENTE entre 5 e 7 exercícios (nunca prescrever apenas 3).
2. DISTRIBUIÇÃO ANATÔMICA:
   - Push: 2-3 Peito + 1-2 Ombros (deltoides) + 1-2 Tríceps (Total: 5 a 6 exercícios).
   - Pull: 2-3 Costas/Dorsais + 1 Trapézio/Posterior + 1-2 Bíceps (Total: 5 a 6 exercícios).
   - Legs: 2 Quadríceps + 2 Posterior/Glúteos + 1-2 Panturrilhas (Total: 5 a 6 exercícios).
   - Upper: 2 Peito + 2 Costas + 1 Ombro + 1 Bíceps + 1 Tríceps (Total: 6 a 7 exercícios).
   - Lower: 2 Quadríceps + 2 Posterior de coxa + 1 Glúteos + 1 Panturrilha (Total: 6 exercícios).
3. DIAS DE DESCANSO: Sábado (diaSemana 6) e Domingo (diaSemana 0) são SEMPRE descanso com exercicios: [].
4. IDs: Use apenas os valores do campo "i" fornecidos.

RETORNE EXATAMENTE ESTE FORMATO JSON:
{
  "treino": {
    "nomeDivisao": "${estrutura.nomeDivisao}",
    "dias": [
      ${estrutura.exemploDias.map(d => d.tipo === 'descanso' 
        ? `{"diaSemana": ${d.diaSemana}, "nome": "Descanso", "tipo": "descanso", "exercicios": []}` 
        : `{"diaSemana": ${d.diaSemana}, "nome": "${d.nome}", "tipo": "treino", "exercicios": [
          {"id": "ex_id_1", "series": 4, "repeticoes": "8-10", "descansoSegundos": 90},
          {"id": "ex_id_2", "series": 3, "repeticoes": "10-12", "descansoSegundos": 60},
          {"id": "ex_id_3", "series": 3, "repeticoes": "10-12", "descansoSegundos": 60},
          {"id": "ex_id_4", "series": 3, "repeticoes": "12-15", "descansoSegundos": 60},
          {"id": "ex_id_5", "series": 3, "repeticoes": "12-15", "descansoSegundos": 60},
          {"id": "ex_id_6", "series": 3, "repeticoes": "12-15", "descansoSegundos": 45}
        ]}`).join(',\n      ')}
    ]
  },
  "dieta": {
    "refeicoes": Array.from({ length: qtdRefeicoes }, (_, idx) => ({ nome: \`Refeição \${idx + 1}\`, horario: "07:00", alimentos: [{ id: 123, porcaoGramas: 150 }] }))
  },
  "comentarios": ["Planejamento periodizado completo com 5 a 7 exercícios por dia."]
}
`;

  return { system, user };
}

// ============================================================
// CHAMADA AO OPENROUTER
// ============================================================

async function chamarGroq(system: string, user: string): Promise<RespostaIA> {
  if (!GROQ_KEY) {
    throw new Error('EXPO_PUBLIC_GROQ_KEY não configurada. Crie em: console.groq.com (gratuito, sem cartão)');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.1,
        max_tokens: 3500,
      }),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const erro = await response.text().catch(() => response.statusText);
    throw new Error(`Groq erro ${response.status}: ${erro}`);
  }

  const data = await response.json();
  const conteudo: string = data?.choices?.[0]?.message?.content ?? '';

  if (!conteudo) throw new Error('OpenRouter retornou conteúdo vazio.');

  // Remove markdown code blocks se o modelo envolver em ```json ... ```
  const semMarkdown = conteudo.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(semMarkdown) as RespostaIA;
  } catch {
    throw new Error(`JSON inválido retornado pelo modelo:\n${conteudo.slice(0, 300)}`);
  }
}

// ============================================================
// ENRICHMENT DETERMINÍSTICO
// Substitui dados alucinados da IA por dados reais do banco
// ============================================================

function enriquecerPlano(
  resposta: RespostaIA,
  exerciciosDB: ExercicioBase[],
  alimentosDB: AlimentoBase[],
  calculo: ReturnType<typeof calcularTudo>,
): PlanoIAGerado {
  const exMap = new Map(exerciciosDB.map(e => [e.id, e]));
  const alMap = new Map(alimentosDB.map(a => [a.id, a]));

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
      nomeDivisao: resposta.treino.nomeDivisao,
      dias: resposta.treino.dias.map(dia => {
        const eDescanso = dia.tipo === 'descanso'
          || String(dia.nome).toLowerCase().includes('descanso');
        return {
          diaSemana: Number(dia.diaSemana),
          nome: eDescanso ? 'Descanso' : dia.nome,
          tipo: eDescanso ? 'descanso' : 'treino',
          exercicios: eDescanso ? [] : (dia.exercicios ?? []).map(ex => {
            const banco = exMap.get(String(ex.id));
            return {
              exercicioId: String(ex.id),
              nome: banco?.nome ?? `Exercício ${String(ex.id).slice(0, 8)}`,
              series: Number(ex.series) || 3,
              repeticoes: ex.repeticoes ?? '10',
              descansoSegundos: Number(ex.descansoSegundos) || 60,
              grupoMuscular: banco?.grupo_primario,
            };
          }),
        };
      }),
    },
    dieta: {
      refeicoes: resposta.dieta.refeicoes.map(ref => ({
        nome: ref.nome,
        horario: ref.horario ?? '12:00',
        alimentos: (ref.alimentos ?? []).map(a => {
          const banco = alMap.get(Number(a.id));
          const porcao = Math.max(1, Number(a.porcaoGramas) || 100);
          const fator = porcao / 100;
          return {
            alimentoId: String(a.id),
            nome: banco?.nome ?? `Alimento ${a.id}`,
            porcao: `${porcao}g`,
            calorias: Math.round((Number(banco?.calorias_100g) || 0) * fator),
            proteinas: Math.round((Number(banco?.proteinas_100g) || 0) * fator * 10) / 10,
            carboidratos: Math.round((Number(banco?.carboidratos_100g) || 0) * fator * 10) / 10,
            gorduras: Math.round((Number(banco?.gorduras_100g) || 0) * fator * 10) / 10,
          };
        }),
      })),
    },
    comentarios: Array.isArray(resposta.comentarios)
      ? resposta.comentarios.map(c => String(c))
      : undefined,
  };
}

// ============================================================
// HELPERS DE MAPEAMENTO
// ============================================================

function mapearSexo(s: string): SexoBiologico {
  return s.toLowerCase().includes('feminino') ? 'feminino' : 'masculino';
}

function mapearNivelAtividade(a: string): NivelAtividade {
  const t = a.toLowerCase();
  if (t.includes('sedent')) return 'sedentario';
  if (t.includes('leve')) return 'leve';
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

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

export async function gerarPlanoComIALocal(dados: DadosQuestionario): Promise<PlanoIAGerado> {
  const peso = Math.max(1, Number(dados.perfil?.peso_atual) || 70);
  const altura = Math.max(1, Number(dados.perfil?.altura) || 170);
  const idade = Math.max(1, Number(dados.perfil?.idade) || 30);
  const diasTreino = Math.max(1, Math.min(7, Number(dados.treino.dias_disponiveis_semana) || 4));

  const calculo = calcularTudo(
    peso, altura, idade,
    mapearSexo(dados.perfil.sexo_biologico),
    mapearNivelAtividade(dados.objetivo.atividade_fora_treino),
    mapearObjetivo(dados.objetivo.objetivo_principal),
  );

  const estrutura = obterEstruturaDivisao(dados.treino.divisao_preferida, diasTreino);
  const grupos = obterGruposDaSplit(estrutura.nomeDivisao);

  // 1. RAG: buscar dados reais do banco
  const { exercicios, alimentos } = await buscarDadosParaPrompt(grupos);

  if (exercicios.length === 0) throw new Error('Nenhum exercício encontrado para este split.');
  if (alimentos.length === 0) throw new Error('Nenhum alimento disponível na base curada.');

  // 2. Montar prompt com IDs reais
  const { system, user } = montarPrompt(dados, calculo, estrutura, exercicios, alimentos);

  console.log('\n=== PROMPT → IA (Groq / ' + MODELO + ') ===');
  console.log('[SYSTEM]', system);
  console.log('[USER]', user.slice(0, 500), '...');
  console.log('=========================================\n');

  // 3. Chamar Groq
  const respostaIA = await chamarGroq(system, user);

  // 4. Enrichment determinístico (macros reais do banco, não da IA)
  const planoCompleto = enriquecerPlano(respostaIA, exercicios, alimentos, calculo);

  // 5. Validar estrutura final
  const validacao = validarPlanoIA(planoCompleto);
  if (!validacao.valido) {
    throw new Error(`Plano inválido após enrichment: ${validacao.erros.join('; ')}`);
  }

  const plano = sanitizarPlanoIA(planoCompleto)!;
  await persistirPlanoNoBanco(dados, plano);
  return plano;
}

// ============================================================
// PERSISTÊNCIA
// ============================================================

async function persistirPlanoNoBanco(
  dados: DadosQuestionario,
  plano: PlanoIAGerado,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    await supabase.from('planos_ia_gerados').insert([{
      usuario_id: user.id,
      respostas_questionario: dados,
      plano_gerado: plano,
      modelo_ia: MODELO,
    }]);

    console.log('✅ Plano persistido no Supabase.');
  } catch (erro) {
    console.error('❌ Erro ao persistir plano:', erro);
  }
}
