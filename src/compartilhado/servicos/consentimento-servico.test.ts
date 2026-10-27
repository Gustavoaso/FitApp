import { supabase } from '@/compartilhado/supabase';
import { possuiConsentimentoSaude, registrarConsentimentoSaude } from './consentimento-servico';

jest.mock('@/compartilhado/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
const mockGetUser = jest.mocked(supabase.auth.getUser);
const mockFrom = jest.mocked(supabase.from);

// Encadeamento mínimo do query builder: cada método devolve a si mesmo.
function consulta(resultadoFinal: unknown) {
  const q: Record<string, jest.Mock> = {};
  for (const m of ['select', 'eq', 'update']) q[m] = jest.fn(() => q);
  q.maybeSingle = jest.fn(() => Promise.resolve(resultadoFinal));
  q.insert = jest.fn(() => Promise.resolve(resultadoFinal));
  // O update(...).eq(...).select(...) termina em select: devolve uma promise no fim.
  q.select = jest.fn(() => Object.assign(Promise.resolve(resultadoFinal), q));
  return q;
}

function logado(id: string | null) {
  mockGetUser.mockResolvedValue({
    data: { user: id ? { id, user_metadata: { nome: 'Pessoa Teste' } } : null },
    error: null,
  } as never);
}

beforeEach(() => jest.clearAllMocks());

describe('possuiConsentimentoSaude', () => {
  it('true quando há data de aceite', async () => {
    logado('u1');
    mockFrom.mockReturnValue(
      consulta({ data: { consentimento_saude_em: '2026-10-26T10:00:00Z' }, error: null }) as never,
    );
    expect(await possuiConsentimentoSaude()).toBe(true);
  });

  it.each([
    ['data nula', { data: { consentimento_saude_em: null }, error: null }],
    ['sem perfil', { data: null, error: null }],
    ['erro do banco', { data: { consentimento_saude_em: '2026-10-26' }, error: { message: 'x' } }],
  ])('false com %s', async (_nome, resultado) => {
    logado('u1');
    mockFrom.mockReturnValue(consulta(resultado) as never);
    expect(await possuiConsentimentoSaude()).toBe(false);
  });

  it('false sem sessão, sem consultar o banco', async () => {
    logado(null);
    expect(await possuiConsentimentoSaude()).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('registrarConsentimentoSaude', () => {
  it('atualiza o perfil existente com a data', async () => {
    logado('u1');
    const q = consulta({ data: [{ id: 'p1' }], error: null });
    mockFrom.mockReturnValue(q as never);
    await registrarConsentimentoSaude();
    expect(q.update).toHaveBeenCalledWith({ consentimento_saude_em: expect.any(String) });
    expect(q.eq).toHaveBeenCalledWith('usuario_id', 'u1');
    expect(q.insert).not.toHaveBeenCalled();
  });

  it('cria o perfil quando ainda não existe', async () => {
    logado('u1');
    const q = consulta({ data: [], error: null });
    mockFrom.mockReturnValue(q as never);
    await registrarConsentimentoSaude();
    expect(q.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: 'u1',
        nome: 'Pessoa Teste',
        consentimento_saude_em: expect.any(String),
      }),
    );
  });

  it('lança erro se o banco recusa', async () => {
    logado('u1');
    mockFrom.mockReturnValue(consulta({ data: null, error: { message: 'rls' } }) as never);
    await expect(registrarConsentimentoSaude()).rejects.toEqual({ message: 'rls' });
  });

  it('lança erro sem sessão', async () => {
    logado(null);
    await expect(registrarConsentimentoSaude()).rejects.toThrow('Sessão expirada');
  });
});
