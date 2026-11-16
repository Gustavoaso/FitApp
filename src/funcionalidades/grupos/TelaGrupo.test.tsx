import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TelaGrupo from './TelaGrupo';
import * as servico from './grupos-servico';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'g1' }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  Stack: { Screen: () => null },
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/compartilhado/servicos/foto-servico', () => ({
  urlDaFoto: jest.fn().mockResolvedValue(null),
  enviarFoto: jest.fn(),
}));
jest.mock('./grupos-servico', () => ({
  listarGrupos: jest.fn(),
  buscarRanking: jest.fn(),
  buscarFeed: jest.fn(),
  curtirCheckin: jest.fn(),
  comentarCheckin: jest.fn(),
  listarComentarios: jest.fn(),
  registrarCheckinManual: jest.fn(),
  definirCheckinAutomatico: jest.fn(),
  encerrarGrupo: jest.fn(),
  sairDoGrupo: jest.fn(),
  removerMembro: jest.fn(),
}));
const mock = jest.mocked(servico);

const grupo = {
  id: 'g1',
  nome: 'Galera',
  descricao: null,
  banner: 'capa:2',
  duracaoSemanas: null,
  fim: null,
  encerrado: false,
  ehCriador: false,
  codigo: null,
  membros: 2,
  checkinAutomatico: true,
};
const checkin = {
  id: 'c1',
  apelido: 'Bia',
  atividade: 'corrida',
  nomeTreino: null,
  descricao: null,
  fotoCaminho: null,
  minutos: 30,
  kcal: null,
  data: '2026-11-16',
  curtidas: 1,
  curtiu: false,
  comentarios: 0,
  ehVoce: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mock.listarGrupos.mockResolvedValue({ ok: true, valor: [grupo] });
  mock.buscarRanking.mockResolvedValue({
    ok: true,
    valor: [{ membroId: 'm1', apelido: 'Bia', pontos: 3, posicao: 1, ehVoce: false }],
  });
  mock.buscarFeed.mockResolvedValue({ ok: true, valor: [checkin] });
  mock.curtirCheckin.mockResolvedValue({ ok: true, valor: null });
});

it('mostra o pódio e troca para o feed, onde dá para curtir', async () => {
  await render(<TelaGrupo />);
  expect(await screen.findByText('3 pontos')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Feed' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Curtir' }));
  await waitFor(() => expect(mock.curtirCheckin).toHaveBeenCalledWith('c1'));
});

it('check-in manual recusa duração vazia sem chamar o serviço', async () => {
  await render(<TelaGrupo />);
  await fireEvent.press(await screen.findByRole('radio', { name: 'Feed' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Check-in manual' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Salvar check-in' }));
  expect(await screen.findByText(/duração em minutos/i)).toBeTruthy();
  expect(mock.registrarCheckinManual).not.toHaveBeenCalled();
});
