import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  chaveDoUsuario,
  definirUsuarioLocal,
  limparCacheLocalUsuario,
} from './armazenamento-usuario';
import {
  adicionarEntradaPeso,
  incrementarExercicioRealizado,
  obterHistoricoPeso,
  obterProgressoSemanal,
} from './progresso-servico';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/compartilhado/supabase', () => ({ supabase: {} }));

const SEMANA = '2026-10-26';

beforeEach(async () => {
  await AsyncStorage.clear();
  definirUsuarioLocal(null);
});

it('a conta B não vê o progresso nem o peso da conta A no mesmo aparelho', async () => {
  definirUsuarioLocal('id-a');
  await incrementarExercicioRealizado(SEMANA);
  await adicionarEntradaPeso(80, '2026-10-26');
  expect((await obterProgressoSemanal(SEMANA)).exerciciosRealizados).toBe(1);

  definirUsuarioLocal('id-b');
  expect((await obterProgressoSemanal(SEMANA)).exerciciosRealizados).toBe(0);
  expect(await obterHistoricoPeso()).toEqual([]);

  definirUsuarioLocal('id-a');
  expect((await obterProgressoSemanal(SEMANA)).exerciciosRealizados).toBe(1);
});

it('separa a chave pelo id e usa "anonimo" sem sessão', () => {
  definirUsuarioLocal('id-a');
  expect(chaveDoUsuario('@fitapp_progresso_peso_v1')).toBe('@fitapp_u:id-a:progresso_peso_v1');
  definirUsuarioLocal(null);
  expect(chaveDoUsuario('@fitapp_progresso_peso_v1')).toBe('@fitapp_u:anonimo:progresso_peso_v1');
});

it('o logout apaga os dados de usuário (inclusive chaves antigas) e mantém o cache de exercícios', async () => {
  definirUsuarioLocal('id-a');
  await adicionarEntradaPeso(80, '2026-10-26');
  await AsyncStorage.setItem('@fitapp_progresso_semanal_v2', '{}');
  await AsyncStorage.setItem('@fitapp_cache_raw_exercise_v1', '[]');
  await AsyncStorage.setItem('sb-local-auth-token', 'sessao');

  await limparCacheLocalUsuario();

  expect(await obterHistoricoPeso()).toEqual([]);
  expect(await AsyncStorage.getItem('@fitapp_progresso_semanal_v2')).toBeNull();
  expect(await AsyncStorage.getItem('@fitapp_cache_raw_exercise_v1')).toBe('[]');
  expect(await AsyncStorage.getItem('sb-local-auth-token')).toBe('sessao');
});
