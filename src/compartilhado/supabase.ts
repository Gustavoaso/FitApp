// ============================================================
// SERVIÇO: Cliente Supabase (servicos/supabase.ts)
// ============================================================
// Configuração e conexão com o Supabase PostgreSQL real.
// Leitura dinâmica das variáveis de ambiente (.env).
// ============================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Variáveis de ambiente do Expo
// O Expo só embute no app variáveis EXPO_PUBLIC_*; a instância de teste usa esta para o banco local.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://asuxqjbwgetdcldjoaqm.supabase.co';
// SUPABASE_KEY é dos scripts (pode ser service_role): o app só usa a anon key.
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_s97SsJOHdU0myvXzWT26DA_PBaFe95D';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ SUPABASE_URL ou SUPABASE_KEY não configuradas no .env');
}

/**
 * Cliente Supabase conectado ao banco PostgreSQL do projeto.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
