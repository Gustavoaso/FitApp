import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MOLAS, NumeroContado, atrasoCascata, molaOuFinal } from './movimento';

describe('movimento', () => {
  it('Reduzir Movimento devolve o valor final, sem animação', () => {
    expect(molaOuFinal(0.7, true)).toBe(0.7);
  });

  it('sem Reduzir Movimento devolve uma animação (objeto), não o número', () => {
    expect(typeof molaOuFinal(0.7, false)).not.toBe('number');
  });

  it('molas padrão não quicam; só a de celebração quica', () => {
    expect(MOLAS.suave.dampingRatio).toBe(1);
    expect(MOLAS.rapida.dampingRatio).toBe(1);
    expect(MOLAS.celebracao.dampingRatio).toBeLessThan(1);
    expect(MOLAS.celebracao.dampingRatio).toBeGreaterThan(0.5);
  });

  it('cascata tem teto de atraso e recusa índice negativo', () => {
    expect(atrasoCascata(0)).toBe(0);
    expect(atrasoCascata(-3)).toBe(0);
    expect(atrasoCascata(100)).toBe(atrasoCascata(8));
  });

  it('NumeroContado mostra o valor inicial formatado', async () => {
    await render(<NumeroContado valor={1250} formatar={(n) => `${n} kcal`} />);
    expect(screen.getByText('1250 kcal')).toBeTruthy();
  });
});
