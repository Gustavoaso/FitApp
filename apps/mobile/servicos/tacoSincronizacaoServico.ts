// ============================================================
// SERVIÇO: Sincronização TacoAPI → base_alimentos
// (servicos/tacoSincronizacaoServico.ts)
// ============================================================
// Sincroniza dados nutricionais da Tabela TACO brasileira (TacoAPI)
// e armazena na tabela base_alimentos no Supabase.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CHAVE_ULTIMA_SYNC_TACO = '@fitapp_sync_taco_timestamp';
const INTERVALO_SYNC_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// URLs oficiais da TacoAPI
const TACO_ENDPOINTS = [
  'https://taco.codivatech.com/api/v1/alimentos',
  'https://taco-api.onrender.com/api/v1/alimentos',
  'https://taco-api-2.onrender.com/api/v1/food',
];

interface AlimentoTaco {
  id?: string | number;
  id_taco?: string | number;
  food_id?: string | number;
  nome?: string;
  name?: string;
  description?: string;
  descricao?: string;
  categoria?: string;
  category?: string;
  calorias?: number;
  energy_kcal?: number;
  energy?: number;
  kcal?: number;
  proteinas?: number;
  protein_g?: number;
  protein?: number;
  carboidratos?: number;
  carbohydrate_g?: number;
  carbohydrate?: number;
  gorduras?: number;
  lipid_g?: number;
  lipid?: number;
  fibras?: number;
  fiber_g?: number;
  [chave: string]: unknown;
}

// Dataset fallback oficial da Tabela TACO para garantir funcionamento offline/sem chave
const BASE_TACO_NATIVA: AlimentoTaco[] = [
  { id: 1, nome: 'Arroz Branco Cozido', categoria: 'Cereais', calorias: 128, proteinas: 2.5, carboidratos: 28.1, gorduras: 0.2, fibras: 1.6 },
  { id: 2, nome: 'Feijão Carioca Cozido', categoria: 'Leguminosas', calorias: 76, proteinas: 4.8, carboidratos: 13.6, gorduras: 0.5, fibras: 8.5 },
  { id: 3, nome: 'Peito de Frango Grelhado', categoria: 'Carnes', calorias: 165, proteinas: 31.0, carboidratos: 0, gorduras: 3.6, fibras: 0 },
  { id: 4, nome: 'Ovo de Galinha Cozido', categoria: 'Ovos', calorias: 146, proteinas: 13.3, carboidratos: 0.6, gorduras: 9.5, fibras: 0 },
  { id: 5, nome: 'Pão de Forma Integral', categoria: 'Cereais', calorias: 253, proteinas: 9.4, carboidratos: 49.9, gorduras: 3.7, fibras: 6.9 },
  { id: 6, nome: 'Banana Prata', categoria: 'Frutas', calorias: 98, proteinas: 1.3, carboidratos: 26.0, gorduras: 0.1, fibras: 2.0 },
  { id: 7, nome: 'Batata Doce Cozida', categoria: 'Tubérculos', calorias: 77, proteinas: 0.6, carboidratos: 18.4, gorduras: 0.1, fibras: 2.2 },
  { id: 8, nome: 'Aveia em Flocos', categoria: 'Cereais', calorias: 394, proteinas: 13.9, carboidratos: 66.6, gorduras: 8.5, fibras: 9.1 },
  { id: 9, nome: 'Tapioca / Goma de Mandioca', categoria: 'Tubérculos', calorias: 242, proteinas: 0.2, carboidratos: 60.0, gorduras: 0.1, fibras: 0.5 },
  { id: 10, nome: 'Azeite de Oliva Extra Virgem', categoria: 'Óleos e Gorduras', calorias: 884, proteinas: 0, carboidratos: 0, gorduras: 100.0, fibras: 0 },
  { id: 11, nome: 'Carne Moída Patinho Grelhada', categoria: 'Carnes', calorias: 219, proteinas: 35.9, carboidratos: 0, gorduras: 7.3, fibras: 0 },
  { id: 12, nome: 'Filé de Tilápia Grelhado', categoria: 'Pescados', calorias: 128, proteinas: 26.0, carboidratos: 0, gorduras: 2.7, fibras: 0 },
  { id: 13, nome: 'Leite Desnatado', categoria: 'Laticínios', calorias: 35, proteinas: 3.4, carboidratos: 4.9, gorduras: 0.1, fibras: 0 },
  { id: 14, nome: 'Iogurte Natural Desnatado', categoria: 'Laticínios', calorias: 41, proteinas: 3.8, carboidratos: 5.8, gorduras: 0.3, fibras: 0 },
  { id: 15, nome: 'Maçã Fuji', categoria: 'Frutas', calorias: 56, proteinas: 0.3, carboidratos: 15.2, gorduras: 0.1, fibras: 1.3 },
  { id: 16, nome: 'Queijo Cottage', categoria: 'Laticínios', calorias: 98, proteinas: 11.1, carboidratos: 3.4, gorduras: 4.3, fibras: 0 },
  { id: 17, nome: 'Pasta de Amendoim Integral', categoria: 'Oleaginosas', calorias: 588, proteinas: 25.0, carboidratos: 20.0, gorduras: 50.0, fibras: 6.0 },
  { id: 18, nome: 'Whey Protein Concentrado 80%', categoria: 'Suplementos', calorias: 400, proteinas: 80.0, carboidratos: 6.6, gorduras: 6.6, fibras: 0 },
];

/**
 * Busca alimentos da TacoAPI oficial com tratamento de headers e múltiplos endpoints.
 */
async function buscarAlimentosTacoAPI(): Promise<AlimentoTaco[]> {
  const apiKey = (process.env.EXPO_PUBLIC_TACO_API_KEY || '').trim();

  for (const endpoint of TACO_ENDPOINTS) {
    try {
      const url = `${endpoint}?limit=500`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey && apiKey !== 'SUA_CHAVE_TACO_AQUI') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['x-api-key'] = apiKey;
      }

      const resposta = await fetch(url, { method: 'GET', headers });

      if (resposta.ok) {
        const dados = await resposta.json();
        const lista = Array.isArray(dados) ? dados : (dados.data || dados.alimentos || []);
        if (Array.isArray(lista) && lista.length > 0) {
          console.log(`✅ TacoAPI: ${lista.length} alimentos obtidos via ${endpoint}`);
          return lista;
        }
      }
    } catch {
      // Tenta o próximo endpoint
    }
  }

  console.log('ℹ️ TacoAPI: Usando base nativa compilada da Tabela TACO.');
  return BASE_TACO_NATIVA;
}

/**
 * Mapeia um alimento da TacoAPI para o schema da tabela base_alimentos no Supabase.
 * Corrige a geração do id_externo para evitar registros duplicados/nulos.
 */
function mapearParaBaseAlimentos(item: AlimentoTaco, index: number) {
  const nome = item.nome || item.name || item.description || item.descricao || `Alimento ${index + 1}`;
  const categoria = item.categoria || item.category || 'Geral';
  const rawId = item.id ?? item.id_taco ?? item.food_id ?? index + 1;

  const calorias = item.calorias ?? item.energy_kcal ?? item.energy ?? item.kcal ?? 0;
  const proteinas = item.proteinas ?? item.protein_g ?? item.protein ?? 0;
  const carboidratos = item.carboidratos ?? item.carbohydrate_g ?? item.carbohydrate ?? 0;
  const gorduras = item.gorduras ?? item.lipid_g ?? item.lipid ?? 0;
  const fibras = item.fibras ?? item.fiber_g ?? item.fiber ?? null;

  const nomeFormatado = String(nome).trim();
  const idExternoUnico = `taco-${rawId}-${nomeFormatado.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  return {
    id_externo: idExternoUnico,
    nome: nomeFormatado,
    categoria: String(categoria).trim(),
    calorias_100g: typeof calorias === 'number' ? calorias : parseFloat(String(calorias)) || 0,
    proteinas_100g: typeof proteinas === 'number' ? proteinas : parseFloat(String(proteinas)) || 0,
    carboidratos_100g: typeof carboidratos === 'number' ? carboidratos : parseFloat(String(carboidratos)) || 0,
    gorduras_100g: typeof gorduras === 'number' ? gorduras : parseFloat(String(gorduras)) || 0,
    fibras_100g: typeof fibras === 'number' ? fibras : parseFloat(String(fibras)) || null,
  };
}

/**
 * Executa a sincronização completa: busca da API → upsert no Supabase.
 */
export async function sincronizarAlimentosTaco(): Promise<void> {
  try {
    const alimentos = await buscarAlimentosTacoAPI();
    if (!alimentos || alimentos.length === 0) return;

    const payload = alimentos.map(mapearParaBaseAlimentos);

    // Grava no Supabase em lotes de 50 registros
    const TAMANHO_LOTE = 50;
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
      const lote = payload.slice(i, i + TAMANHO_LOTE);

      const { error } = await supabase
        .from('base_alimentos')
        .upsert(lote, { onConflict: 'id_externo' });

      if (error) {
        console.warn(`⚠️ TacoAPI Sync Lote ${i}:`, error.message);
      }
    }

    await AsyncStorage.setItem(CHAVE_ULTIMA_SYNC_TACO, String(Date.now()));
    console.log(`✅ TacoAPI: ${payload.length} alimentos sincronizados com sucesso no Supabase.`);
  } catch (erro) {
    console.warn('⚠️ TacoAPI Sync Aviso:', erro);
  }
}

/**
 * Busca alimentos do cache local (Supabase) para enriquecer o prompt da IA.
 */
export async function buscarAlimentosParaPrompt(limite: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('base_alimentos')
      .select('nome, categoria, calorias_100g, proteinas_100g')
      .limit(limite);

    if (error || !data || data.length === 0) {
      return BASE_TACO_NATIVA.slice(0, limite).map(a =>
        `${a.nome} (${a.categoria}) — ${a.calorias}kcal, ${a.proteinas}g prot/100g`
      );
    }

    return data.map(a =>
      `${a.nome} (${a.categoria}) — ${a.calorias_100g}kcal, ${a.proteinas_100g}g prot/100g`
    );
  } catch {
    return BASE_TACO_NATIVA.slice(0, limite).map(a =>
      `${a.nome} (${a.categoria}) — ${a.calorias}kcal, ${a.proteinas}g prot/100g`
    );
  }
}
