import { calcularTudo } from '@/compartilhado/utilidades/calculos';
import type { GrupoMuscular } from '@/compartilhado/tipos';
import { montarDivisaoSemanal, montarSlotsDia, prescrever } from './divisao-semanal';
import { calcularGramas, conferirTolerancia, GRAMAS_MAX, GRAMAS_MIN } from './gramas';
import { REFEICOES } from './schema-prompt';
import { MENSAGEM_PROFISSIONAL, verificarTravasSaude } from './travas-saude';
import type { AlimentoCandidato, EscolhaLLM, ExercicioCandidato, SlotDia } from './tipos';
import { montarPlano, validarEscolha } from './validador';

// Dados fictícios. Três exercícios por grupo, o primeiro composto.
const GRUPOS: GrupoMuscular[] = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
  'abdomen',
  'antebraco',
  'corpo_inteiro',
];
const EXERCICIOS: ExercicioCandidato[] = GRUPOS.flatMap((grupo) =>
  [1, 2, 3].map((n) => ({
    id: `${grupo}-${n}`,
    nome: `Exercício ${grupo} ${n}`,
    grupo,
    composto: n === 1,
    equipamento: n === 3 ? 'academia_completa' : 'peso_corporal',
  })),
);

const ALIMENTOS: AlimentoCandidato[] = [
  {
    id: 'frango',
    nome: 'Frango grelhado',
    slot: 'proteina',
    kcal: 159,
    proteina: 32,
    carboidrato: 0,
    gordura: 3.2,
    restricoesAtendidas: ['sem_lactose', 'sem_gluten'],
  },
  {
    id: 'tofu',
    nome: 'Tofu',
    slot: 'proteina',
    kcal: 120,
    proteina: 13,
    carboidrato: 2,
    gordura: 6.7,
    restricoesAtendidas: ['vegetariano', 'vegano', 'sem_lactose', 'sem_gluten'],
  },
  {
    id: 'arroz',
    nome: 'Arroz cozido',
    slot: 'carboidrato',
    kcal: 128,
    proteina: 2.5,
    carboidrato: 28,
    gordura: 0.2,
    restricoesAtendidas: ['vegetariano', 'vegano', 'sem_lactose', 'sem_gluten'],
  },
  {
    id: 'aveia',
    nome: 'Aveia',
    slot: 'carboidrato',
    kcal: 394,
    proteina: 14,
    carboidrato: 67,
    gordura: 8,
    restricoesAtendidas: ['vegetariano', 'vegano', 'sem_lactose'],
  },
  {
    id: 'azeite',
    nome: 'Azeite',
    slot: 'complemento',
    kcal: 884,
    proteina: 0,
    carboidrato: 0,
    gordura: 100,
    restricoesAtendidas: ['vegetariano', 'vegano', 'sem_lactose', 'sem_gluten'],
  },
  {
    id: 'castanha',
    nome: 'Castanha',
    slot: 'complemento',
    kcal: 650,
    proteina: 15,
    carboidrato: 12,
    gordura: 63,
    restricoesAtendidas: ['vegetariano', 'vegano', 'sem_lactose', 'sem_gluten'],
  },
];

const SEM_RESTRICAO = { equipamentos: 'academia_completa' as const, restricoesAlimentares: [] };

function slotsPara(dias: number): SlotDia[] {
  return montarDivisaoSemanal(dias).map((d) => montarSlotsDia(d, 'intermediario'));
}

/** Escolha que a LLM daria: os primeiros IDs de cada grupo. */
function escolhaValida(
  slots: SlotDia[],
  proteina = 'frango',
  carbo = 'arroz',
  compl = 'azeite',
): EscolhaLLM {
  const refeicao = { proteina, carboidrato: carbo, complemento: compl };
  return {
    dias: slots.map((s) => ({
      exercicios: Object.fromEntries(
        s.porGrupo.map(({ grupo, quantidade }) => [
          grupo,
          [1, 2, 3].slice(0, quantidade).map((n) => `${grupo}-${n}`),
        ]),
      ),
    })),
    refeicoes: { cafe: refeicao, almoco: refeicao, lanche: refeicao, jantar: refeicao },
  };
}

describe('divisão semanal (RN08)', () => {
  it.each([2, 3, 4, 5, 6, 7])('%i dias: devolve %i sessões sem grupo em dias seguidos', (dias) => {
    const divisao = montarDivisaoSemanal(dias);
    expect(divisao).toHaveLength(dias);
    divisao.forEach((dia, i) => {
      const proximo = divisao[(i + 1) % dias];
      expect(dia.grupos.filter((g) => proximo.grupos.includes(g))).toEqual([]);
    });
  });

  it('6 e 7 dias não caem em 5', () => {
    expect(montarDivisaoSemanal(6)).toHaveLength(6);
    expect(montarDivisaoSemanal(7)).toHaveLength(7);
  });

  it.each([1, 8, 0, 3.5, NaN])('recusa frequência %p', (dias) => {
    expect(() => montarDivisaoSemanal(dias)).toThrow();
  });
});

describe('volume (RN07)', () => {
  it('séries, reps e descanso por objetivo e nível', () => {
    expect(prescrever('forca', 'avancado')).toEqual({
      series: 4,
      repeticoes: '3-6',
      descansoSegundos: 180,
    });
    expect(prescrever('hipertrofia', 'iniciante')).toEqual({
      series: 3,
      repeticoes: '8-12',
      descansoSegundos: 90,
    });
  });

  it('reparte o total do nível pelos grupos, cobrindo todos', () => {
    const slot = montarSlotsDia(
      { nome: 'Empurrar', grupos: ['peito', 'ombros', 'triceps'] },
      'avancado',
    );
    expect(slot.porGrupo).toEqual([
      { grupo: 'peito', quantidade: 2 },
      { grupo: 'ombros', quantidade: 2 },
      { grupo: 'triceps', quantidade: 2 },
    ]);
    const inferior = montarSlotsDia(montarDivisaoSemanal(2)[1], 'iniciante');
    expect(inferior.porGrupo.every((g) => g.quantidade >= 1)).toBe(true);
  });

  it('recusa nível ou objetivo inválido', () => {
    expect(() => prescrever('forca', 'mestre' as never)).toThrow();
    expect(() => prescrever(undefined as never, 'iniciante')).toThrow();
  });
});

describe('gramas por mínimos quadrados (RN09)', () => {
  const perfis: { nome: string; args: Parameters<typeof calcularTudo> }[] = [
    { nome: 'homem hipertrofia', args: [80, 178, 30, 'masculino', 'moderado', 'hipertrofia'] },
    { nome: 'mulher definição', args: [62, 165, 28, 'feminino', 'ativo', 'definicao'] },
    { nome: 'homem força', args: [95, 185, 40, 'masculino', 'ativo', 'forca'] },
    { nome: 'mulher emagrecimento', args: [85, 160, 45, 'feminino', 'leve', 'emagrecimento'] },
    {
      nome: 'homem condicionamento',
      args: [70, 172, 55, 'masculino', 'sedentario', 'condicionamento'],
    },
    { nome: 'mulher hipertrofia', args: [58, 168, 22, 'feminino', 'muito_ativo', 'hipertrofia'] },
  ];

  it.each(perfis)('$nome: dia dentro de ±5% em kcal e em cada macro', ({ args }) => {
    const { caloriasAlvo, macros } = calcularTudo(...args);
    const meta = { ...macros, calorias: caloriasAlvo };
    const slots = slotsPara(3);
    const { plano, erros } = montarPlano(
      escolhaValida(slots),
      slots,
      EXERCICIOS,
      ALIMENTOS,
      prescrever(args[5], 'iniciante'),
      meta,
    );
    expect(erros).toEqual([]);
    expect(conferirTolerancia(plano!.totalDia, meta)).toEqual([]);
    plano!.refeicoes
      .flatMap((r) => r.itens)
      .forEach(({ gramas }) => {
        expect(gramas).toBeGreaterThanOrEqual(GRAMAS_MIN);
        expect(gramas).toBeLessThanOrEqual(GRAMAS_MAX);
      });
  });

  it('respeita o limite máximo quando a meta pede demais', () => {
    const [frango, arroz, azeite] = [ALIMENTOS[0], ALIMENTOS[2], ALIMENTOS[4]];
    const gramas = calcularGramas([frango, arroz, azeite], {
      calorias: 20000,
      proteinas: 1000,
      carboidratos: 2000,
      gorduras: 500,
    });
    expect(Math.max(...gramas)).toBe(GRAMAS_MAX);
  });

  describe('troca de alimentos quando a escolha não fecha a meta', () => {
    // Proteína magra e complemento pouco gorduroso: 40 g de abacate dão só 3 g de gordura.
    const PEIXE: AlimentoCandidato = {
      ...ALIMENTOS[0],
      id: 'peixe',
      nome: 'Abadejo cozido',
      kcal: 91,
      proteina: 19.3,
      gordura: 0.9,
    };
    const ABACATE: AlimentoCandidato = {
      ...ALIMENTOS[4],
      id: 'abacate',
      nome: 'Abacate',
      kcal: 96,
      proteina: 1.2,
      carboidrato: 6,
      gordura: 8.4,
    };
    const { caloriasAlvo, macros } = calcularTudo(
      85,
      182,
      31,
      'masculino',
      'moderado',
      'hipertrofia',
    );
    const meta = { ...macros, calorias: caloriasAlvo };
    const slots = slotsPara(3);
    const montar = (candidatos: AlimentoCandidato[]) =>
      montarPlano(
        escolhaValida(slots, 'peixe', 'arroz', 'abacate'),
        slots,
        EXERCICIOS,
        candidatos,
        prescrever('hipertrofia', 'intermediario'),
        meta,
      );

    it('troca só o necessário entre os candidatos e o dia fecha em ±5%', () => {
      const { plano, erros } = montar([PEIXE, ...ALIMENTOS, ABACATE]);
      expect(erros).toEqual([]);
      expect(conferirTolerancia(plano!.totalDia, meta)).toEqual([]);
      const ids = plano!.refeicoes.flatMap((r) => r.itens.map((i) => i.alimento.id));
      expect(ids).not.toContain('abacate');
      // O que já servia na escolha da LLM continua no plano.
      expect(ids).toContain('arroz');
      // Cada refeição continua com um alimento de cada slot.
      plano!.refeicoes.forEach((r) =>
        expect(r.itens.map((i) => i.alimento.slot)).toEqual([
          'proteina',
          'carboidrato',
          'complemento',
        ]),
      );
    });

    it('sem candidato que resolva, continua recusando com o erro da gordura', () => {
      const { plano, erros } = montar([PEIXE, ALIMENTOS[2], ABACATE]);
      expect(plano).toBeUndefined();
      expect(erros.join(' ')).toContain('gorduras do dia fora de ±5%');
    });

    it('escolha que já fecha não é trocada', () => {
      const { plano } = montarPlano(
        escolhaValida(slots),
        slots,
        EXERCICIOS,
        [PEIXE, ...ALIMENTOS, ABACATE],
        prescrever('hipertrofia', 'intermediario'),
        meta,
      );
      const ids = new Set(plano!.refeicoes.flatMap((r) => r.itens.map((i) => i.alimento.id)));
      expect([...ids].sort()).toEqual(['arroz', 'azeite', 'frango']);
    });
  });

  it('acusa fora de ±5% quando os alimentos não fecham a meta', () => {
    expect(
      conferirTolerancia(
        { calorias: 2000, proteinas: 100, carboidratos: 200, gorduras: 70 },
        { calorias: 2000, proteinas: 150, carboidratos: 200, gorduras: 70 },
      ),
    ).toHaveLength(1);
  });

  it.each([null, undefined, 0, -10, NaN])('recusa meta inválida %p', (v) => {
    expect(() =>
      calcularGramas([ALIMENTOS[0]], {
        calorias: v as number,
        proteinas: 1,
        carboidratos: 1,
        gorduras: 1,
      }),
    ).toThrow();
  });
});

describe('validador (RN10)', () => {
  it('aceita escolha correta e põe compostos primeiro', () => {
    const slots = slotsPara(4);
    const { erros, escolha } = validarEscolha(
      escolhaValida(slots),
      slots,
      EXERCICIOS,
      ALIMENTOS,
      SEM_RESTRICAO,
    );
    expect(erros).toEqual([]);
    const meta = { calorias: 2400, proteinas: 180, carboidratos: 270, gorduras: 67 };
    const { plano } = montarPlano(
      escolha!,
      slots,
      EXERCICIOS,
      ALIMENTOS,
      prescrever('hipertrofia', 'intermediario'),
      meta,
    );
    const primeiroDia = plano!.dias[0].exercicios;
    const ultimoComposto = primeiroDia.map((e) => e.composto).lastIndexOf(true);
    const primeiroIsolado = primeiroDia.map((e) => e.composto).indexOf(false);
    expect(primeiroIsolado === -1 || ultimoComposto < primeiroIsolado).toBe(true);
    expect(primeiroDia[0].series).toBe(3);
  });

  it('recusa grupo em dias seguidos', () => {
    // Divisão errada (Superior duas vezes seguidas) que a LLM respeitaria.
    const sup = montarSlotsDia(montarDivisaoSemanal(2)[0], 'intermediario');
    const inf = montarSlotsDia(montarDivisaoSemanal(2)[1], 'intermediario');
    const slots = [sup, sup, inf];
    const { erros } = validarEscolha(
      escolhaValida(slots),
      slots,
      EXERCICIOS,
      ALIMENTOS,
      SEM_RESTRICAO,
    );
    expect(erros.some((e) => e.includes('dias seguidos'))).toBe(true);
  });

  it('recusa ID inventado, grupo errado, repetido e equipamento indisponível', () => {
    const slots = slotsPara(3);
    const escolha = escolhaValida(slots);
    escolha.dias[0].exercicios.peito = ['peito-99', 'costas-1'];
    escolha.dias[1].exercicios.costas = ['costas-1', 'costas-1'];
    const { erros } = validarEscolha(escolha, slots, EXERCICIOS, ALIMENTOS, SEM_RESTRICAO);
    expect(erros.join('\n')).toMatch(/peito-99 não existe/);
    expect(erros.join('\n')).toMatch(/costas-1 não é de peito/);
    expect(erros.join('\n')).toMatch(/repetido/);

    const casa = validarEscolha(escolhaValida(slots), slots, EXERCICIOS, ALIMENTOS, {
      equipamentos: 'peso_corporal',
      restricoesAlimentares: [],
    });
    // Intermediário pede 2 por grupo em 3 dias (peito-1/2 ok); força um 3º com equipamento de academia.
    const comAcademia = escolhaValida(slots);
    comAcademia.dias[0].exercicios.peito = ['peito-1', 'peito-3'];
    const academia = validarEscolha(comAcademia, slots, EXERCICIOS, ALIMENTOS, {
      equipamentos: 'peso_corporal',
      restricoesAlimentares: [],
    });
    expect(casa.erros).toEqual([]);
    expect(academia.erros.join('\n')).toMatch(/peito-3 exige equipamento/);
  });

  it('recusa alimento que fere a restrição ou está no slot errado', () => {
    const slots = slotsPara(2);
    const vegano = {
      equipamentos: 'academia_completa' as const,
      restricoesAlimentares: ['vegano' as const],
    };
    expect(
      validarEscolha(escolhaValida(slots), slots, EXERCICIOS, ALIMENTOS, vegano).erros.join('\n'),
    ).toMatch(/frango não respeita/);
    expect(
      validarEscolha(escolhaValida(slots, 'tofu'), slots, EXERCICIOS, ALIMENTOS, vegano).erros,
    ).toEqual([]);
    expect(
      validarEscolha(
        escolhaValida(slots, 'arroz'),
        slots,
        EXERCICIOS,
        ALIMENTOS,
        SEM_RESTRICAO,
      ).erros.join('\n'),
    ).toMatch(/arroz não é proteina/);
  });

  it.each([null, undefined, 'texto', 42, [], { dias: [] }])(
    'recusa formato inválido %p',
    (bruta) => {
      const slots = slotsPara(2);
      const { erros, escolha } = validarEscolha(bruta, slots, EXERCICIOS, ALIMENTOS, SEM_RESTRICAO);
      expect(erros.length).toBeGreaterThan(0);
      expect(escolha).toBeUndefined();
    },
  );

  it('cobre todas as refeições', () => {
    expect(REFEICOES).toEqual(['cafe', 'almoco', 'lanche', 'jantar']);
  });
});

describe('travas de saúde (RN16)', () => {
  const adulto = {
    idade: 30,
    sexo: 'feminino' as const,
    pesoKg: 60,
    alturaCm: 165,
    caloriasAlvo: 1800,
  };

  it('libera adulto saudável', () => {
    expect(verificarTravasSaude(adulto)).toEqual([]);
  });

  it('recusa menor de 18, mas aceita 18', () => {
    expect(verificarTravasSaude({ ...adulto, idade: 17 })).toEqual(['Menor de 18 anos.']);
    expect(verificarTravasSaude({ ...adulto, idade: 18 })).toEqual([]);
  });

  it('recusa IMC fora de 16–45 e aceita os limites', () => {
    // 1,65 m: IMC 16 = 43,56 kg; IMC 45 = 122,51 kg.
    expect(verificarTravasSaude({ ...adulto, pesoKg: 43 })).toEqual([
      'IMC fora da faixa de 16 a 45.',
    ]);
    expect(verificarTravasSaude({ ...adulto, pesoKg: 123 })).toEqual([
      'IMC fora da faixa de 16 a 45.',
    ]);
    expect(verificarTravasSaude({ ...adulto, pesoKg: 43.6 })).toEqual([]);
    expect(verificarTravasSaude({ ...adulto, pesoKg: 122.5 })).toEqual([]);
  });

  it('recusa calorias abaixo do piso por sexo', () => {
    expect(verificarTravasSaude({ ...adulto, caloriasAlvo: 1199 })).toEqual([
      'Calorias abaixo do piso seguro.',
    ]);
    expect(verificarTravasSaude({ ...adulto, caloriasAlvo: 1200 })).toEqual([]);
    expect(verificarTravasSaude({ ...adulto, sexo: 'masculino', caloriasAlvo: 1499 })).toEqual([
      'Calorias abaixo do piso seguro.',
    ]);
    expect(verificarTravasSaude({ ...adulto, sexo: 'masculino', caloriasAlvo: 1500 })).toEqual([]);
  });

  it.each([null, undefined, {}, { ...adulto, idade: NaN }, { ...adulto, sexo: 'outro' }])(
    'recusa dado inválido %p',
    (dados) => {
      expect(verificarTravasSaude(dados as never)).toEqual(['Dados de saúde inválidos.']);
    },
  );

  it('tem mensagem que recomenda profissional', () => {
    expect(MENSAGEM_PROFISSIONAL).toMatch(/profissional/);
  });
});
