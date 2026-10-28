import { calcularSequenciaDias } from './calcular-sequencia';

describe('calcularSequenciaDias', () => {
  it('é 0 sem nenhum treino', () => {
    expect(calcularSequenciaDias([], '2026-10-28')).toBe(0);
  });

  it('conta dias seguidos até hoje, ignorando repetidos', () => {
    expect(
      calcularSequenciaDias(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-28'], '2026-10-28'),
    ).toBe(3);
  });

  it('mantém a sequência de ontem se hoje ainda não treinou', () => {
    expect(calcularSequenciaDias(['2026-10-26', '2026-10-27'], '2026-10-28')).toBe(2);
  });

  it('zera quando o último treino foi há mais de um dia', () => {
    expect(calcularSequenciaDias(['2026-10-25'], '2026-10-28')).toBe(0);
  });

  it('atravessa a virada do mês', () => {
    expect(calcularSequenciaDias(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2);
  });

  it('recusa datas inválidas', () => {
    expect(calcularSequenciaDias(['ontem', ''], '2026-10-28')).toBe(0);
    expect(calcularSequenciaDias(['2026-10-28'], 'hoje')).toBe(0);
  });
});
