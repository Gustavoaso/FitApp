import { validarSenha } from './validar-senha';

describe('validarSenha', () => {
  it('aceita 8 caracteres com letra e número', () => {
    expect(validarSenha('abcdefg1').valido).toBe(true);
  });
  it('recusa 7 caracteres', () => {
    expect(validarSenha('abcdef1')).toEqual({
      valido: false,
      mensagem: 'A senha deve ter no mínimo 8 caracteres.',
    });
  });
  it('recusa sem número ou sem letra', () => {
    expect(validarSenha('abcdefgh').valido).toBe(false);
    expect(validarSenha('12345678').mensagem).toBe(
      'A senha deve ter ao menos uma letra e um número.',
    );
  });
  it('recusa vazio, null, undefined e tipo errado', () => {
    expect(validarSenha('').valido).toBe(false);
    expect(validarSenha(null).valido).toBe(false);
    expect(validarSenha(undefined).valido).toBe(false);
    expect(validarSenha(12345678).valido).toBe(false);
  });
});
