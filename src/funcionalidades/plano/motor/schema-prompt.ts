// ============================================================
// MOTOR: refeições do dia e slots de alimento (RN07, RN18)
// ============================================================
// O prompt e o formato da resposta da LLM moram na Edge Function
// gerar-plano (supabase/functions/gerar-plano/prompt.ts): o app só manda
// IDs e enums e valida o que volta (validador.ts).
// ============================================================

import type { NomeRefeicao, SlotAlimento } from './tipos';

export const REFEICOES: NomeRefeicao[] = ['cafe', 'almoco', 'lanche', 'jantar'];

// PREMISSA: quais refeições entram para cada quantidade por dia (RN18: 3 a 6).
const REFEICOES_POR_QUANTIDADE: Record<number, NomeRefeicao[]> = {
  3: ['cafe', 'almoco', 'jantar'],
  4: REFEICOES,
  5: ['cafe', 'lanche_manha', 'almoco', 'lanche', 'jantar'],
  6: ['cafe', 'lanche_manha', 'almoco', 'lanche', 'jantar', 'ceia'],
};

/** Refeições do dia pela resposta da pessoa; fora de 3 a 6, as 4 padrão. */
export function refeicoesDoDia(quantidade: number): NomeRefeicao[] {
  return REFEICOES_POR_QUANTIDADE[quantidade] ?? REFEICOES;
}
export const SLOTS: SlotAlimento[] = ['proteina', 'carboidrato', 'complemento'];
