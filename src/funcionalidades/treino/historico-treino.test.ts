import type { RegistroTreinoDiario } from '@/compartilhado/servicos/historico-servico';
import {
  agruparPorMes,
  evolucaoCarga,
  exerciciosDaSessao,
  resumir,
  resumoSemanaMes,
  sessoesConcluidas,
  volumeSessao,
} from './historico-treino';

const reg = (data: string, carga: number, extra: Partial<RegistroTreinoDiario> = {}) => ({
  idSessao: data,
  data,
  foco: 'A',
  duracaoMinutos: 30,
  exerciciosConcluidos: 1,
  totalExercicios: 1,
  concluido: true,
  kcalEstimadas: 100,
  series: [
    { cargaKg: carga, repeticoes: 10, composto: true, exercicio: 'Supino' },
    { cargaKg: carga, repeticoes: 8, composto: true, exercicio: 'Supino' },
  ],
  ...extra,
});

describe('historico-treino', () => {
  it('volume = carga x repetições; sem séries é 0', () => {
    expect(volumeSessao(reg('2026-11-10', 50))).toBe(900);
    expect(volumeSessao(reg('2026-11-10', 50, { series: undefined }))).toBe(0);
  });
  it('resume e ignora kcal ausente', () => {
    const r = resumir([reg('2026-11-10', 10), reg('2026-11-11', 10, { kcalEstimadas: null })]);
    expect(r).toEqual({ treinos: 2, minutos: 60, volume: 360, kcal: 100 });
  });
  it('semana (seg a dom) e mês', () => {
    const lista = [
      reg('2026-11-15', 1),
      reg('2026-11-16', 1),
      reg('2026-11-02', 1),
      reg('2026-10-30', 1),
    ];
    const { semana, mes } = resumoSemanaMes(lista, '2026-11-18');
    expect(semana.treinos).toBe(1);
    expect(mes.treinos).toBe(3);
  });
  it('filtra concluídas, ordena e agrupa por mês', () => {
    const l = sessoesConcluidas({
      a: reg('2026-10-01', 1),
      b: reg('2026-11-01', 1),
      c: reg('2026-11-05', 1, { concluido: false }),
    });
    expect(l.map((r) => r.data)).toEqual(['2026-11-01', '2026-10-01']);
    expect(agruparPorMes(l).map((g) => g.mes)).toEqual(['2026-11', '2026-10']);
  });
  it('detalhe por exercício e evolução pela maior carga', () => {
    expect(exerciciosDaSessao(reg('2026-11-01', 20))[0].series).toHaveLength(2);
    const ev = evolucaoCarga([reg('2026-11-08', 60), reg('2026-11-01', 50)], 'Supino');
    expect(ev).toEqual([
      { data: '2026-11-01', cargaKg: 50 },
      { data: '2026-11-08', cargaKg: 60 },
    ]);
    expect(evolucaoCarga([reg('2026-11-01', 50)], 'Outro')).toEqual([]);
  });
});
