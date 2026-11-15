// Gasto calórico estimado do treino (RN20): kcal = MET × peso(kg) × horas ativas,
// com MET do Compendium of Physical Activities 2024. É estimativa: nunca entra na dieta.

export interface SerieExecutada {
  cargaKg: number;
  repeticoes: number;
  composto: boolean;
}

export interface EntradaGastoTreino {
  pesoKg: number | null | undefined;
  duracaoMinutos: number;
  series: SerieExecutada[];
}

/** METs do Compendium 2024 usados pela RN20. */
export const MET_TREINO = {
  pesoDoCorpo: 3.0,
  geral: 3.5,
  compostosPesados: 5.0,
  vigoroso: 6.0,
} as const;

// PREMISSA: faixas de densidade (kg levantados por minuto por kg de peso corporal).
// Ex.: 70 kg, 45 min, 20 séries de 10 × 40 kg → densidade ≈ 2,5 (treino comum).
export const DENSIDADE_COMPOSTOS = 2;
export const DENSIDADE_VIGOROSA = 4;
export const PROPORCAO_MINIMA_COMPOSTOS = 0.5;

// PREMISSA: sessão acima de 3 h vira 3 h (app esquecido aberto não infla a conta).
export const DURACAO_MAXIMA_MINUTOS = 180;

const PESO_MINIMO_KG = 30;
const PESO_MAXIMO_KG = 300;

function numeroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0;
}

/** MET da sessão pela densidade de volume e pela proporção de compostos. */
export function escolherMet(pesoKg: number, minutos: number, series: SerieExecutada[]): number {
  const volume = series.reduce(
    (soma, s) =>
      soma +
      (numeroPositivo(s.cargaKg) ? s.cargaKg : 0) *
        (numeroPositivo(s.repeticoes) ? s.repeticoes : 0),
    0,
  );
  if (volume === 0) return MET_TREINO.pesoDoCorpo;
  const densidade = volume / minutos / pesoKg;
  if (densidade >= DENSIDADE_VIGOROSA) return MET_TREINO.vigoroso;
  const compostos = series.filter((s) => s.composto).length / series.length;
  if (densidade >= DENSIDADE_COMPOSTOS && compostos >= PROPORCAO_MINIMA_COMPOSTOS) {
    return MET_TREINO.compostosPesados;
  }
  return MET_TREINO.geral;
}

/** kcal estimadas, inteiras; null quando falta peso, duração ou séries. */
export function estimarKcalTreino(entrada: EntradaGastoTreino | null | undefined): number | null {
  if (!entrada) return null;
  const { pesoKg, duracaoMinutos, series } = entrada;
  if (!numeroPositivo(pesoKg) || pesoKg < PESO_MINIMO_KG || pesoKg > PESO_MAXIMO_KG) return null;
  if (!numeroPositivo(duracaoMinutos)) return null;
  if (!Array.isArray(series) || series.length === 0) return null;
  const minutos = Math.min(duracaoMinutos, DURACAO_MAXIMA_MINUTOS);
  return Math.round(escolherMet(pesoKg, minutos, series) * pesoKg * (minutos / 60));
}

/** Texto único para qualquer tela: sempre com o rótulo "estimativa". */
export function formatarKcalEstimada(kcal: number): string {
  return `~${kcal} kcal (estimativa)`;
}

// PREMISSA: o tipo Exercicio não marca compostos; o nome decide (multiarticulares clássicos).
const PADRAO_COMPOSTO =
  /agachamento|terra|supino|remada|desenvolvimento|leg press|barra fixa|puxada|avan[cç]o|afundo|stiff|paralela|mergulho|levantamento|hack|clean|arranco/i;

export function ehComposto(nomeExercicio: string): boolean {
  return PADRAO_COMPOSTO.test(nomeExercicio ?? '');
}
