// ============================================================
// SERVIÇO: Sincronização TacoAPI → base_alimentos
// (servicos/tacoSincronizacaoServico.ts)
// ============================================================
// Busca alimentos da TacoAPI (Tabela TACO brasileira) e armazena
// no Supabase como cache local. Reexecuta apenas se a última
// sincronização tiver mais de 7 dias.
//
// CONCEITOS:
// - AsyncStorage guarda o timestamp da última sincronização
// - upsert: insere se não existe, atualiza se já existe
//   (identifica duplicatas pelo campo id_externo)
// - fire-and-forget: o sync roda em background, sem bloquear a UI
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CHAVE_ULTIMA_SYNC_TACO = '@fitapp_sync_taco_timestamp';
const INTERVALO_SYNC_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
const TACO_API_BASE = 'https://taco.codivatech.com/api/v1';

/**
 * Verifica se já passou tempo suficiente desde a última sincronização.
 * Retorna true se precisa sincronizar (nunca sincronizou ou > 7 dias).
 */
async function precisaSincronizar(): Promise<boolean> {
  try {
    const ultimaSync = await AsyncStorage.getItem(CHAVE_ULTIMA_SYNC_TACO);
    if (!ultimaSync) return true;

    const diferenca = Date.now() - Number(ultimaSync);
    return diferenca > INTERVALO_SYNC_MS;
  } catch {
    return true; // Em caso de erro, tenta sincronizar
  }
}

/**
 * Busca alimentos da TacoAPI com paginação.
 * A TacoAPI retorna uma lista de alimentos com dados nutricionais por 100g.
 */
async function buscarAlimentosTacoAPI(): Promise<AlimentoTaco[]> {
  const apiKey = process.env.EXPO_PUBLIC_TACO_API_KEY;

  if (!apiKey || apiKey === 'SUA_CHAVE_TACO_AQUI') {
    console.log('⏭️ TacoAPI: Chave não configurada, pulando sincronização.');
    return [];
  }

  try {
    const resposta = await fetch(`${TACO_API_BASE}/alimentos?limit=600`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resposta.ok) {
      console.error(`❌ TacoAPI: Erro HTTP ${resposta.status}`);
      return [];
    }

    const dados = await resposta.json();

    // A TacoAPI pode retornar { data: [...] } ou diretamente um array
    const lista = Array.isArray(dados) ? dados : (dados.data || []);
    return lista;
  } catch (erro) {
    console.error('❌ TacoAPI: Erro de rede na busca:', erro);
    return [];
  }
}

/**
 * Interface para representar um alimento retornado pela TacoAPI.
 * Campos podem variar — usamos acesso seguro com fallback.
 */
interface AlimentoTaco {
  id?: string | number;
  nome?: string;
  name?: string;
  categoria?: string;
  category?: string;
  calorias?: number;
  energy_kcal?: number;
  proteinas?: number;
  protein_g?: number;
  carboidratos?: number;
  carbohydrate_g?: number;
  gorduras?: number;
  lipid_g?: number;
  fibras?: number;
  fiber_g?: number;
  [chave: string]: unknown;
}

/**
 * Mapeia um alimento da TacoAPI para o schema da tabela base_alimentos.
 * Usa fallback para campos que podem ter nomes diferentes dependendo
 * da versão da API.
 */
function mapearParaBaseAlimentos(item: AlimentoTaco) {
  const nome = item.nome || item.name || 'Alimento desconhecido';
  const categoria = item.categoria || item.category || 'outros';

  return {
    id_externo: String(item.id || nome),
    nome,
    categoria,
    calorias_100g: item.calorias ?? item.energy_kcal ?? 0,
    proteinas_100g: item.proteinas ?? item.protein_g ?? 0,
    carboidratos_100g: item.carboidratos ?? item.carbohydrate_g ?? 0,
    gorduras_100g: item.gorduras ?? item.lipid_g ?? 0,
    fibras_100g: item.fibras ?? item.fiber_g ?? null,
  };
}

/**
 * Executa a sincronização completa: busca da API → upsert no Supabase.
 * Chamada automaticamente no startup do app (fire-and-forget).
 */
export async function sincronizarAlimentosTaco(): Promise<void> {
  try {
    const necessario = await precisaSincronizar();
    if (!necessario) {
      console.log('✅ TacoAPI: Cache ainda válido, pulando sync.');
      return;
    }

    console.log('🔄 TacoAPI: Iniciando sincronização de alimentos...');
    const alimentos = await buscarAlimentosTacoAPI();

    if (alimentos.length === 0) {
      console.log('⏭️ TacoAPI: Nenhum alimento retornado.');
      return;
    }

    // Mapeia todos os alimentos para o schema do banco
    const payload = alimentos.map(mapearParaBaseAlimentos);

    // Insere em lotes de 100 para não estourar o limite de payload
    const TAMANHO_LOTE = 100;
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
      const lote = payload.slice(i, i + TAMANHO_LOTE);

      const { error } = await supabase
        .from('base_alimentos')
        .upsert(lote, { onConflict: 'id_externo' });

      if (error) {
        console.error(`❌ TacoAPI: Erro ao inserir lote ${i / TAMANHO_LOTE + 1}:`, error.message);
      }
    }

    // Salva o timestamp da sincronização
    await AsyncStorage.setItem(CHAVE_ULTIMA_SYNC_TACO, String(Date.now()));
    console.log(`✅ TacoAPI: ${payload.length} alimentos sincronizados com sucesso.`);
  } catch (erro) {
    console.error('❌ TacoAPI: Erro geral na sincronização:', erro);
  }
}

/**
 * Busca alimentos do cache local (Supabase) para enriquecer o prompt da IA.
 * Retorna uma lista resumida (nome + categoria + calorias) para não
 * ultrapassar o limite de tokens do LLM.
 */
export async function buscarAlimentosParaPrompt(limite: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('base_alimentos')
      .select('nome, categoria, calorias_100g, proteinas_100g')
      .limit(limite);

    if (error || !data) return [];

    return data.map(a =>
      `${a.nome} (${a.categoria}) — ${a.calorias_100g}kcal, ${a.proteinas_100g}g prot/100g`
    );
  } catch {
    return [];
  }
}
