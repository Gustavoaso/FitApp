import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
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

it('comemora com mola e haptic Success, e segue sozinho', () => {
  mockReduzir.mockReturnValue(false);
  const aoTerminar = jest.fn();
  render(<MomentoConquista titulo="Treino concluído" subtitulo="Treino A" aoTerminar={aoTerminar} />);

  expect(screen.getByLabelText('Treino concluído. Treino A')).toBeTruthy();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  expect(mockMola).toHaveBeenCalledTimes(1);
  expect(aoTerminar).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(DURACAO_CONQUISTA));
  expect(aoTerminar).toHaveBeenCalledTimes(1);
});

it('com Reduzir Movimento ligado, não anima (mantém o haptic)', () => {
  mockReduzir.mockReturnValue(true);
  const aoTerminar = jest.fn();
  render(<MomentoConquista titulo="Plano ativado" aoTerminar={aoTerminar} />);

  expect(screen.getByText('Plano ativado')).toBeTruthy();
  expect(mockMola).not.toHaveBeenCalled();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  act(() => jest.advanceTimersByTime(DURACAO_CONQUISTA));
  expect(aoTerminar).toHaveBeenCalledTimes(1);
});
