// ============================================================
// REGRA: opções, validação e conversão das respostas do questionário
// ============================================================
// Funções puras: a tela só mostra e chama. Os textos guardados (`valor`) são
// os que o motor (`mapear-plano.ts`) já entende; o `rotulo` é só de exibição.
// ============================================================

import type { SFSymbol } from 'expo-symbols';
import type { DadosQuestionario } from '@/compartilhado/tipos';
import {
  validarAltura,
  validarFrequenciaSemanal,
  validarIdade,
  validarPeso,
} from '@/compartilhado/utilidades';
import type { RespostasEmEdicao } from './campos-pendentes';

export interface Opcao {
  valor: string;
  rotulo: string;
  descricao?: string;
  icone?: SFSymbol;
}

export const RESPOSTAS_VAZIAS: RespostasEmEdicao = {
  objetivo: '',
  sexo: '',
  idade: '',
  altura: '',
  peso: '',
  experiencia: '',
  dias: '',
  local: '',
  restricaoFisica: [],
  restricaoAlimentar: [],
  atividade: '',
  refeicoes: '',
};

export const OBJETIVOS: Opcao[] = [
  {
    valor: 'Hipertrofia',
    rotulo: 'Hipertrofia',
    descricao: 'Ganhar massa muscular',
    icone: 'dumbbell.fill',
  },
  {
    valor: 'Definição',
    rotulo: 'Definição',
    descricao: 'Menos gordura, músculo à mostra',
    icone: 'flame.fill',
  },
  {
    valor: 'Emagrecimento',
    rotulo: 'Emagrecimento',
    descricao: 'Perder peso com saúde',
    icone: 'arrow.down.circle.fill',
  },
  {
    valor: 'Ganho de força',
    rotulo: 'Força',
    descricao: 'Levantar mais carga',
    icone: 'bolt.fill',
  },
  {
    valor: 'Condicionamento geral',
    rotulo: 'Condicionamento',
    descricao: 'Mais fôlego e disposição',
    icone: 'heart.fill',
  },
];

export const SEXOS: Opcao[] = [
  { valor: 'Masculino', rotulo: 'Masculino' },
  { valor: 'Feminino', rotulo: 'Feminino' },
];

export const EXPERIENCIAS: Opcao[] = [
  { valor: 'Nunca treinei', rotulo: 'Nunca treinei', descricao: 'Estou começando agora' },
  { valor: 'Menos de 6 meses', rotulo: 'Menos de 6 meses', descricao: 'Treino há pouco tempo' },
  { valor: '6 meses a 2 anos', rotulo: '6 meses a 2 anos', descricao: 'Já tenho uma base' },
  { valor: 'Mais de 2 anos', rotulo: 'Mais de 2 anos', descricao: 'Treino de forma consistente' },
];

export const LOCAIS: Opcao[] = [
  {
    valor: 'Peso do corpo',
    rotulo: 'Em casa, sem equipamento',
    descricao: 'Peso do corpo',
    icone: 'figure.walk',
  },
  {
    valor: 'Casa',
    rotulo: 'Em casa, com equipamentos',
    descricao: 'Halteres, elásticos, barra',
    icone: 'house.fill',
  },
  {
    valor: 'Academia',
    rotulo: 'Na academia',
    descricao: 'Máquinas e pesos livres',
    icone: 'dumbbell.fill',
  },
];

export const LESOES: Opcao[] = [
  { valor: 'Joelho', rotulo: 'Joelho' },
  { valor: 'Ombro', rotulo: 'Ombro' },
  { valor: 'Coluna-lombar', rotulo: 'Coluna' },
  { valor: 'Nenhuma', rotulo: 'Nenhuma' },
];

// Sem alergias nem "Outra": o motor não tem regra para elas (RN18).
export const RESTRICOES_ALIMENTARES: Opcao[] = [
  { valor: 'Glúten', rotulo: 'Sem glúten' },
  { valor: 'Lactose', rotulo: 'Sem lactose' },
  { valor: 'Vegetariano', rotulo: 'Vegetariano' },
  { valor: 'Vegano', rotulo: 'Vegano' },
  { valor: 'Nenhuma', rotulo: 'Nenhuma' },
];

export const ATIVIDADES: Opcao[] = [
  {
    valor: 'Sedentário',
    rotulo: 'Sentado a maior parte do dia',
    descricao: 'Escritório, estudo',
    icone: 'desktopcomputer',
  },
  {
    valor: 'Leve',
    rotulo: 'Em pé ou andando um pouco',
    descricao: 'Comércio, casa, aulas',
    icone: 'figure.walk',
  },
  {
    valor: 'Moderado',
    rotulo: 'Ativo o dia todo',
    descricao: 'Trabalho físico, muito movimento',
    icone: 'figure.run',
  },
];

export const DIAS = [2, 3, 4, 5, 6, 7];

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Nível derivado do tempo de treino (RN18). */
export function nivelDaExperiencia(experiencia: string): string {
  if (experiencia === 'Mais de 2 anos') return 'Avançado';
  if (experiencia === '6 meses a 2 anos') return 'Intermediário';
  return 'Iniciante';
}

/** Faixa mais próxima de um nível salvo (o perfil não guarda a faixa exata). */
function experienciaDoNivel(nivel: string): string {
  const n = semAcento(nivel);
  if (n.includes('avanc')) return 'Mais de 2 anos';
  if (n.includes('intermed')) return '6 meses a 2 anos';
  if (n.includes('inici')) return 'Menos de 6 meses';
  return '';
}

/** Acha a opção por texto salvo, ignorando caixa e acento ("forca" acha "Ganho de força"). */
function valorDaOpcao(opcoes: Opcao[], texto: unknown): string {
  const t = semAcento(String(texto ?? ''));
  if (!t) return '';
  const achada =
    opcoes.find((o) => semAcento(o.valor) === t) ??
    opcoes.find((o) => semAcento(o.valor).includes(t));
  return achada?.valor ?? '';
}

function numero(texto: string): number {
  return Number(texto.replace(',', '.'));
}

/** Mensagem do que impede avançar no passo (null = tudo certo). Passo de 1 a 10. */
export function erroDoPasso(passo: number, r: RespostasEmEdicao): string | null {
  const resultados =
    passo === 2
      ? [validarIdade(numero(r.idade))]
      : passo === 3
        ? [validarAltura(numero(r.altura)), validarPeso(numero(r.peso))]
        : passo === 5 && r.dias
          ? [validarFrequenciaSemanal(numero(r.dias))]
          : [];
  const falha = resultados.find((v) => !v.valido);
  if (falha && !falha.valido) return falha.mensagem;
  if (passo === 10) {
    const n = numero(r.refeicoes);
    if (!Number.isInteger(n) || n < 3 || n > 6) return 'Refeições por dia: de 3 a 6.';
  }
  return null;
}

/** Marca ou desmarca; "Nenhuma" é exclusiva e as outras a desmarcam. */
export function alternarOpcao(lista: string[], item: string): string[] {
  if (item === 'Nenhuma') return lista.includes('Nenhuma') ? [] : ['Nenhuma'];
  const semNenhuma = lista.filter((x) => x !== 'Nenhuma');
  return semNenhuma.includes(item) ? semNenhuma.filter((x) => x !== item) : [...semNenhuma, item];
}

// PREMISSA: o questionário V1 não pergunta tempo por sessão (volta na "Parte B"): 1h.
const TEMPO_SESSAO_PADRAO = '1h';
const DIVISAO_PADRAO = 'Deixar a IA decidir';

export function montarPayload(r: RespostasEmEdicao, nome: string): DadosQuestionario {
  return {
    perfil: {
      nome,
      sexo_biologico: r.sexo,
      idade: numero(r.idade),
      peso_atual: numero(r.peso),
      altura: numero(r.altura),
    },
    objetivo: {
      objetivo_principal: r.objetivo,
      atividade_fora_treino: r.atividade,
      nivel_experiencia: nivelDaExperiencia(r.experiencia),
    },
    treino: {
      dias_disponiveis_semana: numero(r.dias),
      local_treino: r.local,
      tempo_sessao: TEMPO_SESSAO_PADRAO,
      divisao_preferida: DIVISAO_PADRAO,
      restricao_fisica: r.restricaoFisica,
    },
    dieta: {
      restricao_alimentar: r.restricaoAlimentar,
      refeicoes_por_dia: numero(r.refeicoes),
    },
  };
}

type PayloadParcial = {
  perfil?: Partial<DadosQuestionario['perfil']>;
  objetivo?: Partial<DadosQuestionario['objetivo']>;
  treino?: Partial<DadosQuestionario['treino']>;
  dieta?: Partial<DadosQuestionario['dieta']>;
};

function lista(opcoes: Opcao[], itens: unknown): string[] {
  if (!Array.isArray(itens)) return [];
  const valores = itens.map((i) => valorDaOpcao(opcoes, i)).filter(Boolean);
  return [...new Set(valores)];
}

/** Respostas salvas ("Ajustar respostas", Perfil) para pré-preencher. O que não casa fica vazio. */
export function respostasDoPayload(p: PayloadParcial | null | undefined): RespostasEmEdicao {
  const texto = (v: unknown) => (v == null || v === '' ? '' : String(v));
  return {
    objetivo: valorDaOpcao(OBJETIVOS, p?.objetivo?.objetivo_principal),
    sexo: valorDaOpcao(SEXOS, p?.perfil?.sexo_biologico),
    idade: texto(p?.perfil?.idade),
    altura: texto(p?.perfil?.altura),
    peso: texto(p?.perfil?.peso_atual),
    experiencia: experienciaDoNivel(texto(p?.objetivo?.nivel_experiencia)),
    dias: texto(p?.treino?.dias_disponiveis_semana),
    local: valorDaOpcao(LOCAIS, p?.treino?.local_treino),
    restricaoFisica: lista(LESOES, p?.treino?.restricao_fisica),
    restricaoAlimentar: lista(RESTRICOES_ALIMENTARES, p?.dieta?.restricao_alimentar),
    atividade: valorDaOpcao(ATIVIDADES, p?.objetivo?.atividade_fora_treino),
    refeicoes: texto(p?.dieta?.refeicoes_por_dia),
  };
}

export interface BlocoResumo {
  titulo: string;
  texto: string;
  /** Passos que o "Editar" percorre antes de voltar ao resumo. */
  passos: number[];
}

const rotuloDe = (opcoes: Opcao[], valor: string) =>
  opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;

export function blocosDoResumo(r: RespostasEmEdicao): BlocoResumo[] {
  return [
    { titulo: 'Objetivo', texto: rotuloDe(OBJETIVOS, r.objetivo), passos: [1] },
    {
      titulo: 'Perfil',
      texto: `${r.sexo} · ${r.idade} anos · ${r.altura} cm · ${r.peso} kg`,
      passos: [2, 3],
    },
    { titulo: 'Experiência', texto: r.experiencia, passos: [4] },
    { titulo: 'Rotina', texto: rotuloDe(ATIVIDADES, r.atividade), passos: [9] },
    {
      titulo: 'Treino',
      texto: [
        `${r.dias} dias`,
        rotuloDe(LOCAIS, r.local),
        r.restricaoFisica.map((x) => rotuloDe(LESOES, x)).join(', '),
      ].join(' · '),
      passos: [5, 6, 7],
    },
    {
      titulo: 'Alimentação',
      texto: [
        r.restricaoAlimentar.map((x) => rotuloDe(RESTRICOES_ALIMENTARES, x)).join(', '),
        `${r.refeicoes} refeições`,
      ].join(' · '),
      passos: [8, 10],
    },
  ];
}
