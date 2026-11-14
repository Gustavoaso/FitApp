// Soma o que foi registrado na aba Dieta num dia. Conta todo alimento registrado,
// como a própria Dieta faz: antes o Início só somava refeições "concluídas", marca que
// a Dieta nunca liga, e o anel de calorias ficava em zero (etapa 20).

import type { RegistroRefeicaoDiaria } from '@/compartilhado/servicos/historico-servico';

export interface ConsumoDoDia {
  calorias: number;
  proteinas: number;
  carbos: number;
  gorduras: number;
}

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

export function somarConsumoDoDia(
  refeicoes: RegistroRefeicaoDiaria[] | null | undefined,
): ConsumoDoDia {
  const total: ConsumoDoDia = { calorias: 0, proteinas: 0, carbos: 0, gorduras: 0 };
  if (!Array.isArray(refeicoes)) return total;
  for (const refeicao of refeicoes) {
    if (!Array.isArray(refeicao?.alimentos)) continue;
    for (const alimento of refeicao.alimentos) {
      total.calorias += numero(alimento?.calorias);
      total.proteinas += numero(alimento?.proteinas);
      total.carbos += numero(alimento?.carbos);
      total.gorduras += numero(alimento?.gorduras);
    }
  }
  return total;
}
