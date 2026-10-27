// ============================================================
// SERVIÇO: Alimentos da base TACO (leitura de base_alimentos)
// ============================================================
// A sincronização com a TacoAPI (RapidAPI) roda só fora do app: na Edge Function
// `sincronizar-bases` (chave em secret) ou num script local com `.env`.
// O app nunca carrega a chave de terceiro.
// ============================================================

import { supabase } from '@/compartilhado/supabase';

/**
 * Alimentos já sincronizados no banco, para o Inspetor de Dev.
 */
export async function obterDadosRawTacoAPI(): Promise<unknown[]> {
  const { data, error } = await supabase.from('base_alimentos').select('*').limit(1000);
  if (error) throw new Error('Não foi possível carregar os alimentos.');
  return data ?? [];
}

export async function buscarAlimentosParaPrompt(
  filtros: { restricoesAlimentares: string[]; objetivoPrincipal: string },
  limite: number = 50,
): Promise<string[]> {
  try {
    let query = supabase
      .from('base_alimentos')
      .select('id, nome, categoria, calorias_100g, proteinas_100g');

    if (filtros.restricoesAlimentares && filtros.restricoesAlimentares.length > 0) {
      const rest = filtros.restricoesAlimentares.map((r) => r.toLowerCase());

      if (rest.includes('vegetariano')) {
        query = query.not('categoria', 'in', '("Carnes", "Aves", "Pescados")');
      }

      if (rest.includes('vegano')) {
        query = query.not(
          'categoria',
          'in',
          '("Carnes", "Aves", "Pescados", "Ovos", "Leite e derivados")',
        );
      }

      if (rest.includes('lactose')) {
        query = query.neq('categoria', 'Leite e derivados');
      }
    }

    const { data, error } = await query.limit(limite);

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map(
      (a) => `[ID: ${a.id}] ${a.nome} (${a.categoria}) - ${a.calorias_100g} kcal/100g`,
    );
  } catch {
    return [];
  }
}
