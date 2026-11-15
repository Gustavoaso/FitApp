import {
  MET_TREINO,
  ehComposto,
  escolherMet,
  estimarKcalTreino,
  formatarKcalEstimada,
  type SerieExecutada,
} from './gasto-calorico';

const series = (n: number, cargaKg: number, repeticoes: number, composto = false) =>
  Array.from({ length: n }, (): SerieExecutada => ({ cargaKg, repeticoes, composto }));

describe('escolherMet', () => {
  it('sem carga: peso do corpo (3,0)', () => {
    expect(escolherMet(70, 30, series(10, 0, 15))).toBe(MET_TREINO.pesoDoCorpo);
  });

  it('treino comum de isoladores: geral (3,5)', () => {
    // 20 × 10 × 40 = 8000 kg / 45 min / 70 kg ≈ 2,5
    expect(escolherMet(70, 45, series(20, 40, 10))).toBe(MET_TREINO.geral);
  });

  it('densidade média com maioria de compostos: 5,0', () => {
    expect(escolherMet(70, 45, series(20, 40, 10, true))).toBe(MET_TREINO.compostosPesados);
  });

  it('limite: exatamente metade compostos e densidade 2 conta como compostos', () => {
    // 10 séries × 10 reps × 70 kg = 7000 / 50 min / 70 kg = 2
    const mistas = [...series(5, 70, 10, true), ...series(5, 70, 10)];
    expect(escolherMet(70, 50, mistas)).toBe(MET_TREINO.compostosPesados);
  });

  it('densidade alta: vigoroso (6,0)', () => {
    // 20 × 10 × 70 = 14000 / 45 / 70 ≈ 4,4
    expect(escolherMet(70, 45, series(20, 70, 10))).toBe(MET_TREINO.vigoroso);
  });
});

describe('estimarKcalTreino', () => {
  it('caso normal: MET × peso × horas', () => {
    expect(estimarKcalTreino({ pesoKg: 70, duracaoMinutos: 60, series: series(20, 30, 10) })).toBe(
      245,
    );
  });

  it('limita a duração a 3 h', () => {
    const longa = estimarKcalTreino({ pesoKg: 80, duracaoMinutos: 600, series: series(10, 0, 10) });
    expect(longa).toBe(Math.round(3 * 80 * 3));
  });

  it.each([null, undefined, 0, -70, 20, 400, NaN, '70'])(
    'sem peso válido (%p) não calcula',
    (p) => {
      expect(
        estimarKcalTreino({
          pesoKg: p as unknown as number,
          duracaoMinutos: 45,
          series: series(5, 20, 10),
        }),
      ).toBeNull();
    },
  );

  it('recusa duração inválida, sem séries e entrada nula', () => {
    expect(
      estimarKcalTreino({ pesoKg: 70, duracaoMinutos: 0, series: series(5, 20, 10) }),
    ).toBeNull();
    expect(estimarKcalTreino({ pesoKg: 70, duracaoMinutos: 45, series: [] })).toBeNull();
    expect(estimarKcalTreino(null)).toBeNull();
    expect(estimarKcalTreino(undefined)).toBeNull();
  });
});

describe('textos e compostos', () => {
  it('rótulo sempre com "estimativa"', () => {
    expect(formatarKcalEstimada(320)).toBe('~320 kcal (estimativa)');
  });

  it('reconhece compostos pelo nome', () => {
    expect(ehComposto('Agachamento livre')).toBe(true);
    expect(ehComposto('Levantamento terra')).toBe(true);
    expect(ehComposto('Rosca direta')).toBe(false);
  });
});
