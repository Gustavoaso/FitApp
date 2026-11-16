// ============================================================
// EDGE FUNCTION: reprocessar-embeddings (handler)
// ============================================================
// Preenche `embedding_384` (gte-small) das bases que ainda não têm, um lote
// por chamada (o tempo da function é curto): chame de novo até `restantes`
// ser 0. Só quem tem o segredo próprio (REPROCESSAR_SEGREDO, cabeçalho
// x-reprocessar-segredo) dispara, porque grava com a service_role. Separado
// do index.ts para ser testado sem rede nem banco.
// ============================================================

export type Contagem = { gravados: number; restantes: number };
export type ResultadoReprocesso = {
  base_exercicios: Contagem;
  base_alimentos: Contagem;
  base_conhecimento: Contagem;
};
export type Reprocessar = () => Promise<ResultadoReprocesso>;

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

export function criarHandler(segredo: string, reprocessar: Reprocessar) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return responder(405, { erro: 'Método não permitido' });

    const recebido = req.headers.get('x-reprocessar-segredo') ?? '';
    // Segredo não configurado recusa tudo, em vez de liberar.
    if (!segredo || !segredosIguais(recebido, segredo)) {
      return responder(401, { erro: 'Não autorizado' });
    }

    try {
      return responder(200, { sucesso: true, ...(await reprocessar()) });
    } catch (erro) {
      console.error('reprocessar-embeddings falhou:', erro);
      return responder(500, { sucesso: false, erro: 'Não foi possível reprocessar' });
    }
  };
}
