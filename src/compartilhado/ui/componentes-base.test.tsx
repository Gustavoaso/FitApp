import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CardVidro } from './CardVidro';
import { BotaoPrimario } from './BotaoPrimario';
import { AnelProgresso } from './AnelProgresso';
import { Skeleton } from './Skeleton';
import { EstadoVazio } from './EstadoVazio';
import { EstadoErro } from './EstadoErro';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockEsquema = useColorScheme as jest.Mock;

describe.each(['dark', 'light'])('tema %s', (esquema) => {
  beforeEach(() => mockEsquema.mockReturnValue(esquema));

  it('CardVidro mostra o conteúdo', () => {
    render(
      <CardVidro rotuloAcessibilidade="Resumo do dia">
        <Text>Conteúdo</Text>
      </CardVidro>,
    );
    expect(screen.getByLabelText('Resumo do dia')).toBeTruthy();
  });

  it('BotaoPrimario é um botão e chama a ação', () => {
    const aoPresionar = jest.fn();
    render(<BotaoPrimario texto="Salvar treino" aoPresionar={aoPresionar} />);
    fireEvent.press(screen.getByRole('button', { name: 'Salvar treino' }));
    expect(aoPresionar).toHaveBeenCalledTimes(1);
  });

  it('BotaoPrimario desabilitado não chama a ação', () => {
    const aoPresionar = jest.fn();
    render(<BotaoPrimario texto="Salvar" aoPresionar={aoPresionar} desabilitado />);
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(aoPresionar).not.toHaveBeenCalled();
  });

  it('AnelProgresso tem resumo para o VoiceOver', () => {
    render(<AnelProgresso titulo="Proteína" atual={80} meta={120} unidade="g" />);
    expect(screen.getByLabelText('Proteína: 80g de 120g')).toBeTruthy();
  });

  it('Skeleton anuncia carregamento', () => {
    render(<Skeleton />);
    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('EstadoVazio mostra a frase e a ação', () => {
    const aoAgir = jest.fn();
    render(
      <EstadoVazio titulo="Nenhuma refeição hoje" textoAcao="Adicionar refeição" aoAgir={aoAgir} />,
    );
    expect(screen.getByText('Nenhuma refeição hoje')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Adicionar refeição' }));
    expect(aoAgir).toHaveBeenCalledTimes(1);
  });

  it('EstadoErro chama a ação ao tocar em "Tentar de novo"', () => {
    const aoTentarDeNovo = jest.fn();
    render(<EstadoErro aoTentarDeNovo={aoTentarDeNovo} />);
    expect(screen.getByText('Não foi possível carregar')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(aoTentarDeNovo).toHaveBeenCalledTimes(1);
  });
});
