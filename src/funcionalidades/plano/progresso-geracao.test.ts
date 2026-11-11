import { progressoEstimado } from './progresso-geracao';

it('começa em 0 e sobe com o tempo', () => {
  expect(progressoEstimado(0, 0, 3)).toBe(0);
  expect(progressoEstimado(25, 0, 3)).toBe(63);
});
it('nunca passa de 95% e não retrocede', () => {
  expect(progressoEstimado(10_000, 2, 3)).toBe(95);
  let anterior = 0;
  for (let s = 0; s <= 120; s += 5) {
    const p = progressoEstimado(s, Math.min(2, Math.floor(s / 20)), 3);
    expect(p).toBeGreaterThanOrEqual(anterior);
    anterior = p;
  }
});
it('cada fase garante um piso', () => {
  expect(progressoEstimado(0, 1, 3)).toBe(33);
  expect(progressoEstimado(0, 2, 3)).toBe(67);
});
it('recusa entradas inválidas', () => {
  expect(progressoEstimado(NaN, 0, 3)).toBe(0);
  expect(progressoEstimado(-5, 0, 3)).toBe(0);
  expect(progressoEstimado(10, 0, 0)).toBe(33);
});
