// Ingestão da base de conhecimento (etapa 7): upsert (por título) em base_conhecimento
// no Supabase LOCAL. Recusa banco remoto. Os embeddings (gte-small, etapa 28) não são
// gerados aqui: a Edge Function reprocessar-embeddings preenche `embedding_384`
// (veja scripts/reprocessar-embeddings.sh).
//
// COMO RODAR (Node 22.6+ roda .ts direto):
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY do `npx supabase status`> \
//     node scripts/ingestao-conhecimento.ts

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

async function principal() {
  const trechos: Trecho[] = JSON.parse(
    readFileSync(new URL('./conhecimento/trechos.json', import.meta.url), 'utf8'),
  );
  const linhas = trechos;

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
