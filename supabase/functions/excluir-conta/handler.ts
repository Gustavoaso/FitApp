// ============================================================
// EDGE FUNCTION: excluir-conta (handler)
// ============================================================
// Apaga o usuário dono do JWT. O id vem só do token, nunca do corpo,
// para ninguém apagar a conta de outro. Os dados somem por cascade
// (toda tabela do usuário referencia auth.users on delete cascade).
// Separado do index.ts para ser testado sem rede nem segredo.
// ============================================================

/** Valida o JWT e apaga o usuário; devolve false se o token não vale. */
export type ExcluirUsuarioDoToken = (jwt: string) => Promise<boolean>;

const CABECALHOS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function responder(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), { status, headers: CABECALHOS });
}

export function criarHandler(excluirUsuarioDoToken: ExcluirUsuarioDoToken) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS });
    if (req.method !== 'POST') return responder(405, { erro: 'Método não permitido' });

    const jwt = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!jwt) return responder(401, { erro: 'Não autenticado' });

    try {
      const apagou = await excluirUsuarioDoToken(jwt);
      if (!apagou) return responder(401, { erro: 'Não autenticado' });
      return responder(200, { ok: true });
    } catch (erro) {
      console.error('excluir-conta falhou:', erro);
      return responder(500, { erro: 'Não foi possível excluir a conta' });
    }
  };
}
