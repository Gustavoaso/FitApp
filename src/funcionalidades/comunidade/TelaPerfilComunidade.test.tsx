import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import TelaPerfilComunidade from './TelaPerfilComunidade';
import * as servico from './comunidade-servico';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ id: 'outro' }),
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
  carregarPerfilComunidade: jest.fn(),
  listarPosts: jest.fn().mockResolvedValue([]),
  alternarSeguir: jest.fn().mockResolvedValue(true),
  bloquearUsuario: jest.fn().mockResolvedValue(true),
  denunciar: jest.fn().mockResolvedValue(true),
}));

const perfil = {
  apelido: 'Bia',
  usuario: 'bia_c',
  bio: 'Corro de manhã',
  avatarCaminho: null,
  seguidores: 4,
  seguindo: 2,
  posts: 7,
  euSigo: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (servico.carregarPerfilComunidade as jest.Mock).mockResolvedValue(perfil);
});

it('mostra nome, @usuario, bio e contadores', async () => {
  await render(<TelaPerfilComunidade />);
  expect(await screen.findByText('@bia_c')).toBeTruthy();
  expect(screen.getByText('Corro de manhã')).toBeTruthy();
  expect(screen.getByLabelText('4 Seguidores')).toBeTruthy();
});

it('seguir atualiza o botão e o contador', async () => {
  await render(<TelaPerfilComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Seguir' }));
  expect(servico.alternarSeguir).toHaveBeenCalledWith('outro', false);
  expect(await screen.findByLabelText('5 Seguidores')).toBeTruthy();
});

it('perfil não encontrado (ex.: bloqueado) mostra o erro', async () => {
  (servico.carregarPerfilComunidade as jest.Mock).mockResolvedValue(null);
  await render(<TelaPerfilComunidade />);
  expect(await screen.findByText('Perfil não encontrado.')).toBeTruthy();
});

it('bloquear confirma, chama o serviço e volta', async () => {
  const alerta = jest.spyOn(Alert, 'alert');
  await render(<TelaPerfilComunidade />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Mais opções' }));
  const menu = alerta.mock.calls[0][2] ?? [];
  menu.find((b) => b.text === 'Bloquear usuário')?.onPress?.();
  const confirmar = alerta.mock.calls[1][2] ?? [];
  await confirmar.find((b) => b.text === 'Bloquear')?.onPress?.();
  expect(servico.bloquearUsuario).toHaveBeenCalledWith('outro');
  expect(mockBack).toHaveBeenCalled();
});
