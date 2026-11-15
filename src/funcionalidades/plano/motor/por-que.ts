// ============================================================
// MOTOR: texto "Por que este plano" (RN19)
// ============================================================
// 3 a 5 frases montadas por código a partir das respostas: o
// objetivo, os dias, o local, as lesões e as restrições, mais a
// fonte da diretriz usada. Perfis diferentes → textos diferentes.
// ============================================================

import type {
  EquipamentosDisponiveis,
  NivelExperiencia,
  ObjetivoTreino,
  RestricaoAlimentar,
} from '@/compartilhado/tipos';
import { listar } from './divisao-semanal';
import type { RestricaoFisica } from './tipos';

export interface ContextoPorQue {
  objetivo: ObjetivoTreino;
  nivel: NivelExperiencia;
  diasPorSemana: number;
  equipamentos: EquipamentosDisponiveis;
  restricoes: RestricaoAlimentar[];
  restricoesFisicas: RestricaoFisica[];
  caloriasAlvo: number;
  tdee: number;
  proteinasG: number;
  pesoKg: number;
  /** Nomes dos dias, na ordem da semana. */
  dias: string[];
  repeticoesPrincipal: string;
  repeticoesReserva: number;
  refeicoes: number;
  /** "Morton et al., 2018"; a primeira entra no texto. */
  fontes: string[];
}

const OBJETIVO: Record<ObjetivoTreino, string> = {
  hipertrofia: 'ganhar massa muscular',
  definicao: 'perder gordura mantendo o músculo',
  emagrecimento: 'emagrecer com saúde',
  forca: 'ficar mais forte',
  condicionamento: 'ganhar fôlego e disposição',
};

const LOCAL: Record<EquipamentosDisponiveis, string> = {
  academia_completa: 'na academia, com máquinas, polias e pesos livres',
  home_gym: 'em casa, com halteres e o que dá para usar sem máquina',
  peso_corporal: 'em casa, só com o peso do corpo',
};

const NIVEL: Record<NivelExperiencia, string> = {
  iniciante: 'Como você está começando',
  intermediario: 'Como você já tem uma base',
  avancado: 'Como você treina há mais de 2 anos',
};

const LESAO: Record<RestricaoFisica, string> = {
  joelho: 'joelho (sem salto, agachamento nem passada)',
  ombro: 'ombro (sem carga acima da cabeça)',
  coluna: 'coluna (sem terra, agachamento livre nem remada curvada)',
};

const DIETA: Record<Exclude<RestricaoAlimentar, 'nenhuma'>, string> = {
  vegano: 'sem nada de origem animal',
  vegetariano: 'sem carne nem peixe',
  sem_lactose: 'sem leite e derivados',
  sem_gluten: 'sem trigo, aveia e outros cereais com glúten',
};

const formatar = (n: number) => Math.round(n).toLocaleString('pt-BR');

export function montarPorQue(c: ContextoPorQue): string[] {
  const balanco = Math.round(c.caloriasAlvo - c.tdee);
  const energia =
    balanco > 0
      ? `${formatar(balanco)} kcal acima do que você gasta`
      : balanco < 0
        ? `${formatar(-balanco)} kcal abaixo do que você gasta`
        : 'o mesmo que você gasta';
  const proteinaPorKg = (c.proteinasG / c.pesoKg).toFixed(1).replace('.', ',');
  const frases = [
    `Seu objetivo é ${OBJETIVO[c.objetivo]}: a meta é de ${formatar(c.caloriasAlvo)} kcal por dia, ${energia}, com ${formatar(c.proteinasG)} g de proteína (${proteinaPorKg} g por kg) divididos em ${c.refeicoes} refeições.`,
    `Você tem ${c.diasPorSemana} dias por semana e treina ${LOCAL[c.equipamentos]}, então a semana ficou assim: ${listar(c.dias)}, sem repetir o mesmo músculo em dias seguidos.`,
    `${NIVEL[c.nivel]}, o primeiro exercício de cada dia fica em ${c.repeticoesPrincipal} repetições, parando com ${c.repeticoesReserva} ${c.repeticoesReserva === 1 ? 'repetição' : 'repetições'} sobrando, e a carga sobe só quando você bater o teto da faixa.`,
  ];
  if (c.restricoesFisicas.length > 0) {
    frases.push(
      `Você marcou ${listar(c.restricoesFisicas.map((r) => LESAO[r]))}: os exercícios de risco para essa região ficaram de fora.`,
    );
  }
  const dieta = c.restricoes.filter((r): r is keyof typeof DIETA => r !== 'nenhuma');
  if (dieta.length > 0) {
    frases.push(`O cardápio é ${listar(dieta.map((r) => DIETA[r]))}, como você pediu.`);
  }
  // No máximo 5 frases: com 5 já montadas, a fonte vai junto da frase do treino.
  // A referência completa já termina em ponto; sem ele a frase não fecha com "..".
  const fonte = c.fontes[0]?.trim().replace(/\.+$/, '');
  if (fonte) {
    if (frases.length >= 5) frases[2] = `${frases[2].slice(0, -1)} (${fonte}).`;
    else
      frases.push(
        `As faixas de repetição, o descanso e a proteína para quem quer ${OBJETIVO[c.objetivo]} seguem ${fonte}.`,
      );
  }
  return frases;
}
