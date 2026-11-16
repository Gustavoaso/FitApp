// Etapa 31: histórico lista sessões concluídas por mês e o detalhe mostra as séries.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TelaHistorico from './TelaHistorico';
import TelaSessao from './TelaSessao';

const mockRegistros = {
  '2026-11-10': {
    idSessao: 's1',
    data: '2026-11-10',
    foco: 'Treino A',
    duracaoMinutos: 40,
    exerciciosConcluidos: 1,
    totalExercicios: 1,
    concluido: true,
    kcalEstimadas: 200,
    series: [{ cargaKg: 50, repeticoes: 10, composto: true, exercicio: 'Supino' }],
  },
};
let mockVazio = false;

jest.mock('@/compartilhado/servicos/historico-servico', () => ({
  obterHistoricoTreinoCompleto: async () => (mockVazio ? {} : mockRegistros),
}));
jest.mock('expo-router', () => {
  const R = jest.requireActual('react');
  return {
    useRouter: () => ({ push: jest.fn() }),
    useLocalSearchParams: () => ({ data: '2026-11-10' }),
    useFocusEffect: (f: () => void) => R.useEffect(f, [f]),
  };
});

it('lista a sessão com volume e kcal', async () => {
  mockVazio = false;
  await render(<TelaHistorico />);
  expect(await screen.findByText(/Treino A/)).toBeTruthy();
  expect(screen.getAllByText(/500 kg/).length).toBeGreaterThan(0);
});

it('mostra estado vazio', async () => {
  mockVazio = true;
  await render(<TelaHistorico />);
  expect(await screen.findByText('Nenhum treino concluído')).toBeTruthy();
});

it('detalhe mostra as séries', async () => {
  mockVazio = false;
  await render(<TelaSessao />);
  expect(await screen.findByText('Série 1: 50 kg × 10')).toBeTruthy();
});
