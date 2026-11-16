import { validarBio, validarUsuario } from './perfil-publico';

describe('validarUsuario', () => {
  it('aceita e tira o @', () => expect(validarUsuario(' @ana_01 ')).toEqual({ usuario: 'ana_01' }));
  it('aceita os limites 3 e 15', () => {
    expect(validarUsuario('abc')).toEqual({ usuario: 'abc' });
    expect(validarUsuario('a'.repeat(15))).toEqual({ usuario: 'a'.repeat(15) });
  });
  it.each(['ab', 'a'.repeat(16), 'Ana', 'ana!', 'a b c', '', null, undefined, 7])(
    'recusa %p',
    (v) => expect(validarUsuario(v)).toHaveProperty('erro'),
  );
});

describe('validarBio', () => {
  it('limpa espaços e vazia vira null', () => {
    expect(validarBio('  oi  ')).toEqual({ bio: 'oi' });
    expect(validarBio('   ')).toEqual({ bio: null });
    expect(validarBio(null)).toEqual({ bio: null });
  });
  it('160 passa, 161 não', () => {
    expect(validarBio('a'.repeat(160))).toEqual({ bio: 'a'.repeat(160) });
    expect(validarBio('a'.repeat(161))).toHaveProperty('erro');
  });
  it('recusa tipo errado', () => expect(validarBio(5)).toHaveProperty('erro'));
});
