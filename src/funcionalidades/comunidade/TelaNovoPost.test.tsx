import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TelaNovoPost from './TelaNovoPost';
import * as servico from './comunidade-servico';
import * as perfilServico from '@/compartilhado/servicos/perfil-basico-servico';

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('./comunidade-servico', () => ({
  verificarProntidao: jest.fn(),
  aceitarTermos: jest.fn(),
  publicar: jest.fn(),
}));
jest.mock('@/compartilhado/servicos/perfil-basico-servico', () => ({
  carregarApelidoAtual: jest.fn().mockResolvedValue(null),
  salvarApelidoEUsuario: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

it('sem perfil: cria apelido e @usuario ali mesmo e libera o post', async () => {
  (servico.verificarProntidao as jest.Mock)
    .mockResolvedValueOnce('sem-perfil')
    .mockResolvedValueOnce('ok');
  (perfilServico.salvarApelidoEUsuario as jest.Mock).mockResolvedValue(null);
  await render(<TelaNovoPost />);
  await fireEvent.changeText(await screen.findByLabelText('Apelido'), 'Ana');
  await fireEvent.changeText(screen.getByLabelText('@usuario'), '@ana_c');
  await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
  expect(perfilServico.salvarApelidoEUsuario).toHaveBeenCalledWith('Ana', 'ana_c');
  expect(await screen.findByLabelText('Texto do post')).toBeTruthy();
});

it('sem perfil: @usuario inválido mostra o erro e não salva', async () => {
  (servico.verificarProntidao as jest.Mock).mockResolvedValue('sem-perfil');
  await render(<TelaNovoPost />);
  await fireEvent.changeText(await screen.findByLabelText('Apelido'), 'Ana');
  await fireEvent.changeText(screen.getByLabelText('@usuario'), 'AB');
  await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
  expect(await screen.findByText(/3 a 15/)).toBeTruthy();
  expect(perfilServico.salvarApelidoEUsuario).not.toHaveBeenCalled();
});

it('publica e volta; em resposta leva o id do pai', async () => {
  mockParams = { pai: 'p9' };
  (servico.verificarProntidao as jest.Mock).mockResolvedValue('ok');
  (servico.publicar as jest.Mock).mockResolvedValue(null);
  await render(<TelaNovoPost />);
  await fireEvent.changeText(await screen.findByLabelText('Texto do post'), 'boa!');
  await fireEvent.press(screen.getByRole('button', { name: 'Responder' }));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(servico.publicar).toHaveBeenCalledWith('boa!', null, { paiId: 'p9', repostDe: undefined });
});

it('mostra o erro do envio (ex.: palavra proibida) e não volta', async () => {
  (servico.verificarProntidao as jest.Mock).mockResolvedValue('ok');
  (servico.publicar as jest.Mock).mockResolvedValue('Seu texto tem palavras não permitidas.');
  await render(<TelaNovoPost />);
  await fireEvent.changeText(await screen.findByLabelText('Texto do post'), 'x');
  await fireEvent.press(screen.getByRole('button', { name: 'Publicar' }));
  expect(await screen.findByText(/palavras não permitidas/)).toBeTruthy();
  expect(mockBack).not.toHaveBeenCalled();
});

it('texto vazio não envia', async () => {
  (servico.verificarProntidao as jest.Mock).mockResolvedValue('ok');
  await render(<TelaNovoPost />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Publicar' }));
  expect(await screen.findByText('Escreva algo para postar.')).toBeTruthy();
  expect(servico.publicar).not.toHaveBeenCalled();
});
