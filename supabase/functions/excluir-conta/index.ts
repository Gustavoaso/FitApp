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
      const { data: arquivos, error: erroLista } = await admin.storage
        .from(bucket)
        .list(data.user.id, { limit: 1000 });
      if (erroLista) throw erroLista;
      if (!arquivos?.length) continue;
      const { error: erroRemocao } = await admin.storage
        .from(bucket)
        .remove(arquivos.map((a) => `${data.user.id}/${a.name}`));
      if (erroRemocao) throw erroRemocao;
    }

    const { error: erroExclusao } = await admin.auth.admin.deleteUser(data.user.id);
    if (erroExclusao) throw erroExclusao;
    return true;
  }),
);
