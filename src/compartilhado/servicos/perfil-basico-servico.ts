// Cria (ou completa) apelido + @usuario de uma vez; a Comunidade e o Perfil usam o mesmo fluxo.
import { supabase } from '@/compartilhado/supabase';

export async function carregarApelidoAtual(): Promise<string | null> {
  const { data } = await supabase.from('apelidos_usuario').select('apelido').maybeSingle();
  return data?.apelido ?? null;
}

/** Devolve null se salvou, ou a mensagem de erro. */
export async function salvarApelidoEUsuario(
  apelido: string,
  usuario: string,
): Promise<string | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return 'Entre na sua conta de novo.';
    const { error } = await supabase
      .from('apelidos_usuario')
      .upsert({ usuario_id: auth.user.id, apelido, usuario });
    if (!error) return null;
    return error.code === '23505'
      ? 'Esse apelido ou @usuario já existe.'
      : 'Não foi possível salvar.';
  } catch {
    return 'Não foi possível salvar.';
  }
}
