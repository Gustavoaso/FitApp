// ============================================================
// EDGE FUNCTION: gerar-plano
// ============================================================
// Liga o handler ao Supabase e à Groq. GROQ_API_KEY só existe aqui
// (secret da function), nunca no app. O embedding é o gte-small da IA
// embutida do edge-runtime (sem chave nem custo).
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { criarHandler } from './handler.ts';
import { criarClienteGroq } from './groq.ts';

declare const Supabase: {
  ai: {
    Session: new (modelo: string) => {
      run(texto: string, opcoes: { mean_pool: boolean; normalize: boolean }): Promise<number[]>;
    };
  };
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

const modeloEmbedding = new Supabase.ai.Session('gte-small');

/** Cliente com o JWT da pessoa: o RLS e as RPCs enxergam só o que ela vê. */
function comJwt(jwt: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// PREMISSA: mesmos limites de candidatos do app antes (30 por grupo, 20 por slot).
const POR_GRUPO_BANCO = 30;
const POR_SLOT_BANCO = 20;

Deno.serve(
  criarHandler({
    autenticar: async (jwt) => {
      const { data, error } = await comJwt(jwt).auth.getUser(jwt);
      return !error && !!data.user;
    },
    geracoesHoje: async (jwt) => {
      const { data, error } = await comJwt(jwt).rpc('geracoes_hoje');
      if (error) throw error;
      return Number(data);
    },
    buscar: async (jwt, c) => {
      const restricoes = c.restricoes.length > 0 ? `, ${c.restricoes.join(', ')}` : '';
      const vetor = await modeloEmbedding.run(
        `treino e dieta para ${c.objetivo}, nível ${c.nivel}${restricoes}`,
        { mean_pool: true, normalize: true },
      );
      const query_embedding = JSON.stringify(Array.from(vetor));
      const banco = comJwt(jwt);
      const [ex, al, tr] = await Promise.all([
        banco.rpc('buscar_exercicios_rag', {
          query_embedding,
          filtro_equipamento: c.filtroEquipamento,
          limite_por_grupo: POR_GRUPO_BANCO,
        }),
        banco.rpc('buscar_alimentos_rag', {
          query_embedding,
          termos_excluidos: c.termosExcluidos,
          termos_proteina: c.termosProteina,
          limite_por_slot: POR_SLOT_BANCO,
        }),
        banco.rpc('buscar_conhecimento_rag', {
          query_embedding,
          filtro_objetivo: c.objetivo,
          filtro_nivel: c.nivel,
          limite: 3,
        }),
      ]);
      if (ex.error) throw ex.error;
      if (al.error) throw al.error;
      if (tr.error) throw tr.error;
      return { exercicios: ex.data ?? [], alimentos: al.data ?? [], trechos: tr.data ?? [] };
    },
    carregarTextos: async (jwt, ids) => {
      const banco = comJwt(jwt);
      const [ex, al, tr] = await Promise.all([
        banco.from('base_exercicios').select('id, nome').in('id', ids.exercicios),
        banco.from('base_alimentos').select('id, nome').in('id', ids.alimentos.map(Number)),
        banco.from('base_conhecimento').select('id, conteudo').in('id', ids.trechos),
      ]);
      if (ex.error) throw ex.error;
      if (al.error) throw al.error;
      if (tr.error) throw tr.error;
      return { exercicios: ex.data ?? [], alimentos: al.data ?? [], trechos: tr.data ?? [] };
    },
    perguntar: criarClienteGroq(GROQ_API_KEY),
  }),
);
