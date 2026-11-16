// Regras do perfil público (RN24 revista): @usuario e bio.

export { validarUsuario } from '@/compartilhado/perfil-regras';

/** Bio opcional de até 160 caracteres; vazia vira null. */
export function validarBio(valor: unknown): { bio: string | null } | { erro: string } {
  if (valor === null || valor === undefined) return { bio: null };
  if (typeof valor !== 'string') return { erro: 'Bio inválida.' };
  const bio = valor.trim();
  if (bio.length > 160) return { erro: 'A bio tem no máximo 160 caracteres.' };
  return { bio: bio || null };
}
