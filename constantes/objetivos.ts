// ============================================================
// OBJETIVOS DE TREINO
// ============================================================
// Labels e descrições dos objetivos, usados na UI para
// mostrar as opções no questionário e em outras telas.
// ============================================================

import type { ObjetivoTreino } from '@fitapp/tipos';

/** Informações de exibição de cada objetivo */
export interface InfoObjetivo {
  valor: ObjetivoTreino;
  label: string;           // Nome amigável para exibição
  descricao: string;       // Explicação breve para o usuário
  icone: string;           // Nome do ícone (para SF Symbols ou similar)
}

/**
 * Lista de todos os objetivos com informações de exibição.
 * A ordem aqui define a ordem no questionário.
 */
export const OBJETIVOS: InfoObjetivo[] = [
  {
    valor: 'hipertrofia',
    label: 'Ganhar massa muscular',
    descricao: 'Foco em crescimento muscular com superávit calórico moderado.',
    icone: 'dumbbell',
  },
  {
    valor: 'definicao',
    label: 'Definição muscular',
    descricao: 'Reduzir gordura mantendo a massa muscular que você já tem.',
    icone: 'flame',
  },
  {
    valor: 'forca',
    label: 'Aumentar força',
    descricao: 'Foco em cargas pesadas e progressão de força.',
    icone: 'bolt',
  },
  {
    valor: 'emagrecimento',
    label: 'Emagrecer',
    descricao: 'Perda de peso com déficit calórico e exercícios.',
    icone: 'arrow-down',
  },
  {
    valor: 'condicionamento',
    label: 'Condicionamento geral',
    descricao: 'Melhorar saúde, resistência e disposição no dia a dia.',
    icone: 'heart',
  },
];
