// ============================================================
// EDGE FUNCTION: excluir-conta
// ============================================================
// Liga o handler ao Supabase. A service_role só existe aqui (secret
// da function), nunca no app.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { apagarPasta } from './apagar-pasta.ts';
import { criarHandler } from './handler.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const BUCKETS_FOTOS = ['avatares', 'checkins', 'posts', 'banners', 'evolucao'];

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(
  criarHandler(async (jwt) => {
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user) return false;

    // RN31: apaga as fotos antes (o cascade do banco não remove os arquivos do Storage).
    for (const bucket of BUCKETS_FOTOS) {
      await apagarPasta(admin.storage.from(bucket), data.user.id);
    }

    const { error: erroExclusao } = await admin.auth.admin.deleteUser(data.user.id);
    if (erroExclusao) throw erroExclusao;
    return true;
  }),
);
