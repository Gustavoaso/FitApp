// ============================================================
// INDEX — Re-exporta todas as utilidades do pacote
// ============================================================
// Uso em outros pacotes:
//   import { calcularTMB, formatarCalorias, validarPeso } from '@fitapp/utilidades';
// ============================================================

export {
  calcularTMB,
  calcularTDEE,
  calcularCaloriasAlvo,
  calcularMacros,
  calcularMetaAgua,
  calcularTudo,
} from './calculos';

export type { ResultadoCalculo } from './calculos';

export {
  formatarCalorias,
  formatarGramas,
  formatarAgua,
  formatarTempo,
  formatarPeso,
  formatarProgresso,
} from './formatadores';

export {
  validarIdade,
  validarPeso,
  validarAltura,
  validarGorduraCorporal,
  validarFrequenciaSemanal,
  validarNome,
  validarEmail,
} from './validadores';

export type { ResultadoValidacao } from './validadores';
