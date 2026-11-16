// ============================================================
// EDGE FUNCTION: gerar-plano (handler)
// ============================================================
// Duas ações, sempre com usuário autenticado e dentro do limite diário (RN13):
//  - buscar:  embedding da consulta (gte-small) + RPCs de candidatos (RN14),
//             com o JWT da pessoa. O app seleciona e monta como antes.
//  - escolher: monta o prompt e chama a Groq (RN06). O cliente manda só IDs e
//             enums; nomes e diretrizes vêm do banco, então a function não vira
//             proxy aberto da Groq. Devolve a escolha crua, com os IDs reais;
//             o app valida e monta o plano (RN07).
// Separado do index.ts para ser testado sem rede nem segredo.
// ============================================================

import { apelidar, montarPrompt, type SlotPrompt } from './prompt.ts';
import { ServicoOcupado } from './groq.ts';

const OBJETIVOS = ['hipertrofia', 'definicao', 'forca', 'emagrecimento', 'condicionamento'];
const NIVEIS = ['iniciante', 'intermediario', 'avancado'];
const EQUIPAMENTOS = ['academia_completa', 'home_gym', 'peso_corporal'];
const RESTRICOES = ['nenhuma', 'vegetariano', 'vegano', 'sem_lactose', 'sem_gluten'];
const REFEICOES = ['cafe', 'lanche_manha', 'almoco', 'lanche', 'jantar', 'ceia'];
const GRUPOS = [
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
const SLOTS = ['proteina', 'carboidrato', 'complemento'];

// Limites de entrada (a function não pode virar proxy aberto).
const MAX_DIAS = 7;
const MAX_EXERCICIOS = 200;
const MAX_ALIMENTOS = 100;
const MAX_TRECHOS = 5;
const MAX_ERROS = 5;
const MAX_TEXTO_ERRO = 200;
const MAX_FILTRO = 40;
const LIMITE_DIARIO = 5; // RN13

export interface ConsultaBusca {
  objetivo: string;
  nivel: string;
  restricoes: string[];
  filtroEquipamento: string[] | null;
  termosExcluidos: string[] | null;
  termosProteina: string[] | null;
}
export interface ResultadoBusca {
  exercicios: unknown[];
  alimentos: unknown[];
  trechos: unknown[];
}
export interface IdsParaTexto {
  exercicios: string[];
  alimentos: string[];
  trechos: number[];
}
export interface Textos {
  exercicios: { id: string; nome: string }[];
  alimentos: { id: string | number; nome: string }[];
  trechos: { id: number; conteudo: string }[];
}

export interface Dependencias {
  autenticar: (jwt: string) => Promise<boolean>;
  geracoesHoje: (jwt: string) => Promise<number>;
  buscar: (jwt: string, consulta: ConsultaBusca) => Promise<ResultadoBusca>;
  carregarTextos: (jwt: string, ids: IdsParaTexto) => Promise<Textos>;
  perguntar: (prompt: string) => Promise<unknown>;
}

const CABECALHOS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function responder(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), { status, headers: CABECALHOS });
}

type Objeto = Record<string, unknown>;
const ehObjeto = (v: unknown): v is Objeto =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const ehEnum = (v: unknown, lista: string[]): v is string =>
  typeof v === 'string' && lista.includes(v);
const ehLista = (v: unknown, max: number): v is unknown[] => Array.isArray(v) && v.length <= max;
const listaDeEnum = (v: unknown, lista: string[], max: number): v is string[] =>
  ehLista(v, max) && v.every((i) => ehEnum(i, lista));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERO = /^\d{1,12}$/;

function listaOuNulo(v: unknown): string[] | null | undefined {
  if (v === null || v === undefined) return null;
  const valida =
    ehLista(v, MAX_FILTRO) && v.every((i) => typeof i === 'string' && i.length <= MAX_FILTRO);
  return valida ? (v as string[]) : undefined;
}

function lerConsulta(corpo: Objeto): ConsultaBusca | null {
  const filtroEquipamento = listaOuNulo(corpo.filtroEquipamento);
  const termosExcluidos = listaOuNulo(corpo.termosExcluidos);
  const termosProteina = listaOuNulo(corpo.termosProteina);
  if (
    !ehEnum(corpo.objetivo, OBJETIVOS) ||
    !ehEnum(corpo.nivel, NIVEIS) ||
    !listaDeEnum(corpo.restricoes, RESTRICOES, RESTRICOES.length) ||
    filtroEquipamento === undefined ||
    termosExcluidos === undefined ||
    termosProteina === undefined
  ) {
    return null;
  }
  return {
    objetivo: corpo.objetivo,
    nivel: corpo.nivel,
    restricoes: corpo.restricoes,
    filtroEquipamento,
    termosExcluidos,
    termosProteina,
  };
}

interface PedidoEscolha {
  objetivo: string;
  nivel: string;
  diasPorSemana: number;
  equipamentos: string;
  restricoes: string[];
  refeicoes: string[];
  slots: SlotPrompt[];
  exercicios: { id: string; grupo: string }[];
  alimentos: { id: string; slot: string }[];
  trechos: number[];
  erros: string[];
}

function lerPedidoEscolha(c: Objeto): PedidoEscolha | null {
  const { slots, exercicios, alimentos, trechos, erros } = c;
  if (
    !ehEnum(c.objetivo, OBJETIVOS) ||
    !ehEnum(c.nivel, NIVEIS) ||
    !ehEnum(c.equipamentos, EQUIPAMENTOS) ||
    !listaDeEnum(c.restricoes, RESTRICOES, RESTRICOES.length) ||
    !listaDeEnum(c.refeicoes, REFEICOES, REFEICOES.length) ||
    c.refeicoes.length === 0 ||
    !Number.isInteger(c.diasPorSemana) ||
    (c.diasPorSemana as number) < 1 ||
    (c.diasPorSemana as number) > MAX_DIAS ||
    !ehLista(slots, MAX_DIAS) ||
    slots.length === 0 ||
    !ehLista(exercicios, MAX_EXERCICIOS) ||
    !ehLista(alimentos, MAX_ALIMENTOS) ||
    !ehLista(trechos, MAX_TRECHOS) ||
    !ehLista(erros, MAX_ERROS)
  ) {
    return null;
  }
  const slotsOk = slots.every(
    (s) =>
      ehObjeto(s) &&
      ehLista(s.porGrupo, GRUPOS.length) &&
      s.porGrupo.every(
        (p) =>
          ehObjeto(p) &&
          ehEnum(p.grupo, GRUPOS) &&
          Number.isInteger(p.quantidade) &&
          (p.quantidade as number) >= 0 &&
          (p.quantidade as number) <= 6,
      ),
  );
  const exerciciosOk = exercicios.every(
    (e) => ehObjeto(e) && typeof e.id === 'string' && UUID.test(e.id) && ehEnum(e.grupo, GRUPOS),
  );
  const alimentosOk = alimentos.every(
    (a) => ehObjeto(a) && typeof a.id === 'string' && NUMERO.test(a.id) && ehEnum(a.slot, SLOTS),
  );
  const trechosOk = trechos.every((t) => Number.isInteger(t) && (t as number) > 0);
  const errosOk = erros.every((e) => typeof e === 'string' && e.length <= MAX_TEXTO_ERRO);
  if (!slotsOk || !exerciciosOk || !alimentosOk || !trechosOk || !errosOk) return null;
  if (exercicios.length === 0 || alimentos.length === 0) return null;
  return c as unknown as PedidoEscolha;
}

/** Devolve os apelidos (e1, e2...) da resposta para os IDs reais dos exercícios. */
function desapelidar(bruta: unknown, original: Map<string, string>): unknown {
  if (!ehObjeto(bruta) || !Array.isArray(bruta.dias)) return bruta;
  const dias = bruta.dias.map((dia: unknown) => {
    if (!ehObjeto(dia) || !ehObjeto(dia.exercicios)) return dia;
    const exercicios = Object.fromEntries(
      Object.entries(dia.exercicios).map(([grupo, ids]) => [
        grupo,
        Array.isArray(ids) ? ids.map((id) => original.get(String(id)) ?? id) : ids,
      ]),
    );
    return { ...dia, exercicios };
  });
  return { ...bruta, dias };
}

export function criarHandler(deps: Dependencias) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS });
    if (req.method !== 'POST') return responder(405, { erro: 'Método não permitido' });

    const jwt = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!jwt) return responder(401, { erro: 'Não autenticado' });

    try {
      if (!(await deps.autenticar(jwt))) return responder(401, { erro: 'Não autenticado' });

      let corpo: unknown;
      try {
        corpo = await req.json();
      } catch {
        return responder(400, { erro: 'Corpo inválido' });
      }
      if (!ehObjeto(corpo)) return responder(400, { erro: 'Corpo inválido' });

      // RN13: 5 gerações gravadas por dia. A RPC salvar_plano_gerado confere de novo ao gravar.
      if ((await deps.geracoesHoje(jwt)) >= LIMITE_DIARIO) {
        return responder(429, { erro: 'limite_diario' });
      }

      if (corpo.acao === 'buscar') {
        const consulta = lerConsulta(corpo);
        if (!consulta) return responder(400, { erro: 'Entrada inválida' });
        return responder(200, { ...(await deps.buscar(jwt, consulta)) });
      }

      if (corpo.acao === 'escolher') {
        const pedido = lerPedidoEscolha(corpo);
        if (!pedido) return responder(400, { erro: 'Entrada inválida' });
        const textos = await deps.carregarTextos(jwt, {
          exercicios: pedido.exercicios.map((e) => e.id),
          alimentos: pedido.alimentos.map((a) => a.id),
          trechos: pedido.trechos,
        });
        const nomeExercicio = new Map(textos.exercicios.map((e) => [e.id, e.nome]));
        const nomeAlimento = new Map(textos.alimentos.map((a) => [String(a.id), a.nome]));
        // ID que não está no banco não entra no prompt (nem na resposta).
        const exercicios = pedido.exercicios.flatMap((e) =>
          nomeExercicio.has(e.id) ? [{ ...e, nome: nomeExercicio.get(e.id) ?? '' }] : [],
        );
        const alimentos = pedido.alimentos.flatMap((a) =>
          nomeAlimento.has(a.id) ? [{ ...a, nome: nomeAlimento.get(a.id) ?? '' }] : [],
        );
        if (exercicios.length === 0 || alimentos.length === 0) {
          return responder(400, { erro: 'Entrada inválida' });
        }
        const { apelidados, original } = apelidar(exercicios);
        const prompt = montarPrompt(
          {
            objetivo: pedido.objetivo,
            nivel: pedido.nivel,
            diasPorSemana: pedido.diasPorSemana,
            equipamentos: pedido.equipamentos,
            restricoes: pedido.restricoes,
            diretrizes: textos.trechos.map((t) => t.conteudo),
          },
          pedido.slots,
          apelidados,
          alimentos,
          pedido.refeicoes,
          pedido.erros,
        );
        const bruta = await deps.perguntar(prompt);
        return responder(200, { escolha: desapelidar(bruta, original) });
      }

      return responder(400, { erro: 'Ação desconhecida' });
    } catch (erro) {
      console.error('gerar-plano falhou:', erro);
      if (erro instanceof ServicoOcupado) return responder(503, { erro: 'servico_ocupado' });
      return responder(500, { erro: 'servico_fora' });
    }
  };
}
