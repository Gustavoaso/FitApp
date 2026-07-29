// ============================================================
// CAMADA DE REPOSITÓRIO: Ponto Central de Persistência (servicos/repositorio.ts)
// ============================================================
// Rodada 3 — Ajuste 2:
// Esta camada abstrai todas as chamadas de banco de dados do aplicativo.
// Atualmente consome o armazenamento local (AsyncStorage / Mocks em memória),
// e quando o Supabase real for conectado, basta alternar a flag 'USAR_BANCO_REAL'
// neste único arquivo para redirecionar todas as chamadas para o PostgreSQL.
// ============================================================

import { supabase } from './supabase';
import { obterHistoricoDieta, salvarHistoricoDieta, RegistroRefeicaoDiaria } from './historicoServico';
import { obterPlanoTreinoCustomizado, salvarPlanoTreinoCustomizado, DiaTreinoCustomizado } from './planoGestaoServico';
import { obterHistoricoPeso, adicionarEntradaPeso, EntradaPeso } from './progressoServico';

/**
 * Flag global de controle de motor de dados:
 * - false: Utiliza o Repositório Mock / AsyncStorage (Modo Offline/Desenvolvimento local)
 * - true: Utiliza as requisições diretas ao Supabase PostgreSQL
 */
export const USAR_BANCO_REAL = true;

// ------------------------------------------------------------
// 1. REPOSITÓRIO DE DIETA E NUTRIÇÃO
// ------------------------------------------------------------
export const repositorioDieta = {
  async buscarDietaPorData(dataStr: string): Promise<RegistroRefeicaoDiaria[]> {
    if (USAR_BANCO_REAL) {
      const { data, error } = await supabase
        .from('registro_refeicoes')
        .select('*')
        .eq('data', dataStr);
      if (error) throw error;
      return data || [];
    }
    const res = await obterHistoricoDieta(dataStr);
    return res || [];
  },

  async salvarDietaDoDia(dataStr: string, registros: RegistroRefeicaoDiaria[]): Promise<void> {
    if (USAR_BANCO_REAL) {
      const { error } = await supabase
        .from('registro_refeicoes')
        .upsert(registros.map(r => ({ ...r, data: dataStr })));
      if (error) throw error;
      return;
    }
    await salvarHistoricoDieta(dataStr, registros);
  },
};

// ------------------------------------------------------------
// 2. REPOSITÓRIO DE TREINOS E EXERCÍCIOS
// ------------------------------------------------------------
export const repositorioTreino = {
  async buscarPlanosTreino(): Promise<DiaTreinoCustomizado[]> {
    if (USAR_BANCO_REAL) {
      const { data, error } = await supabase
        .from('planos_treino')
        .select('*, exercicios(*)');
      if (error) throw error;
      return data || [];
    }
    return obterPlanoTreinoCustomizado();
  },

  async salvarPlanosTreino(planos: DiaTreinoCustomizado[]): Promise<void> {
    if (USAR_BANCO_REAL) {
      const { error } = await supabase
        .from('planos_treino')
        .upsert(planos);
      if (error) throw error;
      return;
    }
    await salvarPlanoTreinoCustomizado(planos);
  },
};

// ------------------------------------------------------------
// 3. REPOSITÓRIO DE PROGRESSO E PESAGEM
// ------------------------------------------------------------
export const repositorioProgresso = {
  async buscarHistoricoPeso(): Promise<EntradaPeso[]> {
    if (USAR_BANCO_REAL) {
      const { data, error } = await supabase
        .from('historico_peso')
        .select('*')
        .order('data', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return obterHistoricoPeso();
  },

  async registrarPeso(pesoKg: number, dataStr?: string): Promise<EntradaPeso[]> {
    if (USAR_BANCO_REAL) {
      const { data, error } = await supabase
        .from('historico_peso')
        .insert([{ peso_kg: pesoKg, data: dataStr || new Date().toISOString().split('T')[0] }])
        .select();
      if (error) throw error;
      return data || [];
    }
    return adicionarEntradaPeso(pesoKg, dataStr);
  },
};
