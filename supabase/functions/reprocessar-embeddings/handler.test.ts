// Rodar com: deno test supabase/functions/reprocessar-embeddings/
import { assertEquals } from 'jsr:@std/assert@1.0.13';
import { criarHandler, type ResultadoReprocesso } from './handler.ts';

const RESULTADO: ResultadoReprocesso = {
  base_exercicios: { gravados: 50, restantes: 10 },
  base_alimentos: { gravados: 0, restantes: 0 },
  base_conhecimento: { gravados: 2, restantes: 0 },
};

function criar(segredo = 'segredo-teste') {
  let chamadas = 0;
  const handler = criarHandler(segredo, () => {
    chamadas++;
    return Promise.resolve(RESULTADO);
  });
  return { handler, chamadas: () => chamadas };
}

const pedir = (cabecalho?: string, metodo = 'POST') =>
  new Request('http://local/reprocessar-embeddings', {
    method: metodo,
    headers: cabecalho === undefined ? {} : { 'x-reprocessar-segredo': cabecalho },
  });

Deno.test('sem segredo ou com segredo errado: 401 e nada reprocessa', async () => {
  const { handler, chamadas } = criar();
  assertEquals((await handler(pedir())).status, 401);
  assertEquals((await handler(pedir('errado'))).status, 401);
  assertEquals(chamadas(), 0);
});

Deno.test('segredo do ambiente vazio recusa tudo, mesmo cabeçalho vazio', async () => {
  const { handler, chamadas } = criar('');
  assertEquals((await handler(pedir(''))).status, 401);
  assertEquals(chamadas(), 0);
});

Deno.test('GET: 405', async () => {
  const { handler } = criar();
  assertEquals((await handler(pedir('segredo-teste', 'GET'))).status, 405);
});

Deno.test('segredo certo reprocessa e informa os restantes', async () => {
  const { handler, chamadas } = criar();
  const r = await handler(pedir('segredo-teste'));
  assertEquals(r.status, 200);
  const corpo = await r.json();
  assertEquals(corpo.base_exercicios.restantes, 10);
  assertEquals(chamadas(), 1);
});

Deno.test('falha interna: 500 sem detalhe', async () => {
  const handler = criarHandler('s', () => Promise.reject(new Error('senha do banco')));
  const r = await handler(pedir('s'));
  assertEquals(r.status, 500);
  assertEquals((await r.text()).includes('senha'), false);
});
