// Regras puras da Comunidade (RN30).
export const LIMITE_POST = 280;

export type ResultadoTexto = { texto: string } | { erro: string };

export function validarTextoPost(entrada: unknown): ResultadoTexto {
  if (typeof entrada !== 'string') return { erro: 'Escreva algo para postar.' };
  const texto = entrada.trim();
  if (!texto) return { erro: 'Escreva algo para postar.' };
  if (texto.length > LIMITE_POST) return { erro: `Máximo de ${LIMITE_POST} caracteres.` };
  return { texto };
}

/** "agora", "5 min", "3 h", "2 d" ou a data curta. */
export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const min = Math.floor((agora.getTime() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(min) || min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.floor(min / 60)} h`;
  if (min < 10080) return `${Math.floor(min / 1440)} d`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Motivos de denúncia (mesma lista do banco). */
export const MOTIVOS_DENUNCIA = [
  { id: 'spam', rotulo: 'Spam' },
  { id: 'ofensivo', rotulo: 'Ofensivo' },
  { id: 'assedio', rotulo: 'Assédio' },
  { id: 'improprio', rotulo: 'Conteúdo impróprio' },
  { id: 'outro', rotulo: 'Outro' },
] as const;
