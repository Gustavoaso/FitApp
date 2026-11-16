// ============================================================
// EDGE FUNCTION: gerar-plano (prompt)
// ============================================================
// Monta o prompt da LLM (RN07, RN12). Recebe só campos já validados:
// o texto livre vem do banco (nomes, diretrizes), nunca do cliente, e o
// prompt nunca leva nome, e-mail nem ID do usuário. Como o llama-3.3 da
// Groq não aceita `json_schema`, o formato vai descrito no próprio prompt
// e o app valida a resposta (validarEscolha) com 1 retry.
// ============================================================

export interface ExercicioPrompt {
  id: string;
  nome: string;
  grupo: string;
}
export interface AlimentoPrompt {
  id: string;
  nome: string;
  slot: string;
}
export interface SlotPrompt {
  porGrupo: { grupo: string; quantidade: number }[];
}
export interface ContextoPrompt {
  objetivo: string;
  nivel: string;
  diasPorSemana: number;
  equipamentos: string;
  restricoes: string[];
  diretrizes: string[];
}

// Caracteres de cada diretriz no prompt; o texto inteiro continua nos fundamentos.
const LIMITE_DIRETRIZ = 300;
const SLOTS = ['proteina', 'carboidrato', 'complemento'];

/** Troca os UUIDs por apelidos curtos (e1, e2...): bem menos tokens no prompt e na resposta. */
export function apelidar(exercicios: ExercicioPrompt[]) {
  const original = new Map(exercicios.map((e, i) => [`e${i + 1}`, e.id]));
  return { apelidados: exercicios.map((e, i) => ({ ...e, id: `e${i + 1}` })), original };
}

function agrupar<T>(itens: T[], chave: (i: T) => string, linha: (i: T) => string): string[] {
  return [...new Set(itens.map(chave))].map(
    (k) =>
      `${k}: ${itens
        .filter((i) => chave(i) === k)
        .map(linha)
        .join('; ')}`,
  );
}

export function montarPrompt(
  c: ContextoPrompt,
  slots: SlotPrompt[],
  exercicios: ExercicioPrompt[],
  alimentos: AlimentoPrompt[],
  refeicoes: string[],
  errosAnteriores: string[] = [],
): string {
  // Não dá para pedir mais IDs distintos do que existem no grupo.
  const dias = slots.map(
    (s, i) =>
      `Dia ${i + 1}: ${s.porGrupo
        .filter((p) => p.quantidade > 0)
        .map(
          (p) =>
            `${p.grupo} ${Math.min(p.quantidade, exercicios.filter((e) => e.grupo === p.grupo).length)}`,
        )
        .join(', ')}.`,
  );
  const formato = JSON.stringify({
    dias: [{ exercicios: { grupo: ['id'] } }],
    refeicoes: Object.fromEntries(
      refeicoes.map((r) => [r, Object.fromEntries(SLOTS.map((s) => [s, 'id']))]),
    ),
  });
  const linhasPrompt = [
    'Monte um plano de treino e dieta escolhendo apenas IDs das listas.',
    `Objetivo: ${c.objetivo}. Nível: ${c.nivel}. Dias por semana: ${c.diasPorSemana}.`,
    `Equipamentos: ${c.equipamentos}. Restrições alimentares: ${c.restricoes.join(', ') || 'nenhuma'}.`,
    'Diretrizes:',
    ...c.diretrizes.map(
      (d) => `- ${d.length > LIMITE_DIRETRIZ ? `${d.slice(0, LIMITE_DIRETRIZ)}…` : d}`,
    ),
    'Exercícios por grupo (id nome):',
    ...agrupar(
      exercicios,
      (e) => e.grupo,
      (e) => `${e.id} ${e.nome}`,
    ),
    'Alimentos por slot (id nome):',
    ...agrupar(
      alimentos,
      (a) => a.slot,
      (a) => `${a.id} ${a.nome}`,
    ),
    'Exercícios por dia (quantidade de IDs distintos em cada grupo):',
    ...dias,
    `Responda só um objeto JSON, com "dias" na ordem dos dias e uma entrada para cada refeição (${refeicoes.join(', ')}). Formato: ${formato}`,
    'Varie os exercícios entre os dias.',
  ];
  if (errosAnteriores.length > 0) {
    linhasPrompt.push(
      'A resposta anterior foi recusada por:',
      ...errosAnteriores.map((e) => `- ${e}`),
    );
  }
  return linhasPrompt.join('\n');
}
