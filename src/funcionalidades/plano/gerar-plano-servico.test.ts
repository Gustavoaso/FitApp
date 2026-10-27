import { supabase } from '@/compartilhado/supabase';
import type { DadosQuestionario } from '@/compartilhado/tipos';
import { ErroGeracao, gerarPlano, MENSAGEM_FALHA, MENSAGEM_LIMITE } from './gerar-plano-servico';
import { MENSAGEM_PROFISSIONAL } from './motor/travas-saude';
import { MENSAGEM_OLLAMA_FORA } from './ollama-cliente';

jest.mock('@/compartilhado/supabase', () => ({ supabase: { from: jest.fn(), rpc: jest.fn() } }));

const from = supabase.from as jest.Mock;
const rpc = supabase.rpc as jest.Mock;

// Dados fictícios. Nomes de grupo como estão na base (traduzidos do free-exercise-db).
const GRUPOS_BASE = [
  'peito', 'dorsais', 'ombros', 'biceps', 'triceps', 'quadriceps',
  'isquiotibiais', 'gluteos', 'panturrilhas', 'abdominais', 'antebracos',
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
  { id: 1, nome: 'Frango grelhado', categoria: 'carnes', calorias_100g: 159, proteinas_100g: 32, carboidratos_100g: 0, gorduras_100g: 3.2 },
  { id: 2, nome: 'Arroz cozido', categoria: 'cereais', calorias_100g: 128, proteinas_100g: 2.5, carboidratos_100g: 28, gorduras_100g: 0.2 },
  { id: 3, nome: 'Azeite', categoria: 'gorduras_oleos', calorias_100g: 884, proteinas_100g: 0, carboidratos_100g: 0, gorduras_100g: 100 },
];
const TRECHO = { titulo: 'Volume semanal', fonte: 'Schoenfeld 2017', conteudo: 'Diretriz fictícia de volume.' };

const RESPOSTAS: DadosQuestionario = {
  perfil: { nome: 'Pessoa Teste', sexo_biologico: 'Masculino', idade: 30, peso_atual: 80, altura: 180 },
  objetivo: { objetivo_principal: 'Hipertrofia', atividade_fora_treino: 'Moderado', nivel_experiencia: 'Intermediário' },
  treino: { dias_disponiveis_semana: 4, local_treino: 'Academia', tempo_sessao: '1h', divisao_preferida: 'Deixar a IA decidir', restricao_fisica: ['Nenhuma'] },
  dieta: { restricao_alimentar: ['Nenhuma'], refeicoes_por_dia: 4 },
};

type Schema = { properties?: Record<string, Schema>; prefixItems?: Schema[]; items?: Schema; enum?: string[]; minItems?: number };

/** O que a LLM daria: os primeiros IDs de cada `enum` do schema pedido (os apelidos e1, e2...). */
function escolherDoSchema(schema: Schema): unknown {
  const props = (s: Schema) => Object.entries(s.properties ?? {});
  const dias = (schema.properties?.dias.prefixItems ?? []).map((dia) => ({
    exercicios: Object.fromEntries(
      props(dia.properties?.exercicios ?? {}).map(([g, lista]) => [g, (lista.items?.enum ?? []).slice(0, lista.minItems)]),
    ),
  }));
  const refeicoes = Object.fromEntries(
    props(schema.properties?.refeicoes ?? {}).map(([r, slots]) => [r, Object.fromEntries(props(slots).map(([k, v]) => [k, v.enum?.[0]]))]),
  );
  return { dias, refeicoes };
}
const VALIDA = 'VALIDA';
const ESCOLHA_INVALIDA = { dias: [], refeicoes: {} };

function consulta(data: unknown[]) {
  const q = { select: jest.fn(), eq: jest.fn(), in: jest.fn(), limit: jest.fn().mockResolvedValue({ data, error: null }) };
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  q.in.mockReturnValue(q);
  return q;
}

/** Simula o Ollama: cada chamada a /api/generate devolve a próxima resposta da fila. */
function simularOllama(respostas: unknown[]) {
  const fila = [...respostas];
  const fetchMock = jest.fn(async (url: string, init: { body: string }) => {
    const proxima = fila.shift();
    const corpo = url.endsWith('/api/embed')
      ? (fila.unshift(proxima), { embeddings: [[0.1, 0.2, 0.3]] })
      : { response: JSON.stringify(proxima === VALIDA ? escolherDoSchema(JSON.parse(init.body).format) : proxima) };
    return { ok: true, status: 200, json: async () => corpo };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function chamadasGenerate(fetchMock: jest.Mock): { prompt: string; format: Schema }[] {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith('/api/generate'))
    .map(([, init]) => JSON.parse(init.body));
}

const salvou = () => rpc.mock.calls.some(([nome]) => nome === 'salvar_plano_gerado');

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  from.mockReset().mockImplementation((tabela: string) => consulta(tabela === 'base_exercicios' ? EXERCICIOS : ALIMENTOS));
  rpc.mockReset().mockImplementation(async (nome: string) =>
    nome === 'buscar_conhecimento_rag' ? { data: [TRECHO], error: null } : { data: 'plano-ia-1', error: null },
  );
});

afterEach(() => jest.restoreAllMocks());

describe('gerarPlano com o Ollama simulado', () => {
  it('sucesso: gera, salva pela RPC e o prompt não leva o nome', async () => {
    const fetchMock = simularOllama([VALIDA]);
    const { plano, planoIaId } = await gerarPlano(RESPOSTAS);

    expect(planoIaId).toBe('plano-ia-1');
    expect(plano.treino.dias).toHaveLength(4);
    expect(plano.dieta.refeicoes).toHaveLength(4);
    expect(plano.comentarios).toEqual(['Volume semanal (Schoenfeld 2017)']);
    expect(plano.fundamentos).toEqual([TRECHO]);
    const [{ prompt }] = chamadasGenerate(fetchMock);
    expect(prompt).not.toContain('Pessoa Teste');
    expect(prompt).toContain('Diretriz fictícia de volume.');
    const salvar = rpc.mock.calls.find(([nome]) => nome === 'salvar_plano_gerado');
    expect(salvar?.[1].p_dados.plano).toEqual(plano);
    expect(salvar?.[1].p_dados.respostas.perfil.nome).toBeUndefined();
  });

  it('retry: a 1ª resposta é recusada e a 2ª, com os erros no prompt, é salva', async () => {
    const fetchMock = simularOllama([ESCOLHA_INVALIDA, VALIDA]);
    await gerarPlano(RESPOSTAS);

    const chamadas = chamadasGenerate(fetchMock);
    expect(chamadas).toHaveLength(2);
    expect(chamadas[0].prompt).not.toContain('A resposta anterior foi recusada');
    expect(chamadas[1].prompt).toContain('A resposta anterior foi recusada');
    expect(salvou()).toBe(true);
  });

  it('falha dupla: mostra a mensagem e não grava nada', async () => {
    const fetchMock = simularOllama([ESCOLHA_INVALIDA, ESCOLHA_INVALIDA]);
    await expect(gerarPlano(RESPOSTAS)).rejects.toThrow(MENSAGEM_FALHA);
    expect(chamadasGenerate(fetchMock)).toHaveLength(2);
    expect(salvou()).toBe(false);
  });

  it('Ollama fora do ar: mensagem da seção 8 e nada gravado', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(gerarPlano(RESPOSTAS)).rejects.toThrow(MENSAGEM_OLLAMA_FORA);
    expect(salvou()).toBe(false);
  });

  it('Ollama responde com erro HTTP: mesma mensagem', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(gerarPlano(RESPOSTAS)).rejects.toThrow(MENSAGEM_OLLAMA_FORA);
  });

  it('6ª geração do dia: a recusa da RPC vira a mensagem do limite', async () => {
    simularOllama([VALIDA]);
    rpc.mockImplementation(async (nome: string) =>
      nome === 'buscar_conhecimento_rag'
        ? { data: [TRECHO], error: null }
        : { data: null, error: { message: 'limite_diario' } },
    );
    await expect(gerarPlano(RESPOSTAS)).rejects.toThrow(MENSAGEM_LIMITE);
  });

  it('trava de saúde: menor de 18 nem chama o Ollama', async () => {
    const fetchMock = simularOllama([VALIDA]);
    const menor = { ...RESPOSTAS, perfil: { ...RESPOSTAS.perfil, idade: 16 } };
    await expect(gerarPlano(menor)).rejects.toThrow(MENSAGEM_PROFISSIONAL);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('base sem candidatos: erro genérico, sem gravar', async () => {
    simularOllama([VALIDA]);
    from.mockImplementation(() => consulta([]));
    const erro = await gerarPlano(RESPOSTAS).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroGeracao);
    expect((erro as Error).message).toBe(MENSAGEM_FALHA);
    expect(salvou()).toBe(false);
  });

  it('vegano: leguminosa (39% das kcal em proteína) entra como proteína e o plano sai', async () => {
    const tempeh = { id: 7, nome: 'Soja cozida', categoria: 'leguminosas', calorias_100g: 165, proteinas_100g: 16, carboidratos_100g: 20, gorduras_100g: 1 };
    const veganos = [tempeh, ALIMENTOS[1], ALIMENTOS[2]];
    from.mockImplementation((tabela: string) => consulta(tabela === 'base_exercicios' ? EXERCICIOS : [ALIMENTOS[0], ...veganos]));
    simularOllama([VALIDA]);
    const vegano = { ...RESPOSTAS, dieta: { ...RESPOSTAS.dieta, restricao_alimentar: ['Vegano'] } };
    const { plano } = await gerarPlano(vegano);
    const nomes = plano.dieta.refeicoes.flatMap((r) => r.alimentos.map((a) => a.nome));
    expect(nomes).toContain('Soja cozida');
    expect(nomes).not.toContain('Frango grelhado');
  });

  it('peso do corpo: grupo sem exercício possível sai do dia com aviso e o plano sai', async () => {
    // Só peito, costas e pernas têm versão sem equipamento; o resto exige barra.
    const comCorpo = EXERCICIOS.map((e) =>
      ['peito', 'dorsais', 'quadriceps', 'isquiotibiais', 'gluteos', 'abdominais'].some((g) => e.id.startsWith(g))
        ? { ...e, equipamento: 'peso-do-corpo' }
        : e,
    );
    from.mockImplementation((tabela: string) => consulta(tabela === 'base_exercicios' ? comCorpo : ALIMENTOS));
    const fetchMock = simularOllama([VALIDA]);
    const corpo = { ...RESPOSTAS, treino: { ...RESPOSTAS.treino, local_treino: 'Peso do corpo' } };
    const { plano } = await gerarPlano(corpo);

    expect(plano.treino.dias).toHaveLength(4);
    const grupos = plano.treino.dias.flatMap((d) => d.exercicios.map((e) => e.grupoMuscular));
    expect(grupos).not.toContain('biceps');
    expect(grupos).toContain('peito');
    expect(plano.avisos).toEqual(expect.arrayContaining([expect.stringContaining('bíceps')]));
    // IDs reais no plano; o prompt só viu os apelidos.
    expect(plano.treino.dias[0].exercicios[0].exercicioId).toMatch(/^peito-/);
    expect(chamadasGenerate(fetchMock)[0].prompt).not.toContain('peito-1');
  });
});
