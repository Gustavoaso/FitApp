// ============================================================
// SERVIÇO: Sincronização ExerciseDB → base_exercicios
// (servicos/exerciseDBSincronizacaoServico.ts)
// ============================================================
// Busca exercícios da ExerciseDB (API pública) e armazena
// no Supabase como cache local. Percorre todas as páginas.
// Re-executa semanalmente ou quando a base tiver < 50 registros.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CHAVE_ULTIMA_SYNC_EXERCICIOS = '@fitapp_sync_exercisedb_timestamp';
const INTERVALO_SYNC_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const EXERCISEDB_BASE = 'https://oss.exercisedb.dev/api/v1';

/**
 * Verifica se precisa sincronizar.
 * Retorna true se nunca sincronizou, passou 7 dias OU se o banco tem < 50 registros.
 */
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

interface ExercicioExerciseDB {
  exerciseId: string;
  name: string;
  bodyParts?: string[];
  equipments?: string[];
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  gifUrl?: string;
  instructions?: string[];
}

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
  cardio: 'Cardio',
};

function traduzirGrupo(grupo: string): string {
  return MAPA_GRUPOS_MUSCULARES[grupo.toLowerCase()] || grupo;
}

const MAPA_EQUIPAMENTOS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halteres',
  cable: 'Cabo',
  'body weight': 'Peso Corporal',
  machine: 'Máquina',
  'smith machine': 'Smith Machine',
  kettlebell: 'Kettlebell',
  band: 'Elástico',
  'ez barbell': 'Barra W',
  'olympic barbell': 'Barra Olímpica',
};

function traduzirEquipamento(equip: string): string {
  return MAPA_EQUIPAMENTOS[equip.toLowerCase()] || equip;
}

function inferirNivel(equipamento: string): 'iniciante' | 'intermediario' | 'avancado' {
  const equip = equipamento.toLowerCase();
  if (equip === 'body weight' || equip === 'band') return 'iniciante';
  if (equip === 'machine' || equip === 'cable' || equip === 'leverage') return 'intermediario';
  return 'avancado';
}

const BASE_EXERCICIOS_NATIVA: ExercicioExerciseDB[] = [
  { exerciseId: 'ex-1', name: 'Supino Reto com Barra', bodyParts: ['chest'], equipments: ['barbell'], targetMuscles: ['pectorals'], secondaryMuscles: ['triceps', 'shoulders'], instructions: ['Deite no banco reto', 'Desça a barra até o peito', 'Empurre até a extensão quase completa'] },
  { exerciseId: 'ex-2', name: 'Supino Inclinado com Halteres', bodyParts: ['chest'], equipments: ['dumbbell'], targetMuscles: ['pectorals'], secondaryMuscles: ['triceps', 'shoulders'], instructions: ['Ajuste o banco a 30 graus', 'Empurre os halteres para cima'] },
  { exerciseId: 'ex-3', name: 'Crossover na Polia Alta', bodyParts: ['chest'], equipments: ['cable'], targetMuscles: ['pectorals'], secondaryMuscles: ['shoulders'], instructions: ['Puxe os cabos cruzando à frente do corpo'] },
  { exerciseId: 'ex-4', name: 'Puxada Frontal Aberta', bodyParts: ['back'], equipments: ['cable'], targetMuscles: ['lats'], secondaryMuscles: ['biceps'], instructions: ['Puxe a barra até a parte superior do peito'] },
  { exerciseId: 'ex-5', name: 'Remada Curvada com Barra', bodyParts: ['back'], equipments: ['barbell'], targetMuscles: ['lats'], secondaryMuscles: ['biceps'], instructions: ['Incline o tronco e puxe a barra no abdômen'] },
  { exerciseId: 'ex-6', name: 'Remada Baixa na Polia com Triângulo', bodyParts: ['back'], equipments: ['cable'], targetMuscles: ['lats'], secondaryMuscles: ['biceps'], instructions: ['Puxe o triângulo em direção ao umbigo'] },
  { exerciseId: 'ex-7', name: 'Agachamento Livre com Barra', bodyParts: ['upper legs'], equipments: ['barbell'], targetMuscles: ['quads'], secondaryMuscles: ['glutes'], instructions: ['Desça flexionando joelhos e quadril a 90°'] },
  { exerciseId: 'ex-8', name: 'Leg Press 45°', bodyParts: ['upper legs'], equipments: ['machine'], targetMuscles: ['quads'], secondaryMuscles: ['glutes'], instructions: ['Empurre a plataforma com os pés afastados'] },
  { exerciseId: 'ex-9', name: 'Cadeira Extensora', bodyParts: ['upper legs'], equipments: ['machine'], targetMuscles: ['quads'], secondaryMuscles: [], instructions: ['Extenda os joelhos até a contração máxima'] },
  { exerciseId: 'ex-10', name: 'Mesa Flexora', bodyParts: ['upper legs'], equipments: ['machine'], targetMuscles: ['hamstrings'], secondaryMuscles: ['calves'], instructions: ['Flexione os joelhos trazendo o rolo no glúteo'] },
  { exerciseId: 'ex-11', name: 'Desenvolvimento com Halteres', bodyParts: ['shoulders'], equipments: ['dumbbell'], targetMuscles: ['delts'], secondaryMuscles: ['triceps'], instructions: ['Eleve os halteres acima da cabeça'] },
  { exerciseId: 'ex-12', name: 'Elevação Lateral com Halteres', bodyParts: ['shoulders'], equipments: ['dumbbell'], targetMuscles: ['delts'], secondaryMuscles: [], instructions: ['Eleve os braços lateralmente até a altura dos ombros'] },
  { exerciseId: 'ex-13', name: 'Rosca Direta com Barra W', bodyParts: ['upper arms'], equipments: ['ez barbell'], targetMuscles: ['biceps'], secondaryMuscles: ['forearms'], instructions: ['Flexione os cotovelos mantendo os braços fixos'] },
  { exerciseId: 'ex-14', name: 'Rosca Martelo com Halteres', bodyParts: ['upper arms'], equipments: ['dumbbell'], targetMuscles: ['biceps'], secondaryMuscles: ['forearms'], instructions: ['Mantenha a pegada neutra ao flexionar'] },
  { exerciseId: 'ex-15', name: 'Tríceps Pulley na Corda', bodyParts: ['upper arms'], equipments: ['cable'], targetMuscles: ['triceps'], secondaryMuscles: [], instructions: ['Extenda os cotovelos separando a corda no final'] },
  { exerciseId: 'ex-16', name: 'Tríceps Testa com Barra W', bodyParts: ['upper arms'], equipments: ['ez barbell'], targetMuscles: ['triceps'], secondaryMuscles: [], instructions: ['Deitado no banco, desça a barra até a testa'] },
  { exerciseId: 'ex-17', name: 'Abdominal Supra na Prancha', bodyParts: ['waist'], equipments: ['body weight'], targetMuscles: ['abs'], secondaryMuscles: [], instructions: ['Flexione o tronco aproximando as costelas do quadril'] },
  { exerciseId: 'ex-18', name: 'Prancha Isométrica', bodyParts: ['waist'], equipments: ['body weight'], targetMuscles: ['abs'], secondaryMuscles: [], instructions: ['Sustente o corpo alinhado sobre os antebraços'] },
];

function mapearParaBaseExercicios(ex: ExercicioExerciseDB) {
  const grupoPrimario = ex.targetMuscles?.[0]
    ? traduzirGrupo(ex.targetMuscles[0])
    : (ex.bodyParts?.[0] ? traduzirGrupo(ex.bodyParts[0]) : 'Geral');

  const grupoSecundario = ex.secondaryMuscles?.length
    ? ex.secondaryMuscles.map(traduzirGrupo).join(', ')
    : null;

  const equipamento = ex.equipments?.[0]
    ? traduzirEquipamento(ex.equipments[0])
    : 'Livre';

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

async function buscarTodosExercicios(): Promise<ExercicioExerciseDB[]> {
  const todos: ExercicioExerciseDB[] = [];
  let cursor: string | null = null;
  let temProximaPagina = true;

  try {
    while (temProximaPagina && todos.length < 500) {
      const url: string = cursor
        ? `${EXERCISEDB_BASE}/exercises?limit=100&after=${cursor}`
        : `${EXERCISEDB_BASE}/exercises?limit=100`;

      const resposta: Response = await fetch(url);
      if (!resposta.ok) break;

      const json: any = await resposta.json();
      const exercicios: ExercicioExerciseDB[] = json.data || [];
      if (exercicios.length === 0) break;

      todos.push(...exercicios);
      temProximaPagina = json.meta?.hasNextPage === true;
      cursor = (json.meta?.nextCursor as string) || null;
    }
  } catch {
    // Caso de falha de rede
  }

  if (todos.length === 0) {
    return BASE_EXERCICIOS_NATIVA;
  }
  return todos;
}

export async function sincronizarExercicios(): Promise<void> {
  try {
    const necessario = await precisaSincronizar();
    if (!necessario) {
      console.log('✅ ExerciseDB: Base populada e cache válido.');
      return;
    }

    console.log('🔄 ExerciseDB: Sincronizando exercícios para o Supabase...');
    const exercicios = await buscarTodosExercicios();
    const payload = exercicios.map(mapearParaBaseExercicios);

    const TAMANHO_LOTE = 50;
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
      const lote = payload.slice(i, i + TAMANHO_LOTE);

      await supabase
        .from('base_exercicios')
        .upsert(lote, { onConflict: 'id_externo' });
    }

    await AsyncStorage.setItem(CHAVE_ULTIMA_SYNC_EXERCICIOS, String(Date.now()));
    console.log(`✅ ExerciseDB: ${payload.length} exercícios salvos com sucesso no Supabase.`);
  } catch (erro) {
    console.warn('⚠️ ExerciseDB Sync Aviso:', erro);
  }
}

export async function buscarExerciciosParaPrompt(
  equipamentoFiltro?: string,
  limite: number = 80
): Promise<string[]> {
  try {
    let query = supabase
      .from('base_exercicios')
      .select('nome, grupo_primario, equipamento')
      .limit(limite);

    if (equipamentoFiltro === 'peso_corporal') {
      query = query.eq('equipamento', 'Peso Corporal');
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return BASE_EXERCICIOS_NATIVA.slice(0, limite).map(e =>
        `${e.name} (${traduzirGrupo(e.bodyParts?.[0] || '')}, ${traduzirEquipamento(e.equipments?.[0] || '')})`
      );
    }

    return data.map(e => `${e.nome} (${e.grupo_primario}, ${e.equipamento})`);
  } catch {
    return BASE_EXERCICIOS_NATIVA.slice(0, limite).map(e =>
      `${e.name} (${traduzirGrupo(e.bodyParts?.[0] || '')}, ${traduzirEquipamento(e.equipments?.[0] || '')})`
    );
  }
}
