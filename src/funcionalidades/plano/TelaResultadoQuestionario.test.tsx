import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PlanoIAGerado } from '@/compartilhado/tipos';
import { repositorioPlano } from '@/compartilhado/servicos/repositorio';
import { gerarPlano } from './gerar-plano-servico';
import TelaResultadoQuestionario, { AVISO_PROFISSIONAL } from './TelaResultadoQuestionario';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParametros: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParametros,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/compartilhado/servicos/repositorio', () => ({
  repositorioPlano: { salvarPlanoComoAtivo: jest.fn() },
}));
// A geração (rede) não roda: o plano chega pronto nos parâmetros.
jest.mock('./gerar-plano-servico', () => ({ gerarPlano: jest.fn() }));

// Dados fictícios.
const FUNDAMENTO = {
  titulo: 'Proteína para hipertrofia',
  fonte: 'Morton et al., 2018',
  conteudo: 'Trecho fictício.',
};
const PLANO: PlanoIAGerado = {
  resumo: {
    tmb: 1800,
    tdee: 2180,
    caloriasAlvo: 2480,
    macros: { proteinas: 164, carboidratos: 301, gorduras: 69 },
    metaAguaMl: 2900,
  },
  treino: {
    nomeDivisao: 'A / B',
    dias: [{ diaSemana: 1, nome: 'Treino A', exercicios: [] }],
  },
  dieta: { refeicoes: [{ nome: 'Almoço', horario: '12:00', alimentos: [] }] },
  fundamentos: [FUNDAMENTO],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParametros = {
    plano: JSON.stringify(PLANO),
    respostas: JSON.stringify({ perfil: { nome: 'Pessoa Teste', peso_atual: 82 } }),
  };
});

it('mostra kcal, os 3 macros, a água, a fonte e o aviso', () => {
  render(<TelaResultadoQuestionario />);

  expect(screen.getByText('Pessoa, seu plano está pronto')).toBeTruthy();
  expect(screen.getByText('2.480')).toBeTruthy();
  expect(screen.getByText('kcal · +300 de superávit')).toBeTruthy();
  expect(screen.getByLabelText('Proteína: 164 g')).toBeTruthy();
  expect(screen.getByLabelText('Carboidrato: 301 g')).toBeTruthy();
  expect(screen.getByLabelText('Gordura: 69 g')).toBeTruthy();
  expect(screen.getByLabelText('Água: 2,9 L')).toBeTruthy();
  expect(screen.getByText('Proteína para hipertrofia')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Fonte: Morton et al., 2018' })).toBeTruthy();
  expect(screen.getByText(AVISO_PROFISSIONAL)).toBeTruthy();
});

it('tocar na fonte abre o trecho no formSheet', () => {
  render(<TelaResultadoQuestionario />);
  fireEvent.press(screen.getByRole('link', { name: 'Fonte: Morton et al., 2018' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/questionario/fonte',
    params: FUNDAMENTO,
  });
});

it('aceitar salva e mostra o momento de conquista', async () => {
  (repositorioPlano.salvarPlanoComoAtivo as jest.Mock).mockResolvedValue(undefined);
  render(<TelaResultadoQuestionario />);
  fireEvent.press(screen.getByRole('button', { name: 'Começar meu plano' }));
  expect(
    await screen.findByLabelText('Plano ativado. Seu primeiro dia começa agora.'),
  ).toBeTruthy();
  expect(repositorioPlano.salvarPlanoComoAtivo).toHaveBeenCalledTimes(1);
});

it('erro ao salvar aparece na barra e não comemora', async () => {
  (repositorioPlano.salvarPlanoComoAtivo as jest.Mock).mockRejectedValue(new Error('Sem conexão.'));
  render(<TelaResultadoQuestionario />);
  fireEvent.press(screen.getByRole('button', { name: 'Começar meu plano' }));
  await waitFor(() => expect(screen.getByText('Sem conexão.')).toBeTruthy());
  expect(screen.queryByText('Plano ativado')).toBeNull();
});

it('mostra o aviso de grupo que ficou fora do treino', () => {
  const aviso = 'Não achei exercício de bíceps; o grupo ficou fora do treino.';
  mockParametros = { ...mockParametros, plano: JSON.stringify({ ...PLANO, avisos: [aviso] }) };
  render(<TelaResultadoQuestionario />);
  expect(screen.getByText(aviso)).toBeTruthy();
});

it('enquanto gera, o texto avança de "Montando seu treino" para "Escolhendo alimentos"', () => {
  jest.useFakeTimers();
  (gerarPlano as jest.Mock).mockReturnValue(new Promise(() => {}));
  mockParametros = { respostas: JSON.stringify({ perfil: { nome: 'Pessoa Teste' } }) };
  render(<TelaResultadoQuestionario />);
  expect(screen.getByText('Montando seu treino…')).toBeTruthy();
  expect(screen.getByText('Isso pode levar até 3 minutos.')).toBeTruthy();
  act(() => jest.advanceTimersByTime(20_000));
  expect(screen.getByText('Escolhendo alimentos…')).toBeTruthy();
  jest.useRealTimers();
});
