import { gerarSemana } from './semana';

describe('gerarSemana', () => {
  it('começa no domingo e termina no sábado', () => {
    const semana = gerarSemana('2026-11-10'); // terça
    expect(semana.map((d) => d.abrev)).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    expect(semana[0].data).toBe('2026-11-08');
    expect(semana[6].data).toBe('2026-11-14');
  });

  it('domingo e sábado caem na mesma semana', () => {
    expect(gerarSemana('2026-11-08')[0].data).toBe('2026-11-08');
    expect(gerarSemana('2026-11-14')[0].data).toBe('2026-11-08');
  });

  it('atravessa a virada de mês', () => {
    const semana = gerarSemana('2026-12-31');
    expect(semana[0].data).toBe('2026-12-27');
    expect(semana[6].data).toBe('2027-01-02');
    expect(semana[6].diaNum).toBe('02');
  });

  it('recusa data inválida', () => {
    expect(gerarSemana('abc')).toEqual([]);
    expect(gerarSemana('')).toEqual([]);
  });
});
