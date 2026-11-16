import React from 'react';
import { Alert } from 'react-native';
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
  alternarRepost: jest.fn(),
  denunciar: jest.fn(),
  bloquearUsuario: jest.fn(),
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
  repostDe: null,
  original: null,
  repostei: false,
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

it('responder abre o post com as respostas', async () => {
  (servico.listarPosts as jest.Mock).mockResolvedValue([post]);
  await render(<TelaComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Responder' }));
  expect(mockPush).toHaveBeenCalledWith('/comunidade/post/p1');
});

it('repostar com comentário abre o sheet com o id do post', async () => {
  const alerta = jest.spyOn(Alert, 'alert');
  (servico.listarPosts as jest.Mock).mockResolvedValue([post]);
  await render(<TelaComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Repostar' }));
  alerta.mock.calls[0][2]?.find((b) => b.text === 'Repostar com comentário')?.onPress?.();
  expect(mockPush).toHaveBeenCalledWith('/comunidade/novo?repost=p1');
});

it('repost simples chama o serviço; repost mostra o post original', async () => {
  const alerta = jest.spyOn(Alert, 'alert');
  (servico.alternarRepost as jest.Mock).mockResolvedValue(true);
  (servico.listarPosts as jest.Mock).mockResolvedValue([post]);
  await render(<TelaComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Repostar' }));
  await alerta.mock.calls[0][2]?.find((b) => b.text === 'Repostar')?.onPress?.();
  expect(servico.alternarRepost).toHaveBeenCalledWith('p1', false);
});

it('post de repost exibe o original citado', async () => {
  (servico.listarPosts as jest.Mock).mockResolvedValue([
    {
      ...post,
      id: 'r1',
      texto: '',
      repostDe: 'p0',
      original: { apelido: 'Caio', usuario: null, texto: 'Texto original', foto: null },
    },
  ]);
  await render(<TelaComunidade />);
  expect(await screen.findByText('Texto original')).toBeTruthy();
});

it('denunciar post: escolhe o motivo e envia', async () => {
  const alerta = jest.spyOn(Alert, 'alert');
  (servico.denunciar as jest.Mock).mockResolvedValue(true);
  (servico.listarPosts as jest.Mock).mockResolvedValue([post]);
  await render(<TelaComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Mais opções' }));
  alerta.mock.calls[0][2]?.find((b) => b.text === 'Denunciar post')?.onPress?.();
  await alerta.mock.calls[1][2]?.find((b) => b.text === 'Spam')?.onPress?.();
  expect(servico.denunciar).toHaveBeenCalledWith('spam', { postId: 'p1' });
});
