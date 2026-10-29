import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { registrarConsentimentoSaude } from '@/compartilhado/servicos/consentimento-servico';
import TelaConsentimento, { AVISO_CONSENTIMENTO, TEXTO_ACEITE } from './TelaConsentimento';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/compartilhado/servicos/consentimento-servico', () => ({
  registrarConsentimentoSaude: jest.fn(),
}));
const mockRegistrar = jest.mocked(registrarConsentimentoSaude);

beforeEach(() => jest.clearAllMocks());

function botaoContinuar() {
  return screen.getByRole('button', { name: 'Continuar' });
}

it('mostra o aviso profissional', async () => {
  await render(<TelaConsentimento />);
  expect(screen.getByText(AVISO_CONSENTIMENTO)).toBeTruthy();
});

it('sem o aceite, o Continuar fica desabilitado e não grava nada', async () => {
  await render(<TelaConsentimento />);
  expect(botaoContinuar()).toBeDisabled();
  await fireEvent.press(botaoContinuar());
  expect(mockRegistrar).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

it('com o aceite, grava e segue para o questionário', async () => {
  mockRegistrar.mockResolvedValue();
  await render(<TelaConsentimento />);
  await fireEvent(screen.getByLabelText(TEXTO_ACEITE), 'valueChange', true);
  expect(botaoContinuar()).toBeEnabled();
  await fireEvent.press(botaoContinuar());
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/questionario'));
  expect(mockRegistrar).toHaveBeenCalledTimes(1);
});

it('desmarcar o aceite desabilita de novo', async () => {
  await render(<TelaConsentimento />);
  await fireEvent(screen.getByLabelText(TEXTO_ACEITE), 'valueChange', true);
  await fireEvent(screen.getByLabelText(TEXTO_ACEITE), 'valueChange', false);
  expect(botaoContinuar()).toBeDisabled();
});

it('se a gravação falha, avisa e não segue', async () => {
  mockRegistrar.mockRejectedValue(new Error('rede'));
  await render(<TelaConsentimento />);
  await fireEvent(screen.getByLabelText(TEXTO_ACEITE), 'valueChange', true);
  await fireEvent.press(botaoContinuar());
  expect(await screen.findByText(/Não foi possível salvar seu aceite/)).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});
