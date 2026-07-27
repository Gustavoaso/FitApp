// ============================================================
// SERVIÇO: Cliente Supabase
// ============================================================
// Configura a conexão com o Supabase (nosso backend).
// Este arquivo é importado em qualquer lugar que precise
// acessar o banco de dados, autenticação ou storage.
//
// CONCEITOS IMPORTANTES:
// - Supabase é um BaaS (Backend as a Service): ele fornece
//   banco de dados (PostgreSQL), autenticação, storage e
//   funções serverless prontos para usar, sem precisar
//   configurar um servidor próprio.
//
// - SUPABASE_URL: endereço do seu projeto no Supabase
// - SUPABASE_ANON_KEY: chave pública (não secreta) que identifica
//   seu projeto. O "anon" significa "anônimo" — é seguro expor
//   no código do frontend porque o RLS (Row Level Security)
//   no banco protege os dados por usuário.
//
// - AsyncStorage: armazenamento persistente no dispositivo
//   (como localStorage do navegador, mas para React Native).
//   Usado para salvar a sessão do usuário (para não precisar
//   logar toda vez que abrir o app).
// ============================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Variáveis de ambiente do Expo
// O prefixo EXPO_PUBLIC_ torna a variável acessível no código do app
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas.\n' +
    'Crie um arquivo .env na raiz do projeto com:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui'
  );
}

/**
 * Cliente Supabase configurado para React Native.
 *
 * Uso em qualquer componente ou serviço:
 * ```ts
 * import { supabase } from '../servicos/supabase';
 *
 * // Buscar dados
 * const { data, error } = await supabase
 *   .from('base_alimentos')
 *   .select('*')
 *   .ilike('nome', '%arroz%');
 *
 * // Chamar Edge Function
 * const { data } = await supabase.functions.invoke('gerar-plano', {
 *   body: { respostas: dadosDoQuestionario }
 * });
 * ```
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usa AsyncStorage para persistir a sessão no dispositivo
    storage: AsyncStorage,
    // Renova automaticamente o token antes de expirar
    autoRefreshToken: true,
    // Salva a sessão no storage (para reabrir o app já logado)
    persistSession: true,
    // Detecta mudanças de sessão em outras abas (relevante no web)
    detectSessionInUrl: false,
  },
});
