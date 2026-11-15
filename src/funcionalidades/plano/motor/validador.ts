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
  PapelExercicio,
  GrupoMuscular,
  RestricaoAlimentar,
} from '@/compartilhado/tipos';
import {
  calcularGramas,
  conferirTolerancia,
  metaDaRefeicao,
  somarMacros,
  TOLERANCIA,
} from './gramas';
import { ordenarSessao } from './prescricao';
import { REFEICOES, SLOTS } from './schema-prompt';
import type {
  AlimentoCandidato,
  EscolhaLLM,
  ExercicioCandidato,
  MetaDia,
  NomeRefeicao,
  Prescricao,
  PrescreverPorPapel,
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
  /** Refeições do dia (3 a 6); sem ele, as 4 padrão. */
  refeicoes?: NomeRefeicao[];
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
  for (const refeicao of restricoes.refeicoes ?? REFEICOES) {
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
  dias: {
    nome: string;
    exercicios: (ExercicioCandidato &
      Prescricao & { papel: PapelExercicio; repeticoesReserva?: number })[];
  }[];
  refeicoes: { refeicao: NomeRefeicao; itens: { alimento: AlimentoCandidato; gramas: number }[] }[];
  totalDia: MetaDia;
}

/** Maior desvio relativo entre os macros da refeição (com as gramas já calculadas) e a meta. */
function desvioDaRefeicao(itens: AlimentoCandidato[], meta: MetaDia): number {
  const gramas = calcularGramas(itens, meta);
  const total = somarMacros(itens.map((alimento, i) => ({ alimento, gramas: gramas[i] })));
  return Math.max(
    ...(Object.keys(meta) as (keyof MetaDia)[]).map((k) => Math.abs(total[k] - meta[k]) / meta[k]),
  );
}

/**
 * Refeição que fecha a meta trocando o mínimo de alimentos da escolha da LLM por candidatos
 * do mesmo slot (os candidatos já respeitam as restrições). Se nenhuma combinação fecha,
 * devolve a de menor desvio; quem decide se o dia passa é a tolerância do dia.
 */
function trocarParaFechar(
  escolhidos: AlimentoCandidato[],
  alimentos: AlimentoCandidato[],
  meta: MetaDia,
): AlimentoCandidato[] {
  let melhor = { itens: escolhidos, trocas: 0, desvio: desvioDaRefeicao(escolhidos, meta) };
  if (melhor.desvio <= TOLERANCIA || escolhidos.length !== SLOTS.length) return escolhidos;
  const [proteinas, carboidratos, complementos] = SLOTS.map((s) =>
    alimentos.filter((a) => a.slot === s),
  );
  for (const proteina of proteinas) {
    for (const carboidrato of carboidratos) {
      for (const complemento of complementos) {
        const itens = [proteina, carboidrato, complemento];
        const trocas = itens.filter((a, i) => a.id !== escolhidos[i].id).length;
        const desvio = desvioDaRefeicao(itens, meta);
        const fecha = desvio <= TOLERANCIA;
        const melhorFecha = melhor.desvio <= TOLERANCIA;
        const ganha = fecha
          ? !melhorFecha ||
            trocas < melhor.trocas ||
            (trocas === melhor.trocas && desvio < melhor.desvio)
          : !melhorFecha && desvio < melhor.desvio;
        if (ganha) melhor = { itens, trocas, desvio };
      }
    }
  }
  return melhor.itens;
}

/**
 * Monta o plano de uma escolha já validada. Se as gramas não fecham ±5%, troca alimentos
 * entre os candidatos; devolve erros só quando nem assim o dia fecha.
 */
export function montarPlano(
  escolha: EscolhaLLM,
  slots: SlotDia[],
  exercicios: ExercicioCandidato[],
  alimentos: AlimentoCandidato[],
  prescricao: Prescricao | PrescreverPorPapel,
  meta: MetaDia,
  refeicoesDoDia: NomeRefeicao[] = REFEICOES,
): { erros: string[]; plano?: PlanoMontado } {
  const exercicioPorId = new Map(exercicios.map((e) => [e.id, e]));
  const alimentoPorId = new Map(alimentos.map((a) => [a.id, a]));

  const dias = slots.map((slot, d) => {
    const lista = slot.porGrupo.flatMap(({ grupo }) =>
      (escolha.dias[d].exercicios[grupo] ?? []).flatMap((id) => exercicioPorId.get(id) ?? []),
    );
    // Principais → acessórios → isolados (RN19); a prescrição sai do papel de cada um.
    return {
      nome: slot.nome,
      exercicios: ordenarSessao(lista).map((e) => ({
        ...e,
        ...(typeof prescricao === 'function' ? prescricao(e.papel) : prescricao),
      })),
    };
  });

  const montarRefeicoes = (ajustar: boolean) =>
    refeicoesDoDia.map((refeicao) => {
      const metaRefeicao = metaDaRefeicao(meta, refeicao, refeicoesDoDia);
      let escolhidos = SLOTS.map((s: SlotAlimento) =>
        alimentoPorId.get(escolha.refeicoes[refeicao]?.[s] ?? ''),
      ).filter((a): a is AlimentoCandidato => a !== undefined);
      if (ajustar) escolhidos = trocarParaFechar(escolhidos, alimentos, metaRefeicao);
      const gramas = calcularGramas(escolhidos, metaRefeicao);
      return {
        refeicao,
        itens: escolhidos.map((alimento, i) => ({ alimento, gramas: gramas[i] })),
      };
    });

  // A LLM escolhe sem ver os macros: quando o dia não fecha, o código troca o mínimo de
  // alimentos pelos candidatos do mesmo slot antes de recusar (etapa 20).
  let refeicoes = montarRefeicoes(false);
  if (conferirTolerancia(somarMacros(refeicoes.flatMap((r) => r.itens)), meta).length > 0) {
    refeicoes = montarRefeicoes(true);
  }
  const totalDia = somarMacros(refeicoes.flatMap((r) => r.itens));
  const erros = conferirTolerancia(totalDia, meta);
  return erros.length > 0 ? { erros } : { erros, plano: { dias, refeicoes, totalDia } };
}
