// ============================================================
// VALIDADOR DE SCHEMA DO PLANO GERADO PELA IA
// ============================================================
// Valida a resposta da IA antes de aceitar e persistir.
// Checa estrutura JSON, IDs reais, contagens, macros e
// restrições alimentares.
// ============================================================

import type { ContextoRAG } from './seletor-rag.ts';

/** Resultado da validação */
export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}

/** Parâmetros esperados do plano */
interface ParametrosValidacao {
  frequenciaSemanal: number;
  numRefeicoes: number;
  caloriasAlvo: number;
  proteinasAlvo: number;
  carboidratosAlvo: number;
  gordurasAlvo: number;
  restricoesAlimentares: string[];
  contextoRag: ContextoRAG;
}

/**
 * Valida o plano gerado pela IA contra os parâmetros esperados
 * e o contexto RAG (IDs reais da base).
 */
export function validarPlanoGerado(
  plano: any,
  params: ParametrosValidacao
): ResultadoValidacao {
  const erros: string[] = [];

  // 1. Estrutura básica
  if (!plano || typeof plano !== 'object') {
    return { valido: false, erros: ['Resposta não é um objeto JSON válido'] };
  }

  if (!plano.treino || !plano.dieta) {
    return { valido: false, erros: ['Faltam campos obrigatórios: treino e/ou dieta'] };
  }

  // 2. Validar treino
  validarTreino(plano.treino, params, erros);

  // 3. Validar dieta
  validarDieta(plano.dieta, params, erros);

  return { valido: erros.length === 0, erros };
}

// ──────────────────────────────────────────────
// VALIDAÇÃO DE TREINO
// ──────────────────────────────────────────────

function validarTreino(
  treino: any,
  params: ParametrosValidacao,
  erros: string[]
): void {
  if (!treino.dias || !Array.isArray(treino.dias)) {
    erros.push('treino.dias deve ser um array');
    return;
  }

  // 7 dias obrigatórios
  if (treino.dias.length !== 7) {
    erros.push(`treino deve ter exatamente 7 dias, recebeu ${treino.dias.length}`);
  }

  // Contagem de dias de treino vs descanso
  const diasTreino = treino.dias.filter((d: any) => d.tipo === 'treino');
  if (diasTreino.length !== params.frequenciaSemanal) {
    erros.push(
      `Esperado ${params.frequenciaSemanal} dias de treino, recebeu ${diasTreino.length}`
    );
  }

  // IDs de exercícios e duplicatas por dia
  const idsExerciciosValidos = new Set(
    params.contextoRag.exercicios.map((e) => e.id)
  );

  for (const dia of treino.dias) {
    if (dia.tipo === 'descanso') continue;
    if (!dia.exercicios || !Array.isArray(dia.exercicios)) {
      erros.push(`Dia ${dia.diaSemana}: exercicios deve ser um array`);
      continue;
    }

    const idsNoDia = new Set<string>();
    for (const ex of dia.exercicios) {
      // Checar ID existe na base
      if (!ex.exercicioId) {
        erros.push(`Dia ${dia.diaSemana}: exercício "${ex.nome}" sem exercicioId`);
      } else if (!idsExerciciosValidos.has(ex.exercicioId)) {
        erros.push(
          `Dia ${dia.diaSemana}: exercicioId "${ex.exercicioId}" não existe na base`
        );
      }

      // Checar duplicata
      if (ex.exercicioId && idsNoDia.has(ex.exercicioId)) {
        erros.push(
          `Dia ${dia.diaSemana}: exercício "${ex.nome}" duplicado no mesmo dia`
        );
      }
      idsNoDia.add(ex.exercicioId);
    }
  }
}

// ──────────────────────────────────────────────
// VALIDAÇÃO DE DIETA
// ──────────────────────────────────────────────

function validarDieta(
  dieta: any,
  params: ParametrosValidacao,
  erros: string[]
): void {
  if (!dieta.refeicoes || !Array.isArray(dieta.refeicoes)) {
    erros.push('dieta.refeicoes deve ser um array');
    return;
  }

  if (dieta.refeicoes.length !== params.numRefeicoes) {
    erros.push(
      `Dieta: esperado ${params.numRefeicoes} refeições, recebeu ${dieta.refeicoes.length}`
    );
  }

  const idsAlimentosValidos = new Set(
    params.contextoRag.alimentos.map((a) => a.id)
  );

  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarboidratos = 0;
  let totalGorduras = 0;

  for (const refeicao of dieta.refeicoes) {
    if (!refeicao.alimentos || !Array.isArray(refeicao.alimentos)) {
      erros.push(`Refeição "${refeicao.nome}": alimentos deve ser um array`);
      continue;
    }

    for (const alimento of refeicao.alimentos) {
      if (!alimento.alimentoId) {
        erros.push(
          `Refeição "${refeicao.nome}": alimento "${alimento.nome}" sem alimentoId`
        );
      } else if (!idsAlimentosValidos.has(alimento.alimentoId)) {
        erros.push(
          `Refeição "${refeicao.nome}": alimentoId "${alimento.alimentoId}" não existe na base`
        );
      }

      if (!alimento.porcao) {
        erros.push(
          `Refeição "${refeicao.nome}": alimento "${alimento.nome}" sem descrição de porção (ex: "150g")`
        );
      }

      totalCalorias += Number(alimento.calorias || 0);
      totalProteinas += Number(alimento.proteinas || 0);
      totalCarboidratos += Number(alimento.carboidratos || 0);
      totalGorduras += Number(alimento.gorduras || 0);
    }
  }

  // Validar totais diários contra as metas
  const calMin = params.caloriasAlvo * 0.92;
  const calMax = params.caloriasAlvo * 1.08;
  if (totalCalorias < calMin || totalCalorias > calMax) {
    erros.push(
      `Dieta: calorias totais (${Math.round(totalCalorias)} kcal) fora da faixa ${Math.round(calMin)}-${Math.round(calMax)} kcal`
    );
  }

  const protMin = params.proteinasAlvo * 0.88;
  const protMax = params.proteinasAlvo * 1.12;
  if (totalProteinas < protMin || totalProteinas > protMax) {
    erros.push(
      `Dieta: proteínas totais (${Math.round(totalProteinas)}g) fora da faixa ${Math.round(protMin)}-${Math.round(protMax)}g`
    );
  }

  const carbMin = params.carboidratosAlvo * 0.82;
  const carbMax = params.carboidratosAlvo * 1.18;
  if (totalCarboidratos < carbMin || totalCarboidratos > carbMax) {
    erros.push(
      `Dieta: carboidratos totais (${Math.round(totalCarboidratos)}g) fora da faixa ${Math.round(carbMin)}-${Math.round(carbMax)}g`
    );
  }

  const gordMin = params.gordurasAlvo * 0.82;
  const gordMax = params.gordurasAlvo * 1.18;
  if (totalGorduras < gordMin || totalGorduras > gordMax) {
    erros.push(
      `Dieta: gorduras totais (${Math.round(totalGorduras)}g) fora da faixa ${Math.round(gordMin)}-${Math.round(gordMax)}g`
    );
  }
}

/**
 * Gera mensagem de correção pra enviar à IA no retry.
 */
export function gerarMensagemCorrecao(resultado: ResultadoValidacao): string {
  return `O plano gerado tem os seguintes erros que precisam ser corrigidos:

${resultado.erros.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Corrija TODOS os erros acima e gere o plano novamente no mesmo formato JSON. Lembre-se:
- Use APENAS IDs da lista RAG fornecida.
- Macros e calorias devem estar dentro das tolerâncias especificadas.
- O plano deve ter exatamente 7 dias.`;
}
