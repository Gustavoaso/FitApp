// ============================================================
// SERVIÇO: Cliente Supabase (servicos/supabase.ts)
// ============================================================
// Configuração e conexão com o Supabase PostgreSQL real.
// Leitura dinâmica das variáveis de ambiente (.env).
// ============================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Variáveis de ambiente do Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://asuxqjbwgetdcldjoaqm.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_gnENJdi83TUersfr5iZ9Kg_dRINulr_';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ SUPABASE_URL ou SUPABASE_KEY não configuradas no .env'
  );
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
