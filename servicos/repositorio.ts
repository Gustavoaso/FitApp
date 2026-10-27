// ============================================================
// CAMADA DE REPOSITÓRIO: Acesso Exclusivo ao Supabase Real (servicos/repositorio.ts)
// ============================================================
// Rodada 4 — Etapa 2:
// Remoção total da lógica mock. Todas as operações de leitura e escrita
// passam exclusivamente pelo banco de dados PostgreSQL do Supabase.
// ============================================================

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistroRefeicaoDiaria } from './historicoServico';
import { DiaTreinoCustomizado } from './planoGestaoServico';
import { EntradaPeso } from './progressoServico';
import type { PlanoIAGerado } from '@fitapp/tipos';

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
  gordura_corporal?: number | null;
  nivel_experiencia?: string;
  nivel_atividade?: string;
  frequencia_semanal?: number;
  objetivo?: string;
  sistema_unidades: 'metrico' | 'imperial';
}

export interface ReceitaUsuario {
  id: string;
  usuario_id?: string;
  nome: string;
  descricao?: string | null;
  alimentos: Array<{
    id: string;
    nome: string;
    porcao: string;
    calorias: number;
    proteinas: number;
    carboidratos?: number;
    carbos?: number;
    gorduras: number;
  }>;
  total_calorias?: number;
  total_proteinas?: number;
  total_carboidratos?: number;
  total_gorduras?: number;
}

export interface PlanoDietaEditavel {
  id: string;
  usuario_id?: string;
  plano_ia_id?: string | null;
  plano_json: PlanoIAGerado;
  ativo: boolean;
}

export interface PlanoIAAtivo {
  id: string;
  plano_gerado: PlanoIAGerado;
  plano_ia_id?: string | null;
  criado_em?: string;
}

const CHAVE_FAVORITOS_LOCAL = '@fitapp_alimentos_favoritos_v1';
const CHAVE_RECEITAS_LOCAL = '@fitapp_receitas_usuario_v1';
const CHAVE_PLANO_EDITAVEL_LOCAL = '@fitapp_plano_dieta_editavel_v1';

function tabelaNaoExiste(erro: any): boolean {
  const mensagem = String(erro?.message || erro || '');
  return (
    mensagem.includes('Could not find the table') ||
    mensagem.includes('does not exist') ||
    mensagem.includes('schema cache')
  );
}

function erroBanco(contexto: string, erro: any): Error {
  const detalhes = [erro?.code, erro?.message, erro?.details, erro?.hint]
    .filter(Boolean)
    .join(' | ');
  return new Error(`${contexto}${detalhes ? `: ${detalhes}` : ''}`);
}

async function validarSchemaPlanejamento(): Promise<void> {
  const { data, error } = await supabase.rpc('validar_compatibilidade_planejamento');
  if (error) throw erroBanco('Não foi possível validar o schema do planejamento', error);

  const resultado = Array.isArray(data) ? data[0] : data;
  if (!resultado?.valido) {
    const faltantes = (resultado?.faltantes || [])
      .map((item: any) => `${item.tabela}.${item.coluna}`)
      .join(', ');
    throw new Error(`Schema do planejamento incompatível. Colunas ausentes: ${faltantes || 'não identificadas'}.`);
  }
}

async function lerLocal<T>(chave: string, padrao: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(chave);
    return json ? JSON.parse(json) : padrao;
  } catch {
    return padrao;
  }
}

async function salvarLocal(chave: string, valor: unknown): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

// ------------------------------------------------------------
// 1. REPOSITÓRIO DE DIETA E NUTRIÇÃO
// ------------------------------------------------------------
export const repositorioDieta = {
  async buscarBaseAlimentos(termo?: string, limite: number = 500) {
    let query = supabase
      .from('base_alimentos')
      .select('*')
      .order('nome', { ascending: true })
      .limit(limite);

    if (termo && termo.trim()) {
      query = query.ilike('nome', `%${termo.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar base de alimentos:', error.message);
      return [];
    }
    return data || [];
  },

  async buscarAlimentosRecentes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('registro_refeicoes')
        .select('alimentos')
        .order('data', { ascending: false })
        .limit(30);

      if (error || !data) return [];

      const recentes = new Map<string, any>();
      
      data.forEach(registro => {
        const alimentos = typeof registro.alimentos === 'string' 
          ? JSON.parse(registro.alimentos) 
          : registro.alimentos;
        
        if (Array.isArray(alimentos)) {
          alimentos.forEach(a => {
            if (a.id && !recentes.has(String(a.id))) {
              recentes.set(String(a.id), {
                id: String(a.id),
                nome: a.nome,
                marca: a.marca,
                categoria: a.categoria,
                calorias_100g: a.calorias,
                proteinas_100g: a.proteinas,
                carboidratos_100g: a.carboidratos,
                gorduras_100g: a.gorduras,
                porcao_descricao: a.porcao
              });
            }
          });
        }
      });
      
      return Array.from(recentes.values());
    } catch (e) {
      return [];
    }
  },

  async buscarFavoritosUsuario() {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('alimentos_favoritos')
        .select('alimento_id, base_alimentos(*)')
        .eq('usuario_id', userId);

      if (error) {
        if (!tabelaNaoExiste(error)) {
          console.error('Erro ao buscar favoritos:', error.message);
        }
        const locais = await lerLocal<any[]>(CHAVE_FAVORITOS_LOCAL, []);
        return locais;
      }

      return (data || []).map((item: any) => item.base_alimentos).filter(Boolean);
    } catch {
      return lerLocal<any[]>(CHAVE_FAVORITOS_LOCAL, []);
    }
  },

  async alternarFavoritoAlimento(alimentoId: string, favorito: boolean) {
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) return;

    if (favorito) {
      const payload = [{
        usuario_id: userId,
        alimento_id: alimentoId,
      }];

      const { error } = await supabase.from('alimentos_favoritos').upsert(payload, { onConflict: 'usuario_id,alimento_id' });
      if (error && tabelaNaoExiste(error)) {
        const locais = await lerLocal<any[]>(CHAVE_FAVORITOS_LOCAL, []);
        const atualizado = [...locais.filter((item) => item.id !== alimentoId), { id: alimentoId }];
        await salvarLocal(CHAVE_FAVORITOS_LOCAL, atualizado);
      }
    } else {
      const { error } = await supabase
        .from('alimentos_favoritos')
        .delete()
        .eq('usuario_id', userId)
        .eq('alimento_id', alimentoId);

      if (error && tabelaNaoExiste(error)) {
        const locais = await lerLocal<any[]>(CHAVE_FAVORITOS_LOCAL, []);
        await salvarLocal(CHAVE_FAVORITOS_LOCAL, locais.filter((item) => item.id !== alimentoId));
      }
    }
  },

  async buscarReceitasUsuario(): Promise<ReceitaUsuario[]> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('receitas_usuario')
        .select('*')
        .eq('usuario_id', userId)
        .order('criado_em', { ascending: false });

      if (error) {
        if (!tabelaNaoExiste(error)) {
          console.error('Erro ao buscar receitas:', error.message);
        }
        return lerLocal<ReceitaUsuario[]>(CHAVE_RECEITAS_LOCAL, []);
      }

      return data || [];
    } catch {
      return lerLocal<ReceitaUsuario[]>(CHAVE_RECEITAS_LOCAL, []);
    }
  },

  async salvarReceitaUsuario(receita: Omit<ReceitaUsuario, 'id'> & { id?: string }) {
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) return;

    const payload = {
      usuario_id: userId,
      nome: receita.nome,
      descricao: receita.descricao || null,
      alimentos: receita.alimentos,
      total_calorias: receita.total_calorias || receita.alimentos.reduce((acc, a) => acc + Number(a.calorias || 0), 0),
      total_proteinas: receita.total_proteinas || receita.alimentos.reduce((acc, a) => acc + Number(a.proteinas || 0), 0),
      total_carboidratos: receita.total_carboidratos || receita.alimentos.reduce((acc, a) => acc + Number((a.carboidratos ?? a.carbos) || 0), 0),
      total_gorduras: receita.total_gorduras || receita.alimentos.reduce((acc, a) => acc + Number(a.gorduras || 0), 0),
    };

    if (receita.id) {
      const { error } = await supabase.from('receitas_usuario').update(payload).eq('id', receita.id).eq('usuario_id', userId);
      if (error && tabelaNaoExiste(error)) {
        const locais = await lerLocal<ReceitaUsuario[]>(CHAVE_RECEITAS_LOCAL, []);
        const atualizado = locais.map((item) => (item.id === receita.id ? { ...item, ...payload, id: receita.id } : item));
        await salvarLocal(CHAVE_RECEITAS_LOCAL, atualizado);
      }
    } else {
      const { data, error } = await supabase.from('receitas_usuario').insert([payload]).select('*').maybeSingle();
      if (error && tabelaNaoExiste(error)) {
        const locais = await lerLocal<ReceitaUsuario[]>(CHAVE_RECEITAS_LOCAL, []);
        await salvarLocal(CHAVE_RECEITAS_LOCAL, [{ id: `local-${Date.now()}`, ...payload }, ...locais]);
      } else if (data) {
        const locais = await lerLocal<ReceitaUsuario[]>(CHAVE_RECEITAS_LOCAL, []);
        await salvarLocal(CHAVE_RECEITAS_LOCAL, [data, ...locais]);
      }
    }
  },

  async buscarPlanoDietaEditavelAtivo(): Promise<PlanoDietaEditavel | null> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('planos_dieta_editaveis')
        .select('*')
        .eq('usuario_id', userId)
        .eq('ativo', true)
        .order('atualizado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data || null;
    } catch {
      const local = await lerLocal<PlanoDietaEditavel | null>(CHAVE_PLANO_EDITAVEL_LOCAL, null);
      return local;
    }
  },

  async buscarUltimoPlanoIA(): Promise<PlanoIAAtivo | null> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('planos_ia_gerados')
        .select('id, plano_gerado, criado_em')
        .eq('usuario_id', userId)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        plano_gerado: data.plano_gerado,
        criado_em: data.criado_em,
      };
    } catch {
      const local = await lerLocal<PlanoIAAtivo | null>(CHAVE_PLANO_EDITAVEL_LOCAL, null);
      return local ? { id: local.id, plano_gerado: local.plano_gerado, criado_em: local.criado_em } : null;
    }
  },

  async salvarPlanoDietaEditavel(plano: PlanoIAGerado, planoIAId?: string | null) {
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) return;

    const { error: erroDesativacao } = await supabase
      .from('planos_dieta_editaveis')
      .update({ ativo: false })
      .eq('usuario_id', userId);
    if (erroDesativacao) throw erroBanco('Não foi possível atualizar o plano editável anterior', erroDesativacao);

    const { error: erroPlanoEditavel } = await supabase.from('planos_dieta_editaveis').insert([{
      usuario_id: userId,
      plano_ia_id: planoIAId || null,
      plano_json: plano,
      ativo: true,
    }]);
    if (erroPlanoEditavel) throw erroBanco('Não foi possível salvar o plano editável', erroPlanoEditavel);
    await salvarLocal(CHAVE_PLANO_EDITAVEL_LOCAL, {
      id: `local-${Date.now()}`,
      usuario_id: userId,
      plano_ia_id: planoIAId || null,
      plano_json: plano,
      ativo: true,
    });
  },

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
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error('Usuário não autenticado.');

      // 1. Remove registros anteriores daquela data para evitar conflitos de restrição e garantir sincronia total com refeições excluídas
      await supabase
        .from('registro_refeicoes')
        .delete()
        .eq('usuario_id', userId)
        .eq('data', dataStr);

      if (registros.length === 0) return;

      const payload = registros.map(r => ({
        usuario_id: userId,
        id_refeicao: r.idRefeicao,
        data: dataStr,
        concluida: r.concluida,
        alimentos: r.alimentos,
      }));

      const { error } = await supabase
        .from('registro_refeicoes')
        .insert(payload);

      if (error) {
        console.error('Erro de banco ao salvar refeições:', error.message);
      }
    } catch (erro) {
      console.error('Erro de rede ao salvar refeições:', erro);
    }
  },

  /**
   * Copia o registro de alimentos de uma refeição de uma data de origem para a data de destino.
   */
  async copiarRefeicaoDeData(dataOrigem: string, dataDestino: string, nomeRefeicao: string): Promise<boolean> {
    try {
      const refeicoesOrigem = await this.buscarDietaPorData(dataOrigem);
      const origem = refeicoesOrigem.find(r => r.idRefeicao === nomeRefeicao);
      if (!origem || !origem.alimentos || origem.alimentos.length === 0) {
        return false;
      }

      const refeicoesDestino = await this.buscarDietaPorData(dataDestino);
      const atualizadas = refeicoesDestino.filter(r => r.idRefeicao !== nomeRefeicao);
      atualizadas.push({
        idRefeicao: nomeRefeicao,
        data: dataDestino,
        concluida: false,
        alimentos: origem.alimentos.map(a => ({ ...a, id: `${a.id}-copy-${Date.now()}` })),
      });

      await this.salvarDietaDoDia(dataDestino, atualizadas);
      return true;
    } catch (erro) {
      console.error('Erro ao copiar refeição:', erro);
      return false;
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
        .select('id, nome, dias_por_semana, dias_treino(id, dia_semana, nome, exercicios_plano(id, exercicio_id, nome, series))')
        .eq('ativo', true)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro de banco ao buscar treinos:', error.message);
        return [];
      }

      if (!data) return [];

      return ((data as any).dias_treino || []).map((dia: any) => ({
        id: dia.id,
        diaSemana: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dia.dia_semana] || dia.nome,
        foco: dia.nome,
        exercicios: (dia.exercicios_plano || []).map((ex: any) => {
          const serie = Array.isArray(ex.series) ? ex.series[0] || {} : {};
          return {
            id: ex.id,
            nome: ex.nome,
            grupoMuscular: 'Geral',
            series: Number(serie.quantidade || 1),
            repeticoes: Number(serie.repeticoes || 1),
            cargaKg: Number(serie.cargaKg || 0),
            tempoDescansoSegundos: Number(serie.descansoSegundos || 0),
          };
        }),
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

// ------------------------------------------------------------
// 5. REPOSITÓRIO DE PLANOS ATIVOS (ONBOARDING & ACEITE)
// ------------------------------------------------------------
export const repositorioPlano = {
  /**
   * Verifica se o usuário logado já possui algum planejamento ativo salvo.
   */
  async verificarUsuarioPossuiPlanoAtivo(): Promise<boolean> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      if (!userId) return false;

      // Verifica se existe registro na tabela planos_ia_gerados ou planos_dieta
      const { data: planosIA } = await supabase
        .from('planos_ia_gerados')
        .select('id')
        .eq('usuario_id', userId)
        .limit(1);

      if (planosIA && planosIA.length > 0) return true;

      const { data: planosDieta } = await supabase
        .from('planos_dieta')
        .select('id')
        .eq('usuario_id', userId)
        .eq('ativo', true)
        .limit(1);

      return Boolean(planosDieta && planosDieta.length > 0);
    } catch (erro) {
      console.error('Erro ao verificar plano ativo:', erro);
      return false;
    }
  },

  /**
   * Obtém os dados do perfil do usuário salvos no Supabase.
   */
  async obterPerfilUsuario(): Promise<PerfilUsuario | null> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return null;

      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('usuario_id', userId)
        .maybeSingle();

      return data || null;
    } catch {
      return null;
    }
  },

  /**
   * Obtém as últimas respostas salvas do questionário para recálculo pré-preenchido.
   */
  async obterUltimasRespostasQuestionario(): Promise<any | null> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return null;

      const { data } = await supabase
        .from('planos_ia_gerados')
        .select('respostas_questionario')
        .eq('usuario_id', userId)
        .order('criado_em', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].respostas_questionario) {
        return data[0].respostas_questionario;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Obtém as metas ativas salvas (calorias, macros, água).
   */
  async obterMetasAtivasUsuario() {
    try {
      const json = await AsyncStorage.getItem('@fitapp_metas_ativas_v1');
      if (json) return JSON.parse(json);
    } catch {}
    return {
      caloriasMeta: 0,
      proteinaMeta: 0,
      carboidratoMeta: 0,
      gorduraMeta: 0,
      metaAguaMl: 0,
    };
  },

  /**
   * Salva o plano aceito pelo usuário como PLANO ATIVO no Supabase e no AsyncStorage.
   * Atualiza perfis, planos_dieta, planos_treino e reflete imediatamente no app.
   */
  async salvarPlanoComoAtivo(plano: any, respostas: any): Promise<void> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error('Usuário não autenticado para aceitar o planejamento.');

      // Valida tudo antes do primeiro insert para evitar estado parcial.
      await validarSchemaPlanejamento();

      // 1. Atualiza Perfil do usuário e grava histórico na tabela questionarios
      if (respostas) {
        // Grava no histórico de questionarios do usuário
        try {
          await supabase.from('questionarios').insert([{
            usuario_id: userId,
            respostas,
          }]);
        } catch (errQuest) {
          console.warn('Não foi possível gravar na tabela questionarios:', errQuest);
        }

        // Salva/atualiza perfil — não bloqueia se falhar
        // NOTA: preferencias_json foi removido — dados já vão para tabela 'questionarios'
        const { error: erroPerfil } = await supabase
          .from('perfis')
          .upsert([{
            usuario_id: userId,
            nome: respostas.nome,
            idade: respostas.idade,
            sexo: respostas.sexo || 'masculino',
            peso_kg: respostas.pesoKg || 70,
            altura_cm: respostas.alturaCm || 175,
            nivel_experiencia: respostas.nivelExperiencia,
            nivel_atividade: respostas.nivelAtividade,
            objetivo: respostas.objetivo || 'hipertrofia',
            frequencia_semanal: respostas.frequenciaSemanal || 4,
            sistema_unidades: 'metrico',
          }], { onConflict: 'usuario_id' });
        if (erroPerfil) {
          // Não bloqueia o salvamento do plano — log claro para debug
          console.error('⚠️ Erro ao atualizar perfil (não fatal):', erroPerfil.message, erroPerfil.code);
        }
      }

      // 2. Salva as metas localmente. O plano remoto completo é criado abaixo.
      if (plano.resumo) {
        await AsyncStorage.setItem('@fitapp_metas_ativas_v1', JSON.stringify({
          caloriasMeta: plano.resumo.caloriasAlvo,
          proteinaMeta: plano.resumo.macros.proteinas,
          carboidratoMeta: plano.resumo.macros.carboidratos,
          gorduraMeta: plano.resumo.macros.gorduras,
          metaAguaMl: plano.resumo.metaAguaMl,
        }));
      }

      // 3. Salva Plano de Treino no Supabase e Localmente
      if (plano.treino && Array.isArray(plano.treino.dias)) {
        await supabase
          .from('planos_treino')
          .delete()
          .eq('usuario_id', userId);

        const { error: erroPlanoTreino } = await supabase.from('planos_treino').insert([{
          usuario_id: userId,
          // Campos mantidos para instalações antigas do schema.
          dia_semana: plano.treino.dias?.[0]?.nome || 'semanal',
          foco: plano.treino.nomeDivisao || 'Plano de treino',
          exercicios: plano.treino.dias || [],
          nome: plano.treino.nomeDivisao || 'Plano de treino',
          dias_por_semana: Math.max(2, Math.min(6, plano.treino.dias.filter((d: any) => Array.isArray(d.exercicios) && d.exercicios.length > 0).length)),
          ativo: true,
        }]).select('id').single();

        if (erroPlanoTreino) throw erroBanco('Não foi possível criar o plano de treino', erroPlanoTreino);

        const { data: planoTreinoAtivo } = await supabase
          .from('planos_treino')
          .select('id')
          .eq('usuario_id', userId)
          .eq('ativo', true)
          .order('criado_em', { ascending: false })
          .limit(1)
          .single();

        if (!planoTreinoAtivo) throw new Error('Plano de treino não foi criado.');

        const diasTreino = plano.treino.dias.map((dia: any) => ({
          plano_treino_id: planoTreinoAtivo.id,
          dia_semana: Math.max(0, Math.min(6, Number(dia.diaSemana))),
          nome: dia.nome || 'Treino',
        }));
        const { data: diasCriados, error: erroDias } = await supabase
          .from('dias_treino')
          .insert(diasTreino)
          .select('id, dia_semana');
        if (erroDias || !diasCriados) throw erroBanco('Não foi possível criar os dias de treino', erroDias);

        const exerciciosPlano = plano.treino.dias.flatMap((dia: any, diaIdx: number) => {
          // Busca o dia pelo índice de inserção para evitar confusão entre dias com mesmo diaSemana
          const diaCriado = diasCriados[diaIdx];
          return (dia.exercicios || []).map((ex: any, ordem: number) => ({
            dia_treino_id: diaCriado?.id,
            exercicio_id: ex.exercicioId || null, // nullable — salva mesmo sem ID do banco
            nome: ex.nome,
            ordem: ordem + 1,
            series: [{ numero: 1, repeticoes: ex.repeticoes, descansoSegundos: ex.descansoSegundos, quantidade: ex.series }],
          }));
        }).filter((item: any) => item.dia_treino_id); // só descarta se não encontrou o dia
        if (exerciciosPlano.length > 0) {
          const { error: erroExercicios } = await supabase.from('exercicios_plano').insert(exerciciosPlano);
          if (erroExercicios) throw erroBanco('Não foi possível salvar os exercícios do plano', erroExercicios);
        }

        const treinosLocais = plano.treino.dias.map((d: any, idx: number) => ({
          id: `dia-${Date.now()}-${idx}`,
          diaSemana: d.nome || `Dia ${idx + 1}`,
          foco: d.nome || 'Treino Especial',
          exercicios: (d.exercicios || []).map((ex: any, exIdx: number) => ({
            id: `ex-${Date.now()}-${exIdx}`,
            nome: ex.nome,
            grupoMuscular: 'Geral',
            series: ex.series || 4,
            repeticoes: ex.repeticoes || 10,
            cargaKg: 20,
            tempoDescansoSegundos: ex.descansoSegundos || 60,
          })),
        }));

        await AsyncStorage.setItem('@fitapp_plano_treino_custom_v1', JSON.stringify(treinosLocais));
        const mapeamento = plano.treino.dias.reduce((acc: Record<string, string>, dia: any, idx: number) => {
          const abrev = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][Math.max(0, Math.min(6, Number(dia.diaSemana)))];
          acc[abrev] = treinosLocais[idx].id;
          return acc;
        }, {});
        await AsyncStorage.setItem('@fitapp_mapeamento_semanal_v1', JSON.stringify(mapeamento));
      }

      // 4. Salva Dieta localmente para consumo imediato
      if (plano.dieta && Array.isArray(plano.dieta.refeicoes)) {
        const refeicoesLocais = plano.dieta.refeicoes.map((r: any, idx: number) => ({
          id: `ref-${Date.now()}-${idx}`,
          nome: r.nome || `Refeição ${idx + 1}`,
          horario: r.horario || '08:00',
          concluida: false,
          alimentos: (r.alimentos || []).map((a: any, aIdx: number) => ({
            id: `ali-${Date.now()}-${aIdx}`,
            nome: a.nome,
            porcao: a.porcao || '100g',
            calorias: Number(a.calorias || 0),
            proteinas: Number(a.proteinas || 0),
            carbos: Number(a.carboidratos ?? a.carbos ?? 0),
            gorduras: Number(a.gorduras || 0),
          })),
        }));

        const hojeStr = new Date().toISOString().split('T')[0];
        const paraSalvar = refeicoesLocais.map((ref: any) => ({
          idRefeicao: ref.nome,
          data: hojeStr,
          concluida: false,
          alimentos: ref.alimentos,
        }));

        await AsyncStorage.setItem(`@fitapp_historico_dieta_${hojeStr}`, JSON.stringify(paraSalvar));

        await supabase.from('planos_dieta').update({ ativo: false }).eq('usuario_id', userId);
        const { data: planoDieta, error: erroDieta } = await supabase
          .from('planos_dieta')
          .insert([{
            usuario_id: userId,
            // Aliases históricos e colunas obrigatórias da tabela planos_dieta
            meta_calorias: plano.resumo?.caloriasAlvo || 0,
            calorias_alvo: plano.resumo?.caloriasAlvo || 0,
            meta_calories: plano.resumo?.caloriasAlvo || 0,
            meta_proteinas_g: plano.resumo?.macros?.proteinas || 0,
            proteinas_alvo_g: plano.resumo?.macros?.proteinas || 0,
            meta_protein_g: plano.resumo?.macros?.proteinas || 0,
            meta_carbos_g: plano.resumo?.macros?.carboidratos || 0,
            meta_carboidratos_g: plano.resumo?.macros?.carboidratos || 0,
            carboidratos_alvo_g: plano.resumo?.macros?.carboidratos || 0,
            meta_carbs_g: plano.resumo?.macros?.carboidratos || 0,
            meta_gorduras_g: plano.resumo?.macros?.gorduras || 0,
            gorduras_alvo_g: plano.resumo?.macros?.gorduras || 0,
            meta_fat_g: plano.resumo?.macros?.gorduras || 0,
            meta_agua_ml: plano.resumo?.metaAguaMl || 0,
            water_goal_ml: plano.resumo?.metaAguaMl || 0,
            ativo: true,
          }])
          .select('id')
          .single();
        if (erroDieta || !planoDieta) throw erroBanco('Não foi possível criar o plano de dieta', erroDieta);

        const refeicoesPlano = [0, 1, 2, 3, 4, 5, 6].flatMap((diaSemana) =>
          plano.dieta.refeicoes.map((ref: any) => ({
            plano_dieta_id: planoDieta.id,
            dia_semana: diaSemana,
            tipo: obterTipoRefeicao(ref.nome),
            nome: ref.nome,
            horario_sugerido: ref.horario || null,
          }))
        );
        const { data: refeicoesCriadas, error: erroRefeicoes } = await supabase
          .from('refeicoes_plano')
          .insert(refeicoesPlano)
          .select('id, dia_semana, nome');
        if (erroRefeicoes || !refeicoesCriadas) {
          throw erroBanco('Não foi possível salvar as refeições planejadas. Verifique se a migration 007 foi aplicada', erroRefeicoes);
        }

        const alimentosPlano = refeicoesCriadas.flatMap((ref: any) => {
          const alimentoRef = plano.dieta.refeicoes.find((item: any) => item.nome === ref.nome);
          return (alimentoRef?.alimentos || []).map((alimento: any) => ({
            refeicao_plano_id: ref.id,
            alimento_id: Number(alimento.alimentoId),
            nome: alimento.nome,
            porcao_gramas: extrairGramas(alimento.porcao),
            calorias: Number(alimento.calorias || 0),
            proteinas: Number(alimento.proteinas || 0),
            carboidratos: Number(alimento.carboidratos || 0),
            gorduras: Number(alimento.gorduras || 0),
          }));
        }).filter((item: any) => item.alimento_id != null && !isNaN(item.alimento_id));

        if (alimentosPlano.length > 0) {
          const { error: erroAlimentos } = await supabase.from('alimentos_refeicao').insert(alimentosPlano);
          if (erroAlimentos) throw erroBanco('Não foi possível salvar os alimentos planejados', erroAlimentos);
        }
      }

      await repositorioDieta.salvarPlanoDietaEditavel(plano, null);
    } catch (erro) {
      console.error('Erro ao salvar plano ativo:', erro);
      throw erro;
    }
  },
};

function extrairGramas(porcao: unknown): number {
  if (typeof porcao === 'number') return porcao > 0 ? porcao : 100;
  const str = String(porcao || '');
  const encontrado = str.match(/(\d+(?:[.,]\d+)?)/);
  return encontrado ? Number(encontrado[1].replace(',', '.')) : 100;
}

function obterTipoRefeicao(nome: string): string {
  const texto = String(nome || '').toLowerCase();
  if (texto.includes('café') || texto.includes('manhã')) return 'cafe_da_manha';
  if (texto.includes('lanche')) return 'lanche_tarde';
  if (texto.includes('jantar')) return 'jantar';
  if (texto.includes('ceia')) return 'ceia';
  return 'almoco';
}
