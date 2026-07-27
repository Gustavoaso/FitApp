// ============================================================
// INDEX — Re-exporta todas as constantes do pacote
// ============================================================
// Uso em outros pacotes:
//   import { OBJETIVOS, GRUPOS_MUSCULARES, kgParaLb } from '@fitapp/constantes';
// ============================================================

export { OBJETIVOS } from './objetivos';
export type { InfoObjetivo } from './objetivos';

export { GRUPOS_MUSCULARES } from './grupos-musculares';
export type { InfoGrupoMuscular } from './grupos-musculares';

export {
  kgParaLb,
  lbParaKg,
  cmParaFtIn,
  ftInParaCm,
} from './unidades';

export type { UnidadePeso, UnidadeAltura } from './unidades';
