import type { RegistroRefeicaoDiaria } from '@/compartilhado/servicos/historico-servico';
import { somarConsumoDoDia } from './consumo-do-dia';

const alimento = (calorias: number) => ({
  id: `a-${calorias}`,
  nome: 'Alimento fictício',
  porcao: '100g',
  calorias,
  proteinas: 10,
  carbos: 20,
  gorduras: 5,
});

// Como a aba Dieta grava: `concluida` fica sempre false.
const refeicao = (nome: string, calorias: number[]): RegistroRefeicaoDiaria => ({
  idRefeicao: nome,
  data: '2026-11-14',
  concluida: false,
  alimentos: calorias.map(alimento),
});

describe('somarConsumoDoDia', () => {
  it('soma o que a Dieta registrou, mesmo sem a refeição marcada como concluída', () => {
    expect(
      somarConsumoDoDia([refeicao('Café da manhã', [200, 150]), refeicao('Almoço', [600])]),
    ).toEqual({ calorias: 950, proteinas: 30, carbos: 60, gorduras: 15 });
  });

  it('refeição sem alimento não soma nada', () => {
    expect(somarConsumoDoDia([refeicao('Jantar', [])]).calorias).toBe(0);
  });

  it.each([null, undefined, 'texto', 42])('entrada inválida (%p) dá zero', (entrada) => {
    expect(somarConsumoDoDia(entrada as unknown as RegistroRefeicaoDiaria[])).toEqual({
      calorias: 0,
      proteinas: 0,
      carbos: 0,
      gorduras: 0,
    });
  });

  it('ignora número quebrado e refeição sem lista de alimentos', () => {
    const quebrada = { ...refeicao('Lanche', [100]), alimentos: undefined };
    const comNaN = refeicao('Almoço', [Number.NaN, 300]);
    expect(
      somarConsumoDoDia([quebrada as unknown as RegistroRefeicaoDiaria, comNaN]).calorias,
    ).toBe(300);
  });
});
