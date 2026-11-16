// Etapa 20: tocar no card abre o detalhe; do detalhe inicia-se o treino ao vivo daquele
// treino; ao concluir, o dia fica marcado para a aba Treino (atualização entre abas).
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { definirUsuarioLocal } from '@/compartilhado/servicos/armazenamento-usuario';
import { obterHistoricoTreinoCompleto } from '@/compartilhado/servicos/historico-servico';
import {
  salvarMapeamentoSemanal,
  type DiaTreinoCustomizado,
} from '@/compartilhado/servicos/plano-gestao-servico';
import {
  adicionarEntradaPeso,
  calcularAderenciaSemanal,
  registrarExecucaoSerie,
} from '@/compartilhado/servicos/progresso-servico';
import { repositorioDieta, repositorioTreino } from '@/compartilhado/servicos/repositorio';
import type { PlanoIAGerado } from '@/compartilhado/tipos';
import { GradeTreinos } from './GradeTreinos';
import TelaDetalheTreino from './TelaDetalheTreino';
import TelaTreinoAoVivo from './TelaTreinoAoVivo';

const mockPush = jest.fn();
const mockVoltar = jest.fn();
let mockParametros: Record<string, string> = {};

jest.mock('expo-router', () => {
  const ReactReal = jest.requireActual('react');
  return {
    useRouter: () => ({
      push: mockPush,
      back: mockVoltar,
      replace: jest.fn(),
      canGoBack: () => true,
    }),
    useLocalSearchParams: () => mockParametros,
    // No teste não há navegação: o foco vira um efeito de montagem.
    useFocusEffect: (efeito: () => void) => ReactReal.useEffect(efeito, [efeito]),
    Stack: { Screen: () => null },
  };
});
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/compartilhado/supabase', () => ({ supabase: {} }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

const exercicio = (id: string, nome: string, series = 1) => ({
  id,
  nome,
  grupoMuscular: 'Geral',
  series,
  repeticoes: '8-12',
  cargaKg: 0,
  tempoDescansoSegundos: 60,
});

// Dados fictícios: o treino B não é o de nenhum dia da semana.
const PLANOS: DiaTreinoCustomizado[] = [
  {
    id: 'treino-a',
    diaSemana: 'Treino A',
    foco: 'Peito e tríceps',
    exercicios: [exercicio('a1', 'Supino reto')],
  },
  {
    id: 'treino-b',
    diaSemana: 'Treino B',
    foco: 'Costas e bíceps',
    exercicios: [exercicio('b1', 'Remada curvada', 2)],
  },
];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  definirUsuarioLocal('id-a');
  mockParametros = {};
  jest.spyOn(repositorioTreino, 'buscarPlanosTreino').mockResolvedValue(PLANOS);
  jest.spyOn(repositorioTreino, 'contarSessoesConcluidas').mockResolvedValue(0);
  // Sem plano gerado (plano antigo ou treino criado à mão), salvo no teste da RN19.
  jest.spyOn(repositorioDieta, 'buscarUltimoPlanoIA').mockResolvedValue(null);
  // Todos os dias da semana apontam para o treino A.
  await salvarMapeamentoSemanal(
    Object.fromEntries(
      ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d) => [d, 'treino-a']),
    ),
  );
});

describe('grade de treinos', () => {
  it('cada card é um botão e tocar abre o treino tocado', async () => {
    const aoAbrir = jest.fn();
    await render(
      <GradeTreinos
        treinos={PLANOS.map((p) => ({
          id: p.id,
          foco: p.foco,
          totalExercicios: p.exercicios.length,
        }))}
        aoAbrir={aoAbrir}
      />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Treino B, Costas e bíceps, 1 exercício' }),
    );
    expect(aoAbrir).toHaveBeenCalledWith('treino-b');
  });
});

describe('detalhe do treino', () => {
  it('RN19: mostra a semana da progressão, o aquecimento e a reserva do plano gerado', async () => {
    const inicioEm = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const plano = {
      treino: {
        inicioEm,
        progressao: [1, 2, 3, 4].map((semana) => ({
          semana,
          titulo: `Fase ${semana}`,
          orientacao: `Faça a fase ${semana}.`,
        })),
        dias: [
          {
            diaSemana: 1,
            nome: 'Costas e bíceps',
            aquecimento: ['5 minutos de bicicleta.'],
            exercicios: [
              {
                nome: 'Remada curvada',
                series: 2,
                repeticoes: '8-12',
                descansoSegundos: 60,
                repeticoesReserva: 2,
              },
            ],
          },
        ],
      },
    } as unknown as PlanoIAGerado;
    jest
      .spyOn(repositorioDieta, 'buscarUltimoPlanoIA')
      .mockResolvedValue({ id: 'p', plano_gerado: plano, criado_em: inicioEm });
    mockParametros = { treinoId: 'treino-b' };
    await render(<TelaDetalheTreino />);

    expect(await screen.findByText('Semana 2 de 4 · Fase 2')).toBeTruthy();
    expect(screen.getByText('Na próxima semana: fase 3.')).toBeTruthy();
    expect(screen.getByText('1. 5 minutos de bicicleta.')).toBeTruthy();
    expect(screen.getByText('2 séries · 8-12 reps · 60s descanso · 2 na reserva')).toBeTruthy();
  });

  it('mostra exercícios, séries e a carga da última vez', async () => {
    await registrarExecucaoSerie('b1', 'Remada curvada', 1, 40, 10);
    mockParametros = { treinoId: 'treino-b' };
    await render(<TelaDetalheTreino />);

    expect(await screen.findByText('Remada curvada')).toBeTruthy();
    expect(screen.getByText('2 séries · 8-12 reps · 60s descanso')).toBeTruthy();
    expect(screen.getByText('Última vez')).toBeTruthy();
    expect(screen.getByText('40 kg × 10 reps')).toBeTruthy();
    // A série 2 nunca foi feita.
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('sem registro, avisa que a carga é informada no treino', async () => {
    mockParametros = { treinoId: 'treino-a' };
    await render(<TelaDetalheTreino />);
    expect(
      await screen.findByText('Ainda sem registro: a carga você informa no treino'),
    ).toBeTruthy();
  });

  it('"Iniciar este treino" abre o treino ao vivo do treino escolhido', async () => {
    mockParametros = { treinoId: 'treino-b' };
    await render(<TelaDetalheTreino />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Iniciar este treino' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/treino-ao-vivo',
      params: { treinoId: 'treino-b' },
    });
  });

  it('treino que não existe mais: estado vazio com volta', async () => {
    mockParametros = { treinoId: 'apagado' };
    await render(<TelaDetalheTreino />);
    expect(await screen.findByText('Treino não encontrado')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar para os treinos' }));
    expect(mockVoltar).toHaveBeenCalled();
  });
});

describe('treino ao vivo', () => {
  it('com treinoId na rota roda o treino escolhido, não o de hoje', async () => {
    mockParametros = { treinoId: 'treino-b' };
    await render(<TelaTreinoAoVivo />);
    expect(await screen.findByText('Remada curvada')).toBeTruthy();
    expect(screen.getByText('Costas e bíceps')).toBeTruthy();
    expect(screen.queryByText('Supino reto')).toBeNull();
  });

  it('sem parâmetro roda o treino de hoje', async () => {
    await render(<TelaTreinoAoVivo />);
    expect(await screen.findByText('Supino reto')).toBeTruthy();
  });

  it('treinoId que não existe: avisa, sem exercício inventado', async () => {
    mockParametros = { treinoId: 'apagado' };
    await render(<TelaTreinoAoVivo />);
    expect(await screen.findByText('Treino não encontrado')).toBeTruthy();
    expect(screen.queryByText('Concluir Série')).toBeNull();
  });

  it('concluir o treino marca o dia e soma na semana (o que Treino e Início leem)', async () => {
    mockParametros = { treinoId: 'treino-a' };
    await render(<TelaTreinoAoVivo />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Finalizar Exercício' }));
    expect(await screen.findByText('Treino concluído')).toBeTruthy();

    const hoje = new Date().toISOString().split('T')[0];
    const historico = await obterHistoricoTreinoCompleto();
    expect(historico[hoje]).toMatchObject({
      foco: 'Peito e tríceps',
      concluido: true,
      exerciciosConcluidos: 1,
      totalExercicios: 1,
    });
    expect((await calcularAderenciaSemanal()).diasTreinados).toBe(1);
  });
});

describe('gasto calórico estimado (RN20)', () => {
  it('com peso registrado, o resumo e o histórico mostram a estimativa', async () => {
    await adicionarEntradaPeso(70);
    mockParametros = { treinoId: 'treino-a' };
    await render(<TelaTreinoAoVivo />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Finalizar Exercício' }));

    // Sem carga e 1 minuto: MET 3,0 × 70 kg × 1/60 h = 3,5 → 4.
    expect(await screen.findByText('4 kcal')).toBeTruthy();
    const hoje = new Date().toISOString().split('T')[0];
    expect((await obterHistoricoTreinoCompleto())[hoje].kcalEstimadas).toBe(4);
  });

  it('sem peso registrado, não calcula nem mostra kcal', async () => {
    mockParametros = { treinoId: 'treino-a' };
    await render(<TelaTreinoAoVivo />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Finalizar Exercício' }));

    expect(await screen.findByText('Treino concluído')).toBeTruthy();
    expect(screen.queryByText(/kcal/)).toBeNull();
    const hoje = new Date().toISOString().split('T')[0];
    expect((await obterHistoricoTreinoCompleto())[hoje].kcalEstimadas).toBeNull();
  });
});
