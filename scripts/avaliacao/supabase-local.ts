// Cliente do Supabase LOCAL para a avaliação: substitui `@/compartilhado/supabase`
// (ver carregador.mjs). As bases são só de `authenticated`: usa a service_role
// do banco LOCAL (como a ingestão) e só lê; recusa qualquer URL que não seja local.
import { createClient } from '@supabase/supabase-js';

const HOSTS_LOCAIS = ['localhost', '127.0.0.1'];
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!HOSTS_LOCAIS.includes(new URL(url).hostname)) {
  throw new Error(`SUPABASE_URL precisa ser local (localhost/127.0.0.1); recebido ${url}.`);
}
if (!chave)
  throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY (SERVICE_ROLE_KEY de `npx supabase status`).');

export const supabase = createClient(url, chave, { auth: { persistSession: false } });
