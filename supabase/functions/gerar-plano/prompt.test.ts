// Rodar com: deno test supabase/functions/gerar-plano/
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1.0.13';
import { apelidar, montarPrompt } from './prompt.ts';

const contexto = {
  objetivo: 'hipertrofia',
  nivel: 'iniciante',
  diasPorSemana: 3,
  equipamentos: 'academia_completa',
  restricoes: ['vegano'],
  diretrizes: ['x'.repeat(400)],
};
const exercicios = [
  { id: 'e1', nome: 'Supino', grupo: 'peito' },
  { id: 'e2', nome: 'Remada', grupo: 'costas' },
];
const alimentos = [{ id: '7', nome: 'Arroz', slot: 'carboidrato' }];
const slots = [
  {
    porGrupo: [
      { grupo: 'peito', quantidade: 3 },
      { grupo: 'costas', quantidade: 0 },
    ],
  },
];

Deno.test('prompt traz contexto, listas, contagem por dia e formato', () => {
  const prompt = montarPrompt(contexto, slots, exercicios, alimentos, ['cafe', 'almoco']);
  assertStringIncludes(prompt, 'Objetivo: hipertrofia. Nível: iniciante. Dias por semana: 3.');
  assertStringIncludes(prompt, 'peito: e1 Supino');
  assertStringIncludes(prompt, 'carboidrato: 7 Arroz');
  // 3 pedidos, só 1 candidato no grupo: não pede mais do que existe; quantidade 0 some.
  assertStringIncludes(prompt, 'Dia 1: peito 1.');
  assertStringIncludes(prompt, '"cafe":{"proteina":"id","carboidrato":"id","complemento":"id"}');
  assertEquals(prompt.includes('x'.repeat(301)), false); // diretriz cortada
});

Deno.test('apelidar troca UUID por e1, e2 e guarda o original', () => {
  const { apelidados, original } = apelidar([
    { id: 'uuid-a', nome: 'A', grupo: 'peito' },
    { id: 'uuid-b', nome: 'B', grupo: 'peito' },
  ]);
  assertEquals(
    apelidados.map((e) => e.id),
    ['e1', 'e2'],
  );
  assertEquals(original.get('e2'), 'uuid-b');
});
