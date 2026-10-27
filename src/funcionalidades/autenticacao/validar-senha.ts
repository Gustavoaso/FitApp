// Espelha a regra do Auth (supabase/config.toml: minimum_password_length = 8,
// password_requirements = "letters_digits") para avisar antes de enviar.
export const SENHA_TAMANHO_MINIMO = 8;

export function validarSenha(senha: unknown): { valido: boolean; mensagem: string } {
  if (typeof senha !== 'string' || senha.length < SENHA_TAMANHO_MINIMO) {
    return {
      valido: false,
      mensagem: `A senha deve ter no mínimo ${SENHA_TAMANHO_MINIMO} caracteres.`,
    };
  }
  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
    return { valido: false, mensagem: 'A senha deve ter ao menos uma letra e um número.' };
  }
  return { valido: true, mensagem: '' };
}
