// ============================================================
// SERVIÇO: Excluir conta
// ============================================================
// Chama a Edge Function excluir-conta, que apaga o usuário do Auth com
// a service_role (só lá) e, por cascade, todos os dados dele.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/compartilhado/supabase';

/** Exclui a conta logada. Lança erro se o servidor não confirmar. */
export async function excluirConta(): Promise<void> {
  const { error } = await supabase.functions.invoke('excluir-conta', { method: 'POST' });
  if (error) throw error;
  // A sessão aponta para um usuário que não existe mais: limpa só no aparelho.
  await supabase.auth.signOut({ scope: 'local' });
  // Histórico e metas também ficam no aparelho (AsyncStorage): somem junto.
  await AsyncStorage.clear();
}
