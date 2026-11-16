// Acesso à Comunidade (RN30). Feed e contadores vêm de funções do banco (respeitam RLS).
import { supabase } from '@/compartilhado/supabase';
import type { Database } from '@/compartilhado/tipos/database';
import { enviarFoto } from '@/compartilhado/servicos/foto-servico';

export type Aba = 'seguindo' | 'para_voce';

export type Post = {
  id: string;
  autorId: string;
  apelido: string;
  usuario: string | null;
  avatarCaminho: string | null;
  texto: string;
  fotoCaminho: string | null;
  criadoEm: string;
  curtidas: number;
  respostas: number;
  reposts: number;
  curtiu: boolean;
  /** Preenchidos em repost (simples ou com comentário): o post original. */
  repostDe: string | null;
  original: { apelido: string; usuario: string | null; texto: string; foto: string | null } | null;
  repostei: boolean;
};

export type PerfilComunidade = {
  apelido: string;
  usuario: string | null;
  bio: string | null;
  avatarCaminho: string | null;
  seguidores: number;
  seguindo: number;
  posts: number;
  euSigo: boolean;
};

export type Prontidao = 'ok' | 'sem-perfil' | 'sem-termos';

/** Lista posts; null se falhar. `alvo` é o autor (aba "usuario") ou o post pai (aba "respostas"). */
export async function listarPosts(
  aba: Aba | 'usuario' | 'respostas',
  alvo?: string,
): Promise<Post[] | null> {
  const args: Database['public']['Functions']['feed_posts']['Args'] = { p_aba: aba };
  if (alvo) args[aba === 'respostas' ? 'p_pai' : 'p_autor'] = alvo;
  const { data, error } = await supabase.rpc('feed_posts', args);
  if (error || !data) return null;
  return (data as Database['public']['Functions']['feed_posts']['Returns']).map((p) => ({
    id: p.id,
    autorId: p.autor_id,
    apelido: p.apelido,
    usuario: p.usuario,
    avatarCaminho: p.avatar_caminho,
    texto: p.texto,
    fotoCaminho: p.foto_caminho,
    criadoEm: p.criado_em,
    curtidas: Number(p.curtidas),
    respostas: Number(p.respostas),
    reposts: Number(p.reposts),
    curtiu: p.curtiu,
    repostDe: p.repost_de,
    original: p.repost_de
      ? {
          apelido: p.original_apelido ?? '',
          usuario: p.original_usuario,
          texto: p.original_texto ?? '',
          foto: p.original_foto,
        }
      : null,
    repostei: p.repostei,
  }));
}

export async function carregarPerfilComunidade(id: string): Promise<PerfilComunidade | null> {
  const { data, error } = await supabase.rpc('perfil_comunidade', { p_usuario: id });
  const p = data?.[0];
  if (error || !p) return null;
  return {
    apelido: p.apelido,
    usuario: p.usuario,
    bio: p.bio,
    avatarCaminho: p.avatar_caminho,
    seguidores: Number(p.seguidores),
    seguindo: Number(p.seguindo),
    posts: Number(p.posts),
    euSigo: p.eu_sigo,
  };
}

/** Pode postar? Precisa de apelido, @usuario e termos aceitos. */
export async function verificarProntidao(): Promise<Prontidao> {
  const { data } = await supabase
    .from('apelidos_usuario')
    .select('usuario, termos_comunidade_em')
    .eq('usuario_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .maybeSingle();
  if (!data?.usuario) return 'sem-perfil';
  return data.termos_comunidade_em ? 'ok' : 'sem-termos';
}

export async function aceitarTermos(): Promise<boolean> {
  const { error } = await supabase
    .from('apelidos_usuario')
    .update({ termos_comunidade_em: new Date().toISOString() })
    .not('usuario_id', 'is', null);
  return !error;
}

const MENSAGENS: Record<string, string> = {
  texto_ofensivo: 'Seu texto tem palavras não permitidas na Comunidade.',
  limite_diario: 'Você chegou ao limite de 30 posts por hoje.',
};

/** Publica post, resposta (`paiId`) ou repost (`repostDe`). Devolve null se deu certo, ou a mensagem. */
export async function publicar(
  texto: string,
  fotoUri: string | null,
  destino: { paiId?: string; repostDe?: string } = {},
): Promise<string | null> {
  try {
    const fotoCaminho = fotoUri ? await enviarFoto('posts', fotoUri) : null;
    const { error } = await supabase.from('posts').insert({
      texto,
      foto_caminho: fotoCaminho,
      pai_id: destino.paiId ?? null,
      repost_de: destino.repostDe ?? null,
    });
    if (error && fotoCaminho) await supabase.storage.from('posts').remove([fotoCaminho]);
    return error ? (MENSAGENS[error.message] ?? 'Não foi possível publicar.') : null;
  } catch {
    return 'Não foi possível publicar.';
  }
}

/** Repost simples (sem comentário) liga e desliga; o RLS garante que só apaga o próprio. */
export async function alternarRepost(postId: string, repostei: boolean): Promise<boolean> {
  if (!repostei) return (await publicar('', null, { repostDe: postId })) === null;
  const { error } = await supabase.from('posts').delete().eq('repost_de', postId).eq('texto', '');
  return !error;
}

export async function denunciar(
  motivo: string,
  alvo: { postId: string } | { usuarioId: string },
): Promise<boolean> {
  const { error } = await supabase.from('denuncias').insert({
    motivo,
    post_id: 'postId' in alvo ? alvo.postId : null,
    usuario_denunciado_id: 'usuarioId' in alvo ? alvo.usuarioId : null,
  });
  // 23505 = já denunciou antes: para a pessoa, o resultado é o mesmo.
  return !error || error.code === '23505';
}

export async function bloquearUsuario(usuarioId: string): Promise<boolean> {
  const { error } = await supabase.from('bloqueios').insert({ bloqueado_id: usuarioId });
  return !error || error.code === '23505';
}

export async function apagarPost(post: Post): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) return false;
  if (post.fotoCaminho) await supabase.storage.from('posts').remove([post.fotoCaminho]);
  return true;
}

export async function alternarCurtida(postId: string, curtiu: boolean): Promise<boolean> {
  const q = curtiu
    ? supabase.from('post_curtidas').delete().eq('post_id', postId)
    : supabase.from('post_curtidas').insert({ post_id: postId });
  return !(await q).error;
}

export async function alternarSeguir(id: string, segue: boolean): Promise<boolean> {
  const q = segue
    ? supabase.from('seguidores').delete().eq('seguido_id', id)
    : supabase.from('seguidores').insert({ seguido_id: id });
  return !(await q).error;
}
