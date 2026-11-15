// ============================================================
// MOTOR: refeições pela rotina, medida caseira e substituição (RN19)
// ============================================================
// Nome e horário de cada refeição saem da rotina da pessoa; a
// que fica antes e a que fica depois do treino ganham orientação.
// As gramas viram medida caseira quando a base tem a porção
// típica, e cada alimento ganha 1 troca equivalente do mesmo slot.
// ============================================================

import type { NivelAtividade, SubstituicaoAlimento } from '@/compartilhado/tipos';
import { LIMITES_GRAMAS } from './gramas';
import type { AlimentoCandidato, NomeRefeicao } from './tipos';

export interface RefeicaoNomeada {
  nome: string;
  horario: string;
  momentoTreino?: 'pre' | 'pos';
  orientacao?: string;
}

// Nomes fixos: a RPC salvar_plano_gerado traduz "Café da manhã", "Almoço" e "Jantar" para o tipo.
const NOMES: Record<NomeRefeicao, string> = {
  cafe: 'Café da manhã',
  lanche_manha: 'Lanche da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
};

// PREMISSA: horários de uma rotina comercial; quem trabalha em pé ou com esforço físico
// costuma começar mais cedo, então o café e o lanche da manhã andam 30 minutos.
const HORARIOS: Record<NomeRefeicao, string> = {
  cafe: '07:00',
  lanche_manha: '10:00',
  almoco: '12:30',
  lanche: '16:00',
  jantar: '20:00',
  ceia: '22:00',
};
const HORARIOS_CEDO: Partial<Record<NomeRefeicao, string>> = {
  cafe: '06:30',
  lanche_manha: '09:30',
};

// PREMISSA: o questionário não pergunta o horário do treino; supõe fim da tarde (depois do
// trabalho), então o pré-treino é a última refeição da tarde e o pós-treino, o jantar.
const ORIENTACAO_PRE =
  'Nos dias de treino, coma 1 a 2 horas antes de treinar: o carboidrato daqui é o combustível da sessão.';
const ORIENTACAO_POS =
  'Nos dias de treino, faça esta refeição até 2 horas depois de treinar: a proteína daqui ajuda a recuperar o músculo.';

export function nomearRefeicoes(
  refeicoes: NomeRefeicao[],
  atividade: NivelAtividade,
): RefeicaoNomeada[] {
  const cedo = atividade !== 'sedentario';
  const indicePos = refeicoes.lastIndexOf('jantar');
  // Pré-treino: a última antes do jantar que não seja o café (lanche da tarde ou almoço).
  const candidatasPre = refeicoes.slice(0, Math.max(indicePos, 0)).filter((r) => r !== 'cafe');
  const pre = candidatasPre[candidatasPre.length - 1];
  return refeicoes.map((r, i) => {
    const base = { nome: NOMES[r], horario: (cedo && HORARIOS_CEDO[r]) || HORARIOS[r] };
    if (r === pre) return { ...base, momentoTreino: 'pre', orientacao: ORIENTACAO_PRE };
    if (i === indicePos) return { ...base, momentoTreino: 'pos', orientacao: ORIENTACAO_POS };
    return base;
  });
}

function numeroDaFracao(texto: string): number {
  const [a, b] = texto.split('/').map(Number);
  return b ? a / b : a;
}

/** "colher de sopa" → "colheres de sopa"; só a primeira palavra vai para o plural. */
function plural(medida: string): string {
  const [primeira, ...resto] = medida.split(' ');
  const irregulares: Record<string, string> = {
    colher: 'colheres',
    pãozinho: 'pãezinhos',
    pão: 'pães',
    filé: 'filés',
    porção: 'porções',
  };
  const nova = irregulares[primeira] ?? (/[sz]$|r$|l$/.test(primeira) ? primeira : `${primeira}s`);
  return [nova, ...resto].join(' ');
}

/**
 * Gramas em medida caseira pela porção típica da base: 180 g de arroz com
 * "4 colheres de sopa" = 100 g → "cerca de 7 colheres de sopa". Sem porção, undefined.
 */
export function medidaCaseira(
  gramas: number,
  descricao: string | null | undefined,
  gramasDaPorcao: number | null | undefined,
): string | undefined {
  const achado = /^(\d+(?:\/\d+)?)\s+(.+)$/.exec(descricao?.trim() ?? '');
  if (!achado || !(Number(gramasDaPorcao) > 0) || !(gramas > 0)) return undefined;
  const [, numero, medida] = achado;
  const unidade = medida.replace(/^(unidades|fatias|colheres|pedaços)\b/, (p) =>
    p === 'colheres' ? 'colher' : p.slice(0, -1),
  );
  // Meia em meia unidade: ninguém mede 1,3 filé.
  const quantidade =
    Math.round(((numeroDaFracao(numero) * gramas) / Number(gramasDaPorcao)) * 2) / 2;
  if (quantidade < 0.5) return undefined;
  const texto =
    quantidade === 0.5
      ? `1/2 ${unidade}`
      : quantidade <= 1
        ? `1 ${unidade}`
        : `${String(quantidade).replace('.', ',')} ${plural(unidade)}`;
  return `cerca de ${texto}`;
}

// Macro que manda em cada slot: a troca preserva este número.
const MACRO_DO_SLOT = {
  proteina: 'proteina',
  carboidrato: 'carboidrato',
  complemento: 'gordura',
} as const;

/**
 * Troca equivalente (RN19): outro candidato do mesmo slot, que respeita as mesmas restrições
 * (os candidatos já vêm filtrados), com as gramas que dão o mesmo macro principal.
 * Escolhe o de kcal por grama de macro mais parecida. Sem alternativa, undefined.
 */
export function escolherSubstituicao(
  alimento: AlimentoCandidato,
  gramas: number,
  candidatos: AlimentoCandidato[],
  evitar: string[] = [],
): SubstituicaoAlimento | undefined {
  const macro = MACRO_DO_SLOT[alimento.slot];
  const alvo = (alimento[macro] * gramas) / 100;
  const densidade = (a: AlimentoCandidato) => a.kcal / Math.max(a[macro], 0.1);
  const opcoes = candidatos.filter(
    (c) =>
      c.slot === alimento.slot && c.id !== alimento.id && !evitar.includes(c.id) && c[macro] > 0,
  );
  if (opcoes.length === 0 || !(alvo > 0)) return undefined;
  const melhor = opcoes.reduce((a, b) =>
    Math.abs(densidade(b) - densidade(alimento)) < Math.abs(densidade(a) - densidade(alimento))
      ? b
      : a,
  );
  const [min, max] = LIMITES_GRAMAS[melhor.slot];
  // De 5 em 5 g: troca é orientação, não precisa de precisão de grama.
  const novas = Math.min(max, Math.max(min, Math.round((alvo * 100) / melhor[macro] / 5) * 5));
  const caseira = medidaCaseira(novas, melhor.porcaoDescricao, melhor.porcaoGramas);
  return { nome: melhor.nome, porcao: `${novas}g`, ...(caseira ? { medidaCaseira: caseira } : {}) };
}
