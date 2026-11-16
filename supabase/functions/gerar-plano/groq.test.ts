// Rodar com: deno test supabase/functions/gerar-plano/
import { assertEquals, assertRejects } from 'jsr:@std/assert@1.0.13';
import { criarClienteGroq, MODELO_GROQ, ServicoOcupado, URL_GROQ } from './groq.ts';

function fetchQue(
  status: number,
  corpo: unknown,
  registro: { url?: string; init?: RequestInit } = {},
) {
  return ((url: string, init: RequestInit) => {
    registro.url = url;
    registro.init = init;
    return Promise.resolve(new Response(JSON.stringify(corpo), { status }));
  }) as unknown as typeof fetch;
}

Deno.test('chama o endpoint OpenAI-compatível com json_object e a chave do ambiente', async () => {
  const registro: { url?: string; init?: RequestInit } = {};
  const resposta = { choices: [{ message: { content: '{"dias":[]}' } }] };
  const perguntar = criarClienteGroq('chave-falsa', fetchQue(200, resposta, registro));
  assertEquals(await perguntar('prompt'), { dias: [] });
  assertEquals(registro.url, URL_GROQ);
  const corpo = JSON.parse(String(registro.init?.body));
  assertEquals(corpo.model, MODELO_GROQ);
  assertEquals(corpo.response_format, { type: 'json_object' });
  assertEquals(corpo.messages[1].content, 'prompt');
  assertEquals(
    (registro.init?.headers as Record<string, string>).Authorization,
    'Bearer chave-falsa',
  );
});

Deno.test('JSON quebrado vira null (o app valida e tenta de novo)', async () => {
  const perguntar = criarClienteGroq(
    'k',
    fetchQue(200, { choices: [{ message: { content: '{ruim' } }] }),
  );
  assertEquals(await perguntar('p'), null);
});

Deno.test('429 e 503 viram ServicoOcupado; outros HTTP, erro comum', async () => {
  await assertRejects(() => criarClienteGroq('k', fetchQue(429, {}))('p'), ServicoOcupado);
  await assertRejects(() => criarClienteGroq('k', fetchQue(503, {}))('p'), ServicoOcupado);
  await assertRejects(() => criarClienteGroq('k', fetchQue(401, {}))('p'), Error, 'HTTP 401');
});

Deno.test('resposta sem conteúdo é erro', async () => {
  await assertRejects(() => criarClienteGroq('k', fetchQue(200, { choices: [] }))('p'), Error);
});
