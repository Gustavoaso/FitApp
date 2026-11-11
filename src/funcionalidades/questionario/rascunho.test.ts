import { apagarRascunho, lerRascunho, salvarRascunho } from './rascunho';
import { RESPOSTAS_VAZIAS } from './respostas';

const mockArmazem = new Map<string, string>();
jest.mock('@/compartilhado/servicos/armazenamento-usuario', () => ({
  armazenamentoUsuario: {
    getItem: async (c: string) => mockArmazem.get(c) ?? null,
    setItem: async (c: string, v: string) => void mockArmazem.set(c, v),
    removeItem: async (c: string) => void mockArmazem.delete(c),
  },
}));

beforeEach(() => mockArmazem.clear());

it('salva e lê de volta', async () => {
  const respostas = { ...RESPOSTAS_VAZIAS, objetivo: 'Hipertrofia', restricaoFisica: ['Nenhuma'] };
  await salvarRascunho({ passo: 3, respostas });
  expect(await lerRascunho()).toEqual({ passo: 3, respostas });
});

it('apagar zera', async () => {
  await salvarRascunho({ passo: 2, respostas: RESPOSTAS_VAZIAS });
  await apagarRascunho();
  expect(await lerRascunho()).toBeNull();
});

it.each([['não é JSON'], ['{"passo":0}'], ['{"passo":12}'], ['{"passo":"x"}'], ['null']])(
  'recusa rascunho inválido: %s',
  async (bruto) => {
    mockArmazem.set('@fitapp_rascunho_questionario', bruto);
    expect(await lerRascunho()).toBeNull();
  },
);

it('ignora campos de tipo errado', async () => {
  mockArmazem.set(
    '@fitapp_rascunho_questionario',
    JSON.stringify({
      passo: 2,
      respostas: { objetivo: 5, restricaoFisica: 'x', sexo: 'Feminino' },
    }),
  );
  expect(await lerRascunho()).toEqual({
    passo: 2,
    respostas: { ...RESPOSTAS_VAZIAS, sexo: 'Feminino' },
  });
});
