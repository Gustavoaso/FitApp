// Ingestão da base de conhecimento (etapa 7): gera embeddings no Ollama local e faz
// upsert (por título) em base_conhecimento no Supabase LOCAL. Recusa banco remoto.
//
// COMO RODAR (Node 22.6+ roda .ts direto):
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY do `npx supabase status`> \
//     node scripts/ingestao-conhecimento.ts
// OLLAMA_URL é opcional (padrão http://localhost:11434).

import { readFileSync } from 'node:fs';

type Trecho = {
  tipo: string;
  tema: string;
  titulo: string;
  fonte: string;
  conteudo: string;
  objetivos: string[];
  niveis: string[];
};

const MODELO = 'mxbai-embed-large';
const DIMENSAO = 1024;
const HOSTS_LOCAIS = ['localhost', '127.0.0.1'];

function falhar(mensagem: string): never {
  console.error(`Erro: ${mensagem}`);
  process.exit(1);
}

function exigirLocal(nome: string, url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    falhar(`${nome} inválida: ${url}`);
  }
  if (!HOSTS_LOCAIS.includes(host))
    falhar(`${nome} precisa ser local (localhost/127.0.0.1); recebido ${host}.`);
  return url.replace(/\/$/, '');
}

const supabaseUrl = exigirLocal(
  'SUPABASE_URL',
  process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
);
const chave =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  falhar('defina SUPABASE_SERVICE_ROLE_KEY (local, de `npx supabase status`).');
const ollamaUrl = exigirLocal('OLLAMA_URL', process.env.OLLAMA_URL ?? 'http://localhost:11434');

async function gerarEmbedding(texto: string): Promise<number[]> {
  let resposta: Response;
  try {
    resposta = await fetch(`${ollamaUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELO, input: texto }),
    });
  } catch {
    falhar(
      `Ollama não respondeu em ${ollamaUrl}. Ligue com \`ollama serve\` e baixe o modelo com \`ollama pull ${MODELO}\`.`,
    );
  }
  if (!resposta.ok)
    falhar(
      `Ollama recusou (${resposta.status}): ${await resposta.text()}. O modelo ${MODELO} está baixado?`,
    );
  const corpo = (await resposta.json()) as { embeddings?: number[][] };
  const vetor = corpo.embeddings?.[0];
  if (!vetor || vetor.length !== DIMENSAO)
    falhar(`embedding com dimensão ${vetor?.length} (esperado ${DIMENSAO}).`);
  return vetor;
}

async function principal() {
  const trechos: Trecho[] = JSON.parse(
    readFileSync(new URL('./conhecimento/trechos.json', import.meta.url), 'utf8'),
  );
  const linhas = [];
  for (const [i, trecho] of trechos.entries()) {
    // Título e conteúdo juntos: a busca casa tanto pelo assunto quanto pelo texto.
    const embedding = await gerarEmbedding(`${trecho.titulo}\n${trecho.conteudo}`);
    linhas.push({ ...trecho, embedding: JSON.stringify(embedding) });
    console.log(`${i + 1}/${trechos.length} ${trecho.titulo}`);
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${supabaseUrl}/rest/v1/base_conhecimento?on_conflict=titulo`, {
      method: 'POST',
      headers: {
        apikey: chave,
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(linhas),
    });
  } catch {
    falhar(`Supabase local não respondeu em ${supabaseUrl}. Rode \`npx supabase start\`.`);
  }
  if (!resposta.ok) falhar(`upsert recusado (${resposta.status}): ${await resposta.text()}`);
  console.log(`${linhas.length} trechos gravados em base_conhecimento.`);
}

principal();
