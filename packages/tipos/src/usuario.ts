// ============================================================
// TIPOS DO USUÁRIO
// ============================================================
// Representam os dados do usuário, seu perfil físico e suas
// respostas ao questionário. São usados por todos os módulos
// do app (mobile, web e backend).
// ============================================================

/** Sexo biológico — usado para cálculo de TMB (fórmulas diferentes para cada sexo) */
export type SexoBiologico = 'masculino' | 'feminino';

/** Níveis de experiência com treino */
export type NivelExperiencia = 'iniciante' | 'intermediario' | 'avancado';

/** Fatores de atividade para cálculo do TDEE (gasto calórico total diário) */
export type NivelAtividade =
  | 'sedentario'       // Pouco ou nenhum exercício
  | 'leve'             // 1-3 dias/semana
  | 'moderado'         // 3-5 dias/semana
  | 'ativo'            // 6-7 dias/semana
  | 'muito_ativo';     // Atleta, 2x ao dia

/** Dados do perfil do usuário */
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  criadoEm: string;    // ISO 8601 timestamp
  atualizadoEm: string;
}

/** Dados físicos do usuário (atualizáveis ao longo do tempo) */
export interface Perfil {
  usuarioId: string;
  idade: number;
  sexo: SexoBiologico;
  pesoKg: number;
  alturaCm: number;
  gorduraCorporal?: number;  // Percentual, opcional
  nivelExperiencia: NivelExperiencia;
  nivelAtividade: NivelAtividade;
  atualizadoEm: string;
}
