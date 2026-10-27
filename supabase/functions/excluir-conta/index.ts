// ============================================================
// EDGE FUNCTION: excluir-conta
// ============================================================
// Liga o handler ao Supabase. A service_role só existe aqui (secret
// da function), nunca no app.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { criarHandler } from './handler.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(
  criarHandler(async (jwt) => {
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user) return false;

    const { error: erroExclusao } = await admin.auth.admin.deleteUser(data.user.id);
    if (erroExclusao) throw erroExclusao;
    return true;
  }),
);
