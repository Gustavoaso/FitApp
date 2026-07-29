// ============================================================
// SERVIÇO: Validador de Plano Gerado pela IA
// (servicos/validadorPlanoIA.ts)
// ============================================================
// Valida a estrutura e os valores do JSON retornado pelo Gemini.
// Garante que o plano está completo e dentro de faixas razoáveis
// antes de persistir no banco ou exibir ao usuário.
//
// CONCEITOS:
// - Type Guard: função que verifica se um valor tem o formato
//   esperado em runtime (TypeScript só valida em compile time)
// - Faixa de sanidade: valores mínimos/máximos que fazem sentido
//   no domínio (ex: calorias entre 1000 e 6000)
// ============================================================

import type { PlanoIAGerado } from '@fitapp/tipos';

/** Resultado da validação: se é válido e lista de erros encontrados */
export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}

/**
 * Valida o plano completo gerado pela IA.
 * Retorna { valido: true, erros: [] } se tudo estiver correto,
 * ou { valido: false, erros: ['...'] } com a lista de problemas.
 */
export function validarPlanoIA(plano: unknown): ResultadoValidacao {
  const erros: string[] = [];

  // 1. Verifica se é um objeto
  if (!plano || typeof plano !== 'object') {
    return { valido: false, erros: ['Resposta da IA não é um objeto JSON válido.'] };
  }

  const p = plano as Record<string, unknown>;

  // 2. Verifica campos obrigatórios de primeiro nível
  if (!p.resumo) erros.push('Campo "resumo" ausente.');
  if (!p.treino) erros.push('Campo "treino" ausente.');
  if (!p.dieta) erros.push('Campo "dieta" ausente.');

  // Se campos essenciais faltam, não tem como validar o resto
  if (erros.length > 0) {
    return { valido: false, erros };
  }

  // 3. Valida o resumo nutricional
  validarResumo(p.resumo as Record<string, unknown>, erros);

  // 4. Valida o plano de treino
  validarTreino(p.treino as Record<string, unknown>, erros);

  // 5. Valida o plano alimentar
  validarDieta(p.dieta as Record<string, unknown>, erros);

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Valida a seção "resumo" do plano.
 * Verifica se TMB, TDEE, calorias e macros estão em faixas razoáveis.
 */
function validarResumo(resumo: Record<string, unknown>, erros: string[]): void {
  if (typeof resumo !== 'object' || !resumo) {
    erros.push('Resumo não é um objeto válido.');
    return;
  }

  // TMB: Taxa Metabólica Basal — normalmente entre 800 e 3500 kcal
  const tmb = Number(resumo.tmb);
  if (isNaN(tmb) || tmb < 800 || tmb > 3500) {
    erros.push(`TMB fora da faixa razoável (800-3500): ${tmb}`);
  }

  // Calorias alvo: entre 1000 e 6000 kcal
  const caloriasAlvo = Number(resumo.caloriasAlvo);
  if (isNaN(caloriasAlvo) || caloriasAlvo < 1000 || caloriasAlvo > 6000) {
    erros.push(`Calorias alvo fora da faixa (1000-6000): ${caloriasAlvo}`);
  }

  // Macros
  const macros = resumo.macros as Record<string, unknown> | undefined;
  if (!macros || typeof macros !== 'object') {
    erros.push('Macros ausentes ou inválidos no resumo.');
  } else {
    const proteinas = Number(macros.proteinas);
    const carboidratos = Number(macros.carboidratos);
    const gorduras = Number(macros.gorduras);

    if (isNaN(proteinas) || proteinas < 30 || proteinas > 400) {
      erros.push(`Proteínas fora da faixa (30-400g): ${proteinas}`);
    }
    if (isNaN(carboidratos) || carboidratos < 20 || carboidratos > 800) {
      erros.push(`Carboidratos fora da faixa (20-800g): ${carboidratos}`);
    }
    if (isNaN(gorduras) || gorduras < 15 || gorduras > 300) {
      erros.push(`Gorduras fora da faixa (15-300g): ${gorduras}`);
    }
  }

  // Água: entre 1000ml e 6000ml
  const agua = Number(resumo.metaAguaMl);
  if (isNaN(agua) || agua < 1000 || agua > 6000) {
    erros.push(`Meta de água fora da faixa (1000-6000ml): ${agua}`);
  }
}

/**
 * Valida a seção "treino" do plano.
 * Verifica se tem dias, exercícios com séries/repetições válidas.
 */
function validarTreino(treino: Record<string, unknown>, erros: string[]): void {
  if (typeof treino !== 'object' || !treino) {
    erros.push('Treino não é um objeto válido.');
    return;
  }

  if (typeof treino.nomeDivisao !== 'string' || !treino.nomeDivisao) {
    erros.push('Nome da divisão de treino ausente.');
  }

  const dias = treino.dias;
  if (!Array.isArray(dias) || dias.length === 0) {
    erros.push('Treino sem dias de treino definidos.');
    return;
  }

  if (dias.length > 7) {
    erros.push(`Treino com mais de 7 dias: ${dias.length}`);
  }

  dias.forEach((dia: Record<string, unknown>, indice: number) => {
    if (typeof dia !== 'object' || !dia) {
      erros.push(`Dia de treino ${indice + 1} inválido.`);
      return;
    }

    if (typeof dia.nome !== 'string' || !dia.nome) {
      erros.push(`Dia ${indice + 1}: nome ausente.`);
    }

    const exercicios = dia.exercicios;
    if (!Array.isArray(exercicios) || exercicios.length === 0) {
      erros.push(`Dia ${indice + 1} (${dia.nome}): sem exercícios.`);
      return;
    }

    exercicios.forEach((ex: Record<string, unknown>, iEx: number) => {
      if (typeof ex.nome !== 'string' || !ex.nome) {
        erros.push(`Dia ${indice + 1}, exercício ${iEx + 1}: nome ausente.`);
      }

      const series = Number(ex.series);
      if (isNaN(series) || series < 1 || series > 10) {
        erros.push(`Dia ${indice + 1}, "${ex.nome}": séries fora da faixa (1-10): ${series}`);
      }

      const reps = Number(ex.repeticoes);
      if (isNaN(reps) || reps < 1 || reps > 100) {
        erros.push(`Dia ${indice + 1}, "${ex.nome}": repetições fora da faixa (1-100): ${reps}`);
      }
    });
  });
}

/**
 * Valida a seção "dieta" do plano.
 * Verifica se tem refeições com alimentos e calorias.
 */
function validarDieta(dieta: Record<string, unknown>, erros: string[]): void {
  if (typeof dieta !== 'object' || !dieta) {
    erros.push('Dieta não é um objeto válido.');
    return;
  }

  const refeicoes = dieta.refeicoes;
  if (!Array.isArray(refeicoes) || refeicoes.length === 0) {
    erros.push('Dieta sem refeições definidas.');
    return;
  }

  if (refeicoes.length < 2) {
    erros.push('Dieta com menos de 2 refeições — improvável.');
  }

  refeicoes.forEach((ref: Record<string, unknown>, indice: number) => {
    if (typeof ref !== 'object' || !ref) {
      erros.push(`Refeição ${indice + 1} inválida.`);
      return;
    }

    if (typeof ref.nome !== 'string' || !ref.nome) {
      erros.push(`Refeição ${indice + 1}: nome ausente.`);
    }

    const alimentos = ref.alimentos;
    if (!Array.isArray(alimentos) || alimentos.length === 0) {
      erros.push(`Refeição "${ref.nome}": sem alimentos.`);
      return;
    }

    alimentos.forEach((alim: Record<string, unknown>, iAlim: number) => {
      if (typeof alim.nome !== 'string' || !alim.nome) {
        erros.push(`Refeição "${ref.nome}", alimento ${iAlim + 1}: nome ausente.`);
      }

      const calorias = Number(alim.calorias);
      if (isNaN(calorias) || calorias < 0 || calorias > 3000) {
        erros.push(`"${alim.nome}": calorias fora da faixa (0-3000): ${calorias}`);
      }
    });
  });
}

/**
 * Tenta corrigir problemas menores no plano (sanitização).
 * Retorna o plano "limpo" ou null se irrecuperável.
 */
export function sanitizarPlanoIA(plano: unknown): PlanoIAGerado | null {
  if (!plano || typeof plano !== 'object') return null;

  const p = plano as Record<string, unknown>;

  try {
    const resumo = p.resumo as Record<string, unknown>;
    const treino = p.treino as Record<string, unknown>;
    const dieta = p.dieta as Record<string, unknown>;

    if (!resumo || !treino || !dieta) return null;

    const macros = resumo.macros as Record<string, unknown> || {};

    return {
      resumo: {
        tmb: Number(resumo.tmb) || 0,
        tdee: Number(resumo.tdee) || 0,
        caloriasAlvo: Number(resumo.caloriasAlvo) || 0,
        macros: {
          proteinas: Number(macros.proteinas) || 0,
          carboidratos: Number(macros.carboidratos) || 0,
          gorduras: Number(macros.gorduras) || 0,
        },
        metaAguaMl: Number(resumo.metaAguaMl) || 0,
      },
      treino: {
        nomeDivisao: String(treino.nomeDivisao || 'Plano Personalizado'),
        dias: Array.isArray(treino.dias) ? treino.dias.map((dia: Record<string, unknown>) => ({
          diaSemana: Number(dia.diaSemana) || 0,
          nome: String(dia.nome || 'Treino'),
          exercicios: Array.isArray(dia.exercicios) ? dia.exercicios.map((ex: Record<string, unknown>) => ({
            nome: String(ex.nome || 'Exercício'),
            series: Number(ex.series) || 3,
            repeticoes: Number(ex.repeticoes) || 10,
            descansoSegundos: Number(ex.descansoSegundos) || 60,
            grupoMuscular: ex.grupoMuscular ? String(ex.grupoMuscular) : undefined,
          })) : [],
        })) : [],
      },
      dieta: {
        refeicoes: Array.isArray((dieta as Record<string, unknown>).refeicoes) ? ((dieta as Record<string, unknown>).refeicoes as Record<string, unknown>[]).map((ref: Record<string, unknown>) => ({
          nome: String(ref.nome || 'Refeição'),
          horario: String(ref.horario || '12:00'),
          alimentos: Array.isArray(ref.alimentos) ? ref.alimentos.map((a: Record<string, unknown>) => ({
            nome: String(a.nome || 'Alimento'),
            porcao: String(a.porcao || '100g'),
            calorias: Number(a.calorias) || 0,
            proteinas: a.proteinas != null ? Number(a.proteinas) : undefined,
            carboidratos: a.carboidratos != null ? Number(a.carboidratos) : undefined,
            gorduras: a.gorduras != null ? Number(a.gorduras) : undefined,
          })) : [],
        })) : [],
      },
      comentarios: Array.isArray(p.comentarios)
        ? p.comentarios.map((c: unknown) => String(c))
        : undefined,
    };
  } catch {
    return null;
  }
}
