// ============================================================
// TIPOS DE DIETA
// ============================================================
// Estrutura hierárquica:
// PlanoDieta → RefeicaoPlano[] → AlimentoRefeicao[]
//
// - PlanoDieta: plano alimentar diário completo
// - RefeicaoPlano: uma refeição (ex: "Café da Manhã")
// - AlimentoRefeicao: um alimento dentro da refeição (ex: "Arroz 150g")
//
// Separamos o Alimento (base de dados TACO) do AlimentoRefeicao
// (alimento dentro de um plano, com porção específica).
// ============================================================

/** Categorias de alimentos (para filtro na busca) */
export type CategoriaAlimento =
  | 'cereais'
  | 'leguminosas'       // Feijão, lentilha, grão-de-bico
  | 'carnes'
  | 'peixes_frutos_mar'
  | 'ovos_laticinios'
  | 'hortalicas'
  | 'frutas'
  | 'gorduras_oleos'
  | 'nozes_sementes'
  | 'acucares_doces'
  | 'bebidas'
  | 'suplementos'
  | 'outros';

/** Tipo de refeição (para organizar o dia) */
export type TipoRefeicao =
  | 'cafe_da_manha'
  | 'lanche_manha'
  | 'almoco'
  | 'lanche_tarde'
  | 'jantar'
  | 'ceia';

/** Macronutrientes por 100g */
export interface Macros {
  calorias: number;     // kcal
  proteinas: number;    // gramas
  carboidratos: number; // gramas
  gorduras: number;     // gramas
  fibras?: number;      // gramas (opcional)
}

/** Alimento na base de dados (TACO ou curado) */
export interface Alimento {
  id: string;
  nome: string;
  categoria: CategoriaAlimento;
  macrosPor100g: Macros;         // Valores nutricionais por 100g
  porcaoPadrao?: {
    descricao: string;           // Ex: "1 unidade", "1 colher de sopa"
    pesoGramas: number;          // Ex: 30 (30g = 1 colher de sopa)
  };
}

/** Alimento dentro de uma refeição no plano */
export interface AlimentoRefeicao {
  id: string;
  alimentoId: string;     // Referência ao Alimento da base
  nome: string;           // Nome do alimento (copiado para exibição rápida)
  porcaoGramas: number;   // Porção em gramas
  macros: Macros;         // Macros calculados para esta porção
}

/** Uma refeição dentro do plano alimentar */
export interface RefeicaoPlano {
  id: string;
  tipo: TipoRefeicao;
  nome: string;          // Ex: "Café da Manhã"
  horarioSugerido?: string; // Ex: "07:00"
  alimentos: AlimentoRefeicao[];
  totalMacros: Macros;   // Soma dos macros de todos os alimentos
}

/** Plano alimentar diário completo */
export interface PlanoDieta {
  id: string;
  usuarioId: string;
  caloriasAlvo: number;
  macrosAlvo: Macros;
  metaAguaMl: number;       // Meta de água em mililitros
  refeicoes: RefeicaoPlano[];
  criadoEm: string;
  ativo: boolean;
}

// ============================================================
// TIPOS DE REGISTRO DE REFEIÇÃO (consumo real)
// ============================================================

/** Registro de uma refeição consumida pelo usuário */
export interface RefeicaoRegistrada {
  id: string;
  usuarioId: string;
  data: string;             // ISO 8601 (dia)
  tipo: TipoRefeicao;
  alimentos: AlimentoRefeicao[];
  totalMacros: Macros;
  registradoEm: string;    // Timestamp do registro
}

/** Registro de consumo de água do dia */
export interface RegistroAgua {
  id: string;
  usuarioId: string;
  data: string;
  totalMl: number;         // Total consumido no dia
  metaMl: number;          // Meta do dia
}

/** Resumo nutricional do dia (calculado a partir dos registros) */
export interface ResumoDiario {
  data: string;
  caloriasConsumidas: number;
  caloriasAlvo: number;
  macrosConsumidos: Macros;
  macrosAlvo: Macros;
  aguaConsumidaMl: number;
  aguaMetaMl: number;
  refeicoesRegistradas: number;
  refeicoesTotais: number;
}
