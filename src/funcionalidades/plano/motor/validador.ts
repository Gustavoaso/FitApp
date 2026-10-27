// ============================================================
// MOTOR: validador da escolha da LLM e montagem (RN07, RN09, RN10)
// ============================================================
// A resposta da LLM chega como `unknown`: o validador confere
// formato, IDs, grupo, equipamento, restrições e grupos em dias
// seguidos. Só com zero erros a escolha vira plano (ordem,
// séries e gramas por código). Os erros voltam no retry.
// ============================================================

import type {
  EquipamentosDisponiveis,
  GrupoMuscular,
  RestricaoAlimentar,
} from '@/compartilhado/tipos';
import { calcularGramas, conferirTolerancia, metaDaRefeicao, somarMacros } from './gramas';
import { REFEICOES, SLOTS } from './schema-prompt';
import type {
  AlimentoCandidato,
  EscolhaLLM,
  ExercicioCandidato,
  MetaDia,
  NomeRefeicao,
  Prescricao,
  SlotAlimento,
  SlotDia,
} from './tipos';

export const EQUIPAMENTOS_PERMITIDOS: Record<EquipamentosDisponiveis, EquipamentosDisponiveis[]> = {
  academia_completa: ['academia_completa', 'home_gym', 'peso_corporal'],
  home_gym: ['home_gym', 'peso_corporal'],
  peso_corporal: ['peso_corporal'],
};

export interface Restricoes {
  equipamentos: EquipamentosDisponiveis;
  restricoesAlimentares: RestricaoAlimentar[];
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ehListaDeTexto(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/** Valida e estreita o tipo. `escolha` só é devolvida quando não há erros. */
export function validarEscolha(
  bruta: unknown,
  slots: SlotDia[],
  exercicios: ExercicioCandidato[],
  alimentos: AlimentoCandidato[],
  restricoes: Restricoes,
): { erros: string[]; escolha?: EscolhaLLM } {
  const erros: string[] = [];
  if (!ehObjeto(bruta) || !Array.isArray(bruta.dias) || !ehObjeto(bruta.refeicoes)) {
    return { erros: ['Resposta fora do formato: faltam "dias" ou "refeicoes".'] };
  }
  // Cópia tipada: o estreitamento de `bruta.dias` não sobrevive dentro do forEach.
  const diasBrutos: unknown[] = bruta.dias;
  if (diasBrutos.length !== slots.length) {
    erros.push(`Esperados ${slots.length} dias, vieram ${diasBrutos.length}.`);
  }

  const exercicioPorId = new Map(exercicios.map((e) => [e.id, e]));
  const permitidos = EQUIPAMENTOS_PERMITIDOS[restricoes.equipamentos] ?? [];
  const gruposPorDia: Set<GrupoMuscular>[] = [];

  slots.forEach((slot, d) => {
    const dia: unknown = diasBrutos[d];
    const escolhidos = ehObjeto(dia) && ehObjeto(dia.exercicios) ? dia.exercicios : {};
    const grupos = new Set<GrupoMuscular>();
    for (const { grupo, quantidade } of slot.porGrupo) {
      const ids = escolhidos[grupo];
      const esperado = Math.min(quantidade, exercicios.filter((e) => e.grupo === grupo).length);
      if (!ehListaDeTexto(ids) || ids.length !== esperado) {
        erros.push(`Dia ${d + 1}: ${grupo} precisa de ${esperado} exercício(s).`);
        continue;
      }
      if (new Set(ids).size !== ids.length)
        erros.push(`Dia ${d + 1}: exercício repetido em ${grupo}.`);
      for (const id of ids) {
        const ex = exercicioPorId.get(id);
        if (!ex) erros.push(`Dia ${d + 1}: exercício ${id} não existe na base.`);
        else if (ex.grupo !== grupo) erros.push(`Dia ${d + 1}: ${id} não é de ${grupo}.`);
        else if (!permitidos.includes(ex.equipamento)) {
          erros.push(`Dia ${d + 1}: ${id} exige equipamento indisponível.`);
        } else grupos.add(ex.grupo);
      }
    }
    gruposPorDia.push(grupos);
  });

  // A semana se repete: o último dia também encosta no primeiro.
  for (let d = 0; d < gruposPorDia.length && gruposPorDia.length > 1; d++) {
    const proximo = gruposPorDia[(d + 1) % gruposPorDia.length];
    for (const g of gruposPorDia[d]) {
      if (proximo.has(g))
        erros.push(
          `Grupo ${g} em dias seguidos (${d + 1} e ${((d + 1) % gruposPorDia.length) + 1}).`,
        );
    }
  }

  const alimentoPorId = new Map(alimentos.map((a) => [a.id, a]));
  const exigidas = restricoes.restricoesAlimentares.filter((r) => r !== 'nenhuma');
  for (const refeicao of REFEICOES) {
    const r: unknown = bruta.refeicoes[refeicao];
    for (const slot of SLOTS) {
      const id = ehObjeto(r) ? r[slot] : undefined;
      const alimento = typeof id === 'string' ? alimentoPorId.get(id) : undefined;
      if (!alimento) erros.push(`${refeicao}: ${slot} ausente ou fora da base.`);
      else if (alimento.slot !== slot) erros.push(`${refeicao}: ${alimento.id} não é ${slot}.`);
      else if (!exigidas.every((x) => alimento.restricoesAtendidas.includes(x))) {
        erros.push(`${refeicao}: ${alimento.id} não respeita as restrições alimentares.`);
      }
    }
  }

  return erros.length > 0 ? { erros } : { erros, escolha: bruta as unknown as EscolhaLLM };
}

export interface PlanoMontado {
  dias: { nome: string; exercicios: (ExercicioCandidato & Prescricao)[] }[];
  refeicoes: { refeicao: NomeRefeicao; itens: { alimento: AlimentoCandidato; gramas: number }[] }[];
  totalDia: MetaDia;
}

/** Monta o plano de uma escolha já validada; devolve erros se as gramas não fecham ±5%. */
export function montarPlano(
  escolha: EscolhaLLM,
  slots: SlotDia[],
  exercicios: ExercicioCandidato[],
  alimentos: AlimentoCandidato[],
  prescricao: Prescricao,
  meta: MetaDia,
): { erros: string[]; plano?: PlanoMontado } {
  const exercicioPorId = new Map(exercicios.map((e) => [e.id, e]));
  const alimentoPorId = new Map(alimentos.map((a) => [a.id, a]));

  const dias = slots.map((slot, d) => {
    const lista = slot.porGrupo.flatMap(({ grupo }) =>
      (escolha.dias[d].exercicios[grupo] ?? []).flatMap((id) => exercicioPorId.get(id) ?? []),
    );
    // Compostos primeiro; sort é estável, então a ordem dos grupos se mantém.
    lista.sort((a, b) => Number(b.composto) - Number(a.composto));
    return { nome: slot.nome, exercicios: lista.map((e) => ({ ...e, ...prescricao })) };
  });

  const refeicoes = REFEICOES.map((refeicao) => {
    const escolhidos = SLOTS.map((s: SlotAlimento) =>
      alimentoPorId.get(escolha.refeicoes[refeicao][s]),
    ).filter((a): a is AlimentoCandidato => a !== undefined);
    const gramas = calcularGramas(escolhidos, metaDaRefeicao(meta, refeicao));
    return { refeicao, itens: escolhidos.map((alimento, i) => ({ alimento, gramas: gramas[i] })) };
  });

  const totalDia = somarMacros(refeicoes.flatMap((r) => r.itens));
  const erros = conferirTolerancia(totalDia, meta);
  return erros.length > 0 ? { erros } : { erros, plano: { dias, refeicoes, totalDia } };
}
