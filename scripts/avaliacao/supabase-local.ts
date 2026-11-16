// Cliente do Supabase LOCAL para a avaliação: substitui `@/compartilhado/supabase`
// (ver carregador.mjs). A geração agora passa pela Edge Function gerar-plano, que exige
// usuário logado: entra como a conta A do seed (só banco local) e lê as bases como
// `authenticated`. Recusa qualquer URL que não seja local.
import { createClient } from '@supabase/supabase-js';

const HOSTS_LOCAIS = ['localhost', '127.0.0.1'];
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const chave = process.env.SUPABASE_ANON_KEY;

if (!HOSTS_LOCAIS.includes(new URL(url).hostname)) {
  throw new Error(`SUPABASE_URL precisa ser local (localhost/127.0.0.1); recebido ${url}.`);
}
if (!chave) throw new Error('Defina SUPABASE_ANON_KEY (ANON_KEY de `npx supabase status`).');

export const supabase = createClient(url, chave, { auth: { persistSession: false } });

const { error } = await supabase.auth.signInWithPassword({
  email: 'conta-a@exemplo.com',
  password: 'senha-teste-123',
});
if (error)
  throw new Error(
    `Login da conta A do seed falhou (rode \`npx supabase db reset\`): ${error.message}`,
  );
