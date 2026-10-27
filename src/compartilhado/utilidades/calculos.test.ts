import {
  calcularTMB,
  calcularTDEE,
  calcularCaloriasAlvo,
  calcularMacros,
  calcularMetaAgua,
  calcularTudo,
} from './calculos';

// Valores esperados calculados à mão a partir das fórmulas do PROJETO.md (RN01 a RN05).

describe('RN01: TMB por Mifflin-St Jeor', () => {
  it('soma 5 para o sexo masculino', () => {
    // 10·80 + 6,25·180 − 5·30 + 5 = 800 + 1125 − 150 + 5
    expect(calcularTMB(80, 180, 30, 'masculino')).toBe(1780);
  });

  it('subtrai 161 para o sexo feminino', () => {
    // 10·60 + 6,25·165 − 5·25 − 161 = 600 + 1031,25 − 125 − 161
    expect(calcularTMB(60, 165, 25, 'feminino')).toBe(1345);
  });

  it('a diferença entre os sexos com os mesmos dados é 166 kcal', () => {
    expect(calcularTMB(70, 170, 40, 'masculino') - calcularTMB(70, 170, 40, 'feminino')).toBe(166);
  });

  it('arredonda o resultado', () => {
    // 10·70 + 6,25·171 − 5·33 + 5 = 1608,75
    expect(calcularTMB(70, 171, 33, 'masculino')).toBe(1609);
  });
});

describe('RN02: TDEE = TMB × fator de atividade', () => {
  it.each([
    ['sedentario', 2400],
    ['leve', 2750],
    ['moderado', 3100],
    ['ativo', 3450],
    ['muito_ativo', 3800],
  ] as const)('%s', (nivel, esperado) => {
    expect(calcularTDEE(2000, nivel)).toBe(esperado);
  });

  it('arredonda o resultado', () => {
    // 1345 × 1,375 = 1849,375
    expect(calcularTDEE(1345, 'leve')).toBe(1849);
  });
});

describe('RN03: calorias-alvo = TDEE × ajuste do objetivo', () => {
  it.each([
    ['hipertrofia', 2200],
    ['definicao', 1700],
    ['forca', 2100],
    ['emagrecimento', 1600],
    ['condicionamento', 2000],
  ] as const)('%s', (objetivo, esperado) => {
    expect(calcularCaloriasAlvo(2000, objetivo)).toBe(esperado);
  });
});

describe('RN04: macros em % das calorias (4/4/9 kcal por grama)', () => {
  it('hipertrofia 30/45/25', () => {
    expect(calcularMacros(2000, 'hipertrofia')).toEqual({
      calorias: 2000,
      proteinas: 150,
      carboidratos: 225,
      gorduras: 56,
    });
  });

  it('força usa a mesma divisão da hipertrofia', () => {
    expect(calcularMacros(2000, 'forca')).toEqual(calcularMacros(2000, 'hipertrofia'));
  });

  it('definição 35/35/30', () => {
    expect(calcularMacros(2000, 'definicao')).toEqual({
      calorias: 2000,
      proteinas: 175,
      carboidratos: 175,
      gorduras: 67,
    });
  });

  it('emagrecimento usa a mesma divisão da definição', () => {
    expect(calcularMacros(2000, 'emagrecimento')).toEqual(calcularMacros(2000, 'definicao'));
  });

  it('condicionamento 25/50/25', () => {
    expect(calcularMacros(2000, 'condicionamento')).toEqual({
      calorias: 2000,
      proteinas: 125,
      carboidratos: 250,
      gorduras: 56,
    });
  });

  it('zero calorias dá zero gramas', () => {
    expect(calcularMacros(0, 'hipertrofia')).toEqual({
      calorias: 0,
      proteinas: 0,
      carboidratos: 0,
      gorduras: 0,
    });
  });
});

describe('RN05: água = 35 ml × peso', () => {
  it('peso inteiro', () => {
    expect(calcularMetaAgua(70)).toBe(2450);
  });

  it('peso fracionado é arredondado', () => {
    // 70,5 × 35 = 2467,5
    expect(calcularMetaAgua(70.5)).toBe(2468);
  });
});

describe('calcularTudo encadeia RN01 a RN05', () => {
  it('perfil masculino moderado em hipertrofia', () => {
    // TMB 1780 → TDEE 1780×1,55 = 2759 → alvo 2759×1,10 = 3034,9 → 3035
    expect(calcularTudo(80, 180, 30, 'masculino', 'moderado', 'hipertrofia')).toEqual({
      tmb: 1780,
      tdee: 2759,
      caloriasAlvo: 3035,
      macros: { calorias: 3035, proteinas: 228, carboidratos: 341, gorduras: 84 },
      metaAguaMl: 2800,
      deficitOuSuperavit: 276,
    });
  });

  it('déficit fica negativo no emagrecimento', () => {
    const resultado = calcularTudo(60, 165, 25, 'feminino', 'sedentario', 'emagrecimento');
    // TMB 1345 → TDEE 1614 → alvo 1291,2 → 1291
    expect(resultado.tdee).toBe(1614);
    expect(resultado.caloriasAlvo).toBe(1291);
    expect(resultado.deficitOuSuperavit).toBe(-323);
  });
});

describe('entradas recusadas (comportamento atual, sem validação)', () => {
  // As funções não validam entrada: a validação mora no questionário.
  // Estes testes registram o que acontece hoje para a mudança ser deliberada.
  it('nível de atividade desconhecido dá NaN', () => {
    expect(calcularTDEE(2000, 'inexistente' as never)).toBeNaN();
  });

  it('peso undefined dá NaN na TMB', () => {
    expect(calcularTMB(undefined as never, 170, 30, 'masculino')).toBeNaN();
  });

  it('objetivo null quebra nos macros', () => {
    expect(() => calcularMacros(2000, null as never)).toThrow(TypeError);
  });
});
