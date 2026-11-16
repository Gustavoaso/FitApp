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

/** Lista posts; null se falhar. `autor` só vale na aba "usuario". */
export async function listarPosts(aba: Aba | 'usuario', autor?: string): Promise<Post[] | null> {
  const args: Database['public']['Functions']['feed_posts']['Args'] = { p_aba: aba };
  if (autor) args.p_autor = autor;
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

/** Devolve null se publicou, ou a mensagem de erro. */
export async function publicar(texto: string, fotoUri: string | null): Promise<string | null> {
  try {
    const fotoCaminho = fotoUri ? await enviarFoto('posts', fotoUri) : null;
    const { error } = await supabase.from('posts').insert({ texto, foto_caminho: fotoCaminho });
    if (error && fotoCaminho) await supabase.storage.from('posts').remove([fotoCaminho]);
    return error ? 'Não foi possível publicar.' : null;
  } catch {
    return 'Não foi possível publicar.';
  }
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
