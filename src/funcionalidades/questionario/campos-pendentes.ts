// ============================================================
// REGRA: passos do questionário e campos obrigatórios de cada um
// ============================================================
// Uma pergunta (ou par de perguntas) por tela. O questionário começa vazio
// e não avança enquanto houver pergunta sem resposta.
// ============================================================

export interface RespostasEmEdicao {
  objetivo: string;
  sexo: string;
  idade: string;
  altura: string;
  peso: string;
  /** Faixa de tempo de treino; o nível é derivado dela (RN18). */
  experiencia: string;
  dias: string;
  local: string;
  restricaoFisica: string[];
  restricaoAlimentar: string[];
  atividade: string;
  refeicoes: string;
}

interface Passo {
  campos: [keyof RespostasEmEdicao, string][];
  /** Valor mostrado (e confirmado ao Continuar) quando a pessoa não mexeu na roda, régua ou stepper. */
  padroes?: Partial<RespostasEmEdicao>;
}

// PREMISSA: padrões de idade, altura, peso e refeições (valores médios, visíveis na tela).
export const PASSOS: Passo[] = [
  { campos: [['objetivo', 'objetivo']] },
  {
    campos: [
      ['sexo', 'sexo biológico'],
      ['idade', 'idade'],
    ],
    padroes: { idade: '30' },
  },
  {
    campos: [
      ['altura', 'altura'],
      ['peso', 'peso'],
    ],
    padroes: { altura: '170', peso: '70' },
  },
  { campos: [['experiencia', 'tempo de treino']] },
  { campos: [['dias', 'dias por semana']] },
  { campos: [['local', 'local de treino']] },
  { campos: [['restricaoFisica', 'dores ou lesões']] },
  { campos: [['restricaoAlimentar', 'restrição alimentar']] },
  { campos: [['atividade', 'rotina fora do treino']] },
  { campos: [['refeicoes', 'refeições por dia']], padroes: { refeicoes: '4' } },
];

export const TOTAL_PASSOS = PASSOS.length;

function vazio(valor: string | string[] | undefined): boolean {
  return Array.isArray(valor) ? valor.length === 0 : !String(valor ?? '').trim();
}

/** Nomes das perguntas sem resposta no passo (1 a 10; vazio = pode avançar). */
export function camposPendentes(passo: number, respostas: RespostasEmEdicao): string[] {
  return (PASSOS[passo - 1]?.campos ?? [])
    .filter(([campo]) => vazio(respostas[campo]))
    .map(([, rotulo]) => rotulo);
}

/** Preenche com o padrão do passo o que ainda está vazio (o que a pessoa vê na tela). */
export function aplicarPadroes(passo: number, respostas: RespostasEmEdicao): RespostasEmEdicao {
  const resultado = { ...respostas };
  for (const [campo, valor] of Object.entries(PASSOS[passo - 1]?.padroes ?? {})) {
    if (vazio(resultado[campo as keyof RespostasEmEdicao])) {
      Object.assign(resultado, { [campo]: valor });
    }
  }
  return resultado;
}
