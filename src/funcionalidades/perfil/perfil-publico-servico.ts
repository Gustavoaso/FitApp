// Perfil público do próprio usuário (apelidos_usuario). Sem linha = ainda sem apelido (RN24).
import { supabase } from '@/compartilhado/supabase';
import { enviarFoto } from '@/compartilhado/servicos/foto-servico';

export type PerfilPublico = {
  apelido: string;
  usuario: string | null;
  bio: string | null;
  avatarCaminho: string | null;
};

export async function carregarPerfilPublico(): Promise<PerfilPublico | null> {
  const { data, error } = await supabase
    .from('apelidos_usuario')
    .select('apelido, usuario, bio, avatar_caminho')
    .maybeSingle();
  if (error || !data) return null;
  return {
    apelido: data.apelido,
    usuario: data.usuario,
    bio: data.bio,
    avatarCaminho: data.avatar_caminho,
  };
}

/** Devolve null se salvou, ou a mensagem de erro para a tela. */
export async function salvarPerfilPublico(
  usuario: string,
  bio: string | null,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('apelidos_usuario')
    .update({ usuario, bio })
    .not('usuario_id', 'is', null)
    .select('usuario_id');
  if (error)
    return error.code === '23505' ? 'Esse @usuario já existe.' : 'Não foi possível salvar.';
  return data.length ? null : 'Escolha um apelido primeiro (aba Grupos).';
}

/** Envia o avatar novo; o antigo é apagado (RN31: nada de foto sobrando). */
export async function trocarAvatar(uri: string, antigo: string | null): Promise<string> {
  const caminho = await enviarFoto('avatares', uri);
  const { error } = await supabase
    .from('apelidos_usuario')
    .update({ avatar_caminho: caminho })
    .not('usuario_id', 'is', null);
  if (error) throw error;
  if (antigo) await supabase.storage.from('avatares').remove([antigo]);
  return caminho;
}
