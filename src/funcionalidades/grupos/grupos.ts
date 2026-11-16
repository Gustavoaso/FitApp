// Regras puras de grupos (RN23, RN24): validação de entrada, rótulos e mensagens de erro.

export const ATIVIDADES = [
  'musculação',
  'corrida',
  'caminhada',
  'bike',
  'natação',
  'esporte',
  'outro',
] as const;
export type Atividade = (typeof ATIVIDADES)[number];

export interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  /** 'capa:1'..'capa:8' ou caminho no bucket banners. */
  banner: string | null;
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
  pontos: number;
  posicao: number;
  ehVoce: boolean;
}

export interface Checkin {
  id: string;
  apelido: string;
  atividade: string;
  nomeTreino: string | null;
  descricao: string | null;
  fotoCaminho: string | null;
  minutos: number;
  kcal: number | null;
  data: string;
  curtidas: number;
  curtiu: boolean;
  comentarios: number;
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

/** Pontuação do ranking: 1 ponto por dia com check-in. */
export function textoPontos(pontos: number): string {
  return pontos === 1 ? '1 ponto' : `${pontos} pontos`;
}

const MENSAGENS: Record<string, string> = {
  codigo_invalido: 'Código não encontrado. Confira com quem convidou.',
  muitas_tentativas: 'Muitas tentativas. Tente de novo mais tarde.',
  removido_do_grupo: 'Você não pode voltar a este grupo.',
  grupo_cheio: 'Este grupo já tem 50 pessoas.',
  limite_grupos: 'Você já está em 10 grupos. Saia de um para entrar em outro.',
  apelido_obrigatorio: 'Escolha um apelido antes.',
  apelido_em_uso: 'Esse apelido já está em uso.',
  criador_nao_sai: 'Quem criou o grupo encerra em vez de sair.',
  nao_membro: 'Você não participa deste grupo.',
  nao_criador: 'Só quem criou o grupo pode fazer isso.',
  data_invalida: 'O check-in manual só vale para hoje ou ontem.',
  fora_do_periodo: 'Essa data está fora do período do grupo.',
  grupo_encerrado: 'Este grupo foi encerrado.',
  comentario_invalido: 'O comentário tem de 1 a 280 caracteres.',
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

// Cores das 8 capas prontas ('capa:1'..'capa:8'); banner de foto usa o caminho no Storage.
const CORES_CAPA = [
  '#2F6FED',
  '#0FA37F',
  '#E8590C',
  '#9C36B5',
  '#D6336C',
  '#1098AD',
  '#5C7CFA',
  '#74B816',
];

/** Cor da capa pronta; null se o banner não for uma capa (foto ou vazio). */
export function corDaCapa(banner: unknown): string | null {
  if (typeof banner !== 'string') return null;
  const n = /^capa:([1-8])$/.exec(banner)?.[1];
  return n ? CORES_CAPA[Number(n) - 1] : null;
}

/** Data local AAAA-MM-DD de hoje ou de ontem (o manual só vale para esses dois dias). */
export function dataManual(quando: 'hoje' | 'ontem', agora: Date = new Date()): string {
  const d = new Date(agora);
  if (quando === 'ontem') d.setDate(d.getDate() - 1);
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** Minutos do check-in manual: inteiro de 1 a 600. null se inválido. */
export function validarMinutos(valor: unknown): number | null {
  const n = typeof valor === 'string' ? Number(valor.trim()) : valor;
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 600 ? n : null;
}
