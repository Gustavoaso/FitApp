// Regras do perfil público (RN24 revista): @usuario e bio.

/** @usuario: 3 a 15, minúsculas, números e _ (aceita o @ digitado). Devolve o texto limpo ou o motivo. */
export function validarUsuario(valor: unknown): { usuario: string } | { erro: string } {
  if (typeof valor !== 'string') return { erro: 'Escolha um @usuario.' };
  const usuario = valor.trim().replace(/^@/, '');
  if (!/^[a-z0-9_]{3,15}$/.test(usuario)) {
    return { erro: 'Use de 3 a 15 letras minúsculas, números ou _.' };
  }
  return { usuario };
}

/** Bio opcional de até 160 caracteres; vazia vira null. */
export function validarBio(valor: unknown): { bio: string | null } | { erro: string } {
  if (valor === null || valor === undefined) return { bio: null };
  if (typeof valor !== 'string') return { erro: 'Bio inválida.' };
  const bio = valor.trim();
  if (bio.length > 160) return { erro: 'A bio tem no máximo 160 caracteres.' };
  return { bio: bio || null };
}
