// ============================================================
// FUNÇÕES DE CÁLCULO NUTRICIONAL
// ============================================================
// Todas as fórmulas usadas para calcular:
// - TMB (Taxa Metabólica Basal): calorias que seu corpo gasta em repouso
// - TDEE (Gasto Energético Total Diário): TMB × fator de atividade
// - Macros: distribuição de proteínas, carboidratos e gorduras
// - Meta de água: baseada no peso corporal
//
// Fórmulas baseadas em evidências científicas:
// - Harris-Benedict revisada (Roza & Shizgal, 1984)
// - Mifflin-St Jeor (Mifflin et al., 1990) — mais precisa para sobrepeso
// ============================================================

import type {
  SexoBiologico,
  NivelAtividade,
  ObjetivoTreino,
  Macros,
} from '@fitapp/tipos';

// ──────────────────────────────────────────────
// FATORES DE ATIVIDADE
// ──────────────────────────────────────────────
// Multiplicadores aplicados à TMB para obter o TDEE.
// Fonte: McArdle, Katch & Katch (2010)
// ──────────────────────────────────────────────

const FATORES_ATIVIDADE: Record<NivelAtividade, number> = {
  sedentario: 1.2,      // Escritório, sem exercício
  leve: 1.375,          // Exercício leve 1-3x/semana
  moderado: 1.55,       // Exercício moderado 3-5x/semana
  ativo: 1.725,         // Exercício intenso 6-7x/semana
  muito_ativo: 1.9,     // Atleta, 2x ao dia ou trabalho físico pesado
};

// ──────────────────────────────────────────────
// AJUSTE CALÓRICO POR OBJETIVO
// ──────────────────────────────────────────────
// Percentual de superávit ou déficit aplicado ao TDEE.
// Valores conservadores e seguros para saúde.
// ──────────────────────────────────────────────

const AJUSTE_CALORICO: Record<ObjetivoTreino, number> = {
  hipertrofia: 1.10,       // +10% (superávit moderado)
  definicao: 0.85,         // -15% (déficit moderado)
  forca: 1.05,             // +5% (superávit leve)
  emagrecimento: 0.80,     // -20% (déficit mais agressivo)
  condicionamento: 1.0,    // Manutenção
};

// ──────────────────────────────────────────────
// DISTRIBUIÇÃO DE MACROS POR OBJETIVO
// ──────────────────────────────────────────────
// Percentual de proteína, carboidrato e gordura
// sobre o total calórico diário.
// ──────────────────────────────────────────────

const DISTRIBUICAO_MACROS: Record<ObjetivoTreino, { proteina: number; carboidrato: number; gordura: number }> = {
  hipertrofia:     { proteina: 0.30, carboidrato: 0.45, gordura: 0.25 },
  definicao:       { proteina: 0.35, carboidrato: 0.35, gordura: 0.30 },
  forca:           { proteina: 0.30, carboidrato: 0.45, gordura: 0.25 },
  emagrecimento:   { proteina: 0.35, carboidrato: 0.35, gordura: 0.30 },
  condicionamento: { proteina: 0.25, carboidrato: 0.50, gordura: 0.25 },
};

// ──────────────────────────────────────────────
// TMB — Taxa Metabólica Basal
// ──────────────────────────────────────────────

/**
 * Calcula a TMB usando a fórmula de Mifflin-St Jeor.
 *
 * Mifflin-St Jeor é considerada a fórmula mais precisa para
 * a maioria das pessoas (melhor que Harris-Benedict para
 * indivíduos com sobrepeso ou obesidade).
 *
 * Masculino: TMB = (10 × peso em kg) + (6.25 × altura em cm) - (5 × idade) + 5
 * Feminino:  TMB = (10 × peso em kg) + (6.25 × altura em cm) - (5 × idade) - 161
 *
 * @param pesoKg - Peso em quilogramas
 * @param alturaCm - Altura em centímetros
 * @param idade - Idade em anos
 * @param sexo - Sexo biológico ('masculino' | 'feminino')
 * @returns TMB em kcal/dia (arredondado)
 */
export function calcularTMB(
  pesoKg: number,
  alturaCm: number,
  idade: number,
  sexo: SexoBiologico,
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;

  if (sexo === 'masculino') {
    return Math.round(base + 5);
  } else {
    return Math.round(base - 161);
  }
}

// ──────────────────────────────────────────────
// TDEE — Gasto Energético Total Diário
// ──────────────────────────────────────────────

/**
 * Calcula o TDEE (Total Daily Energy Expenditure).
 * É simplesmente a TMB multiplicada pelo fator de atividade.
 *
 * TDEE = TMB × fator de atividade
 *
 * @param tmb - Taxa Metabólica Basal em kcal
 * @param nivelAtividade - Nível de atividade física do usuário
 * @returns TDEE em kcal/dia (arredondado)
 */
export function calcularTDEE(tmb: number, nivelAtividade: NivelAtividade): number {
  return Math.round(tmb * FATORES_ATIVIDADE[nivelAtividade]);
}

// ──────────────────────────────────────────────
// CALORIAS-ALVO
// ──────────────────────────────────────────────

/**
 * Calcula as calorias-alvo diárias com base no TDEE e no objetivo.
 * Aplica um superávit ou déficit calórico conforme o objetivo.
 *
 * @param tdee - TDEE em kcal
 * @param objetivo - Objetivo do usuário (hipertrofia, definição, etc.)
 * @returns Calorias-alvo em kcal/dia (arredondado)
 */
export function calcularCaloriasAlvo(tdee: number, objetivo: ObjetivoTreino): number {
  return Math.round(tdee * AJUSTE_CALORICO[objetivo]);
}

// ──────────────────────────────────────────────
// MACROS
// ──────────────────────────────────────────────

/**
 * Calcula a distribuição de macronutrientes em gramas.
 *
 * Conversão: 1g proteína = 4 kcal, 1g carboidrato = 4 kcal, 1g gordura = 9 kcal
 *
 * @param caloriasAlvo - Calorias totais diárias
 * @param objetivo - Objetivo do usuário
 * @returns Objeto Macros com calorias e gramas de cada macronutriente
 */
export function calcularMacros(caloriasAlvo: number, objetivo: ObjetivoTreino): Macros {
  const distribuicao = DISTRIBUICAO_MACROS[objetivo];

  return {
    calorias: caloriasAlvo,
    proteinas: Math.round((caloriasAlvo * distribuicao.proteina) / 4),
    carboidratos: Math.round((caloriasAlvo * distribuicao.carboidrato) / 4),
    gorduras: Math.round((caloriasAlvo * distribuicao.gordura) / 9),
  };
}

// ──────────────────────────────────────────────
// META DE ÁGUA
// ──────────────────────────────────────────────

/**
 * Calcula a meta de ingestão diária de água.
 *
 * Regra geral: 35ml por kg de peso corporal.
 * Referência: Dietary Reference Intakes (DRI), Institute of Medicine.
 *
 * @param pesoKg - Peso em quilogramas
 * @returns Meta de água em mililitros
 */
export function calcularMetaAgua(pesoKg: number): number {
  return Math.round(pesoKg * 35);
}

// ──────────────────────────────────────────────
// CÁLCULO COMPLETO A PARTIR DO QUESTIONÁRIO
// ──────────────────────────────────────────────

/** Resultado completo do cálculo nutricional */
export interface ResultadoCalculo {
  tmb: number;
  tdee: number;
  caloriasAlvo: number;
  macros: Macros;
  metaAguaMl: number;
  deficitOuSuperavit: number; // Positivo = superávit, negativo = déficit
}

/**
 * Calcula todos os valores nutricionais de uma vez,
 * a partir dos dados do questionário.
 *
 * @param pesoKg - Peso
 * @param alturaCm - Altura
 * @param idade - Idade
 * @param sexo - Sexo biológico
 * @param nivelAtividade - Nível de atividade
 * @param objetivo - Objetivo de treino
 * @returns Todos os valores calculados (TMB, TDEE, calorias, macros, água)
 */
export function calcularTudo(
  pesoKg: number,
  alturaCm: number,
  idade: number,
  sexo: SexoBiologico,
  nivelAtividade: NivelAtividade,
  objetivo: ObjetivoTreino,
): ResultadoCalculo {
  const tmb = calcularTMB(pesoKg, alturaCm, idade, sexo);
  const tdee = calcularTDEE(tmb, nivelAtividade);
  const caloriasAlvo = calcularCaloriasAlvo(tdee, objetivo);
  const macros = calcularMacros(caloriasAlvo, objetivo);
  const metaAguaMl = calcularMetaAgua(pesoKg);

  return {
    tmb,
    tdee,
    caloriasAlvo,
    macros,
    metaAguaMl,
    deficitOuSuperavit: caloriasAlvo - tdee,
  };
}
