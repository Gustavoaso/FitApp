// RN21: selo e fluxo da foto do treino com câmera, galeria, captura e compartilhar simulados.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FimDoTreino } from './FimDoTreino';
import { SeloTreino } from './SeloTreino';
import type { ResumoSessao } from './selo-treino';

const mockPermissaoCamera = jest.fn();
const mockCamera = jest.fn();
const mockGaleria = jest.fn();
const mockPermissaoFotos = jest.fn();
const mockCriarAsset = jest.fn();
const mockCompartilhar = jest.fn();
const mockCapturar = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: () => mockPermissaoCamera(),
  launchCameraAsync: (o: unknown) => mockCamera(o),
  launchImageLibraryAsync: (o: unknown) => mockGaleria(o),
}));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: (somenteEscrita: boolean) => mockPermissaoFotos(somenteEscrita),
  Asset: { create: (uri: string) => mockCriarAsset(uri) },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: (uri: string, o: unknown) => mockCompartilhar(uri, o),
}));
jest.mock('react-native-view-shot', () => ({
  captureRef: (ref: unknown, o: unknown) => mockCapturar(ref, o),
}));

const resumo: ResumoSessao = {
  nomeTreino: 'Peito e tríceps',
  duracaoMinutos: 48,
  series: [{ cargaKg: 50, repeticoes: 10, composto: true }],
  kcalEstimadas: 210,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCapturar.mockResolvedValue('file:///tmp/selo.jpg');
  mockPermissaoFotos.mockResolvedValue({ granted: true });
});

describe('SeloTreino', () => {
  it('modelo coluna: nome, números e marca sobre a foto', async () => {
    await render(
      <SeloTreino resumo={resumo} modelo="coluna" formato="9:16" fotoUri="file:///foto.jpg" />,
    );
    expect(screen.getByText('Peito e tríceps')).toBeTruthy();
    expect(screen.getByText('48 min')).toBeTruthy();
    expect(screen.getByText('500 kg')).toBeTruthy();
    expect(screen.getByText('210 kcal')).toBeTruthy();
    expect(screen.getByText('AI')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Selo TreinaAI: Peito e tríceps, Duração 48 min, Volume 500 kg, Gasto estimado 210 kcal',
      ),
    ).toBeTruthy();
  });

  it('modelo faixa sem kcal (sem peso): não inventa número', async () => {
    await render(
      <SeloTreino
        resumo={{ ...resumo, kcalEstimadas: null }}
        modelo="faixa"
        formato="4:5"
        fotoUri={null}
      />,
    );
    expect(screen.getByText('48 min')).toBeTruthy();
    expect(screen.queryByText(/kcal/)).toBeNull();
  });
});

describe('FimDoTreino', () => {
  it('foto da câmera → selo → compartilhar na folha do iOS em 9:16', async () => {
    mockPermissaoCamera.mockResolvedValue({ granted: true });
    mockCamera.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///foto.jpg' }] });
    await render(<FimDoTreino resumo={resumo} aoConcluir={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Registrar com foto' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Compartilhar' }));

    expect(mockCapturar).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 1080, height: 1920, result: 'tmpfile' }),
    );
    expect(mockCompartilhar).toHaveBeenCalledWith(
      'file:///tmp/selo.jpg',
      expect.objectContaining({ mimeType: 'image/jpeg' }),
    );
  });

  it('formato feed e modelo faixa mudam a imagem salva na galeria', async () => {
    mockGaleria.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///g.jpg' }] });
    await render(<FimDoTreino resumo={resumo} aoConcluir={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Escolher da galeria' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Faixa' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Feed 4:5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar na galeria' }));

    expect(mockPermissaoFotos).toHaveBeenCalledWith(true);
    expect(mockCapturar).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 1080, height: 1350 }),
    );
    expect(mockCriarAsset).toHaveBeenCalledWith('file:///tmp/selo.jpg');
    expect(await screen.findByText('Imagem salva nas Fotos.')).toBeTruthy();
  });

  it('câmera negada: avisa e oferece galeria e cartão sem foto', async () => {
    mockPermissaoCamera.mockResolvedValue({ granted: false });
    await render(<FimDoTreino resumo={resumo} aoConcluir={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Registrar com foto' }));
    expect(mockCamera).not.toHaveBeenCalled();
    expect(await screen.findByText(/Sem acesso à câmera/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Usar cartão sem foto' }));
    expect(screen.getByLabelText(/^Selo TreinaAI/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeTruthy();
  });

  it('galeria cancelada não abre o editor; Concluir fecha', async () => {
    mockGaleria.mockResolvedValue({ canceled: true, assets: null });
    const aoConcluir = jest.fn();
    await render(<FimDoTreino resumo={resumo} aoConcluir={aoConcluir} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Escolher da galeria' }));
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    expect(aoConcluir).toHaveBeenCalled();
  });

  it('sem permissão para salvar: não grava e avisa', async () => {
    mockPermissaoFotos.mockResolvedValue({ granted: false });
    await render(<FimDoTreino resumo={resumo} aoConcluir={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Usar cartão sem foto' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar na galeria' }));
    expect(mockCriarAsset).not.toHaveBeenCalled();
    expect(await screen.findByText(/Sem acesso para salvar/)).toBeTruthy();
  });
});
