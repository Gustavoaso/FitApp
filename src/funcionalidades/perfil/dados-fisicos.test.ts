import { montarDadosFisicos, SEM_DADO } from './dados-fisicos';

describe('montarDadosFisicos', () => {
  it('usa o objetivo do banco mesmo com resposta diferente no questionário', () => {
    const dados = montarDadosFisicos(
      { peso_kg: 80, altura_cm: 170, idade: 30, objetivo: 'emagrecimento' },
      { objetivo: { objetivo_principal: 'Hipertrofia' } },
      'metrico',
    );
    expect(dados).toEqual({
      peso: '80 kg',
      altura: '170 cm',
      idade: '30 anos',
      objetivo: 'Emagrecimento',
    });
  });

  it('completa com as respostas quando o banco não tem o dado', () => {
    const dados = montarDadosFisicos(
      null,
      {
        perfil: { peso_atual: 60, altura: 160, idade: 22 },
        objetivo: { objetivo_principal: 'Definição' },
      },
      'metrico',
    );
    expect(dados.peso).toBe('60 kg');
    expect(dados.idade).toBe('22 anos');
    expect(dados.objetivo).toBe('Definição Muscular');
  });

  it('mostra traço sem nenhum dado, sem inventar valores', () => {
    for (const entrada of [null, undefined]) {
      expect(montarDadosFisicos(entrada, entrada, 'metrico')).toEqual({
        peso: SEM_DADO,
        altura: SEM_DADO,
        idade: SEM_DADO,
        objetivo: SEM_DADO,
      });
    }
  });

  it('recusa valores inválidos (zero, negativo, texto)', () => {
    const dados = montarDadosFisicos(
      { peso_kg: 0, altura_cm: -1, idade: Number.NaN, objetivo: '  ' },
      { pesoKg: 'abc' },
      'metrico',
    );
    expect(dados.peso).toBe(SEM_DADO);
    expect(dados.altura).toBe(SEM_DADO);
    expect(dados.idade).toBe(SEM_DADO);
    expect(dados.objetivo).toBe(SEM_DADO);
  });

  it('converte para imperial', () => {
    const dados = montarDadosFisicos({ peso_kg: 100, altura_cm: 180 }, null, 'imperial');
    expect(dados.peso).toBe('220 lbs');
    expect(dados.altura).toBe('5 ft 11 in');
  });
});
