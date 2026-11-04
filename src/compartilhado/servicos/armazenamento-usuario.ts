// ============================================================
// SERVIÇO: Armazenamento local por usuário
// ============================================================
// Progresso, metas, plano e histórico ficam no AsyncStorage do aparelho.
// A chave leva o id do usuário logado para que outra conta no mesmo
// aparelho nunca leia os dados da anterior; no logout tudo é apagado.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIXO = '@fitapp_';

// Caches das bases públicas (exercícios), iguais para todos: sobrevivem ao logout.
const CHAVES_GLOBAIS = ['@fitapp_cache_raw_exercise_v1', '@fitapp_sync_exercicios_timestamp'];

let usuarioAtual: string | null = null;

/** Chamado pelo AuthContexto sempre que a sessão muda. */
export function definirUsuarioLocal(idUsuario: string | null): void {
  usuarioAtual = idUsuario;
}

/** Chave do AsyncStorage separada pelo usuário logado ('anonimo' sem sessão). */
export function chaveDoUsuario(chaveBase: string): string {
  const semPrefixo = chaveBase.startsWith(PREFIXO) ? chaveBase.slice(PREFIXO.length) : chaveBase;
  return `${PREFIXO}u:${usuarioAtual ?? 'anonimo'}:${semPrefixo}`;
}

export const armazenamentoUsuario = {
  getItem: (chave: string) => AsyncStorage.getItem(chaveDoUsuario(chave)),
  setItem: (chave: string, valor: string) => AsyncStorage.setItem(chaveDoUsuario(chave), valor),
  removeItem: (chave: string) => AsyncStorage.removeItem(chaveDoUsuario(chave)),
};

/**
 * Apaga do aparelho os dados de usuário do TreinaAI (de qualquer conta e as
 * chaves globais antigas, de antes da separação). A sessão do Supabase não usa
 * o prefixo e é tratada pelo signOut.
 */
export async function limparCacheLocalUsuario(): Promise<void> {
  const chaves = await AsyncStorage.getAllKeys();
  const remover = chaves.filter((c) => c.startsWith(PREFIXO) && !CHAVES_GLOBAIS.includes(c));
  if (remover.length > 0) await AsyncStorage.multiRemove(remover);
}
