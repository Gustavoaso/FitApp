import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TelaEvolucao from './TelaEvolucao';
import * as servico from './evolucao-servico';

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(), impactAsync: jest.fn() }));
jest.mock('@/compartilhado/servicos/foto-servico', () => ({
  urlDaFoto: jest.fn().mockResolvedValue(null),
}));
jest.mock('./evolucao-servico', () => ({
  listarRegistros: jest.fn(),
  listarMeusGrupos: jest.fn(),
  buscarFrequencia: jest.fn(),
  salvarFrequencia: jest.fn(),
  criarRegistro: jest.fn(),
  mudarVisibilidade: jest.fn(),
  apagarRegistro: jest.fn(),
}));
const mock = jest.mocked(servico);

const registro = {
  id: 'r1',
  data: '2026-11-01',
  pesoKg: 80,
  mostrarPeso: false,
  fotos: { frente: 'u/a.jpg', lado: null, costas: null },
  grupos: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mock.buscarFrequencia.mockResolvedValue('mensal');
  mock.listarMeusGrupos.mockResolvedValue([{ id: 'g1', nome: 'Galera' }]);
  mock.mudarVisibilidade.mockResolvedValue({ ok: true, valor: null });
});

it('sem registros mostra o estado vazio e o lembrete', async () => {
  mock.listarRegistros.mockResolvedValue({ ok: true, valor: [] });
  await render(<TelaEvolucao />);
  expect(await screen.findByText('Sem registros ainda')).toBeTruthy();
  expect(screen.getByText('Hora de registrar sua evolução')).toBeTruthy();
});

it('registro privado mostra "Só eu" e compartilhar com um grupo chama o serviço', async () => {
  mock.listarRegistros.mockResolvedValue({ ok: true, valor: [registro] });
  await render(<TelaEvolucao />);
  expect(await screen.findByText('Só eu')).toBeTruthy();
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Galera' }));
  await waitFor(() => expect(mock.mudarVisibilidade).toHaveBeenCalledWith('r1', false, ['g1']));
});

it('erro ao listar oferece tentar de novo', async () => {
  mock.listarRegistros.mockResolvedValue({ ok: false, erro: 'x' });
  await render(<TelaEvolucao />);
  expect(await screen.findByText(/tentar de novo/i)).toBeTruthy();
});
