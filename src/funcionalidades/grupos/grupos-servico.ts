// Acesso aos grupos (RN23, RN24). Tudo por RPC: as tabelas não são lidas pelo app e nenhuma
// resposta traz id de autenticação, e-mail ou dado de saúde de outra pessoa.
import { supabase } from '@/compartilhado/supabase';
import type { Database } from '@/compartilhado/tipos/database';
import {
  mensagemDeErro,
  type Checkin,
  type Grupo,
  type LinhaRanking,
  type ModoGrupo,
} from './grupos';

type Retorno<F extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][F]['Returns'];

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

const FALHA_REDE = 'Sem conexão. Tente de novo.';

async function chamar<T>(
  executar: () => PromiseLike<{
    data: T | null;
    error: { message?: string; code?: string } | null;
  }>,
): Promise<Resultado<T | null>> {
  try {
    const { data, error } = await executar();
    return error ? { ok: false, erro: mensagemDeErro(error) } : { ok: true, valor: data };
  } catch {
    return { ok: false, erro: FALHA_REDE };
  }
}

export async function buscarApelido(): Promise<string | null> {
  try {
    const { data } = await supabase.from('apelidos_usuario').select('apelido').maybeSingle();
    return data?.apelido ?? null;
  } catch {
    return null;
  }
}

export async function salvarApelido(apelido: string): Promise<Resultado<null>> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const usuarioId = auth.user?.id;
    if (!usuarioId) return { ok: false, erro: FALHA_REDE };
    const { error } = await supabase
      .from('apelidos_usuario')
      .upsert({ usuario_id: usuarioId, apelido });
    return error ? { ok: false, erro: mensagemDeErro(error) } : { ok: true, valor: null };
  } catch {
    return { ok: false, erro: FALHA_REDE };
  }
}

export async function listarGrupos(): Promise<Resultado<Grupo[]>> {
  const r = await chamar<Retorno<'meus_grupos'>>(() => supabase.rpc('meus_grupos'));
  if (!r.ok) return r;
  return {
    ok: true,
    valor: (r.valor ?? []).map((g) => ({
      id: g.id,
      nome: g.nome,
      modo: g.modo as ModoGrupo,
      duracaoSemanas: g.duracao_semanas,
      fim: g.fim,
      encerrado: g.encerrado,
      ehCriador: g.eh_criador,
      codigo: g.codigo,
      membros: g.membros,
      checkinAutomatico: g.checkin_automatico,
    })),
  };
}

export async function criarGrupo(
  nome: string,
  modo: ModoGrupo,
  semanas: number | null,
): Promise<Resultado<{ id: string; codigo: string } | null>> {
  const r = await chamar(() =>
    supabase.rpc('criar_grupo', { p_nome: nome, p_modo: modo, p_semanas: semanas ?? undefined }),
  );
  if (!r.ok) return r;
  const v = r.valor as { id?: string; codigo?: string } | null;
  return v?.id && v.codigo
    ? { ok: true, valor: { id: v.id, codigo: v.codigo } }
    : { ok: false, erro: mensagemDeErro(null) };
}

export const entrarNoGrupo = (codigo: string) =>
  chamar(() => supabase.rpc('entrar_grupo', { p_codigo: codigo }));
export const sairDoGrupo = (grupo: string) =>
  chamar(() => supabase.rpc('sair_grupo', { p_grupo: grupo }));
export const encerrarGrupo = (grupo: string) =>
  chamar(() => supabase.rpc('encerrar_grupo', { p_grupo: grupo }));
export const removerMembro = (grupo: string, membro: string) =>
  chamar(() => supabase.rpc('remover_membro', { p_grupo: grupo, p_membro: membro }));
export const definirCheckinAutomatico = (grupo: string, ativo: boolean) =>
  chamar(() => supabase.rpc('definir_checkin_automatico', { p_grupo: grupo, p_ativo: ativo }));

export async function buscarRanking(grupo: string): Promise<Resultado<LinhaRanking[]>> {
  const r = await chamar<Retorno<'ranking_grupo'>>(() =>
    supabase.rpc('ranking_grupo', { p_grupo: grupo }),
  );
  if (!r.ok) return r;
  return {
    ok: true,
    valor: (r.valor ?? []).map((l) => ({
      membroId: l.membro_id,
      apelido: l.apelido,
      treinos: l.treinos,
      minutos: l.minutos,
      pontos: l.pontos,
      posicao: l.posicao,
      ehVoce: l.eh_voce,
    })),
  };
}

export async function buscarFeed(grupo: string): Promise<Resultado<Checkin[]>> {
  const r = await chamar<Retorno<'feed_grupo'>>(() =>
    supabase.rpc('feed_grupo', { p_grupo: grupo }),
  );
  if (!r.ok) return r;
  return {
    ok: true,
    valor: (r.valor ?? []).map((c) => ({
      id: c.id,
      apelido: c.apelido,
      nomeTreino: c.nome_treino,
      minutos: c.minutos,
      kcal: c.kcal,
      pontos: c.pontos,
      data: c.data,
      ehVoce: c.eh_voce,
    })),
  };
}
