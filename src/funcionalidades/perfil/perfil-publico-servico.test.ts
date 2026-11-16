import { supabase } from '@/compartilhado/supabase';
import { salvarPerfilPublico, trocarAvatar } from './perfil-publico-servico';

const mockRemover = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/compartilhado/servicos/foto-servico', () => ({
  enviarFoto: jest.fn().mockResolvedValue('u1/novo.jpg'),
}));
jest.mock('@/compartilhado/supabase', () => ({
  supabase: { from: jest.fn(), storage: { from: jest.fn(() => ({ remove: mockRemover })) } },
}));

beforeEach(() => {
  jest.clearAllMocks();
  const encadeado = { not: () => ({ select: mockSelect }) };
  mockUpdate.mockReturnValue(encadeado);
  jest.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);
});

it('salva @usuario e bio', async () => {
  mockSelect.mockResolvedValue({ data: [{ usuario_id: 'u1' }], error: null });
  expect(await salvarPerfilPublico('ana', 'oi')).toBeNull();
  expect(mockUpdate).toHaveBeenCalledWith({ usuario: 'ana', bio: 'oi' });
});

it('@usuario repetido vira mensagem clara', async () => {
  mockSelect.mockResolvedValue({ data: null, error: { code: '23505' } });
  expect(await salvarPerfilPublico('ana', null)).toContain('já existe');
});

it('sem apelido ainda, avisa', async () => {
  mockSelect.mockResolvedValue({ data: [], error: null });
  expect(await salvarPerfilPublico('ana', null)).toContain('apelido');
});

it('troca o avatar e apaga o antigo', async () => {
  mockUpdate.mockReturnValue({ not: () => Promise.resolve({ error: null }) });
  expect(await trocarAvatar('file://a.jpg', 'u1/velho.jpg')).toBe('u1/novo.jpg');
  expect(mockRemover).toHaveBeenCalledWith(['u1/velho.jpg']);
});
