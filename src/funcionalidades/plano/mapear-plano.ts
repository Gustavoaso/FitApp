// ============================================================
// MAPEAMENTOS DA GERAÇÃO (regras puras, sem rede)
// ============================================================
// Liga as três pontas do motor: respostas da tela → entrada do
// motor; linhas do banco → candidatos; plano montado → o formato
// PlanoIAGerado que o Resultado e a RPC já usam.
// ============================================================

import type {
  DadosQuestionario,
  EquipamentosDisponiveis,
  GrupoMuscular,
  NivelAtividade,
  NivelExperiencia,
  ObjetivoTreino,
  PlanoIAGerado,
  RestricaoAlimentar,
  SexoBiologico,
} from '@/compartilhado/tipos';
import type { ResultadoCalculo } from '@/compartilhado/utilidades';
import type { AtualizacaoPerfil } from '@/compartilhado/servicos/repositorio';
import type { PlanoMontado } from './motor/validador';
import type {
  AlimentoCandidato,
  ExercicioCandidato,
  NomeRefeicao,
  RestricaoFisica,
  SlotAlimento,
} from './motor/tipos';

export interface EntradaMotor {
  sexo: SexoBiologico;
  idade: number;
  pesoKg: number;
  alturaCm: number;
  nivelAtividade: NivelAtividade;
  objetivo: ObjetivoTreino;
  nivel: NivelExperiencia;
  diasPorSemana: number;
  equipamentos: EquipamentosDisponiveis;
  restricoes: RestricaoAlimentar[];
  restricoesFisicas: RestricaoFisica[];
}

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Campos da tabela perfis a partir do questionário (mesma tradução do motor). */
export function perfilDoQuestionario(dados: DadosQuestionario): AtualizacaoPerfil {
  // Respostas incompletas (parâmetro antigo/corrompido): não mexe no perfil.
  if (!dados?.perfil || !dados.objetivo || !dados.treino || !dados.dieta) return {};
  const entrada = mapearRespostas(dados);
  return {
    idade: entrada.idade,
    sexo: entrada.sexo,
    pesoKg: entrada.pesoKg,
    alturaCm: entrada.alturaCm,
    nivelExperiencia: entrada.nivel,
    nivelAtividade: entrada.nivelAtividade,
    objetivo: entrada.objetivo,
    frequenciaSemanal: entrada.diasPorSemana,
  };
}

/** Traduz os textos das opções da tela. Sem nome: o prompt nunca o recebe (RN12). */
export function mapearRespostas(dados: DadosQuestionario): EntradaMotor {
  const objetivo = semAcento(dados.objetivo.objetivo_principal);
  const atividade = semAcento(dados.objetivo.atividade_fora_treino);
  const nivel = semAcento(dados.objetivo.nivel_experiencia);
  const local = semAcento(dados.treino.local_treino);
  const restricoes = dados.dieta.restricao_alimentar.map(semAcento);
  const fisicas = (dados.treino.restricao_fisica ?? []).map(semAcento);
  const mapaRestricoes: [string, RestricaoAlimentar][] = [
    ['lactose', 'sem_lactose'],
    ['gluten', 'sem_gluten'],
    ['vegano', 'vegano'],
    ['vegetariano', 'vegetariano'],
  ];
  return {
    sexo: semAcento(dados.perfil.sexo_biologico).includes('feminino') ? 'feminino' : 'masculino',
    idade: Number(dados.perfil.idade),
    pesoKg: Number(dados.perfil.peso_atual),
    alturaCm: Number(dados.perfil.altura),
    nivelAtividade: atividade.includes('sedent')
      ? 'sedentario'
      : atividade.includes('leve')
        ? 'leve'
        : 'moderado',
    objetivo: objetivo.includes('emagrec')
      ? 'emagrecimento'
      : objetivo.includes('defini')
        ? 'definicao'
        : objetivo.includes('forca')
          ? 'forca'
          : objetivo.includes('condicion')
            ? 'condicionamento'
            : 'hipertrofia',
    nivel: nivel.includes('avanc')
      ? 'avancado'
      : nivel.includes('intermed')
        ? 'intermediario'
        : 'iniciante',
    diasPorSemana: Number(dados.treino.dias_disponiveis_semana),
    equipamentos: local.includes('academia')
      ? 'academia_completa'
      : local.includes('casa')
        ? 'home_gym'
        : 'peso_corporal',
    // "Outra" não tem filtro possível: fica de fora.
    restricoes: mapaRestricoes.filter(([texto]) => restricoes.includes(texto)).map(([, r]) => r),
    // "Punho" e "Outra" ainda não têm regra no motor.
    restricoesFisicas: (['joelho', 'ombro', 'coluna'] as const).filter((r) =>
      fisicas.some((f) => f.includes(r)),
    ),
  };
}

// PREMISSA: nomes da base (free-exercise-db traduzido e seed) → grupos do motor.
const GRUPO_DA_BASE: Record<string, GrupoMuscular> = {
  peito: 'peito',
  costas: 'costas',
  dorsais: 'costas',
  'meio-das-costas': 'costas',
  'inferior-das-costas': 'costas',
  trapezio: 'costas',
  ombros: 'ombros',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'quadriceps',
  posterior: 'posterior',
  isquiotibiais: 'posterior',
  gluteos: 'gluteos',
  adutores: 'gluteos',
  abdutores: 'gluteos',
  panturrilha: 'panturrilha',
  panturrilhas: 'panturrilha',
  abdomen: 'abdomen',
  abdominais: 'abdomen',
  antebraco: 'antebraco',
  antebracos: 'antebraco',
  corpo_inteiro: 'corpo_inteiro',
};

// PREMISSA: o que dá para fazer em casa (halteres, kettlebell, faixas, bolas)
// e só com o corpo; o resto (barra, máquina, cabo, "outros") só na academia.
const EQUIPAMENTO_CASA = [
  'halteres',
  'kettlebell',
  'faixas',
  'bola-medicinal',
  'bola-de-exercicio',
  'barra_fixa',
];
const EQUIPAMENTO_CORPO = ['peso_corporal', 'peso-do-corpo', 'nenhum', 'não especificado'];

/** Equipamentos da base que a pessoa tem (filtro da RPC); null na academia, que tem tudo. */
export function equipamentosDaBase(equipamentos: EquipamentosDisponiveis): string[] | null {
  if (equipamentos === 'academia_completa') return null;
  const lista =
    equipamentos === 'home_gym' ? [...EQUIPAMENTO_CASA, ...EQUIPAMENTO_CORPO] : EQUIPAMENTO_CORPO;
  return lista.map(semAcento);
}

export interface LinhaExercicio {
  id: string;
  nome: string;
  grupo_primario: string;
  equipamento: string;
  tipo_movimento: string;
  nivel?: string;
  grupo_secundario?: string | null;
}

/** Nome da base ("isquiotibiais", "Dorsais") → grupo do motor, ou undefined. */
export function grupoDaBase(texto: string): GrupoMuscular | undefined {
  return GRUPO_DA_BASE[semAcento(texto.trim())];
}

/** Linha sem grupo conhecido é descartada. Funcional vira candidato de corpo inteiro. */
export function mapearExercicio(linha: LinhaExercicio): ExercicioCandidato | null {
  const grupo =
    linha.tipo_movimento === 'funcional'
      ? 'corpo_inteiro'
      : grupoDaBase(linha.grupo_primario.split(',')[0]);
  if (!grupo) return null;
  const equipamento = semAcento(linha.equipamento);
  return {
    id: linha.id,
    nome: linha.nome,
    grupo,
    composto: linha.tipo_movimento === 'composto',
    equipamento: EQUIPAMENTO_CORPO.includes(equipamento)
      ? 'peso_corporal'
      : EQUIPAMENTO_CASA.includes(equipamento)
        ? 'home_gym'
        : 'academia_completa',
  };
}

export interface LinhaAlimento {
  id: number;
  nome: string;
  categoria: string;
  calorias_100g: number;
  proteinas_100g: number;
  carboidratos_100g: number;
  gorduras_100g: number;
}

// PREMISSA: palavras do nome/categoria que quebram cada restrição. Na dúvida, exclui.
const PROIBIDOS: Record<Exclude<RestricaoAlimentar, 'nenhuma'>, string[]> = {
  vegetariano: [
    'carne',
    'frango',
    'peixe',
    'atum',
    'tilapia',
    'salmao',
    'sardinha',
    'patinho',
    'alcatra',
    'file',
    'musculo',
    'contrafile',
    'fraldinha',
    'costela',
    'porco',
    'lombo',
    'peru',
    'presunto',
    'bacon',
    'linguica',
  ],
  vegano: [
    'ovo',
    'clara',
    'leite',
    'queijo',
    'iogurte',
    'whey',
    'albumina',
    'requeijao',
    'manteiga',
    'laticinio',
  ],
  sem_lactose: ['leite', 'queijo', 'iogurte', 'whey', 'requeijao', 'manteiga', 'laticinio'],
  sem_gluten: [
    'trigo',
    'pao',
    'macarrao',
    'massa',
    'aveia',
    'cevada',
    'centeio',
    'biscoito',
    'bolacha',
    'granola',
  ],
};

/** Termos que a RPC exclui do nome/categoria; vegano leva os do vegetariano junto. */
export function termosExcluidos(restricoes: RestricaoAlimentar[]): string[] {
  const termos = restricoes.flatMap((r) =>
    r === 'nenhuma'
      ? []
      : r === 'vegano'
        ? [...PROIBIDOS.vegano, ...PROIBIDOS.vegetariano]
        : PROIBIDOS[r],
  );
  return [...new Set(termos)];
}

// PREMISSA: palavras que marcam exercício de risco para cada restrição física.
// Na dúvida, exclui: joelho = impacto, salto e flexão profunda; ombro = carga
// acima da cabeça e arremessos; coluna = carga axial e flexão de tronco com peso.
const LEVANTAMENTOS_OLIMPICOS = ['arranco', 'clean', 'snatch', 'jerk', 'thruster', 'turkish'];
const RISCO_FISICO: Record<RestricaoFisica, string[]> = {
  joelho: [
    'agachamento',
    'afundo',
    'avanco',
    'passada',
    'lunge',
    'squat',
    'bulgaro',
    'pistol',
    'leg press',
    'hack',
    'extensora',
    'extensao de pernas',
    'salto',
    'pulo',
    'saltos',
    'pliometr',
    'sprint',
    'corrida',
    'impulso',
    'patinacao',
    'shuffle',
    'caixa',
    'barreiras',
    'step',
    'chute',
    'carioca',
    'prowler',
    ...LEVANTAMENTOS_OLIMPICOS,
  ],
  ombro: [
    'desenvolvimento',
    'press',
    'arremesso',
    'handstand',
    'flexoes de mao',
    'acima da cabeca',
    'por cima',
    'atras do pescoco',
    'mergulho',
    'paralela',
    'remada alta',
    'iron cross',
    'batalha',
    'jammer',
    ...LEVANTAMENTOS_OLIMPICOS,
  ],
  coluna: [
    'levantamento terra',
    'terra ',
    'deadlift',
    'stiff',
    'bom dia',
    'good morning',
    'hiperextens',
    'agachamento',
    'squat',
    'zercher',
    'remada curvada',
    'balance',
    'swing',
    'salto',
    'pulo',
    'prowler',
    ...LEVANTAMENTOS_OLIMPICOS,
  ],
};

/** true quando o nome do exercício não tem nenhuma palavra de risco das restrições. */
export function respeitaRestricoesFisicas(nome: string, restricoes: RestricaoFisica[]): boolean {
  const texto = `${semAcento(nome)} `;
  return restricoes.every((r) => !RISCO_FISICO[r].some((p) => texto.includes(p)));
}

// PREMISSA: proteína vegetal que o vegano usa no slot de proteína, mesmo sem 40% das kcal.
export const PROTEINA_VEGETAL = [
  'leguminosas',
  'feijao',
  'grao-de-bico',
  'lentilha',
  'ervilha',
  'tofu',
  'soja',
  'tempeh',
];

// PREMISSA: fonte de carboidrato da refeição tem ao menos 12 g/100 g. Leite,
// iogurte, verduras e frutas aguadas não fecham a meta dentro do limite de gramas
// e, com a ordem por vetor (etapa 17), chegavam ao topo do slot. Igual na RPC.
export const CARBOIDRATO_MIN_100G = 12;

/**
 * Classifica pelo macro dominante em kcal; alimento sem slot claro fica de fora.
 * Com `proteinaVegetal`, leguminosas, tofu e soja entram como proteína (cardápio vegano).
 */
export function mapearAlimento(
  linha: LinhaAlimento,
  proteinaVegetal = false,
): AlimentoCandidato | null {
  const kcal = Number(linha.calorias_100g);
  const proteina = Number(linha.proteinas_100g);
  const carboidrato = Number(linha.carboidratos_100g);
  const gordura = Number(linha.gorduras_100g);
  if (![kcal, proteina, carboidrato, gordura].every(Number.isFinite) || kcal <= 0) return null;
  // PREMISSA: limiares de fração das kcal para cada slot.
  let slot: SlotAlimento | null = null;
  const texto = semAcento(`${linha.nome} ${linha.categoria}`);
  if ((proteina * 4) / kcal >= 0.4) slot = 'proteina';
  else if (proteinaVegetal && PROTEINA_VEGETAL.some((p) => texto.includes(p))) slot = 'proteina';
  else if ((gordura * 9) / kcal >= 0.6) slot = 'complemento';
  else if ((carboidrato * 4) / kcal >= 0.5 && carboidrato >= CARBOIDRATO_MIN_100G)
    slot = 'carboidrato';
  if (!slot) return null;

  const atende = (r: Exclude<RestricaoAlimentar, 'nenhuma'>) =>
    !PROIBIDOS[r].some((p) => texto.includes(p));
  const restricoesAtendidas = (
    Object.keys(PROIBIDOS) as Exclude<RestricaoAlimentar, 'nenhuma'>[]
  ).filter(
    // Vegano exclui também tudo o que o vegetariano exclui.
    (r) => atende(r) && (r !== 'vegano' || atende('vegetariano')),
  );
  return {
    id: String(linha.id),
    nome: linha.nome,
    slot,
    kcal,
    proteina,
    carboidrato,
    gordura,
    restricoesAtendidas,
  };
}

// PREMISSA: treinos em dias seguidos a partir de segunda (a divisão já evita grupo repetido).
const DIA_SEMANA_INICIAL = 1;
const NOME_REFEICAO: Record<NomeRefeicao, { nome: string; horario: string }> = {
  cafe: { nome: 'Café da manhã', horario: '07:00' },
  almoco: { nome: 'Almoço', horario: '12:00' },
  lanche: { nome: 'Lanche da tarde', horario: '16:00' },
  jantar: { nome: 'Jantar', horario: '20:00' },
};

const um = (v: number) => Math.round(v * 10) / 10;

export function paraPlanoGerado(
  plano: PlanoMontado,
  calculo: ResultadoCalculo,
  nomeDivisao: string,
  fontes: string[],
): PlanoIAGerado {
  return {
    resumo: {
      tmb: calculo.tmb,
      tdee: calculo.tdee,
      caloriasAlvo: calculo.caloriasAlvo,
      macros: {
        proteinas: calculo.macros.proteinas,
        carboidratos: calculo.macros.carboidratos,
        gorduras: calculo.macros.gorduras,
      },
      metaAguaMl: calculo.metaAguaMl,
    },
    treino: {
      nomeDivisao,
      dias: plano.dias.map((dia, i) => ({
        diaSemana: (DIA_SEMANA_INICIAL + i) % 7,
        nome: dia.nome,
        tipo: 'treino',
        exercicios: dia.exercicios.map((e) => ({
          exercicioId: e.id,
          nome: e.nome,
          series: e.series,
          repeticoes: e.repeticoes,
          descansoSegundos: e.descansoSegundos,
          grupoMuscular: e.grupo,
        })),
      })),
    },
    dieta: {
      refeicoes: plano.refeicoes.map(({ refeicao, itens }) => ({
        ...NOME_REFEICAO[refeicao],
        alimentos: itens.map(({ alimento, gramas }) => ({
          alimentoId: alimento.id,
          nome: alimento.nome,
          porcao: `${gramas}g`,
          calorias: Math.round((alimento.kcal * gramas) / 100),
          proteinas: um((alimento.proteina * gramas) / 100),
          carboidratos: um((alimento.carboidrato * gramas) / 100),
          gorduras: um((alimento.gordura * gramas) / 100),
        })),
      })),
    },
    comentarios: fontes,
  };
}
