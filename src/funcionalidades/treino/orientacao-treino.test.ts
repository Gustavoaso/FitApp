import type { PlanoIAGerado } from '@/compartilhado/tipos';
import { descreverPrescricao, orientacaoDoTreino } from './orientacao-treino';

const SEMANAS = [1, 2, 3, 4].map((semana) => ({
  semana,
  titulo: `T${semana}`,
  orientacao: `O${semana}`,
}));
const PLANO = {
  resumo: {},
  treino: {
    nomeDivisao: 'Empurrar / Puxar / Pernas',
    inicioEm: '2026-11-02T12:00:00.000Z',
    progressao: SEMANAS,
    dias: [
      {
        diaSemana: 1,
        nome: 'Peito, ombros e tríceps',
        aquecimento: ['5 minutos de bicicleta.'],
        exercicios: [
          {
            nome: 'Supino',
            series: 4,
            repeticoes: '6-10',
            descansoSegundos: 120,
            repeticoesReserva: 2,
          },
          { nome: 'Tríceps na polia', series: 3, repeticoes: '10-15', descansoSegundos: 60 },
        ],
      },
    ],
  },
  dieta: { refeicoes: [] },
} as unknown as PlanoIAGerado;

const NA_SEMANA_2 = new Date('2026-11-10T12:00:00.000Z');

describe('orientação do treino (RN19)', () => {
  it('acha o dia pelo nome e traz aquecimento, reserva e semana', () => {
    expect(orientacaoDoTreino(PLANO, 'Peito, ombros e tríceps', NA_SEMANA_2)).toEqual({
      aquecimento: ['5 minutos de bicicleta.'],
      reservaPorExercicio: { Supino: 2 },
      semana: { atual: SEMANAS[1], proxima: SEMANAS[2] },
    });
  });

  it('treino que não é deste plano não ganha progressão', () => {
    expect(orientacaoDoTreino(PLANO, 'Treino criado à mão', NA_SEMANA_2)).toEqual({
      aquecimento: [],
      reservaPorExercicio: {},
      semana: null,
    });
  });

  it.each([null, undefined, {} as PlanoIAGerado])(
    'plano ausente ou antigo (%p) não quebra',
    (p) => {
      expect(orientacaoDoTreino(p, 'Superior', NA_SEMANA_2).semana).toBeNull();
    },
  );

  it('plano antigo, sem os campos novos, devolve vazio no dia que acha', () => {
    const antigo = {
      ...PLANO,
      treino: { nomeDivisao: 'A', dias: [{ diaSemana: 1, nome: 'Treino A', exercicios: [] }] },
    } as PlanoIAGerado;
    expect(orientacaoDoTreino(antigo, 'Treino A', NA_SEMANA_2)).toEqual({
      aquecimento: [],
      reservaPorExercicio: {},
      semana: null,
    });
  });
});

describe('texto da prescrição', () => {
  it('com e sem reserva; sem reps e sem descanso usa o padrão', () => {
    expect(descreverPrescricao(4, '6-10', 120, 2)).toBe(
      '4 séries · 6-10 reps · 120s descanso · 2 na reserva',
    );
    expect(descreverPrescricao(1, '', 0)).toBe('1 série · — reps · 60s descanso');
  });
});
