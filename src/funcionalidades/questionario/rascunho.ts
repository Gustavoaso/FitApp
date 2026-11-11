// Rascunho do questionário: a cada passo, as respostas e o passo ficam no aparelho
// (por usuário), para retomar se a pessoa sair.
import { armazenamentoUsuario } from '@/compartilhado/servicos/armazenamento-usuario';
import { TOTAL_PASSOS, type RespostasEmEdicao } from './campos-pendentes';
import { RESPOSTAS_VAZIAS } from './respostas';

const CHAVE = '@fitapp_rascunho_questionario';

export interface Rascunho {
  /** 1 a TOTAL_PASSOS; TOTAL_PASSOS + 1 é o resumo. */
  passo: number;
  respostas: RespostasEmEdicao;
}

export async function salvarRascunho(rascunho: Rascunho): Promise<void> {
  await armazenamentoUsuario.setItem(CHAVE, JSON.stringify(rascunho));
}

export async function apagarRascunho(): Promise<void> {
  await armazenamentoUsuario.removeItem(CHAVE);
}

/** Lê o rascunho; texto corrompido ou de formato antigo vira null. */
export async function lerRascunho(): Promise<Rascunho | null> {
  try {
    const bruto = await armazenamentoUsuario.getItem(CHAVE);
    if (!bruto) return null;
    const dado = JSON.parse(bruto);
    const passo = Number(dado?.passo);
    if (!Number.isInteger(passo) || passo < 1 || passo > TOTAL_PASSOS + 1) return null;
    const r = dado.respostas ?? {};
    const respostas = { ...RESPOSTAS_VAZIAS };
    for (const campo of Object.keys(RESPOSTAS_VAZIAS) as (keyof RespostasEmEdicao)[]) {
      const padrao = RESPOSTAS_VAZIAS[campo];
      if (Array.isArray(padrao)) {
        if (Array.isArray(r[campo])) Object.assign(respostas, { [campo]: r[campo].map(String) });
      } else if (typeof r[campo] === 'string') {
        Object.assign(respostas, { [campo]: r[campo] });
      }
    }
    return { passo, respostas };
  } catch {
    return null;
  }
}
