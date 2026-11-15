import { progressaoDaSemana, semanaDaProgressao } from './progressao-treino';

const INICIO = '2026-11-02T12:00:00.000Z';
const dia = (n: number) => new Date(new Date(INICIO).getTime() + n * 24 * 60 * 60 * 1000);
const CICLO = [1, 2, 3, 4].map((semana) => ({
  semana,
  titulo: `Semana ${semana}`,
  orientacao: `Orientação ${semana}`,
}));

describe('semana do ciclo de progressão (RN19)', () => {
  it.each([
    [0, 1],
    [6, 1],
    [7, 2],
    [20, 3],
    [27, 4],
    [28, 1],
    [35, 2],
  ])('dia %i do plano cai na semana %i', (dias, semana) => {
    expect(semanaDaProgressao(INICIO, dia(dias))).toBe(semana);
  });

  it.each([null, undefined, '', 'ontem'])('início %p vira semana 1', (inicio) => {
    expect(semanaDaProgressao(inicio, dia(10))).toBe(1);
  });

  it('data antes do início (relógio errado) vira semana 1', () => {
    expect(semanaDaProgressao(INICIO, dia(-3))).toBe(1);
  });

  it('devolve a semana atual e a próxima; depois da 4ª vem a 1ª', () => {
    expect(progressaoDaSemana(CICLO, INICIO, dia(8))).toEqual({
      atual: CICLO[1],
      proxima: CICLO[2],
    });
    expect(progressaoDaSemana(CICLO, INICIO, dia(22))).toEqual({
      atual: CICLO[3],
      proxima: CICLO[0],
    });
  });

  it.each([null, undefined, []])('plano antigo sem progressão (%p) devolve null', (ciclo) => {
    expect(progressaoDaSemana(ciclo, INICIO, dia(1))).toBeNull();
  });
});
