import { validarAlimento, type CampoAlimento } from './cadastro-alimento';

const base: CampoAlimento = {
  nome: 'Pão da vó',
  kcal: '',
  proteina: '8',
  carboidrato: '45,5',
  gordura: '3',
  porcaoGramas: '',
};

describe('validarAlimento', () => {
  it('calcula kcal quando vazia e aceita vírgula decimal', () => {
    const { alimento, erro } = validarAlimento(base);
    expect(erro).toBeUndefined();
    expect(alimento).toMatchObject({
      calorias_100g: 241,
      carboidratos_100g: 45.5,
      porcao_gramas: 100,
      porcao_descricao: '100 g',
    });
  });

  it('recusa nome curto, macros negativos e soma acima de 100 g', () => {
    expect(validarAlimento({ ...base, nome: 'a' }).erro).toMatch(/nome/);
    expect(validarAlimento({ ...base, gordura: '-1' }).erro).toMatch(/números/);
    expect(validarAlimento({ ...base, proteina: '60', carboidrato: '60' }).erro).toMatch(/100 g/);
  });

  it('recusa kcal e porção fora dos limites', () => {
    expect(validarAlimento({ ...base, kcal: '950' }).erro).toMatch(/calorias/);
    expect(validarAlimento({ ...base, porcaoGramas: '0' }).erro).toMatch(/porção/);
    expect(validarAlimento({ ...base, proteina: 'abc' }).erro).toMatch(/números/);
  });
});
