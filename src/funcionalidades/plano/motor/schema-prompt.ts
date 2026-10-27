// ============================================================
// MOTOR: JSON Schema restrito e prompt (RN07, RN12)
// ============================================================
// Schema restrito: cada campo só aceita IDs de um `enum`, e o
// Ollama (`format` = schema) não consegue inventar exercício
// nem alimento. O prompt recebe só o ContextoPrompt, montado
// campo a campo: nome, e-mail e ID nunca entram.
// ============================================================

import type {
  AlimentoCandidato,
  ContextoPrompt,
  ExercicioCandidato,
  NomeRefeicao,
  SlotAlimento,
  SlotDia,
} from './tipos';

export const REFEICOES: NomeRefeicao[] = ['cafe', 'almoco', 'lanche', 'jantar'];
export const SLOTS: SlotAlimento[] = ['proteina', 'carboidrato', 'complemento'];

type Schema = Record<string, unknown>;

// Caracteres de cada diretriz no prompt; o texto inteiro continua nos fundamentos.
const LIMITE_DIRETRIZ = 300;

function enumIds(ids: string[]): Schema {
  // `enum` vazio é inválido em JSON Schema: falta de candidato é erro do chamador.
  if (ids.length === 0) throw new Error('Sem candidatos para um grupo ou slot.');
  return { type: 'string', enum: ids };
}

export function montarSchemaEscolha(
  dias: SlotDia[],
  exercicios: ExercicioCandidato[],
  alimentos: AlimentoCandidato[],
): Schema {
  const itensDias = dias.map((dia) => {
    const propriedades: Record<string, Schema> = {};
    for (const { grupo, quantidade } of dia.porGrupo) {
      if (quantidade === 0) continue;
      const ids = exercicios.filter((e) => e.grupo === grupo).map((e) => e.id);
      // Não dá para pedir mais IDs distintos do que existem.
      const n = Math.min(quantidade, ids.length);
      propriedades[grupo] = {
        type: 'array',
        items: enumIds(ids),
        minItems: n,
        maxItems: n,
        uniqueItems: true,
      };
    }
    return {
      type: 'object',
      properties: { exercicios: { type: 'object', properties: propriedades, required: Object.keys(propriedades), additionalProperties: false } },
      required: ['exercicios'],
      additionalProperties: false,
    };
  });

  const slotsSchema: Record<string, Schema> = {};
  for (const slot of SLOTS) {
    slotsSchema[slot] = enumIds(alimentos.filter((a) => a.slot === slot).map((a) => a.id));
  }
  const refeicao = { type: 'object', properties: slotsSchema, required: SLOTS, additionalProperties: false };

  return {
    type: 'object',
    properties: {
      dias: { type: 'array', prefixItems: itensDias, minItems: dias.length, maxItems: dias.length },
      refeicoes: {
        type: 'object',
        properties: Object.fromEntries(REFEICOES.map((r) => [r, refeicao])),
        required: REFEICOES,
        additionalProperties: false,
      },
    },
    required: ['dias', 'refeicoes'],
    additionalProperties: false,
  };
}

/** Extrai só os campos permitidos (RN12), mesmo que receba o perfil inteiro. */
export function montarContextoPrompt(origem: ContextoPrompt): ContextoPrompt {
  return {
    objetivo: origem.objetivo,
    nivel: origem.nivel,
    diasPorSemana: origem.diasPorSemana,
    equipamentos: origem.equipamentos,
    restricoes: [...origem.restricoes],
    diretrizes: [...origem.diretrizes],
  };
}

export function montarPrompt(
  origem: ContextoPrompt,
  exercicios: ExercicioCandidato[],
  alimentos: AlimentoCandidato[],
  errosAnteriores: string[] = [],
): string {
  const c = montarContextoPrompt(origem);
  // Prompt enxuto (etapa 13b): candidatos agrupados, um "id nome" por item, e
  // diretrizes cortadas. Menos tokens = geração mais rápida no Mac de 8 GB.
  const agrupar = <T,>(itens: T[], chave: (i: T) => string, linha: (i: T) => string) =>
    [...new Set(itens.map(chave))].map((k) => `${k}: ${itens.filter((i) => chave(i) === k).map(linha).join('; ')}`);
  const linhas = [
    'Monte um plano de treino e dieta escolhendo apenas IDs das listas.',
    `Objetivo: ${c.objetivo}. Nível: ${c.nivel}. Dias por semana: ${c.diasPorSemana}.`,
    `Equipamentos: ${c.equipamentos}. Restrições alimentares: ${c.restricoes.join(', ') || 'nenhuma'}.`,
    'Diretrizes:',
    ...c.diretrizes.map((d) => `- ${d.length > LIMITE_DIRETRIZ ? `${d.slice(0, LIMITE_DIRETRIZ)}…` : d}`),
    'Exercícios por grupo (id nome):',
    ...agrupar(exercicios, (e) => e.grupo, (e) => `${e.id} ${e.nome}`),
    'Alimentos por slot (id nome):',
    ...agrupar(alimentos, (a) => a.slot, (a) => `${a.id} ${a.nome}`),
    'Responda só o JSON no formato pedido. Varie os exercícios entre os dias.',
  ];
  if (errosAnteriores.length > 0) {
    linhas.push('A resposta anterior foi recusada por:', ...errosAnteriores.map((e) => `- ${e}`));
  }
  return linhas.join('\n');
}
