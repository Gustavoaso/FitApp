// Rodar com: deno test supabase/functions/sincronizar-bases/
import { assertEquals } from 'jsr:@std/assert@1.0.13';
import { criarHandler } from './handler.ts';

function handlerQueRegistra(segredo = 'segredo-teste', falhar = false) {
  let chamadas = 0;
  const handler = criarHandler(segredo, () => {
    chamadas++;
    if (falhar) return Promise.reject(new Error('detalhe interno do banco'));
    return Promise.resolve({ totalAlimentos: 2, totalExercicios: 3 });
  });
  return { handler, chamadas: () => chamadas };
}

function post(cabecalhos: Record<string, string> = {}) {
  return new Request('http://local/sincronizar-bases', { method: 'POST', headers: cabecalhos });
}

Deno.test('recusa GET com 405 sem sincronizar', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(
    new Request('http://local/sincronizar-bases', {
      headers: { 'x-sincronizar-segredo': 'segredo-teste' },
    }),
  );
  assertEquals(resposta.status, 405);
  assertEquals(chamadas(), 0);
});

Deno.test('recusa POST sem segredo', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(post());
  assertEquals(resposta.status, 401);
  assertEquals(chamadas(), 0);
});

Deno.test('recusa segredo errado, inclusive prefixo do certo', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  assertEquals((await handler(post({ 'x-sincronizar-segredo': 'outro' }))).status, 401);
  assertEquals((await handler(post({ 'x-sincronizar-segredo': 'segredo' }))).status, 401);
  assertEquals(chamadas(), 0);
});

Deno.test('recusa tudo quando o segredo não está configurado', async () => {
  const { handler, chamadas } = handlerQueRegistra('');
  const resposta = await handler(post({ 'x-sincronizar-segredo': '' }));
  assertEquals(resposta.status, 401);
  assertEquals(chamadas(), 0);
});

Deno.test('com o segredo certo chama a sincronização', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(post({ 'x-sincronizar-segredo': 'segredo-teste' }));
  assertEquals(resposta.status, 200);
  const corpo = await resposta.json();
  assertEquals(corpo.totalAlimentos, 2);
  assertEquals(corpo.totalExercicios, 3);
  assertEquals(chamadas(), 1);
});

Deno.test('erro na sincronização vira mensagem genérica', async () => {
  const { handler } = handlerQueRegistra('segredo-teste', true);
  const original = console.error;
  console.error = () => {};
  try {
    const resposta = await handler(post({ 'x-sincronizar-segredo': 'segredo-teste' }));
    assertEquals(resposta.status, 500);
    const texto = await resposta.text();
    assertEquals(texto.includes('detalhe interno'), false);
  } finally {
    console.error = original;
  }
});
