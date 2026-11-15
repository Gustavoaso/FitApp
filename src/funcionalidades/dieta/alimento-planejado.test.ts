import { descreverAlimentoPlanejado, descreverSubstituicao } from './alimento-planejado';

describe('alimento planejado (RN19)', () => {
  it('mostra a medida caseira ao lado das gramas', () => {
    expect(
      descreverAlimentoPlanejado({
        nome: 'Arroz cozido',
        porcao: '180g',
        calorias: 230.4,
        medidaCaseira: 'cerca de 7 colheres de sopa',
      }),
    ).toBe('Arroz cozido • 180g (cerca de 7 colheres de sopa) • 230 kcal');
  });

  it('plano antigo, sem medida, mostra só gramas; kcal inválida vira 0', () => {
    expect(descreverAlimentoPlanejado({ nome: 'Azeite', porcao: '10g', calorias: NaN })).toBe(
      'Azeite • 10g • 0 kcal',
    );
  });

  it('troca com e sem medida caseira', () => {
    expect(
      descreverSubstituicao({
        nome: 'Batata',
        porcao: '400g',
        medidaCaseira: 'cerca de 3 unidades',
      }),
    ).toBe('Ou troque por: Batata, 400g (cerca de 3 unidades)');
    expect(descreverSubstituicao({ nome: 'Ovo', porcao: '150g' })).toBe('Ou troque por: Ovo, 150g');
  });
});
