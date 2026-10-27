import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/compartilhado/supabase';
import { excluirConta } from './excluir-conta-servico';

jest.mock('@react-native-async-storage/async-storage', () => ({ clear: jest.fn() }));
jest.mock('@/compartilhado/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() }, auth: { signOut: jest.fn() } },
}));
const mockInvoke = jest.mocked(supabase.functions.invoke);

beforeEach(() => jest.clearAllMocks());

it('chama a function, sai da sessão local e limpa o aparelho', async () => {
  mockInvoke.mockResolvedValue({ data: { ok: true }, error: null } as never);
  await excluirConta();
  expect(mockInvoke).toHaveBeenCalledWith('excluir-conta', { method: 'POST' });
  expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(AsyncStorage.clear).toHaveBeenCalled();
});

it('com erro do servidor, lança e não apaga nada no aparelho', async () => {
  mockInvoke.mockResolvedValue({ data: null, error: new Error('401') } as never);
  await expect(excluirConta()).rejects.toThrow('401');
  expect(supabase.auth.signOut).not.toHaveBeenCalled();
  expect(AsyncStorage.clear).not.toHaveBeenCalled();
});
