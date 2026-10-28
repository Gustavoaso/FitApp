import { supabase } from '@/compartilhado/supabase';
import { montarAtualizacaoPerfil, repositorioDieta, repositorioPlano } from './repositorio';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockEq = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
const mockInsert = jest.fn().mockResolvedValue({ error: null });
jest.mock('@/compartilhado/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(repositorioDieta, 'salvarPlanoDietaEditavel').mockResolvedValue(undefined as never);
  jest.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'id-b' } },
    error: null,
  } as never);
  jest.mocked(supabase.rpc).mockResolvedValue({ data: { valido: true }, error: null } as never);
  jest
    .mocked(supabase.from)
    .mockImplementation(
      (tabela: string) =>
        (tabela === 'perfis'
          ? { update: mockUpdate }
          : { insert: mockInsert, upsert: mockInsert, select: jest.fn() }) as never,
    );
});

describe('montarAtualizacaoPerfil', () => {
  it('converte para as colunas do banco', () => {
    expect(
      montarAtualizacaoPerfil({
        idade: 30,
        sexo: 'feminino',
        pesoKg: 75,
        alturaCm: 168,
        nivelExperiencia: 'iniciante',
        nivelAtividade: 'leve',
        objetivo: 'definicao',
        frequenciaSemanal: 3,
      }),
    ).toEqual({
      idade: 30,
      sexo: 'feminino',
      peso_kg: 75,
      altura_cm: 168,
      nivel_experiencia: 'iniciante',
      nivel_atividade: 'leve',
      objetivo: 'definicao',
      frequencia_semanal: 3,
    });
  });

  it('nunca manda nome nem campo vazio ou inválido', () => {
    const campos = montarAtualizacaoPerfil({ pesoKg: Number.NaN, idade: undefined, objetivo: '' });
    expect(campos).toEqual({});
    expect('nome' in montarAtualizacaoPerfil({ pesoKg: 75 })).toBe(false);
  });
});

it('ao aceitar o plano faz update parcial do perfil com o peso do questionário', async () => {
  await repositorioPlano.salvarPlanoComoAtivo({}, { perfil: { nome: '' } }, { pesoKg: 75 });
  expect(mockUpdate).toHaveBeenCalledWith({ peso_kg: 75 });
  expect(mockEq).toHaveBeenCalledWith('usuario_id', 'id-b');
});
