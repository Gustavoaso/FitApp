// ============================================================
// CLIENTE OLLAMA (RN06)
// ============================================================
// O app fala direto com o Ollama da rede local. Qualquer falha
// de rede, timeout ou HTTP vira ErroOllama, com a mensagem da
// seção 8 do PROJETO.md: a tela só mostra esse texto.
// ============================================================

const URL_PADRAO = 'http://localhost:11434';

/**
 * Aceita o que a pessoa costuma colar no .env: IP ou nome Bonjour do Mac
 * (`Meu-Mac.local:11434`), com ou sem `http://` e com ou sem barra no fim.
 */
export function normalizarUrlOllama(valor: string | undefined | null): string {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) return URL_PADRAO;
  const comEsquema = /^https?:\/\//i.test(texto) ? texto : `http://${texto}`;
  return comEsquema.replace(/\/+$/, '');
}

export const OLLAMA_URL = normalizarUrlOllama(process.env.EXPO_PUBLIC_OLLAMA_URL);
export const MODELO_GERACAO = 'llama3.2';
export const MODELO_EMBEDDING = 'mxbai-embed-large';
// PREMISSA: 180 s; o llama3.2 no Mac de 8 GB passa de 60 s nos perfis maiores (etapa 13).
export const TIMEOUT_MS = 180_000;
// Contexto que cabe o prompt enxuto e a resposta; o modelo fica carregado entre gerações.
const OPCOES_GERACAO = { temperature: 0.4, num_ctx: 4096 };
const MANTER_CARREGADO = '15m';

export const MENSAGEM_OLLAMA_FORA =
  'Não consegui falar com o gerador de planos. Confira se o Mac está ligado e na mesma rede.';

export class ErroOllama extends Error {
  constructor(detalhe: string) {
    super(MENSAGEM_OLLAMA_FORA);
    this.name = 'ErroOllama';
    // O detalhe vai só para o log, nunca para a tela.
    console.warn('[ollama]', detalhe);
  }
}

async function postar(caminho: string, corpo: object): Promise<unknown> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetch(`${OLLAMA_URL}${caminho}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controle.signal,
    });
    if (!resposta.ok) throw new ErroOllama(`HTTP ${resposta.status} em ${caminho}`);
    return await resposta.json();
  } catch (erro) {
    if (erro instanceof ErroOllama) throw erro;
    throw new ErroOllama(erro instanceof Error ? erro.message : String(erro));
  } finally {
    clearTimeout(relogio);
  }
}

/** Gera com saída presa ao JSON Schema (`format`). Devolve o JSON cru, sem validar. */
export async function gerarComSchema(prompt: string, schema: object): Promise<unknown> {
  const corpo = await postar('/api/generate', {
    model: MODELO_GERACAO,
    prompt,
    format: schema,
    stream: false,
    options: OPCOES_GERACAO,
    keep_alive: MANTER_CARREGADO,
  });
  const texto =
    typeof corpo === 'object' && corpo !== null && 'response' in corpo ? corpo.response : undefined;
  if (typeof texto !== 'string') throw new ErroOllama('resposta sem "response"');
  try {
    return JSON.parse(texto);
  } catch {
    // JSON quebrado não é falha de rede: o validador acusa e entra no retry.
    return null;
  }
}

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const corpo = await postar('/api/embed', { model: MODELO_EMBEDDING, input: texto });
  const lista =
    typeof corpo === 'object' && corpo !== null && 'embeddings' in corpo
      ? corpo.embeddings
      : undefined;
  const vetor: unknown = Array.isArray(lista) ? lista[0] : undefined;
  if (!Array.isArray(vetor) || !vetor.every((v) => typeof v === 'number')) {
    throw new ErroOllama('resposta sem "embeddings"');
  }
  return vetor;
}
