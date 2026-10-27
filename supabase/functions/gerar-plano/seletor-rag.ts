// ============================================================
// SELETOR RAG (Retrieval-Augmented Generation)
// ============================================================
// Gera embedding da query via HuggingFace Inference API
// (mxbai-embed-large, 1024d — mesmo modelo da ingestão).
// Chama 3 RPCs Postgres pra busca vetorial e retorna contexto
// filtrado pelo perfil do usuário pra injetar no prompt.
// ============================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ConhecimentoRAG {
  id: number;
  tipo: string;
  titulo: string;
  fonte: string | null;
  conteudo: string;
  similaridade: number;
}

export interface ContextoRAG {
  exercicios: ExercicioRAG[];
  alimentos: AlimentoRAG[];
  conhecimento: ConhecimentoRAG[];
}

export interface ExercicioRAG {
  id: string;
  nome: string;
  grupo_primario: string;
  grupo_secundario: string | null;
  equipamento: string;
  nivel: string;
  tipo_movimento: string;
  padrao_series: object;
}

export interface AlimentoRAG {
  id: string;
  nome: string;
  categoria: string;
  calorias_100g: number;
  proteinas_100g: number;
  carboidratos_100g: number;
  gorduras_100g: number;
  porcao_descricao: string | null;
  porcao_gramas: number | null;
}

function equipamentosPorPreferencia(equipamentos: string): string[] {
  switch (equipamentos) {
    case 'academia_completa':
      return ['barra', 'halteres', 'cabo', 'maquina', 'peso_corporal', 'barra_fixa'];
    case 'home_gym':
      return ['barra', 'halteres', 'peso_corporal', 'barra_fixa'];
    case 'peso_corporal':
      return ['peso_corporal', 'barra_fixa'];
    default:
      return ['barra', 'halteres', 'cabo', 'maquina', 'peso_corporal', 'barra_fixa'];
  }
}

function niveisPermitidos(nivelExperiencia: string): string[] {
  switch (nivelExperiencia) {
    case 'iniciante':    return ['iniciante'];
    case 'intermediario': return ['iniciante', 'intermediario'];
    case 'avancado':    return ['iniciante', 'intermediario', 'avancado'];
    default:            return ['iniciante'];
  }
}

function categoriasExcluidas(restricoes: string[]): string[] {
  const mapa: Record<string, string[]> = {
    vegetariano: ['carnes', 'peixes_frutos_mar'],
    vegano:      ['carnes', 'peixes_frutos_mar', 'ovos_laticinios'],
    sem_lactose: ['ovos_laticinios'],
  };
  const excluidas = new Set<string>();
  for (const r of restricoes) {
    mapa[r]?.forEach((c) => excluidas.add(c));
  }
  return Array.from(excluidas);
}

/**
 * Gera embedding via HuggingFace Inference API.
 * Modelo: mixedbread-ai/mxbai-embed-large-v1 (1024d).
 * HF_TOKEN opcional — sem ele usa tier gratuito (rate-limited).
 */
async function gerarEmbedding(texto: string): Promise<number[]> {
  const hfToken = Deno.env.get('HF_TOKEN') ?? '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;

  const resp = await fetch(
    'https://api-inference.huggingface.co/models/mixedbread-ai/mxbai-embed-large-v1',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: texto }),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`HF embedding error ${resp.status}: ${err}`);
  }

  const json = await resp.json();
  // HF retorna array de arrays para batch; pega o primeiro
  return Array.isArray(json[0]) ? json[0] : json;
}

export async function selecionarContextoRAG(
  supabase: SupabaseClient,
  perfil: {
    equipamentos: string;
    nivelExperiencia: string;
    restricoesAlimentares: string[];
    objetivo: string;
    objetivoNutricional: string;
  }
): Promise<ContextoRAG> {
  const queryTreino = `Exercícios para objetivo: ${perfil.objetivo}. Nível: ${perfil.nivelExperiencia}. Equipamento: ${perfil.equipamentos}.`;
  const queryNutricao = `Alimentos para objetivo nutricional: ${perfil.objetivoNutricional}. Restrições: ${perfil.restricoesAlimentares.join(', ') || 'nenhuma'}.`;
  const queryConhecimento = `Diretrizes científicas para ${perfil.objetivo} nível ${perfil.nivelExperiencia}.`;

  const [embeddingTreino, embeddingNutricao, embeddingConhecimento] = await Promise.all([
    gerarEmbedding(queryTreino),
    gerarEmbedding(queryNutricao),
    gerarEmbedding(queryConhecimento),
  ]);

  const equipamentos = equipamentosPorPreferencia(perfil.equipamentos);
  const excluidas    = categoriasExcluidas(perfil.restricoesAlimentares);

  const [{ data: exercicios }, { data: alimentos }, { data: conhecimento }] = await Promise.all([
    supabase.rpc('buscar_exercicios_rag', {
      query_embedding:   embeddingTreino,
      filtro_equipamento: equipamentos,
      filtro_nivel:       niveisPermitidos(perfil.nivelExperiencia),
      limite:             20,
    }),
    supabase.rpc('buscar_alimentos_rag', {
      query_embedding:     embeddingNutricao,
      categorias_excluidas: excluidas.length > 0 ? excluidas : null,
      limite:              20,
    }),
    supabase.rpc('buscar_conhecimento_rag', {
      query_embedding: embeddingConhecimento,
      filtro_tipo:     null,
      limite:          3,
    }),
  ]);

  return {
    exercicios:  exercicios  ?? [],
    alimentos:   alimentos   ?? [],
    conhecimento: conhecimento ?? [],
  };
}