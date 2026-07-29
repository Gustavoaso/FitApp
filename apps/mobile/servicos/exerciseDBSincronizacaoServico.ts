// ============================================================
// SERVIÇO: Sincronização ExerciseDB → base_exercicios
// (servicos/exerciseDBSincronizacaoServico.ts)
// ============================================================
// Busca exercícios da ExerciseDB (API pública, sem chave) e armazena
// no Supabase como cache local. Percorre todas as páginas via cursor.
//
// CONCEITOS:
// - Cursor-based pagination: em vez de page=1, page=2, a API usa
//   um "cursor" (ID do último item) para navegar entre páginas.
//   É mais eficiente que offset/limit em tabelas grandes.
// - upsert com id_externo: evita duplicatas na sincronização
// - Mapeamento de campos inglês → português (schema do banco)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CHAVE_ULTIMA_SYNC_EXERCICIOS = '@fitapp_sync_exercisedb_timestamp';
const INTERVALO_SYNC_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const EXERCISEDB_BASE = 'https://oss.exercisedb.dev/api/v1';

/**
 * Verifica se precisa sincronizar (> 7 dias ou nunca sincronizou).
 */
async function precisaSincronizar(): Promise<boolean> {
  try {
    const ultimaSync = await AsyncStorage.getItem(CHAVE_ULTIMA_SYNC_EXERCICIOS);
    if (!ultimaSync) return true;

    const diferenca = Date.now() - Number(ultimaSync);
    return diferenca > INTERVALO_SYNC_MS;
  } catch {
    return true;
  }
}

/**
 * Interface de um exercício retornado pela ExerciseDB.
 * Campos documentados na OpenAPI spec.
 */
interface ExercicioExerciseDB {
  exerciseId: string;
  name: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  gifUrl: string;
  instructions: string[];
}

/**
 * Mapeia grupo muscular do inglês (ExerciseDB) para português (schema).
 * Retorna o valor original se não encontrar tradução.
 */
const MAPA_GRUPOS_MUSCULARES: Record<string, string> = {
  pectorals: 'Peito',
  lats: 'Costas',
  traps: 'Trapézio',
  delts: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraço',
  abs: 'Abdômen',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de Coxa',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
  adductors: 'Adutores',
  abductors: 'Abdutores',
  shoulders: 'Ombros',
  chest: 'Peito',
  back: 'Costas',
  'upper arms': 'Braços',
  'lower arms': 'Antebraço',
  'upper legs': 'Pernas',
  'lower legs': 'Panturrilha',
  waist: 'Core',
  neck: 'Pescoço',
  cardio: 'Cardio',
};

function traduzirGrupo(grupo: string): string {
  return MAPA_GRUPOS_MUSCULARES[grupo.toLowerCase()] || grupo;
}

/**
 * Mapeia equipamento do inglês para português.
 */
const MAPA_EQUIPAMENTOS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halteres',
  'cable': 'Cabo',
  'body weight': 'Peso Corporal',
  machine: 'Máquina',
  'smith machine': 'Smith Machine',
  kettlebell: 'Kettlebell',
  band: 'Elástico',
  'ez barbell': 'Barra W',
  'olympic barbell': 'Barra Olímpica',
  'medicine ball': 'Bola Medicinal',
  'stability ball': 'Bola de Estabilidade',
  bosu: 'Bosu',
  roller: 'Rolo',
  rope: 'Corda',
  weighted: 'Com Peso',
  assisted: 'Assistido',
  leverage: 'Alavanca',
  'upper body ergometer': 'Ergômetro Superior',
  'elliptical machine': 'Elíptico',
  'stationary bike': 'Bicicleta Ergométrica',
  'skierg machine': 'SkiErg',
  hammer: 'Hammer',
  'tire': 'Pneu',
  'trap bar': 'Trap Bar',
  stepmill: 'Stepmill',
  sled: 'Sled',
};

function traduzirEquipamento(equip: string): string {
  return MAPA_EQUIPAMENTOS[equip.toLowerCase()] || equip;
}

/**
 * Infere o nível do exercício com base no equipamento e tipo.
 * Regra simples: peso corporal = iniciante, máquinas = intermediário,
 * barras/halteres = avançado. Decisão pragmática para não depender de
 * campo inexistente na API.
 */
function inferirNivel(equipamento: string): 'iniciante' | 'intermediario' | 'avancado' {
  const equip = equipamento.toLowerCase();
  if (equip === 'body weight' || equip === 'band') return 'iniciante';
  if (equip === 'machine' || equip === 'cable' || equip === 'leverage') return 'intermediario';
  return 'avancado';
}

/**
 * Mapeia um exercício da ExerciseDB para o schema da tabela base_exercicios.
 */
function mapearParaBaseExercicios(ex: ExercicioExerciseDB) {
  const grupoPrimario = ex.targetMuscles?.[0]
    ? traduzirGrupo(ex.targetMuscles[0])
    : (ex.bodyParts?.[0] ? traduzirGrupo(ex.bodyParts[0]) : 'Outro');

  const grupoSecundario = ex.secondaryMuscles?.length > 0
    ? ex.secondaryMuscles.map(traduzirGrupo).join(', ')
    : null;

  const equipamento = ex.equipments?.[0]
    ? traduzirEquipamento(ex.equipments[0])
    : 'Outro';

  return {
    id_externo: ex.exerciseId,
    nome: ex.name,
    grupo_primario: grupoPrimario,
    grupo_secundario: grupoSecundario,
    equipamento,
    nivel: inferirNivel(ex.equipments?.[0] || ''),
    instrucoes: ex.instructions?.join('\n') || '',
    gif_url: ex.gifUrl || null,
  };
}

/**
 * Busca TODOS os exercícios da ExerciseDB usando cursor-based pagination.
 * A API retorna no máximo 25 por página. Percorre até não haver mais páginas.
 */
async function buscarTodosExercicios(): Promise<ExercicioExerciseDB[]> {
  const todos: ExercicioExerciseDB[] = [];
  let cursor: string | null = null;
  let temProximaPagina = true;

  console.log('🔄 ExerciseDB: Buscando exercícios...');

  while (temProximaPagina) {
    const url: string = cursor
      ? `${EXERCISEDB_BASE}/exercises?limit=25&after=${cursor}`
      : `${EXERCISEDB_BASE}/exercises?limit=25`;

    try {
      const resposta: Response = await fetch(url);

      if (!resposta.ok) {
        console.error(`❌ ExerciseDB: Erro HTTP ${resposta.status}`);
        break;
      }

      const json: any = await resposta.json();
      const exercicios: ExercicioExerciseDB[] = json.data || [];
      todos.push(...exercicios);

      // Cursor-based pagination: usa nextCursor para a próxima página
      temProximaPagina = json.meta?.hasNextPage === true;
      cursor = (json.meta?.nextCursor as string) || null;

      // Log a cada 100 exercícios para acompanhar progresso
      if (todos.length % 100 === 0) {
        console.log(`  📊 ExerciseDB: ${todos.length} exercícios carregados...`);
      }
    } catch (erro) {
      console.error('❌ ExerciseDB: Erro de rede:', erro);
      break;
    }
  }

  return todos;
}

/**
 * Executa a sincronização completa: busca da API → upsert no Supabase.
 * Chamada automaticamente no startup do app (fire-and-forget).
 */
export async function sincronizarExercicios(): Promise<void> {
  try {
    const necessario = await precisaSincronizar();
    if (!necessario) {
      console.log('✅ ExerciseDB: Cache ainda válido, pulando sync.');
      return;
    }

    const exercicios = await buscarTodosExercicios();

    if (exercicios.length === 0) {
      console.log('⏭️ ExerciseDB: Nenhum exercício retornado.');
      return;
    }

    console.log(`🔄 ExerciseDB: Inserindo ${exercicios.length} exercícios no Supabase...`);
    const payload = exercicios.map(mapearParaBaseExercicios);

    // Insere em lotes de 50 para não estourar limites
    const TAMANHO_LOTE = 50;
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
      const lote = payload.slice(i, i + TAMANHO_LOTE);

      const { error } = await supabase
        .from('base_exercicios')
        .upsert(lote, { onConflict: 'id_externo' });

      if (error) {
        console.error(`❌ ExerciseDB: Erro ao inserir lote ${i / TAMANHO_LOTE + 1}:`, error.message);
      }
    }

    await AsyncStorage.setItem(CHAVE_ULTIMA_SYNC_EXERCICIOS, String(Date.now()));
    console.log(`✅ ExerciseDB: ${payload.length} exercícios sincronizados com sucesso.`);
  } catch (erro) {
    console.error('❌ ExerciseDB: Erro geral na sincronização:', erro);
  }
}

/**
 * Busca exercícios do cache local (Supabase) para enriquecer o prompt da IA.
 * Filtra por equipamento se especificado.
 * Retorna uma lista resumida para não estourar tokens do LLM.
 */
export async function buscarExerciciosParaPrompt(
  equipamentoFiltro?: string,
  limite: number = 80
): Promise<string[]> {
  try {
    let query = supabase
      .from('base_exercicios')
      .select('nome, grupo_primario, equipamento')
      .limit(limite);

    // Se o usuário tem apenas peso corporal, filtra
    if (equipamentoFiltro === 'peso_corporal') {
      query = query.eq('equipamento', 'Peso Corporal');
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(e =>
      `${e.nome} (${e.grupo_primario}, ${e.equipamento})`
    );
  } catch {
    return [];
  }
}
