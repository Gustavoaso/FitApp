// ============================================================
// CAMADA DE REPOSITÓRIO: Acesso Exclusivo ao Supabase Real (servicos/repositorio.ts)
// ============================================================
// Rodada 4 — Etapa 2:
// Remoção total da lógica mock. Todas as operações de leitura e escrita
// passam exclusivamente pelo banco de dados PostgreSQL do Supabase.
// ============================================================

import { supabase } from './supabase';
import { RegistroRefeicaoDiaria } from './historicoServico';
import { DiaTreinoCustomizado } from './planoGestaoServico';
import { EntradaPeso } from './progressoServico';

export interface RegistroHidratacao {
  id?: string;
  usuario_id?: string;
  data: string;
  total_ml: number;
  meta_ml: number;
}

export interface PerfilUsuario {
  id?: string;
  usuario_id?: string;
  nome: string;
  idade: number;
  sexo: 'masculino' | 'feminino';
  peso_kg: number;
  altura_cm: number;
  sistema_unidades: 'metrico' | 'imperial';
}

// ------------------------------------------------------------
// 1. REPOSITÓRIO DE DIETA E NUTRIÇÃO
// ------------------------------------------------------------
export const repositorioDieta = {
  /**
   * Busca as refeições registradas para uma data específica no Supabase.
   */
  async buscarDietaPorData(dataStr: string): Promise<RegistroRefeicaoDiaria[]> {
    try {
      const { data, error } = await supabase
        .from('registro_refeicoes')
        .select('*')
        .eq('data', dataStr);

      if (error) {
        console.error('Erro de banco ao buscar refeições:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map(item => ({
        idRefeicao: item.id_refeicao,
        data: item.data,
        concluida: item.concluida,
        alimentos: typeof item.alimentos === 'string' ? JSON.parse(item.alimentos) : item.alimentos,
      }));
    } catch (erro) {
      console.error('Erro de rede ao carregar dieta:', erro);
      return [];
    }
  },

  /**
   * Salva ou atualiza as refeições do dia no Supabase.
   */
  async salvarDietaDoDia(dataStr: string, registros: RegistroRefeicaoDiaria[]): Promise<void> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

      const payload = registros.map(r => ({
        usuario_id: userId,
        id_refeicao: r.idRefeicao,
        data: dataStr,
        concluida: r.concluida,
        alimentos: r.alimentos,
      }));

      const { error } = await supabase
        .from('registro_refeicoes')
        .upsert(payload, { onConflict: 'usuario_id, id_refeicao, data' });

      if (error) {
        console.error('Erro de banco ao salvar refeições:', error.message);
      }
    } catch (erro) {
      console.error('Erro de rede ao salvar refeições:', erro);
    }
  },
};

// ------------------------------------------------------------
// 2. REPOSITÓRIO DE TREINOS E EXERCÍCIOS
// ------------------------------------------------------------
export const repositorioTreino = {
  /**
   * Busca os planos de treino cadastrados no Supabase.
   */
  async buscarPlanosTreino(): Promise<DiaTreinoCustomizado[]> {
    try {
      const { data, error } = await supabase
        .from('planos_treino')
        .select('*');

      if (error) {
        console.error('Erro de banco ao buscar treinos:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map(t => ({
        id: t.id,
        diaSemana: t.dia_semana,
        foco: t.foco,
        exercicios: typeof t.exercicios === 'string' ? JSON.parse(t.exercicios) : t.exercicios,
      }));
    } catch (erro) {
      console.error('Erro de rede ao buscar treinos:', erro);
      return [];
    }
  },

  /**
   * Salva os planos de treino customizados no Supabase.
   */
  async salvarPlanosTreino(planos: DiaTreinoCustomizado[]): Promise<void> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

      const payload = planos.map(p => ({
        id: p.id.startsWith('dia-') ? undefined : p.id,
        usuario_id: userId,
        dia_semana: p.diaSemana,
        foco: p.foco,
        exercicios: p.exercicios,
      }));

      const { error } = await supabase
        .from('planos_treino')
        .upsert(payload);

      if (error) {
        console.error('Erro de banco ao salvar treinos:', error.message);
      }
    } catch (erro) {
      console.error('Erro de rede ao salvar treinos:', erro);
    }
  },

  /**
   * Registra a execução de uma série específica no Supabase.
   */
  async registrarSerie(
    exercicioId: string,
    nomeExercicio: string,
    numeroSerie: number,
    cargaKg: number,
    repeticoes: number
  ): Promise<void> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase
        .from('historico_series_executadas')
        .insert([{
          usuario_id: userId,
          exercicio_id: exercicioId,
          nome_exercicio: nomeExercicio,
          numero_serie: numeroSerie,
          carga_kg: cargaKg,
          repeticoes: repeticoes,
        }]);

      if (error) {
        console.error('Erro de banco ao registrar série:', error.message);
      }
    } catch (erro) {
      console.error('Erro de rede ao registrar série:', erro);
    }
  },
};

// ------------------------------------------------------------
// 3. REPOSITÓRIO DE PROGRESSO E PESAGEM
// ------------------------------------------------------------
export const repositorioProgresso = {
  /**
   * Busca o histórico de pesagens no Supabase.
   */
  async buscarHistoricoPeso(): Promise<EntradaPeso[]> {
    try {
      const { data, error } = await supabase
        .from('historico_peso')
        .select('*')
        .order('data', { ascending: true });

      if (error) {
        console.error('Erro de banco ao buscar peso:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map(item => ({
        id: item.id,
        data: item.data,
        pesoKg: Number(item.peso_kg),
      }));
    } catch (erro) {
      console.error('Erro de rede ao buscar histórico de peso:', erro);
      return [];
    }
  },

  /**
   * Registra um novo peso no Supabase.
   */
  async registrarPeso(pesoKg: number, dataStr?: string): Promise<void> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase
        .from('historico_peso')
        .insert([{
          usuario_id: userId,
          peso_kg: pesoKg,
          data: dataStr || new Date().toISOString().split('T')[0],
        }]);

      if (error) {
        console.error('Erro de banco ao registrar peso:', error.message);
      }
    } catch (erro) {
      console.error('Erro de rede ao registrar peso:', erro);
    }
  },
};

// ------------------------------------------------------------
// 4. REPOSITÓRIO DE HIDRATAÇÃO
// ------------------------------------------------------------
export const repositorioAgua = {
  async buscarAguaDoDia(dataStr: string): Promise<RegistroHidratacao | null> {
    try {
      const { data, error } = await supabase
        .from('registros_agua')
        .select('*')
        .eq('data', dataStr)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar consumo de água:', error.message);
        return null;
      }

      return data || null;
    } catch (erro) {
      console.error('Erro de rede ao buscar água:', erro);
      return null;
    }
  },

  async salvarAguaDoDia(dataStr: string, totalMl: number, metaMl: number): Promise<void> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase
        .from('registros_agua')
        .upsert([{
          usuario_id: userId,
          data: dataStr,
          total_ml: totalMl,
          meta_ml: metaMl,
        }], { onConflict: 'usuario_id, data' });

      if (error) {
        console.error('Erro ao salvar água:', error.message);
      }
    } catch (erro) {
      console.error('Erro de rede ao salvar água:', erro);
    }
  },
};
