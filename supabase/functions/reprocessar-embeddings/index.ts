// ============================================================
// EDGE FUNCTION: reprocessar-embeddings
// ============================================================
// Liga o handler ao banco (service_role, só aqui) e ao gte-small da IA
// embutida. Os textos seguem o formato dos embeddings antigos.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { criarHandler, type Contagem } from './handler.ts';

declare const Supabase: {
  ai: {
    Session: new (modelo: string) => {
      run(texto: string, opcoes: { mean_pool: boolean; normalize: boolean }): Promise<number[]>;
    };
  };
};

const REPROCESSAR_SEGREDO = Deno.env.get('REPROCESSAR_SEGREDO') ?? '';
// Poucas linhas por chamada: cada embedding gasta CPU e a function tem limite de CPU por requisição.
const LOTE = 5;

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const modelo = new Supabase.ai.Session('gte-small');

type Linha = Record<string, unknown> & { id: number | string };

const TABELAS = {
  base_exercicios: {
    colunas: 'id, nome, grupo_primario, equipamento, nivel',
    texto: (e: Linha) =>
      `Exercício: ${e.nome}. Grupo Muscular: ${e.grupo_primario}. Equipamento: ${e.equipamento}. Nível: ${e.nivel}.`,
  },
  base_alimentos: {
    colunas: 'id, nome, marca, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g',
    texto: (a: Linha) =>
      `Alimento: ${a.nome}. Marca: ${a.marca ?? 'None'}. Calorias: ${a.calorias_100g}kcal/100g. Proteínas: ${a.proteinas_100g}g. Carboidratos: ${a.carboidratos_100g}g. Gorduras: ${a.gorduras_100g}g.`,
  },
  base_conhecimento: {
    colunas: 'id, titulo, conteudo',
    texto: (t: Linha) => `${t.titulo}\n${t.conteudo}`,
  },
} as const;

async function reprocessarTabela(tabela: keyof typeof TABELAS): Promise<Contagem> {
  const { colunas, texto } = TABELAS[tabela];
  const { data, error } = await admin
    .from(tabela)
    .select(colunas)
    .is('embedding_384', null)
    .order('id')
    .limit(LOTE);
  if (error) throw error;
  const linhas = (data ?? []) as unknown as Linha[];
  for (const linha of linhas) {
    const vetor = await modelo.run(texto(linha), { mean_pool: true, normalize: true });
    const { error: erroGravar } = await admin
      .from(tabela)
      .update({ embedding_384: JSON.stringify(Array.from(vetor)) })
      .eq('id', linha.id);
    if (erroGravar) throw erroGravar;
  }
  const { count, error: erroContar } = await admin
    .from(tabela)
    .select('id', { count: 'exact', head: true })
    .is('embedding_384', null);
  if (erroContar) throw erroContar;
  return { gravados: linhas.length, restantes: count ?? 0 };
}

Deno.serve(
  criarHandler(REPROCESSAR_SEGREDO, async () => ({
    base_exercicios: await reprocessarTabela('base_exercicios'),
    base_alimentos: await reprocessarTabela('base_alimentos'),
    base_conhecimento: await reprocessarTabela('base_conhecimento'),
  })),
);
