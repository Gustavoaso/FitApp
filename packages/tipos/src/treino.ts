// ============================================================
// TIPOS DE TREINO
// ============================================================
// Estrutura hierárquica:
// PlanoTreino → DiaTreino[] → ExercicioPlano[] → Serie[]
//
// - PlanoTreino: o plano semanal completo (ex: "Push Pull Legs 5x")
// - DiaTreino: um dia específico (ex: "Segunda — Peito + Tríceps")
// - ExercicioPlano: um exercício dentro do dia (ex: "Supino Reto")
// - Serie: uma série do exercício (ex: "12 reps a 60kg")
//
// Separamos também o Exercicio (base de dados) do ExercicioPlano
// (exercício dentro de um plano, com séries/reps específicas).
// ============================================================

/** Grupo muscular — para categorizar exercícios */
export type GrupoMuscular =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'posterior'     // Posterior de coxa (isquiotibiais)
  | 'gluteos'
  | 'panturrilha'
  | 'abdomen'
  | 'antebraco'
  | 'corpo_inteiro'; // Para exercícios compostos como burpees

/** Tipo de equipamento necessário */
export type Equipamento =
  | 'barra'
  | 'halteres'
  | 'maquina'
  | 'cabo'
  | 'peso_corporal'
  | 'barra_fixa'
  | 'kettlebell'
  | 'elástico'
  | 'banco';

/** Exercício na base de dados (template, não personalizado) */
export interface Exercicio {
  id: string;
  nome: string;
  grupoPrimario: GrupoMuscular;
  grupoSecundario?: GrupoMuscular;
  equipamento: Equipamento;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  instrucoes: string; // Breve descrição de como executar
}

/** Uma série de um exercício (dentro do plano) */
export interface Serie {
  numero: number;      // 1, 2, 3...
  repeticoes: number;  // Quantidade de repetições
  cargaKg?: number;    // Carga sugerida (opcional no plano, preenchida no registro)
  descansoSegundos: number; // Tempo de descanso após esta série
}

/** Exercício dentro de um plano de treino (com séries específicas) */
export interface ExercicioPlano {
  id: string;
  exercicioId: string;  // Referência ao Exercicio da base
  nome: string;         // Nome do exercício (copiado para exibição rápida)
  ordem: number;        // Posição no dia (1, 2, 3...)
  series: Serie[];
}

/** Um dia de treino dentro do plano */
export interface DiaTreino {
  id: string;
  diaSemana: number;    // 0=domingo, 1=segunda... 6=sábado
  nome: string;         // Ex: "Peito + Tríceps", "Costas + Bíceps"
  exercicios: ExercicioPlano[];
}

/** Plano de treino semanal completo */
export interface PlanoTreino {
  id: string;
  usuarioId: string;
  nome: string;          // Ex: "Push Pull Legs 5x"
  diasPorSemana: number; // 2 a 6
  dias: DiaTreino[];
  criadoEm: string;
  ativo: boolean;        // Apenas 1 plano ativo por vez
}

// ============================================================
// TIPOS DE REGISTRO DE TREINO (sessão executada)
// ============================================================

/** Uma série executada pelo usuário (registro real) */
export interface SerieExecutada {
  numero: number;
  repeticoes: number;  // Quantas reps o usuário fez de fato
  cargaKg: number;     // Carga que usou de fato
  concluida: boolean;
}

/** Sessão de treino executada */
export interface SessaoTreino {
  id: string;
  usuarioId: string;
  planoTreinoId: string;
  diaTreinoId: string;
  data: string;            // ISO 8601 (dia da sessão)
  iniciadoEm: string;      // Timestamp de início
  finalizadoEm?: string;   // Timestamp de fim (null se em andamento)
  exerciciosExecutados: {
    exercicioPlanoId: string;
    nome: string;
    series: SerieExecutada[];
  }[];
}
