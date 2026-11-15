import {
  DIMENSOES_FORMATO,
  calcularVolumeKg,
  formatarDuracao,
  montarNumerosSelo,
  type ResumoSessao,
} from './selo-treino';

const resumoBase: ResumoSessao = {
  nomeTreino: 'Peito e tríceps',
  duracaoMinutos: 52,
  series: [
    { cargaKg: 60, repeticoes: 10, composto: true },
    { cargaKg: 62.5, repeticoes: 8, composto: true },
  ],
  kcalEstimadas: 287.4,
};

describe('calcularVolumeKg', () => {
  it('soma carga × repetições', () => {
    expect(calcularVolumeKg(resumoBase.series)).toBe(1100);
  });

  it('série sem carga ou com valor inválido não soma', () => {
    expect(
      calcularVolumeKg([
        { cargaKg: 0, repeticoes: 15, composto: false },
        { cargaKg: Number.NaN, repeticoes: 10, composto: false },
        { cargaKg: 20, repeticoes: -3, composto: false },
        { cargaKg: 10, repeticoes: 5, composto: false },
      ]),
    ).toBe(50);
  });

  it('recusa null, undefined e tipo errado', () => {
    expect(calcularVolumeKg(null)).toBe(0);
    expect(calcularVolumeKg(undefined)).toBe(0);
    expect(calcularVolumeKg('x' as unknown as [])).toBe(0);
  });
});

describe('formatarDuracao', () => {
  it('minutos, hora cheia e hora com minutos', () => {
    expect(formatarDuracao(45)).toBe('45 min');
    expect(formatarDuracao(60)).toBe('1 h');
    expect(formatarDuracao(75)).toBe('1 h 15 min');
  });

  it('valor inválido vira 0 min', () => {
    expect(formatarDuracao(-5)).toBe('0 min');
    expect(formatarDuracao(Number.NaN)).toBe('0 min');
  });
});

describe('montarNumerosSelo', () => {
  it('mostra a sequência semanal só quando há sequência', () => {
    expect(montarNumerosSelo({ ...resumoBase, semanasSeguidas: 3 }).at(-1)).toEqual({
      rotulo: 'Sequência',
      valor: '3 semanas',
    });
    expect(
      montarNumerosSelo({ ...resumoBase, semanasSeguidas: 0 }).map((n) => n.rotulo),
    ).not.toContain('Sequência');
    expect(
      montarNumerosSelo({ ...resumoBase, semanasSeguidas: null }).map((n) => n.rotulo),
    ).not.toContain('Sequência');
  });

  it('duração, volume com milhar pt-BR e kcal arredondada', () => {
    expect(
      montarNumerosSelo({
        ...resumoBase,
        series: [{ cargaKg: 100, repeticoes: 32.5, composto: true }],
      }),
    ).toEqual([
      { rotulo: 'Duração', valor: '52 min' },
      { rotulo: 'Volume', valor: '3.250 kg' },
      { rotulo: 'Gasto estimado', valor: '287 kcal' },
    ]);
  });

  it('sem volume e sem kcal (RN20: sem peso), mostra só a duração', () => {
    expect(montarNumerosSelo({ ...resumoBase, series: [], kcalEstimadas: null })).toEqual([
      { rotulo: 'Duração', valor: '52 min' },
    ]);
  });

  it('sem resumo, selo sem números', () => {
    expect(montarNumerosSelo(null)).toEqual([]);
    expect(montarNumerosSelo(undefined)).toEqual([]);
  });
});

it('formatos de exportação: stories 9:16 e feed 4:5', () => {
  const { largura: l1, altura: a1 } = DIMENSOES_FORMATO['9:16'];
  const { largura: l2, altura: a2 } = DIMENSOES_FORMATO['4:5'];
  expect(l1 / a1).toBeCloseTo(9 / 16);
  expect(l2 / a2).toBeCloseTo(4 / 5);
});
