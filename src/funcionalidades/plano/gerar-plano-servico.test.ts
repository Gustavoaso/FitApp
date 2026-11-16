import { supabase } from '@/compartilhado/supabase';
import type { DadosQuestionario } from '@/compartilhado/tipos';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import {
  ErroGeracao,
  gerarPlano,
  MENSAGEM_FALHA,
  MENSAGEM_LIMITE,
  MENSAGEM_SEM_REDE,
  MENSAGEM_SERVICO_FORA,
  MENSAGEM_SERVICO_OCUPADO,
  MENSAGEM_SESSAO,
} from './gerar-plano-servico';
import { MENSAGEM_PROFISSIONAL } from './motor/travas-saude';

jest.mock('@/compartilhado/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn(), functions: { invoke: jest.fn() } },
}));

const rpc = supabase.rpc as jest.Mock;
const from = supabase.from as jest.Mock;
const invoke = supabase.functions.invoke as jest.Mock;

// Dados fictícios. Nomes de grupo como estão na base (traduzidos do free-exercise-db).
const GRUPOS_BASE = [
  'peito',
  'dorsais',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'isquiotibiais',
  'gluteos',
  'panturrilhas',
  'abdominais',
  'antebracos',
];
const EXERCICIOS = GRUPOS_BASE.flatMap((grupo) =>
  [1, 2, 3].map((n) => ({
    id: `${grupo}-${n}`,
    nome: `Exercício ${grupo} ${n}`,
    grupo_primario: grupo,
    equipamento: 'barra',
    tipo_movimento: n === 1 ? 'composto' : 'isolado',
  })),
);
const ALIMENTOS = [
  {
    id: 1,
    nome: 'Frango grelhado',
    categoria: 'carnes',
    calorias_100g: 159,
    proteinas_100g: 32,
    carboidratos_100g: 0,
    gorduras_100g: 3.2,
  },
  {
    id: 2,
    nome: 'Arroz cozido',
    categoria: 'cereais',
    calorias_100g: 128,
    proteinas_100g: 2.5,
    carboidratos_100g: 28,
    gorduras_100g: 0.2,
  },
  {
    id: 3,
    nome: 'Azeite',
    categoria: 'gorduras_oleos',
    calorias_100g: 884,
    proteinas_100g: 0,
    carboidratos_100g: 0,
    gorduras_100g: 100,
  },
];
const TRECHO = {
  titulo: 'Volume semanal',
  fonte: 'Schoenfeld 2017',
  conteudo: 'Diretriz fictícia de volume.',
};

const RESPOSTAS: DadosQuestionario = {
  perfil: {
    nome: 'Pessoa Teste',
    sexo_biologico: 'Masculino',
    idade: 30,
    peso_atual: 80,
    altura: 180,
  },
  objetivo: {
    objetivo_principal: 'Hipertrofia',
    atividade_fora_treino: 'Moderado',
    nivel_experiencia: 'Intermediário',
  },
  treino: {
    dias_disponiveis_semana: 4,
    local_treino: 'Academia',
    tempo_sessao: '1h',
    divisao_preferida: 'Deixar a IA decidir',
    restricao_fisica: ['Nenhuma'],
  },
  dieta: { restricao_alimentar: ['Nenhuma'], refeicoes_por_dia: 4 },
};

interface Corpo {
  acao: 'buscar' | 'escolher';
  [campo: string]: unknown;
}
interface DiaPedido {
  porGrupo: { grupo: string; quantidade: number }[];
}
interface PedidoEscolher {
  slots: DiaPedido[];
  exercicios: { id: string; grupo: string }[];
  alimentos: { id: string; slot: string }[];
  refeicoes: string[];
  erros: string[];
}

/** O que a LLM daria: os primeiros IDs de cada grupo e slot que o pedido oferece. */
function escolherDoPedido(p: PedidoEscolher): unknown {
  const dias = p.slots.map((dia) => ({
    exercicios: Object.fromEntries(
      dia.porGrupo
        .filter((g) => g.quantidade > 0)
        .map((g) => {
          const ids = p.exercicios.filter((e) => e.grupo === g.grupo).map((e) => e.id);
          return [g.grupo, ids.slice(0, Math.min(g.quantidade, ids.length))];
        }),
    ),
  }));
  const refeicoes = Object.fromEntries(
    p.refeicoes.map((r) => [
      r,
      Object.fromEntries(
        ['proteina', 'carboidrato', 'complemento'].map((s) => [
          s,
          p.alimentos.find((a) => a.slot === s)?.id,
        ]),
      ),
    ]),
  );
  return { dias, refeicoes };
}
const VALIDA = 'VALIDA';
const ESCOLHA_INVALIDA = { dias: [], refeicoes: {} };
const TRECHO_BANCO = { id: 3, ...TRECHO };

/**
 * Simula a Edge Function gerar-plano: `buscar` devolve as linhas dadas; cada `escolher`
 * devolve a próxima resposta da fila (VALIDA = escolha montada a partir do pedido).
 */
function simularFuncao(respostas: unknown[] = [VALIDA], banco = {}) {
  const { exercicios = EXERCICIOS as unknown[], alimentos = ALIMENTOS as unknown[] } = banco as {
    exercicios?: unknown[];
    alimentos?: unknown[];
  };
  const fila = [...respostas];
  const corpos: Corpo[] = [];
  invoke.mockReset().mockImplementation(async (nome: string, { body }: { body: Corpo }) => {
    expect(nome).toBe('gerar-plano');
    corpos.push(body);
    if (body.acao === 'buscar') {
      return { data: { exercicios, alimentos, trechos: [TRECHO_BANCO] }, error: null };
    }
    const proxima = fila.shift();
    const escolha =
      proxima === VALIDA ? escolherDoPedido(body as unknown as PedidoEscolher) : proxima;
    return { data: { escolha }, error: null };
  });
  return {
    buscas: () => corpos.filter((c) => c.acao === 'buscar'),
    escolhas: () => corpos.filter((c) => c.acao === 'escolher'),
  };
}

/** Simula o banco: só a RPC de gravar e as porções caseiras. */
function simularBanco({
  salvar = { data: 'plano-ia-1', error: null } as { data: unknown; error: unknown },
} = {}) {
  rpc.mockReset().mockImplementation(async () => salvar);
}

const salvou = () => rpc.mock.calls.some(([nome]) => nome === 'salvar_plano_gerado');

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  simularBanco();
  from.mockReset();
});

afterEach(() => jest.restoreAllMocks());

describe('gerarPlano com a Edge Function simulada', () => {
  it('RN19: nomes pelo foco, prescrição, aquecimento, progressão, refeições e por quê', async () => {
    // Porção caseira só do arroz (id 2): os outros alimentos ficam só em gramas.
    from.mockReturnValue({
      select: () => ({
        in: async () => ({
          data: [{ id: 2, porcao_descricao: '4 colheres de sopa', porcao_gramas: 100 }],
          error: null,
        }),
      }),
    });
    simularFuncao();
    const { plano } = await gerarPlano({
      ...RESPOSTAS,
      dieta: { ...RESPOSTAS.dieta, refeicoes_por_dia: 5 },
    });

    const [dia] = plano.treino.dias;
    expect(dia.nome).not.toMatch(/^Treino|^Superior$/);
    expect(dia.aquecimento?.length).toBeGreaterThanOrEqual(3);
    expect(dia.exercicios[0]).toMatchObject({ papel: 'principal', repeticoesReserva: 2 });
    expect(plano.treino.dias.map((d) => d.diaSemana)).toEqual([1, 2, 4, 5]);
    expect(plano.treino.progressao).toHaveLength(4);
    expect(plano.treino.inicioEm).toEqual(expect.any(String));
    expect(plano.dieta.refeicoes).toHaveLength(5);
    expect(plano.dieta.refeicoes.find((r) => r.momentoTreino === 'pos')?.nome).toBe('Jantar');
    const arroz = plano.dieta.refeicoes[0].alimentos.find((a) => a.nome === 'Arroz cozido');
    expect(arroz?.medidaCaseira).toMatch(/^cerca de .* colheres de sopa$/);
    expect(plano.porQue?.join(' ')).toContain('Schoenfeld 2017');
  });

  it('sem as porções da base, o plano sai só com gramas', async () => {
    from.mockImplementation(() => {
      throw new Error('fora do ar');
    });
    simularFuncao();
    const { plano } = await gerarPlano(RESPOSTAS);
    expect(plano.dieta.refeicoes.flatMap((r) => r.alimentos).every((a) => !a.medidaCaseira)).toBe(
      true,
    );
  });

  it('sucesso: gera, salva pela RPC e nada do que vai à function leva o nome', async () => {
    const funcao = simularFuncao();
    const { plano, planoIaId } = await gerarPlano(RESPOSTAS);

    expect(planoIaId).toBe('plano-ia-1');
    expect(plano.treino.dias).toHaveLength(4);
    expect(plano.dieta.refeicoes).toHaveLength(4);
    expect(plano.comentarios).toEqual(['Volume semanal (Schoenfeld 2017)']);
    expect(plano.fundamentos).toEqual([TRECHO]);
    expect(JSON.stringify([...funcao.buscas(), ...funcao.escolhas()])).not.toContain(
      'Pessoa Teste',
    );
    // O pedido de escolha leva só IDs e enums; a function lê nomes e diretrizes do banco.
    const [pedido] = funcao.escolhas();
    expect(pedido.trechos).toEqual([3]);
    expect(JSON.stringify(pedido)).not.toContain('Diretriz fictícia');
    expect(JSON.stringify(pedido)).not.toContain('Exercício peito');
    const salvar = rpc.mock.calls.find(([nome]) => nome === 'salvar_plano_gerado');
    expect(salvar?.[1].p_dados.plano).toEqual(plano);
    expect(salvar?.[1].p_dados.respostas.perfil.nome).toBeUndefined();
  });

  it('RAG híbrido: uma busca na function com os filtros da pessoa', async () => {
    const funcao = simularFuncao([VALIDA], { alimentos: [ALIMENTOS[1], ALIMENTOS[2]] });
    const vegano = {
      ...RESPOSTAS,
      treino: { ...RESPOSTAS.treino, local_treino: 'Em casa' },
      dieta: { ...RESPOSTAS.dieta, restricao_alimentar: ['Vegano'] },
    };
    await gerarPlano(vegano).catch(() => undefined);

    expect(funcao.buscas()).toHaveLength(1);
    const [busca] = funcao.buscas() as unknown as {
      objetivo: string;
      restricoes: string[];
      filtroEquipamento: string[];
      termosExcluidos: string[];
      termosProteina: string[];
    }[];
    expect(busca.objetivo).toBe('hipertrofia');
    expect(busca.restricoes).toContain('vegano');
    expect(busca.filtroEquipamento).toEqual(expect.arrayContaining(['halteres', 'peso-do-corpo']));
    expect(busca.filtroEquipamento).not.toContain('barra');
    // Vegano exclui também o que o vegetariano exclui.
    expect(busca.termosExcluidos).toEqual(expect.arrayContaining(['ovo', 'leite', 'frango']));
    expect(busca.termosProteina).toEqual(expect.arrayContaining(['feijao', 'tofu']));
  });

  it('academia sem restrição: sem filtro de equipamento nem de termos', async () => {
    const funcao = simularFuncao();
    await gerarPlano(RESPOSTAS);
    expect(funcao.buscas()[0]).toMatchObject({
      filtroEquipamento: null,
      termosExcluidos: [],
      termosProteina: null,
    });
  });

  it('o banco só pré-filtra: alimento que quebra a restrição é barrado pelo código', async () => {
    const soja = { ...ALIMENTOS[0], id: 8, nome: 'Tofu firme', categoria: 'leguminosas' };
    simularFuncao([VALIDA], { alimentos: [ALIMENTOS[0], soja, ALIMENTOS[1], ALIMENTOS[2]] });
    const vegano = { ...RESPOSTAS, dieta: { ...RESPOSTAS.dieta, restricao_alimentar: ['Vegano'] } };
    const { plano } = await gerarPlano(vegano);
    const nomes = plano.dieta.refeicoes.flatMap((r) => r.alimentos.map((a) => a.nome));
    expect(nomes).not.toContain('Frango grelhado');
    expect(nomes).toContain('Tofu firme');
  });

  it('retry: a 1ª resposta é recusada e a 2ª, com os erros no pedido, é salva', async () => {
    const funcao = simularFuncao([ESCOLHA_INVALIDA, VALIDA]);
    await gerarPlano(RESPOSTAS);

    const pedidos = funcao.escolhas() as unknown as PedidoEscolher[];
    expect(pedidos).toHaveLength(2);
    expect(pedidos[0].erros).toEqual([]);
    expect(pedidos[1].erros.length).toBeGreaterThan(0);
    expect(salvou()).toBe(true);
  });

  it('falha dupla: mostra a mensagem e não grava nada', async () => {
    const funcao = simularFuncao([ESCOLHA_INVALIDA, ESCOLHA_INVALIDA]);
    await expect(gerarPlano(RESPOSTAS)).rejects.toThrow(MENSAGEM_FALHA);
    expect(funcao.escolhas()).toHaveLength(2);
    expect(salvou()).toBe(false);
  });

  it('base sem embedding (só peixe magro e abacate no topo): troca alimentos e o plano sai', async () => {
    // Como a base remota em 2026-11-14: sem similaridade, a ordem cai no id e a LLM
    // (primeiro de cada lista) escolhe uma combinação que não fecha a gordura do dia.
    const peixe = { ...ALIMENTOS[0], id: 10, nome: 'Abadejo cozido', categoria: 'pescados' };
    const magro = { ...peixe, calorias_100g: 91, proteinas_100g: 19.3, gorduras_100g: 0.9 };
    const abacate = {
      id: 11,
      nome: 'Abacate',
      categoria: 'frutas',
      calorias_100g: 96,
      proteinas_100g: 1.2,
      carboidratos_100g: 6,
      gorduras_100g: 8.4,
    };
    const funcao = simularFuncao([VALIDA], {
      alimentos: [magro, ALIMENTOS[0], ALIMENTOS[1], abacate, ALIMENTOS[2]],
    });

    const { plano } = await gerarPlano(RESPOSTAS);

    expect(funcao.escolhas()).toHaveLength(1);
    const nomes = plano.dieta.refeicoes.flatMap((r) => r.alimentos.map((a) => a.nome));
    expect(nomes).toContain('Azeite');
    expect(salvou()).toBe(true);
  });

  it('a mensagem de falha diz o que a pessoa pode fazer', () => {
    expect(MENSAGEM_FALHA).toContain('Tentar de novo');
    expect(MENSAGEM_FALHA).toContain('questionário');
    expect(MENSAGEM_FALHA).not.toContain('DEBUG');
  });

  it.each([
    [
      'sem rede',
      new FunctionsFetchError(new TypeError('Network request failed')),
      MENSAGEM_SEM_REDE,
    ],
    ['sessão expirada (401)', new FunctionsHttpError({ status: 401 }), MENSAGEM_SESSAO],
    ['limite diário (429)', new FunctionsHttpError({ status: 429 }), MENSAGEM_LIMITE],
    ['Groq ocupada (503)', new FunctionsHttpError({ status: 503 }), MENSAGEM_SERVICO_OCUPADO],
    ['falha interna (500)', new FunctionsHttpError({ status: 500 }), MENSAGEM_SERVICO_FORA],
  ])('function com erro, %s: mensagem pronta e nada gravado', async (_, erro, mensagem) => {
    invoke.mockReset().mockResolvedValue({ data: null, error: erro });
    const recebido = await gerarPlano(RESPOSTAS).catch((e: unknown) => e);
    expect(recebido).toBeInstanceOf(ErroGeracao);
    expect((recebido as Error).message).toBe(mensagem);
    expect(salvou()).toBe(false);
  });

  it('6ª geração do dia: a recusa da RPC vira a mensagem do limite', async () => {
    simularFuncao();
    simularBanco({ salvar: { data: null, error: { message: 'limite_diario' } } });
    await expect(gerarPlano(RESPOSTAS)).rejects.toThrow(MENSAGEM_LIMITE);
  });

  it('trava de saúde: menor de 18 nem chama a function', async () => {
    simularFuncao();
    const menor = { ...RESPOSTAS, perfil: { ...RESPOSTAS.perfil, idade: 16 } };
    await expect(gerarPlano(menor)).rejects.toThrow(MENSAGEM_PROFISSIONAL);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('base sem candidatos: erro genérico, sem gravar', async () => {
    const funcao = simularFuncao([VALIDA], { exercicios: [], alimentos: [] });
    const erro = await gerarPlano(RESPOSTAS).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroGeracao);
    expect((erro as Error).message).toBe(MENSAGEM_FALHA);
    expect(funcao.escolhas()).toHaveLength(0);
    expect(salvou()).toBe(false);
  });

  it('vegano: leguminosa (39% das kcal em proteína) entra como proteína e o plano sai', async () => {
    const tempeh = {
      id: 7,
      nome: 'Soja cozida',
      categoria: 'leguminosas',
      calorias_100g: 165,
      proteinas_100g: 16,
      carboidratos_100g: 20,
      gorduras_100g: 1,
    };
    simularFuncao([VALIDA], { alimentos: [ALIMENTOS[0], tempeh, ALIMENTOS[1], ALIMENTOS[2]] });
    const vegano = { ...RESPOSTAS, dieta: { ...RESPOSTAS.dieta, restricao_alimentar: ['Vegano'] } };
    const { plano } = await gerarPlano(vegano);
    const nomes = plano.dieta.refeicoes.flatMap((r) => r.alimentos.map((a) => a.nome));
    expect(nomes).toContain('Soja cozida');
    expect(nomes).not.toContain('Frango grelhado');
  });

  it('peso do corpo: grupo sem exercício possível sai do dia com aviso e o plano sai', async () => {
    // Só peito, costas e pernas têm versão sem equipamento; o resto exige barra.
    const comCorpo = EXERCICIOS.map((e) =>
      ['peito', 'dorsais', 'quadriceps', 'isquiotibiais', 'gluteos', 'abdominais'].some((g) =>
        e.id.startsWith(g),
      )
        ? { ...e, equipamento: 'peso-do-corpo' }
        : e,
    );
    const funcao = simularFuncao([VALIDA], { exercicios: comCorpo });
    const corpo = { ...RESPOSTAS, treino: { ...RESPOSTAS.treino, local_treino: 'Peso do corpo' } };
    const { plano } = await gerarPlano(corpo);

    expect(plano.treino.dias).toHaveLength(4);
    const grupos = plano.treino.dias.flatMap((d) => d.exercicios.map((e) => e.grupoMuscular));
    expect(grupos).not.toContain('biceps');
    expect(grupos).toContain('peito');
    expect(plano.avisos).toEqual(expect.arrayContaining([expect.stringContaining('bíceps')]));
    // O plano guarda os IDs reais; o pedido à function também leva IDs reais.
    expect(plano.treino.dias[0].exercicios[0].exercicioId).toMatch(/^peito-/);
    expect(JSON.stringify(funcao.escolhas()[0])).toContain('peito-1');
  });
});
