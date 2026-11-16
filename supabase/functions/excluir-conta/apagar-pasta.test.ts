import { assertEquals } from 'jsr:@std/assert@1.0.13';
import { apagarPasta } from './apagar-pasta.ts';

Deno.test('apaga mais arquivos que o limite da página, até esvaziar', async () => {
  let arquivos = ['a', 'b', 'c', 'd', 'e'];
  const removidos: string[] = [];
  await apagarPasta(
    {
      list: (_p, { limit }) =>
        Promise.resolve({ data: arquivos.slice(0, limit).map((name) => ({ name })), error: null }),
      remove: (caminhos) => {
        removidos.push(...caminhos);
        arquivos = arquivos.filter((n) => !caminhos.includes(`u/${n}`));
        return Promise.resolve({ error: null });
      },
    },
    'u',
    2,
  );
  assertEquals(removidos, ['u/a', 'u/b', 'u/c', 'u/d', 'u/e']);
});
