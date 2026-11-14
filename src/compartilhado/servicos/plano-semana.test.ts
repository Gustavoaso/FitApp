import AsyncStorage from '@react-native-async-storage/async-storage';
import { definirUsuarioLocal } from './armazenamento-usuario';
import {
  definirTreinoEspecialParaData,
  derivarMapeamentoSemanal,
  descreverSerie,
  obterMapeamentoSemanal,
  obterTreinoDeHoje,
  repeticoesAlvo,
  salvarMapeamentoSemanal,
  treinoDoDia,
  type DiaTreinoCustomizado,
} from './plano-gestao-servico';
import { calcularAderenciaSemanal } from './progresso-servico';
import { repositorioTreino } from './repositorio';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/compartilhado/supabase', () => ({ supabase: {} }));

const exercicio = (id: string) => ({
  id,
  nome: 'Supino',
  grupoMuscular: 'Geral',
  series: 3,
  repeticoes: '8-12',
  cargaKg: 0,
  tempoDescansoSegundos: 60,
});

// Plano do servidor como o da conta A do seed: Full Body seg/qua/sex, 6 exercícios.
const PLANO_SERVIDOR: DiaTreinoCustomizado[] = [1, 3, 5].map((d) => ({
  id: `dia-servidor-${d}`,
  diaSemana: 'Full Body',
  foco: 'Full Body',
  diaSemanaIndice: d,
  exercicios: [1, 2, 3, 4, 5, 6].map((e) => exercicio(`ex-${d}-${e}`)),
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  definirUsuarioLocal('id-a');
  jest.restoreAllMocks();
  jest.spyOn(repositorioTreino, 'buscarPlanosTreino').mockResolvedValue(PLANO_SERVIDOR);
  jest.spyOn(repositorioTreino, 'contarSessoesConcluidas').mockResolvedValue(1);
});

describe('mapa semanal', () => {
  it('sem ajuste local, vem dos dias do plano ativo no servidor', async () => {
    expect(await obterMapeamentoSemanal()).toEqual({
      seg: 'dia-servidor-1',
      qua: 'dia-servidor-3',
      sex: 'dia-servidor-5',
    });
  });

  it('o ajuste feito no aparelho vale como override', async () => {
    await salvarMapeamentoSemanal({ ter: 'dia-servidor-1' });
    expect(await obterMapeamentoSemanal()).toEqual({ ter: 'dia-servidor-1' });
  });

  it('ignora dias sem índice ou com índice fora de 0 a 6', () => {
    const [primeiro] = PLANO_SERVIDOR;
    expect(
      derivarMapeamentoSemanal([
        { ...primeiro, id: 'manual', diaSemanaIndice: undefined },
        { ...primeiro, id: 'invalido', diaSemanaIndice: 9 },
        { ...primeiro, id: 'domingo', diaSemanaIndice: 0 },
      ]),
    ).toEqual({ dom: 'domingo' });
  });
});

describe('treino do dia (o mesmo para Início, Treino e treino ao vivo)', () => {
  const MAPA = { seg: 'dia-servidor-1', qua: 'dia-servidor-3', sex: 'dia-servidor-5' };

  it('vem do mapa semanal; dia sem treino é descanso', () => {
    expect(treinoDoDia(PLANO_SERVIDOR, MAPA, 'qua')?.id).toBe('dia-servidor-3');
    expect(treinoDoDia(PLANO_SERVIDOR, MAPA, 'ter')).toBeNull();
    expect(treinoDoDia(PLANO_SERVIDOR, { ter: 'descanso' }, 'ter')).toBeNull();
  });

  it('a troca feita para a data vence o mapa', () => {
    expect(treinoDoDia(PLANO_SERVIDOR, MAPA, 'qua', 'dia-servidor-5')?.id).toBe('dia-servidor-5');
    expect(treinoDoDia(PLANO_SERVIDOR, MAPA, 'ter', 'dia-servidor-1')?.id).toBe('dia-servidor-1');
  });

  it('troca ou mapa apontando para treino que não existe mais não quebra', () => {
    expect(treinoDoDia(PLANO_SERVIDOR, MAPA, 'qua', 'apagado')?.id).toBe('dia-servidor-3');
    expect(treinoDoDia(PLANO_SERVIDOR, { qua: 'apagado' }, 'qua')).toBeNull();
    expect(treinoDoDia([], MAPA, 'qua', null)).toBeNull();
  });

  describe('obterTreinoDeHoje', () => {
    // Quarta-feira fictícia.
    beforeEach(() => jest.useFakeTimers({ now: new Date('2026-11-11T15:00:00Z') }));
    afterEach(() => jest.useRealTimers());

    it('lê o plano e o mapa; depois de "Trocar" na aba Treino, devolve o treino trocado', async () => {
      expect((await obterTreinoDeHoje())?.id).toBe('dia-servidor-3');
      await definirTreinoEspecialParaData('2026-11-11', 'dia-servidor-5');
      expect((await obterTreinoDeHoje())?.id).toBe('dia-servidor-5');
    });

    it('descanso quando a semana foi redefinida sem treino hoje', async () => {
      await salvarMapeamentoSemanal({ seg: 'dia-servidor-1' });
      expect(await obterTreinoDeHoje()).toBeNull();
    });
  });
});

it('a aderência conta a frequência real do plano e as sessões do servidor', async () => {
  const estatisticas = await calcularAderenciaSemanal();
  expect(estatisticas.metaDiasTreino).toBe(3);
  expect(estatisticas.metaExercicios).toBe(18);
  expect(estatisticas.diasTreinados).toBe(1);
});

describe('textos da série', () => {
  it('mostra a faixa do plano e só mostra carga quando existe', () => {
    expect(descreverSerie(0, '8-12')).toBe('8-12 reps');
    expect(descreverSerie(20, 10)).toBe('20 kg × 10 reps');
    expect(descreverSerie(0, '')).toBe('— reps');
  });

  it('repeticoesAlvo pega o primeiro número e recusa o resto', () => {
    expect(repeticoesAlvo('8-12')).toBe(8);
    expect(repeticoesAlvo(10)).toBe(10);
    expect(repeticoesAlvo('')).toBe(0);
    expect(repeticoesAlvo(Number.NaN)).toBe(0);
  });
});
