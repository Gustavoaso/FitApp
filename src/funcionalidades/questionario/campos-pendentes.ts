// ============================================================
// REGRA: campos obrigatórios de cada etapa do questionário
// ============================================================
// O questionário começa vazio (exemplos só como placeholder) e não
// avança enquanto houver pergunta sem resposta.
// ============================================================

export interface RespostasEmEdicao {
  sexo: string;
  idade: string;
  peso: string;
  altura: string;
  objetivo: string;
  atividade: string;
  nivel: string;
  dias: string;
  local: string;
  tempo: string;
  restricaoFisica: string[];
  restricaoAlimentar: string[];
  refeicoes: string;
}

const CAMPOS_POR_ETAPA: Record<number, [keyof RespostasEmEdicao, string][]> = {
  1: [
    ['sexo', 'sexo biológico'],
    ['idade', 'idade'],
    ['peso', 'peso'],
    ['altura', 'altura'],
  ],
  2: [
    ['objetivo', 'objetivo'],
    ['atividade', 'atividade fora do treino'],
    ['nivel', 'experiência'],
  ],
  3: [
    ['dias', 'dias por semana'],
    ['local', 'local de treino'],
    ['tempo', 'tempo por sessão'],
  ],
  4: [
    ['restricaoFisica', 'restrição física'],
    ['restricaoAlimentar', 'restrição alimentar'],
    ['refeicoes', 'refeições por dia'],
  ],
};

/** Nomes das perguntas sem resposta na etapa (vazio = pode avançar). */
export function camposPendentes(etapa: number, respostas: RespostasEmEdicao): string[] {
  return (CAMPOS_POR_ETAPA[etapa] ?? [])
    .filter(([campo]) => {
      const valor = respostas[campo];
      return Array.isArray(valor) ? valor.length === 0 : !String(valor ?? '').trim();
    })
    .map(([, rotulo]) => rotulo);
}
