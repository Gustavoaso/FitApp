// Grava a sessão de treino concluída no servidor (base da aderência RN28 e dos grupos).
import { supabase } from '@/compartilhado/supabase';

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
      // O banco recusa fora de 1..240 min e 0..3000 kcal; limita aqui para não perder o treino.
      duracao_minutos: Math.min(240, Math.max(1, Math.round(sessao.duracaoMinutos))),
      kcal_estimadas:
        sessao.kcalEstimadas === null
          ? null
          : Math.min(3000, Math.max(0, Math.round(sessao.kcalEstimadas))),
    });
    return !error;
  } catch {
    return false;
  }
}
