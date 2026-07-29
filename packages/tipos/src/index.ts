// ============================================================
// INDEX — Re-exporta todos os tipos do pacote
// ============================================================
// Uso em outros pacotes:
//   import type { Usuario, PlanoTreino, Alimento } from '@fitapp/tipos';
// ============================================================

export type {
  SexoBiologico,
  NivelExperiencia,
  NivelAtividade,
  Usuario,
  Perfil,
} from './usuario';

export type {
  ObjetivoTreino,
  RestricaoAlimentar,
  PreferenciaTreino,
  EquipamentosDisponiveis,
  RespostaQuestionario,
  ResumoNutricionalIA,
  ExercicioPlanoIA,
  DiaTreinoIA,
  AlimentoPlanoIA,
  RefeicaoPlanoIA,
  PlanoIAGerado,
} from './questionario';

export type {
  GrupoMuscular,
  Equipamento,
  Exercicio,
  Serie,
  ExercicioPlano,
  DiaTreino,
  PlanoTreino,
  SerieExecutada,
  SessaoTreino,
} from './treino';

export type {
  CategoriaAlimento,
  TipoRefeicao,
  Macros,
  Alimento,
  AlimentoRefeicao,
  RefeicaoPlano,
  PlanoDieta,
  RefeicaoRegistrada,
  RegistroAgua,
  ResumoDiario,
} from './dieta';
