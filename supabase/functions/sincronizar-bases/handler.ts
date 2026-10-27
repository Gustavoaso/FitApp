// ============================================================
// EDGE FUNCTION: sincronizar-bases (handler)
// ============================================================
// Só quem tem o segredo próprio (SINCRONIZAR_SEGREDO, cabeçalho
// x-sincronizar-segredo) dispara a sincronização: a anon key é pública
// e passaria pelo verify_jwt, gastando a cota da RapidAPI e regravando
// as tabelas base_* com a service_role. Separado do index.ts para ser
// testado sem rede nem banco.
// ============================================================

export type ResultadoSincronizacao = { totalAlimentos: number; totalExercicios: number };
export type Sincronizar = () => Promise<ResultadoSincronizacao>;

const CABECALHOS = { 'Content-Type': 'application/json' };

function responder(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), { status, headers: CABECALHOS });
}

/** Compara em tempo constante para não vazar o segredo pelo tempo de resposta. */
function segredosIguais(recebido: string, esperado: string): boolean {
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(esperado);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diferenca |= (a[i] ?? 0) ^ b[i];
  return diferenca === 0;
}

export function criarHandler(segredo: string, sincronizar: Sincronizar) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return responder(405, { erro: 'Método não permitido' });

    const recebido = req.headers.get('x-sincronizar-segredo') ?? '';
    // Segredo não configurado recusa tudo, em vez de liberar.
    if (!segredo || !segredosIguais(recebido, segredo)) {
      return responder(401, { erro: 'Não autorizado' });
    }

    try {
      const resultado = await sincronizar();
      return responder(200, { sucesso: true, ...resultado, executadoEm: new Date().toISOString() });
    } catch (erro) {
      console.error('sincronizar-bases falhou:', erro);
      return responder(500, { sucesso: false, erro: 'Não foi possível sincronizar' });
    }
  };
}
