import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TelaGrupos from './TelaGrupos';
import * as servico from './grupos-servico';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/compartilhado/servicos/foto-servico', () => ({
  urlDaFoto: jest.fn().mockResolvedValue(null),
}));
jest.mock('./grupos-servico', () => ({
  listarGrupos: jest.fn(),
  buscarApelido: jest.fn(),
  salvarApelido: jest.fn(),
  criarGrupo: jest.fn(),
  entrarNoGrupo: jest.fn(),
}));
const mock = jest.mocked(servico);

const grupo = {
  id: 'g1',
  nome: 'Galera',
  descricao: null,
  banner: null,
  duracaoSemanas: null,
  fim: null,
  encerrado: false,
  ehCriador: true,
  codigo: 'AB12CD',
  membros: 3,
  checkinAutomatico: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mock.listarGrupos.mockResolvedValue({ ok: true, valor: [] });
  mock.buscarApelido.mockResolvedValue('Ana');
});

it('pede o apelido antes de tudo e recusa e-mail', async () => {
  mock.buscarApelido.mockResolvedValue(null);
  await render(<TelaGrupos />);
  await fireEvent.changeText(await screen.findByLabelText('Apelido'), 'ana@x.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Salvar apelido' }));
  expect(screen.getByText('O apelido não pode ser um e-mail.')).toBeTruthy();
  expect(mock.salvarApelido).not.toHaveBeenCalled();
});

it('sem grupos mostra o convite para criar ou entrar', async () => {
  await render(<TelaGrupos />);
  expect(await screen.findByText('Treine junto')).toBeTruthy();
});

it('lista os grupos e abre o detalhe', async () => {
  mock.listarGrupos.mockResolvedValue({ ok: true, valor: [grupo] });
  await render(<TelaGrupos />);
  await fireEvent.press(await screen.findByRole('button', { name: /Galera, 3 membros/ }));
  expect(mockPush).toHaveBeenCalledWith('/grupos/g1');
});

it('código inválido mostra o erro do servidor, código malformado nem chama', async () => {
  mock.entrarNoGrupo.mockResolvedValue({
    ok: false,
    erro: 'Código não encontrado. Confira com quem convidou.',
  });
  await render(<TelaGrupos />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Entrar com código' }));
  await fireEvent.changeText(screen.getByLabelText('Código do grupo'), 'abc');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByText('O código tem 6 letras ou números.')).toBeTruthy();
  expect(mock.entrarNoGrupo).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText('Código do grupo'), 'zzzzzz');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  await waitFor(() => expect(mock.entrarNoGrupo).toHaveBeenCalledWith('ZZZZZZ'));
  expect(await screen.findByText(/Código não encontrado/)).toBeTruthy();
});

it('cria o grupo e navega para ele', async () => {
  mock.criarGrupo.mockResolvedValue({ ok: true, valor: { id: 'g9', codigo: 'XXXXXX' } });
  await render(<TelaGrupos />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Criar grupo' }));
  await fireEvent.changeText(screen.getByLabelText('Nome do grupo'), 'Galera');
  await fireEvent.press(screen.getByRole('button', { name: 'Criar' }));
  await waitFor(() => expect(mock.criarGrupo).toHaveBeenCalledWith('Galera', null));
  expect(mockPush).toHaveBeenCalledWith('/grupos/g9');
});
