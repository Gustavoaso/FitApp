// Contas do histórico de treinos (RN27): volume, resumo semana/mês, grupos por mês, evolução.
import type { RegistroTreinoDiario } from '@/compartilhado/servicos/historico-servico';

export interface Resumo {
  treinos: number;
  minutos: number;
  volume: number;
  kcal: number;
}

export function volumeSessao(r: RegistroTreinoDiario): number {
  return Math.round((r.series ?? []).reduce((s, x) => s + x.cargaKg * x.repeticoes, 0));
}

export function resumir(registros: RegistroTreinoDiario[]): Resumo {
  return registros.reduce<Resumo>(
    (t, r) => ({
      treinos: t.treinos + 1,
      minutos: t.minutos + r.duracaoMinutos,
      volume: t.volume + volumeSessao(r),
      kcal: t.kcal + (r.kcalEstimadas ?? 0),
    }),
    { treinos: 0, minutos: 0, volume: 0, kcal: 0 },
  );
}

/** Concluídas, da mais nova para a mais antiga. */
export function sessoesConcluidas(mapa: Record<string, RegistroTreinoDiario>) {
  return Object.values(mapa)
    .filter((r) => r.concluido)
    .sort((a, b) => b.data.localeCompare(a.data));
}

/** Semana = segunda a domingo da data `hoje` (YYYY-MM-DD); mês = mesmo YYYY-MM. */
export function resumoSemanaMes(registros: RegistroTreinoDiario[], hoje: string) {
  const d = new Date(`${hoje}T12:00:00`);
  const ini = new Date(d);
  ini.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const iniStr = ini.toISOString().slice(0, 10);
  const fim = new Date(ini);
  fim.setDate(ini.getDate() + 6);
  const fimStr = fim.toISOString().slice(0, 10);
  return {
    semana: resumir(registros.filter((r) => r.data >= iniStr && r.data <= fimStr)),
    mes: resumir(registros.filter((r) => r.data.slice(0, 7) === hoje.slice(0, 7))),
  };
}

/** Mantém a ordem recebida; chave YYYY-MM. */
export function agruparPorMes(registros: RegistroTreinoDiario[]) {
  const grupos: { mes: string; sessoes: RegistroTreinoDiario[] }[] = [];
  for (const r of registros) {
    const mes = r.data.slice(0, 7);
    const g = grupos.find((x) => x.mes === mes);
    if (g) g.sessoes.push(r);
    else grupos.push({ mes, sessoes: [r] });
  }
  return grupos;
}

/** Séries da sessão por exercício (só as que têm nome). */
export function exerciciosDaSessao(r: RegistroTreinoDiario) {
  const mapa = new Map<string, { cargaKg: number; repeticoes: number }[]>();
  for (const s of r.series ?? []) {
    if (!s.exercicio) continue;
    mapa.set(s.exercicio, [...(mapa.get(s.exercicio) ?? []), s]);
  }
  return [...mapa].map(([nome, series]) => ({ nome, series }));
}

/** Maior carga do exercício em cada sessão, da mais antiga para a mais nova. */
export function evolucaoCarga(registros: RegistroTreinoDiario[], nome: string) {
  return [...registros]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({
      data: r.data,
      cargaKg: Math.max(
        0,
        ...(r.series ?? []).filter((s) => s.exercicio === nome).map((s) => s.cargaKg),
      ),
    }))
    .filter((p) => p.cargaKg > 0);
}
