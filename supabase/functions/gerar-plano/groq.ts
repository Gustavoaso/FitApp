// ============================================================
// EDGE FUNCTION: gerar-plano (cliente da Groq)
// ============================================================
// API compatível com a da OpenAI. O `llama-3.3-70b-versatile` não aceita
// `json_schema` (só os modelos openai/gpt-oss e outros listados na doc de
// Structured Outputs), então usa `json_object`: JSON válido, sem garantia de
// schema; o app valida a escolha de IDs e faz 1 retry.
// ============================================================

export const URL_GROQ = 'https://api.groq.com/openai/v1/chat/completions';
export const MODELO_GROQ = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 45_000;

/** Groq com limite de uso estourado (HTTP 429) ou fora do ar (503). */
export class ServicoOcupado extends Error {
  override name = 'ServicoOcupado';
}

type Fetch = typeof fetch;

export function criarClienteGroq(chave: string, buscar: Fetch = fetch) {
  return async (prompt: string): Promise<unknown> => {
    const resposta = await buscar(URL_GROQ, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
      body: JSON.stringify({
        model: MODELO_GROQ,
        messages: [
          {
            role: 'system',
            content: 'Você é um preparador físico e nutricionista. Responda só JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (resposta.status === 429 || resposta.status === 503) {
      throw new ServicoOcupado(`Groq HTTP ${resposta.status}`);
    }
    if (!resposta.ok) throw new Error(`Groq HTTP ${resposta.status}`);
    const corpo = await resposta.json();
    const texto = corpo?.choices?.[0]?.message?.content;
    if (typeof texto !== 'string') throw new Error('Groq sem "choices[0].message.content"');
    try {
      return JSON.parse(texto);
    } catch {
      // JSON quebrado não é falha de rede: o validador do app acusa e entra no retry.
      return null;
    }
  };
}
