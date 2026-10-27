import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/compartilhado/supabase';
import { entrarComApple } from './entrar-com-apple-servico';

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('@/compartilhado/supabase', () => ({
  supabase: { auth: { signInWithIdToken: jest.fn() } },
}));
const mockSignIn = jest.mocked(AppleAuthentication.signInAsync);
const mockIdToken = jest.mocked(supabase.auth.signInWithIdToken);

beforeEach(() => jest.clearAllMocks());

describe('entrarComApple', () => {
  it('envia o token da Apple ao Supabase', async () => {
    mockSignIn.mockResolvedValue({ identityToken: 'token-ficticio' } as never);
    mockIdToken.mockResolvedValue({ data: {}, error: null } as never);
    await expect(entrarComApple()).resolves.toEqual({ status: 'ok' });
    expect(mockIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'token-ficticio' });
  });

  it('cancelamento não vira erro', async () => {
    mockSignIn.mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });
    await expect(entrarComApple()).resolves.toEqual({ status: 'cancelado' });
    expect(mockIdToken).not.toHaveBeenCalled();
  });

  it('sem token é erro e não chama o Supabase', async () => {
    mockSignIn.mockResolvedValue({ identityToken: null } as never);
    await expect(entrarComApple()).resolves.toMatchObject({ status: 'erro' });
    expect(mockIdToken).not.toHaveBeenCalled();
  });

  it('erro do Supabase vira mensagem genérica', async () => {
    mockSignIn.mockResolvedValue({ identityToken: 'token-ficticio' } as never);
    mockIdToken.mockResolvedValue({ data: {}, error: { message: 'detalhe interno' } } as never);
    await expect(entrarComApple()).resolves.toEqual({
      status: 'erro',
      mensagem: 'Não foi possível entrar com a Apple. Tente de novo.',
    });
  });

  it('falha desconhecida da Apple vira erro', async () => {
    mockSignIn.mockRejectedValue(new Error('x'));
    await expect(entrarComApple()).resolves.toMatchObject({ status: 'erro' });
  });
});
