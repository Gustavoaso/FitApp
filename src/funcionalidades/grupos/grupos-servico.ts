// Acesso aos grupos (RN23, RN24). Tudo por RPC: as tabelas não são lidas pelo app e nenhuma
// resposta traz id de autenticação, e-mail ou dado de saúde de outra pessoa.
import { supabase } from '@/compartilhado/supabase';
import type { Database } from '@/compartilhado/tipos/database';
import { mensagemDeErro, type Checkin, type Grupo, type LinhaRanking } from './grupos';

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
      descricao: g.descricao,
      banner: g.banner,
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
  semanas: number | null,
  extras: { descricao?: string | null; banner?: string | null; inicio?: string | null } = {},
): Promise<Resultado<{ id: string; codigo: string } | null>> {
  const r = await chamar(() =>
    supabase.rpc('criar_grupo', {
      p_nome: nome,
      p_semanas: semanas ?? undefined,
      p_descricao: extras.descricao ?? undefined,
      p_banner: extras.banner ?? undefined,
      p_inicio: extras.inicio ?? undefined,
    }),
  );
  if (!r.ok) return r;
  const v = r.valor as { id?: string; codigo?: string } | null;
  return v?.id && v.codigo
    ? { ok: true, valor: { id: v.id, codigo: v.codigo } }
    : { ok: false, erro: mensagemDeErro(null) };
}

// Só o criador (o banco confere). fim null = contínuo.
export const editarGrupo = (
  grupo: string,
  d: { nome: string; descricao: string | null; banner: string | null; fim: string | null },
) =>
  chamar(() =>
    supabase.rpc('editar_grupo', {
      p_grupo: grupo,
      p_nome: d.nome,
      p_descricao: d.descricao ?? undefined,
      p_banner: d.banner ?? undefined,
      p_fim: d.fim ?? undefined,
    }),
  );

// O banco devolve null (sem erro) para código errado, para registrar a tentativa.
export async function entrarNoGrupo(codigo: string): Promise<Resultado<string | null>> {
  const r = await chamar<string>(() => supabase.rpc('entrar_grupo', { p_codigo: codigo }));
  if (r.ok && !r.valor) return { ok: false, erro: mensagemDeErro({ message: 'codigo_invalido' }) };
  return r;
}
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
      atividade: c.atividade,
      nomeTreino: c.nome_treino,
      descricao: c.descricao,
      fotoCaminho: c.foto_caminho,
      minutos: c.minutos,
      kcal: c.kcal,
      data: c.data,
      curtidas: c.curtidas,
      curtiu: c.curtiu,
      comentarios: c.comentarios,
      ehVoce: c.eh_voce,
    })),
  };
}

export const curtirCheckin = (checkin: string) =>
  chamar(() => supabase.rpc('alternar_curtida_checkin', { p_checkin: checkin }));
export const comentarCheckin = (checkin: string, texto: string) =>
  chamar(() => supabase.rpc('comentar_checkin', { p_checkin: checkin, p_texto: texto }));
export const registrarCheckinManual = (
  grupo: string,
  dados: { atividade: string; minutos: number; data: string; descricao?: string; foto?: string },
) =>
  chamar(() =>
    supabase.rpc('registrar_checkin_manual', {
      p_grupo: grupo,
      p_atividade: dados.atividade,
      p_minutos: dados.minutos,
      p_data: dados.data,
      p_descricao: dados.descricao,
      p_foto: dados.foto,
    }),
  );

export interface Comentario {
  id: string;
  apelido: string;
  texto: string;
  ehVoce: boolean;
}

export async function listarComentarios(checkin: string): Promise<Resultado<Comentario[]>> {
  const r = await chamar<Retorno<'comentarios_checkin'>>(() =>
    supabase.rpc('comentarios_checkin', { p_checkin: checkin }),
  );
  if (!r.ok) return r;
  return {
    ok: true,
    valor: (r.valor ?? []).map((c) => ({
      id: c.id,
      apelido: c.apelido,
      texto: c.texto,
      ehVoce: c.eh_voce,
    })),
  };
}

export interface RegistroEvolucao {
  id: string;
  apelido: string;
  ehVoce: boolean;
  data: string;
  pesoKg: number | null;
  fotos: (string | null)[]; // frente, lado, costas
}

/** Fotos de evolução que os membros compartilharam com este grupo (o banco já filtra). */
export async function buscarEvolucaoGrupo(grupo: string): Promise<Resultado<RegistroEvolucao[]>> {
  const r = await chamar<Retorno<'evolucao_grupo'>>(() =>
    supabase.rpc('evolucao_grupo', { p_grupo: grupo }),
  );
  if (!r.ok) return r;
  return {
    ok: true,
    valor: (r.valor ?? []).map((e) => ({
      id: e.registro_id,
      apelido: e.apelido,
      ehVoce: e.eh_voce,
      data: e.data,
      pesoKg: e.peso_kg,
      fotos: [e.foto_frente, e.foto_lado, e.foto_costas],
    })),
  };
}
