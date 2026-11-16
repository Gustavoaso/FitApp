// ============================================================
// SERVIÇO: Fotos no Storage (RN31)
// ============================================================
// Único caminho de envio de foto: redimensiona (1080 px, JPEG 0,7), confere 5 MB,
// envia para <usuario_id>/<arquivo>.jpg num bucket privado e lê por URL assinada.
// ============================================================

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/compartilhado/supabase';

export type BucketFoto = 'avatares' | 'checkins' | 'posts' | 'banners' | 'evolucao';

const LARGURA_MAXIMA = 1080;
const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const VALIDADE_URL_SEGUNDOS = 3600;

/** Envia a foto e devolve o caminho no bucket (guarde no registro). Lança erro se falhar. */
export async function enviarFoto(bucket: BucketFoto, uri: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const usuarioId = auth.user?.id;
  if (!usuarioId) throw new Error('Sessão expirada');

  const foto = await manipulateAsync(uri, [{ resize: { width: LARGURA_MAXIMA } }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  const bytes = await (await fetch(foto.uri)).arrayBuffer();
  if (bytes.byteLength > TAMANHO_MAXIMO) throw new Error('Foto maior que 5 MB');

  const caminho = `${usuarioId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(caminho, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return caminho;
}

/** URL temporária para exibir a foto; null se não houver caminho ou não puder ver. */
export async function urlDaFoto(bucket: BucketFoto, caminho: unknown): Promise<string | null> {
  if (typeof caminho !== 'string' || !caminho) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(caminho, VALIDADE_URL_SEGUNDOS);
  return error ? null : data.signedUrl;
}

/** Avatar do próprio usuário (botão do topo); null se não tiver. */
export async function urlDoMeuAvatar(): Promise<string | null> {
  const { data } = await supabase.from('apelidos_usuario').select('avatar_caminho').maybeSingle();
  return urlDaFoto('avatares', data?.avatar_caminho);
}
