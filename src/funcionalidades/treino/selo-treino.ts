// Selo da foto do treino (RN21): números da sessão já formatados para ficar por
// cima da foto. Regra pura: a tela só desenha o que sai daqui.
import type { SerieExecutada } from '@/compartilhado/utilidades/gasto-calorico';

export type ModeloSelo = 'coluna' | 'faixa';
export type FormatoSelo = '9:16' | '4:5';

/** Tamanho final da imagem exportada (px): stories e feed do Instagram. */
export const DIMENSOES_FORMATO: Record<FormatoSelo, { largura: number; altura: number }> = {
  '9:16': { largura: 1080, altura: 1920 },
  '4:5': { largura: 1080, altura: 1350 },
};

export interface ResumoSessao {
  nomeTreino: string;
  duracaoMinutos: number;
  series: SerieExecutada[];
  kcalEstimadas: number | null;
}

export interface NumeroSelo {
  rotulo: string;
  valor: string;
}

const formatoMil = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** Volume total = soma de carga × repetições; série sem carga (peso do corpo) não soma. */
export function calcularVolumeKg(series: SerieExecutada[] | null | undefined): number {
  if (!Array.isArray(series)) return 0;
  return series.reduce((total, s) => {
    const carga = Number.isFinite(s?.cargaKg) && s.cargaKg > 0 ? s.cargaKg : 0;
    const reps = Number.isFinite(s?.repeticoes) && s.repeticoes > 0 ? s.repeticoes : 0;
    return total + carga * reps;
  }, 0);
}

export function formatarDuracao(minutos: number): string {
  const total = Number.isFinite(minutos) && minutos > 0 ? Math.round(minutos) : 0;
  if (total < 60) return `${total} min`;
  const resto = total % 60;
  return resto === 0 ? `${Math.floor(total / 60)} h` : `${Math.floor(total / 60)} h ${resto} min`;
}

/**
 * Números do selo, na ordem de leitura. Volume zero e kcal sem cálculo (RN20: sem peso
 * registrado) saem do selo em vez de mostrar "0" ou um número inventado.
 */
export function montarNumerosSelo(resumo: ResumoSessao | null | undefined): NumeroSelo[] {
  if (!resumo) return [];
  const numeros: NumeroSelo[] = [
    { rotulo: 'Duração', valor: formatarDuracao(resumo.duracaoMinutos) },
  ];
  const volume = calcularVolumeKg(resumo.series);
  if (volume > 0) numeros.push({ rotulo: 'Volume', valor: `${formatoMil.format(volume)} kg` });
  if (typeof resumo.kcalEstimadas === 'number' && resumo.kcalEstimadas > 0) {
    numeros.push({ rotulo: 'Gasto estimado', valor: `${Math.round(resumo.kcalEstimadas)} kcal` });
  }
  return numeros;
}
