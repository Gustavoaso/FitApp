// Regras puras de grupos (RN23, RN24): validação de entrada, rótulos e mensagens de erro.

export type ModoGrupo = 'treinos' | 'minutos' | 'xp';

export const MODOS: { valor: ModoGrupo; rotulo: string }[] = [
  { valor: 'treinos', rotulo: 'Treinos' },
  { valor: 'minutos', rotulo: 'Minutos' },
  { valor: 'xp', rotulo: 'XP' },
];

export interface Grupo {
  id: string;
  nome: string;
  modo: ModoGrupo;
  duracaoSemanas: number | null;
  fim: string | null;
  encerrado: boolean;
  ehCriador: boolean;
  /** Só vem para o criador de grupo ativo. */
  codigo: string | null;
  membros: number;
  checkinAutomatico: boolean;
}

export interface LinhaRanking {
  membroId: string;
  apelido: string;
  treinos: number;
  minutos: number;
  pontos: number;
  posicao: number;
  ehVoce: boolean;
}

export interface Checkin {
  id: string;
  apelido: string;
  nomeTreino: string | null;
  minutos: number;
  kcal: number | null;
  pontos: number;
  data: string;
  ehVoce: boolean;
}

/** Apelido de 3 a 20 caracteres, sem arroba (e-mail). Devolve o texto limpo ou o motivo. */
export function validarApelido(valor: unknown): { apelido: string } | { erro: string } {
  if (typeof valor !== 'string') return { erro: 'Escolha um apelido.' };
  const apelido = valor.trim();
  if (apelido.length < 3 || apelido.length > 20) return { erro: 'Use de 3 a 20 caracteres.' };
  if (apelido.includes('@')) return { erro: 'O apelido não pode ser um e-mail.' };
  return { apelido };
}

/** Código de convite: 6 letras ou números, em maiúsculas. null se inválido. */
export function normalizarCodigo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const codigo = valor.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(codigo) ? codigo : null;
}

export function validarNomeGrupo(valor: unknown): { nome: string } | { erro: string } {
  if (typeof valor !== 'string') return { erro: 'Dê um nome ao grupo.' };
  const nome = valor.trim();
  if (nome.length < 3 || nome.length > 40) return { erro: 'O nome tem de 3 a 40 caracteres.' };
  return { nome };
}

/** Valor mostrado ao lado do apelido no ranking, conforme o modo do grupo. */
export function valorDoModo(linha: LinhaRanking, modo: ModoGrupo): string {
  if (modo === 'minutos') return `${linha.minutos} min`;
  if (modo === 'xp') return `${linha.pontos} XP`;
  return linha.treinos === 1 ? '1 treino' : `${linha.treinos} treinos`;
}

const MENSAGENS: Record<string, string> = {
  codigo_invalido: 'Código não encontrado. Confira com quem convidou.',
  grupo_cheio: 'Este grupo já tem 30 pessoas.',
  limite_grupos: 'Você já está em 5 grupos. Saia de um para entrar em outro.',
  apelido_obrigatorio: 'Escolha um apelido antes.',
  apelido_em_uso: 'Esse apelido já está em uso.',
  criador_nao_sai: 'Quem criou o grupo encerra em vez de sair.',
  nao_membro: 'Você não participa deste grupo.',
  nao_criador: 'Só quem criou o grupo pode fazer isso.',
};

/** Traduz o erro do banco (a mensagem é o código) para português simples. */
export function mensagemDeErro(
  erro: { message?: string; code?: string } | null | undefined,
): string {
  if (erro?.code === '23505') return MENSAGENS.apelido_em_uso;
  return MENSAGENS[erro?.message ?? ''] ?? 'Não deu certo. Tente de novo.';
}

export function mensagemConvite(nome: string, codigo: string): string {
  return `Entre no meu grupo "${nome}" no TreinaAI com o código ${codigo}.`;
}
