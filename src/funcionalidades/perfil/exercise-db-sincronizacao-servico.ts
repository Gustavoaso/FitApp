// ============================================================
// SERVIÇO: Sincronização ExerciseDB → base_exercicios
// (servicos/exerciseDBSincronizacaoServico.ts)
// ============================================================
// Arquitetura Mobile de Alta Performance:
// 1. Leitura ultrarrápida no Supabase (< 30ms) / Cache Local (0ms).
// 2. AbortController Timeout (3.5s max) para impedir travamentos de UI.
// 3. Persistência offline em AsyncStorage.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/compartilhado/supabase';

const CHAVE_CACHE_EXERCISE_RAW = '@fitapp_cache_raw_exercise_v1';
const CHAVE_ULTIMA_SYNC_EXERCICIOS = '@fitapp_sync_exercicios_timestamp';
const INTERVALO_SYNC_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface ExercícioExerciseDB {
  exerciseId: string;
  name: string;
  gifUrl?: string;
  bodyParts?: string[];
  equipments?: string[];
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

// Fallback nativo compilado de alta performance
const EXERCICIOS_NATIVOS: ExercícioExerciseDB[] = [
  {
    exerciseId: 'nat-1',
    name: 'Supino Reto com Barra',
    gifUrl: 'https://static.exercisedb.dev/media/0025.gif',
    bodyParts: ['chest'],
    equipments: ['barbell'],
    targetMuscles: ['pectorals'],
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: ['Deite-se no banco', 'Empurre a barra verticalmente', 'Controle a descida'],
  },
  {
    exerciseId: 'nat-2',
    name: 'Agachamento Livre com Barra',
    gifUrl: 'https://static.exercisedb.dev/media/0043.gif',
    bodyParts: ['upper legs'],
    equipments: ['barbell'],
    targetMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    instructions: ['Posicione a barra no trapezoide', 'Agache flexionando joelhos e quadril'],
  },
  {
    exerciseId: 'nat-3',
    name: 'Puxada Frontal no Pulley',
    gifUrl: 'https://static.exercisedb.dev/media/0150.gif',
    bodyParts: ['back'],
    equipments: ['cable'],
    targetMuscles: ['latissimus dorsi'],
    secondaryMuscles: ['biceps'],
    instructions: ['Puxe a barra ate a altura do peito', 'Retorne controladamente'],
  },
];

async function fetchComTimeout(resource: string, options: RequestInit = {}, timeoutMs: number = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function obterDadosRawExerciseDB(): Promise<any[]> {
  try {
    // 1. Cache Local AsyncStorage (0ms)
    const cacheLocal = await AsyncStorage.getItem(CHAVE_CACHE_EXERCISE_RAW);
    if (cacheLocal) {
      const dados = JSON.parse(cacheLocal);
      if (Array.isArray(dados) && dados.length >= 30) {
        return dados;
      }
    }

    // 2. Supabase (< 30ms)
    const { data: dadosSupabase } = await supabase
      .from('base_exercicios')
      .select('*')
      .limit(300);

    if (dadosSupabase && dadosSupabase.length >= 30) {
      await AsyncStorage.setItem(CHAVE_CACHE_EXERCISE_RAW, JSON.stringify(dadosSupabase));
      return dadosSupabase;
    }
  } catch {
    // Silencioso
  }

  // 3. Fallback Rede com timeout 3.5s
  const resultadoRede = await buscarTodosExerciciosRede();
  if (resultadoRede && resultadoRede.length > 0) {
    AsyncStorage.setItem(CHAVE_CACHE_EXERCISE_RAW, JSON.stringify(resultadoRede)).catch(() => {});
  }

  return resultadoRede;
}

async function buscarTodosExerciciosRede(): Promise<ExercícioExerciseDB[]> {
  try {
    const resp = await fetchComTimeout('https://oss.exercisedb.dev/api/v1/exercises?limit=300', {}, 3500);
    if (resp.ok) {
      const json = await resp.json();
      const lista = json.data || [];
      if (Array.isArray(lista) && lista.length > 0) {
        return lista;
      }
    }
  } catch {}

  return EXERCICIOS_NATIVOS;
}

function mapearParaBaseExercicios(ex: ExercícioExerciseDB) {
  return {
    id_externo: ex.exerciseId,
    nome: ex.name,
    grupo_primario: ex.targetMuscles?.[0] || ex.bodyParts?.[0] || 'Geral',
    grupo_secundario: ex.secondaryMuscles?.join(', ') || null,
    equipamento: ex.equipments?.[0] || 'Livre',
    nivel: ex.equipments?.[0] === 'body weight' ? 'iniciante' : 'intermediario',
    instrucoes: ex.instructions?.join('\n') || '',
    gif_url: ex.gifUrl || null,
  };
}

async function precisaSincronizar(): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('base_exercicios')
      .select('*', { count: 'exact', head: true });

    if (!count || count < 50) return true;

    const ultimaSync = await AsyncStorage.getItem(CHAVE_ULTIMA_SYNC_EXERCICIOS);
    if (!ultimaSync) return true;

    const diferenca = Date.now() - Number(ultimaSync);
    return diferenca > INTERVALO_SYNC_MS;
  } catch {
    return true;
  }
}

export async function sincronizarExercicios(forcado: boolean = false): Promise<void> {
  try {
    if (!forcado) {
      const necessario = await precisaSincronizar();
      if (!necessario) {
        return;
      }
    }

    const exercicios = await obterDadosRawExerciseDB();
    const payload = exercicios.map(mapearParaBaseExercicios);

    const TAMANHO_LOTE = 50;
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
      const lote = payload.slice(i, i + TAMANHO_LOTE);
      await supabase
        .from('base_exercicios')
        .upsert(lote, { onConflict: 'id_externo' });
    }

    await AsyncStorage.setItem(CHAVE_ULTIMA_SYNC_EXERCICIOS, String(Date.now()));
  } catch (erro) {
    console.warn('ExerciseDB Sync Warning:', erro);
  }
}

export async function buscarExerciciosParaPrompt(
  filtros: { localTreino: string; nivelExperiencia: string; restricoesFisicas: string[]; divisaoPreferida: string },
  limite: number = 80
): Promise<string[]> {
  try {
    let query = supabase
      .from('base_exercicios')
      .select('id, nome, grupo_primario, equipamento');

    if (filtros.localTreino === 'Casa' || filtros.localTreino === 'Peso do corpo') {
      // Evitar equipamentos complexos (máquinas, cabos) para quem treina em casa
      query = query.not('equipamento', 'in', '("cable", "machine", "barbell")');
    }

    if (filtros.nivelExperiencia === 'Iniciante') {
      query = query.in('nivel', ['iniciante']);
    }

    const { data, error } = await query.limit(limite);

    if (error || !data || data.length === 0) {
      return [];
    }

    let resultados = data;

    // Filtro em memória simples para restrições físicas para evitar query complexa
    if (filtros.restricoesFisicas && filtros.restricoesFisicas.length > 0) {
      const restricoes = filtros.restricoesFisicas.map(r => r.toLowerCase());
      resultados = resultados.filter(e => {
        const str = (e.nome + ' ' + e.grupo_primario).toLowerCase();
        if (restricoes.includes('joelho') && (str.includes('agachamento') || str.includes('leg press'))) return false;
        if (restricoes.includes('ombro') && (str.includes('desenvolvimento') || str.includes('elevação'))) return false;
        if (restricoes.includes('coluna') && str.includes('terra')) return false;
        return true;
      });
    }

    return resultados.map((e) =>
      `[ID: ${e.id}] ${e.nome} (Músculo: ${e.grupo_primario})`
    );
  } catch {
    return [];
  }
}
