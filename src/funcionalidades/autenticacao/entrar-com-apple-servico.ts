import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/compartilhado/supabase';

export type ResultadoApple =
  { status: 'ok' } | { status: 'cancelado' } | { status: 'erro'; mensagem: string };

const MENSAGEM_ERRO = 'Não foi possível entrar com a Apple. Tente de novo.';

/** Pede o token à Apple e troca por uma sessão do Supabase. */
export async function entrarComApple(): Promise<ResultadoApple> {
  try {
    const credencial = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credencial.identityToken) return { status: 'erro', mensagem: MENSAGEM_ERRO };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credencial.identityToken,
    });
    return error ? { status: 'erro', mensagem: MENSAGEM_ERRO } : { status: 'ok' };
  } catch (e) {
    // Fechar a folha da Apple não é erro: a pessoa só desistiu.
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return { status: 'cancelado' };
    return { status: 'erro', mensagem: MENSAGEM_ERRO };
  }
}
