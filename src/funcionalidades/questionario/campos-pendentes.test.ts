import {
  PASSOS,
  TOTAL_PASSOS,
  aplicarPadroes,
  camposPendentes,
  type RespostasEmEdicao,
} from './campos-pendentes';
import { RESPOSTAS_VAZIAS } from './respostas';

const VAZIO: RespostasEmEdicao = RESPOSTAS_VAZIAS;

it('são 10 passos e cada um começa pendente', () => {
  expect(TOTAL_PASSOS).toBe(10);
  for (let p = 1; p <= TOTAL_PASSOS; p++) {
    expect(camposPendentes(p, VAZIO).length).toBeGreaterThan(0);
  }
  expect(camposPendentes(2, VAZIO)).toEqual(['sexo biológico', 'idade']);
});

it('passo respondido não tem pendência; espaço em branco não conta', () => {
  expect(camposPendentes(1, { ...VAZIO, objetivo: 'Hipertrofia' })).toEqual([]);
  expect(camposPendentes(1, { ...VAZIO, objetivo: '  ' })).toEqual(['objetivo']);
  expect(camposPendentes(7, { ...VAZIO, restricaoFisica: ['Nenhuma'] })).toEqual([]);
  expect(camposPendentes(7, { ...VAZIO, restricaoFisica: [] })).toEqual(['dores ou lesões']);
});

it('passo desconhecido não bloqueia', () => {
  expect(camposPendentes(0, VAZIO)).toEqual([]);
  expect(camposPendentes(11, VAZIO)).toEqual([]);
});

it('padrões só preenchem o que está vazio', () => {
  expect(aplicarPadroes(2, VAZIO).idade).toBe('30');
  expect(aplicarPadroes(2, { ...VAZIO, idade: '41' }).idade).toBe('41');
  expect(aplicarPadroes(3, VAZIO)).toMatchObject({ altura: '170', peso: '70' });
  expect(aplicarPadroes(1, VAZIO)).toEqual(VAZIO);
  expect(PASSOS).toHaveLength(10);
});
