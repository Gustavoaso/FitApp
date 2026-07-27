// ============================================================
// GRUPOS MUSCULARES
// ============================================================
// Labels e ícones dos grupos musculares, usados para
// categorizar exercícios e filtrar na busca.
// ============================================================

import type { GrupoMuscular } from '@fitapp/tipos';

/** Informações de exibição de cada grupo muscular */
export interface InfoGrupoMuscular {
  valor: GrupoMuscular;
  label: string;
  icone: string;
}

/** Lista de todos os grupos musculares com informações de exibição */
export const GRUPOS_MUSCULARES: InfoGrupoMuscular[] = [
  { valor: 'peito', label: 'Peito', icone: 'chest' },
  { valor: 'costas', label: 'Costas', icone: 'back' },
  { valor: 'ombros', label: 'Ombros', icone: 'shoulders' },
  { valor: 'biceps', label: 'Bíceps', icone: 'biceps' },
  { valor: 'triceps', label: 'Tríceps', icone: 'triceps' },
  { valor: 'quadriceps', label: 'Quadríceps', icone: 'quads' },
  { valor: 'posterior', label: 'Posterior', icone: 'hamstrings' },
  { valor: 'gluteos', label: 'Glúteos', icone: 'glutes' },
  { valor: 'panturrilha', label: 'Panturrilha', icone: 'calves' },
  { valor: 'abdomen', label: 'Abdômen', icone: 'abs' },
  { valor: 'antebraco', label: 'Antebraço', icone: 'forearm' },
  { valor: 'corpo_inteiro', label: 'Corpo Inteiro', icone: 'body' },
];
