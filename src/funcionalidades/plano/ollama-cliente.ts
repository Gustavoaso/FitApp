// ============================================================
// CLIENTE OLLAMA (RN06)
// ============================================================
// O app fala direto com o Ollama da rede local. Qualquer falha
// de rede, timeout ou HTTP vira ErroOllama, com a mensagem da
// seção 8 do PROJETO.md: a tela só mostra esse texto.
// ============================================================

export const OLLAMA_URL = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
export const MODELO_GERACAO = 'llama3.2';
export const MODELO_EMBEDDING = 'mxbai-embed-large';
export const TIMEOUT_MS = 60_000;

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
    options: { temperature: 0.4 },
  });
  const texto = typeof corpo === 'object' && corpo !== null && 'response' in corpo ? corpo.response : undefined;
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
  const lista = typeof corpo === 'object' && corpo !== null && 'embeddings' in corpo ? corpo.embeddings : undefined;
  const vetor: unknown = Array.isArray(lista) ? lista[0] : undefined;
  if (!Array.isArray(vetor) || !vetor.every((v) => typeof v === 'number')) {
    throw new ErroOllama('resposta sem "embeddings"');
  }
  return vetor;
}
