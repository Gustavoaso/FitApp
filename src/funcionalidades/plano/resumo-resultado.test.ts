import { descreverBalanco, segmentosAnel } from './resumo-resultado';

describe('segmentosAnel', () => {
  it('divide o anel pelas kcal de cada macro', () => {
    // 100 g P = 400 kcal, 100 g C = 400 kcal, 0 g G: metade cada.
    const s = segmentosAnel({ proteinas: 100, carboidratos: 100, gorduras: 0 }, 100, 0);
    expect(s).toEqual([
      { macro: 'proteina', comprimento: 50, inicio: 0 },
      { macro: 'carboidrato', comprimento: 50, inicio: 50 },
      { macro: 'gordura', comprimento: 0, inicio: 100 },
    ]);
  });

  it('gordura vale 9 kcal por grama e o espaço sai do traço', () => {
    const s = segmentosAnel({ proteinas: 0, carboidratos: 0, gorduras: 10 }, 360, 10);
    expect(s[2]).toEqual({ macro: 'gordura', comprimento: 350, inicio: 0 });
  });

  it('nunca devolve traço negativo', () => {
    const s = segmentosAnel({ proteinas: 1, carboidratos: 1000, gorduras: 0 }, 100, 20);
    expect(s[0].comprimento).toBe(0);
  });

  it('recusa zeros, negativos e tipos errados', () => {
    expect(segmentosAnel({ proteinas: 0, carboidratos: 0, gorduras: 0 }, 100, 0)).toEqual([]);
    expect(segmentosAnel({ proteinas: -1, carboidratos: 10, gorduras: 10 }, 100, 0)).toEqual([]);
    expect(segmentosAnel({ proteinas: NaN, carboidratos: 10, gorduras: 10 }, 100, 0)).toEqual([]);
    // @ts-expect-error entrada inválida de propósito
    expect(segmentosAnel(null, 100, 0)).toEqual([]);
    // @ts-expect-error entrada inválida de propósito
    expect(segmentosAnel({ proteinas: '10', carboidratos: 10, gorduras: 10 }, 100, 0)).toEqual([]);
  });
});

describe('descreverBalanco', () => {
  it('superávit, déficit e manutenção', () => {
    expect(descreverBalanco(2480, 2180)).toBe('+300 de superávit');
    expect(descreverBalanco(1800, 2200)).toBe('-400 de déficit');
    expect(descreverBalanco(2000, 2000)).toBe('manutenção');
  });

  it('arredonda a diferença', () => {
    expect(descreverBalanco(2000.4, 2000)).toBe('manutenção');
  });

  it('recusa valores inválidos', () => {
    expect(descreverBalanco(NaN, 2000)).toBe('');
    // @ts-expect-error entrada inválida de propósito
    expect(descreverBalanco(undefined, 2000)).toBe('');
    // @ts-expect-error entrada inválida de propósito
    expect(descreverBalanco('2000', 2000)).toBe('');
  });
});
