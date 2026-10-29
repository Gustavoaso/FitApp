import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion, withSpring } from 'react-native-reanimated';
import { DURACAO_CONQUISTA, MomentoConquista } from './MomentoConquista';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: jest.fn(),
  withSpring: jest.fn((valor: number) => valor),
}));

const mockReduzir = useReducedMotion as jest.Mock;
const mockMola = withSpring as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it('comemora com mola e haptic Success, e segue sozinho', async () => {
  mockReduzir.mockReturnValue(false);
  const aoTerminar = jest.fn();
  await render(
    <MomentoConquista titulo="Treino concluído" subtitulo="Treino A" aoTerminar={aoTerminar} />,
  );

  expect(screen.getByLabelText('Treino concluído. Treino A')).toBeTruthy();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  expect(mockMola).toHaveBeenCalledTimes(1);
  expect(aoTerminar).not.toHaveBeenCalled();
  await act(() => jest.advanceTimersByTime(DURACAO_CONQUISTA));
  expect(aoTerminar).toHaveBeenCalledTimes(1);
});

it('com Reduzir Movimento ligado, não anima (mantém o haptic)', async () => {
  mockReduzir.mockReturnValue(true);
  const aoTerminar = jest.fn();
  await render(<MomentoConquista titulo="Plano ativado" aoTerminar={aoTerminar} />);

  expect(screen.getByText('Plano ativado')).toBeTruthy();
  expect(mockMola).not.toHaveBeenCalled();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  await act(() => jest.advanceTimersByTime(DURACAO_CONQUISTA));
  expect(aoTerminar).toHaveBeenCalledTimes(1);
});

it('um toque segue antes do tempo, e o tempo não chama de novo', async () => {
  mockReduzir.mockReturnValue(false);
  const aoTerminar = jest.fn();
  await render(<MomentoConquista titulo="Plano ativado" aoTerminar={aoTerminar} />);

  await act(() => jest.advanceTimersByTime(DURACAO_CONQUISTA - 100));
  expect(aoTerminar).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Plano ativado'));
  await act(() => jest.advanceTimersByTime(DURACAO_CONQUISTA));
  expect(aoTerminar).toHaveBeenCalledTimes(1);
});
