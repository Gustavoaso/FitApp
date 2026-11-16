import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TelaComunidade from './TelaComunidade';
import * as servico from './comunidade-servico';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, []),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@/compartilhado/AuthContexto', () => ({ useAuth: () => ({ usuario: { id: 'eu' } }) }));
jest.mock('@/compartilhado/servicos/foto-servico', () => ({
  urlDaFoto: jest.fn().mockResolvedValue(null),
}));
jest.mock('./comunidade-servico', () => ({
  listarPosts: jest.fn(),
  alternarCurtida: jest.fn().mockResolvedValue(true),
  apagarPost: jest.fn(),
}));

const post = {
  id: 'p1',
  autorId: 'outro',
  apelido: 'Bia',
  usuario: 'bia_c',
  avatarCaminho: null,
  texto: 'Treino de pernas feito',
  fotoCaminho: null,
  criadoEm: new Date().toISOString(),
  curtidas: 2,
  respostas: 0,
  reposts: 0,
  curtiu: false,
};

beforeEach(() => jest.clearAllMocks());

it('mostra os posts e troca de aba', async () => {
  (servico.listarPosts as jest.Mock).mockResolvedValue([post]);
  await render(<TelaComunidade />);
  expect(await screen.findByText('Treino de pernas feito')).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: 'Para você' }));
  await waitFor(() => expect(servico.listarPosts).toHaveBeenCalledWith('para_voce', undefined));
});

it('curtir atualiza o contador na hora', async () => {
  (servico.listarPosts as jest.Mock).mockResolvedValue([post]);
  await render(<TelaComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Curtir' }));
  expect(await screen.findByText('3')).toBeTruthy();
  expect(servico.alternarCurtida).toHaveBeenCalledWith('p1', false);
});

it('feed vazio mostra o estado vazio e o + abre o novo post', async () => {
  (servico.listarPosts as jest.Mock).mockResolvedValue([]);
  await render(<TelaComunidade />);
  expect(await screen.findByText('Nada por aqui')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Novo post' }));
  expect(mockPush).toHaveBeenCalledWith('/comunidade/novo');
});

it('erro mostra tentar de novo', async () => {
  (servico.listarPosts as jest.Mock).mockResolvedValue(null);
  await render(<TelaComunidade />);
  expect(await screen.findByText('Tentar de novo')).toBeTruthy();
});
