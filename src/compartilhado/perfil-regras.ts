// Regras de apelido e @usuario, usadas por Grupos, Perfil e Comunidade.

/** Apelido de 3 a 20 caracteres, sem arroba (e-mail). Devolve o texto limpo ou o motivo. */
export function validarApelido(valor: unknown): { apelido: string } | { erro: string } {
  if (typeof valor !== 'string') return { erro: 'Escolha um apelido.' };
  const apelido = valor.trim();
  if (apelido.length < 3 || apelido.length > 20) return { erro: 'Use de 3 a 20 caracteres.' };
  if (apelido.includes('@')) return { erro: 'O apelido não pode ser um e-mail.' };
  return { apelido };
}

/** @usuario: 3 a 15, minúsculas, números e _ (aceita o @ digitado). Devolve o texto limpo ou o motivo. */
export function validarUsuario(valor: unknown): { usuario: string } | { erro: string } {
  if (typeof valor !== 'string') return { erro: 'Escolha um @usuario.' };
  const usuario = valor.trim().replace(/^@/, '');
  if (!/^[a-z0-9_]{3,15}$/.test(usuario)) {
    return { erro: 'Use de 3 a 15 letras minúsculas, números ou _.' };
  }
  return { usuario };
}
