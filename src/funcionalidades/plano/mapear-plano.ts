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
import type { PlanoMontado } from './motor/validador';
import type { AlimentoCandidato, ExercicioCandidato, NomeRefeicao, SlotAlimento } from './motor/tipos';

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
}

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Traduz os textos das opções da tela. Sem nome: o prompt nunca o recebe (RN12). */
export function mapearRespostas(dados: DadosQuestionario): EntradaMotor {
  const objetivo = semAcento(dados.objetivo.objetivo_principal);
  const atividade = semAcento(dados.objetivo.atividade_fora_treino);
  const nivel = semAcento(dados.objetivo.nivel_experiencia);
  const local = semAcento(dados.treino.local_treino);
  const restricoes = dados.dieta.restricao_alimentar.map(semAcento);
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
    nivelAtividade: atividade.includes('sedent') ? 'sedentario' : atividade.includes('leve') ? 'leve' : 'moderado',
    objetivo: objetivo.includes('emagrec')
      ? 'emagrecimento'
      : objetivo.includes('defini')
        ? 'definicao'
        : objetivo.includes('forca')
          ? 'forca'
          : objetivo.includes('condicion')
            ? 'condicionamento'
            : 'hipertrofia',
    nivel: nivel.includes('avanc') ? 'avancado' : nivel.includes('intermed') ? 'intermediario' : 'iniciante',
    diasPorSemana: Number(dados.treino.dias_disponiveis_semana),
    equipamentos: local.includes('academia') ? 'academia_completa' : local.includes('casa') ? 'home_gym' : 'peso_corporal',
    // "Outra" não tem filtro possível: fica de fora.
    restricoes: mapaRestricoes.filter(([texto]) => restricoes.includes(texto)).map(([, r]) => r),
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
const EQUIPAMENTO_CASA = ['halteres', 'kettlebell', 'faixas', 'bola-medicinal', 'bola-de-exercicio', 'barra_fixa'];
const EQUIPAMENTO_CORPO = ['peso_corporal', 'peso-do-corpo', 'nenhum', 'não especificado'];

export interface LinhaExercicio {
  id: string;
  nome: string;
  grupo_primario: string;
  equipamento: string;
  tipo_movimento: string;
}

/** Linha sem grupo conhecido é descartada. Funcional vira candidato de corpo inteiro. */
export function mapearExercicio(linha: LinhaExercicio): ExercicioCandidato | null {
  const primeiro = semAcento(linha.grupo_primario.split(',')[0].trim());
  const grupo = linha.tipo_movimento === 'funcional' ? 'corpo_inteiro' : GRUPO_DA_BASE[primeiro];
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
  vegetariano: ['carne', 'frango', 'peixe', 'atum', 'tilapia', 'salmao', 'sardinha', 'patinho', 'alcatra', 'file', 'musculo', 'contrafile', 'fraldinha', 'costela', 'porco', 'lombo', 'peru', 'presunto', 'bacon', 'linguica'],
  vegano: ['ovo', 'clara', 'leite', 'queijo', 'iogurte', 'whey', 'albumina', 'requeijao', 'manteiga', 'laticinio'],
  sem_lactose: ['leite', 'queijo', 'iogurte', 'whey', 'requeijao', 'manteiga', 'laticinio'],
  sem_gluten: ['trigo', 'pao', 'macarrao', 'massa', 'aveia', 'cevada', 'centeio', 'biscoito', 'bolacha', 'granola'],
};

/** Classifica pelo macro dominante em kcal; alimento sem slot claro fica de fora. */
export function mapearAlimento(linha: LinhaAlimento): AlimentoCandidato | null {
  const kcal = Number(linha.calorias_100g);
  const proteina = Number(linha.proteinas_100g);
  const carboidrato = Number(linha.carboidratos_100g);
  const gordura = Number(linha.gorduras_100g);
  if (![kcal, proteina, carboidrato, gordura].every(Number.isFinite) || kcal <= 0) return null;
  // PREMISSA: limiares de fração das kcal para cada slot.
  let slot: SlotAlimento | null = null;
  if ((proteina * 4) / kcal >= 0.4) slot = 'proteina';
  else if ((gordura * 9) / kcal >= 0.6) slot = 'complemento';
  else if ((carboidrato * 4) / kcal >= 0.5) slot = 'carboidrato';
  if (!slot) return null;

  const texto = semAcento(`${linha.nome} ${linha.categoria}`);
  const atende = (r: Exclude<RestricaoAlimentar, 'nenhuma'>) => !PROIBIDOS[r].some((p) => texto.includes(p));
  const restricoesAtendidas = (Object.keys(PROIBIDOS) as Exclude<RestricaoAlimentar, 'nenhuma'>[]).filter(
    // Vegano exclui também tudo o que o vegetariano exclui.
    (r) => atende(r) && (r !== 'vegano' || atende('vegetariano')),
  );
  return { id: String(linha.id), nome: linha.nome, slot, kcal, proteina, carboidrato, gordura, restricoesAtendidas };
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
