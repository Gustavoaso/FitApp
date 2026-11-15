// Gamificação (RN22): grava a sessão de treino no servidor e lê o resumo calculado no banco.
// O app nunca envia XP: ele só registra o treino, e a função do banco faz a conta.
import { supabase } from '@/compartilhado/supabase';
import {
  lerResumoGamificacao,
  type ResumoGamificacao,
} from '@/compartilhado/utilidades/gamificacao';

/** Resumo do usuário logado; null offline ou sem sessão. `hoje` em YYYY-MM-DD. */
export async function buscarResumoGamificacao(hoje: string): Promise<ResumoGamificacao | null> {
  try {
    const { data, error } = await supabase.rpc('resumo_gamificacao', { p_hoje: hoje });
    return error ? null : lerResumoGamificacao(data);
  } catch {
    return null;
  }
}

export interface SessaoConcluida {
  data: string;
  nomeTreino: string;
  duracaoMinutos: number;
  kcalEstimadas: number | null;
}

/** Grava o treino concluído. Falha de rede não trava o app: o histórico local já guarda. */
export async function gravarSessaoTreino(sessao: SessaoConcluida): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const usuarioId = auth.user?.id;
    if (!usuarioId) return false;
    const { error } = await supabase.from('sessoes_treino').insert({
      usuario_id: usuarioId,
      data: sessao.data,
      finalizado_em: new Date().toISOString(),
      nome_treino: sessao.nomeTreino,
      duracao_minutos: sessao.duracaoMinutos,
      kcal_estimadas: sessao.kcalEstimadas === null ? null : Math.round(sessao.kcalEstimadas),
    });
    return !error;
  } catch {
    return false;
  }
}
