import {
  mensagemConvite,
  mensagemDeErro,
  normalizarCodigo,
  validarApelido,
  validarNomeGrupo,
  textoPontos,
  type LinhaRanking,
} from './grupos';

const linha: LinhaRanking = {
  membroId: 'm',
  apelido: 'Ana',
  pontos: 3,
  posicao: 1,
  ehVoce: true,
};

describe('validarApelido', () => {
  it('aceita e limpa espaços', () => expect(validarApelido('  Ana  ')).toEqual({ apelido: 'Ana' }));
  it('aceita os limites 3 e 20', () => {
    expect(validarApelido('abc')).toEqual({ apelido: 'abc' });
    expect(validarApelido('a'.repeat(20))).toEqual({ apelido: 'a'.repeat(20) });
  });
  it.each([['ab'], ['a'.repeat(21)], ['ana@x.com'], [''], [null], [undefined], [42]])(
    'recusa %p',
    (valor) => expect(validarApelido(valor)).toHaveProperty('erro'),
  );
});

describe('normalizarCodigo', () => {
  it('põe em maiúsculas e tira espaços', () => expect(normalizarCodigo(' ab12cd ')).toBe('AB12CD'));
  it.each([['ABC'], ['ABCDEFG'], ['AB 2CD'], ['AB-2CD'], [null], [undefined], [123456]])(
    'recusa %p',
    (valor) => expect(normalizarCodigo(valor)).toBeNull(),
  );
});

describe('validarNomeGrupo', () => {
  it('aceita 3 a 40', () => expect(validarNomeGrupo('Galera')).toEqual({ nome: 'Galera' }));
  it.each([['ab'], ['a'.repeat(41)], [null], [7]])('recusa %p', (v) =>
    expect(validarNomeGrupo(v)).toHaveProperty('erro'),
  );
});

describe('textoPontos', () => {
  it('formata a pontuação', () => {
    expect(textoPontos(linha.pontos)).toBe('3 pontos');
    expect(textoPontos(1)).toBe('1 ponto');
    expect(textoPontos(0)).toBe('0 pontos');
  });
});

describe('mensagens', () => {
  it('traduz o código do banco', () => {
    expect(mensagemDeErro({ message: 'grupo_cheio' })).toMatch('50 pessoas');
    expect(mensagemDeErro({ code: '23505' })).toMatch('em uso');
  });
  it('erro desconhecido ou nulo vira mensagem genérica', () => {
    expect(mensagemDeErro({ message: 'xyz' })).toMatch('Tente de novo');
    expect(mensagemDeErro(null)).toMatch('Tente de novo');
  });
  it('convite leva nome e código, nada pessoal', () =>
    expect(mensagemConvite('Galera', 'AB12CD')).toContain('AB12CD'));
});
