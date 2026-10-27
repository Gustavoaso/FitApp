// Rodar com: deno test supabase/functions/excluir-conta/
import { assertEquals } from 'jsr:@std/assert@1.0.13';
import { criarHandler } from './handler.ts';

function handlerQueRegistra() {
  const chamadas: string[] = [];
  const handler = criarHandler((jwt) => {
    chamadas.push(jwt);
    return Promise.resolve(jwt === 'token-valido');
  });
  return { handler, chamadas };
}

Deno.test('recusa chamada sem JWT e não apaga ninguém', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(new Request('http://local/excluir-conta', { method: 'POST' }));
  assertEquals(resposta.status, 401);
  assertEquals(chamadas.length, 0);
});

Deno.test('recusa Authorization que não é Bearer', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(
    new Request('http://local/excluir-conta', { method: 'POST', headers: { Authorization: 'Basic abc' } }),
  );
  assertEquals(resposta.status, 401);
  assertEquals(chamadas.length, 0);
});

Deno.test('recusa JWT inválido', async () => {
  const { handler } = handlerQueRegistra();
  const resposta = await handler(
    new Request('http://local/excluir-conta', { method: 'POST', headers: { Authorization: 'Bearer falso' } }),
  );
  assertEquals(resposta.status, 401);
});

Deno.test('recusa método diferente de POST', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(
    new Request('http://local/excluir-conta', { headers: { Authorization: 'Bearer token-valido' } }),
  );
  assertEquals(resposta.status, 405);
  assertEquals(chamadas.length, 0);
});

Deno.test('apaga com JWT válido', async () => {
  const { handler, chamadas } = handlerQueRegistra();
  const resposta = await handler(
    new Request('http://local/excluir-conta', { method: 'POST', headers: { Authorization: 'Bearer token-valido' } }),
  );
  assertEquals(resposta.status, 200);
  assertEquals(chamadas, ['token-valido']);
});
