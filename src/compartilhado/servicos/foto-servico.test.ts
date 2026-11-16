import { manipulateAsync } from 'expo-image-manipulator';
import { supabase } from '@/compartilhado/supabase';
import { enviarFoto, urlDaFoto } from './foto-servico';

const mockUpload = jest.fn();
const mockAssinar = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('@/compartilhado/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn(() => ({ upload: mockUpload, createSignedUrl: mockAssinar })) },
  },
}));

function simular(bytes: number, usuario: string | null = 'u1') {
  jest.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: usuario ? { id: usuario } : null },
  } as never);
  jest.mocked(manipulateAsync).mockResolvedValue({ uri: 'file://r.jpg' } as never);
  global.fetch = jest.fn().mockResolvedValue({
    arrayBuffer: async () => new ArrayBuffer(bytes),
  }) as never;
  mockUpload.mockResolvedValue({ error: null });
}

beforeEach(() => jest.clearAllMocks());

describe('enviarFoto', () => {
  it('redimensiona para 1080 px/JPEG 0,7 e envia na pasta do usuário', async () => {
    simular(1000);
    const caminho = await enviarFoto('avatares', 'file://a.jpg');
    expect(manipulateAsync).toHaveBeenCalledWith(
      'file://a.jpg',
      [{ resize: { width: 1080 } }],
      expect.objectContaining({ compress: 0.7, format: 'jpeg' }),
    );
    expect(caminho).toMatch(/^u1\/\d+\.jpg$/);
    expect(mockUpload).toHaveBeenCalledWith(caminho, expect.any(ArrayBuffer), {
      contentType: 'image/jpeg',
    });
  });

  it('recusa foto acima de 5 MB sem enviar', async () => {
    simular(5 * 1024 * 1024 + 1);
    await expect(enviarFoto('posts', 'file://a.jpg')).rejects.toThrow('5 MB');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('sem sessão, lança erro', async () => {
    simular(10, null);
    await expect(enviarFoto('posts', 'file://a.jpg')).rejects.toThrow('Sessão');
  });

  it('propaga erro do Storage', async () => {
    simular(10);
    mockUpload.mockResolvedValue({ error: new Error('negado') });
    await expect(enviarFoto('posts', 'file://a.jpg')).rejects.toThrow('negado');
  });
});

describe('urlDaFoto', () => {
  it('devolve a URL assinada', async () => {
    mockAssinar.mockResolvedValue({ data: { signedUrl: 'https://x/s' }, error: null });
    expect(await urlDaFoto('avatares', 'u1/a.jpg')).toBe('https://x/s');
  });
  it.each([null, undefined, '', 42])('recusa caminho %p sem chamar o Storage', async (c) => {
    expect(await urlDaFoto('avatares', c)).toBeNull();
    expect(mockAssinar).not.toHaveBeenCalled();
  });
  it('sem permissão, devolve null', async () => {
    mockAssinar.mockResolvedValue({ data: null, error: new Error('403') });
    expect(await urlDaFoto('evolucao', 'u2/a.jpg')).toBeNull();
  });
});
