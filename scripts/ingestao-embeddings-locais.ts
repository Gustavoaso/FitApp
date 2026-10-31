// Embeddings de base_exercicios e base_alimentos no Supabase LOCAL (etapa 17),
// para o RAG híbrido funcionar na avaliação. Só preenche o que está sem embedding.
// Mesmo texto do scripts/ingestao-embeddings.py (o que gerou os de produção).
// Recusa banco e Ollama que não sejam locais.
//
// COMO RODAR (Node 22.6+ roda .ts direto):
//   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY do `npx supabase status`> \
//     node scripts/ingestao-embeddings-locais.ts

const MODELO = 'mxbai-embed-large';
const DIMENSAO = 1024;
const LOTE = 32;
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
const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  'Content-Type': 'application/json',
};

type Linha = Record<string, string | number | null>;

// Números com uma casa, como o Python imprime os numeric(…,1) da base.
const n = (v: string | number | null) => Number(v).toFixed(1);
const TEXTO = {
  base_exercicios: (e: Linha) =>
    `Exercício: ${e.nome}. Grupo Muscular: ${e.grupo_primario}. Equipamento: ${e.equipamento}. Nível: ${e.nivel}.`,
  base_alimentos: (a: Linha) =>
    `Alimento: ${a.nome}. Marca: ${a.marca ?? 'None'}. Calorias: ${n(a.calorias_100g)}kcal/100g. Proteínas: ${n(a.proteinas_100g)}g. Carboidratos: ${n(a.carboidratos_100g)}g. Gorduras: ${n(a.gorduras_100g)}g.`,
};
const COLUNAS = {
  base_exercicios: 'id,nome,grupo_primario,equipamento,nivel',
  base_alimentos: 'id,nome,marca,calorias_100g,proteinas_100g,carboidratos_100g,gorduras_100g',
};

async function pedir(url: string, init: RequestInit, servico: string): Promise<Response> {
  let resposta: Response;
  try {
    resposta = await fetch(url, init);
  } catch {
    falhar(`${servico} não respondeu em ${url}.`);
  }
  if (!resposta.ok) falhar(`${servico} recusou (${resposta.status}): ${await resposta.text()}`);
  return resposta;
}

async function gerarEmbeddings(textos: string[]): Promise<number[][]> {
  const resposta = await pedir(
    `${ollamaUrl}/api/embed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELO, input: textos }),
    },
    `Ollama (${MODELO})`,
  );
  const vetores = ((await resposta.json()) as { embeddings?: number[][] }).embeddings ?? [];
  if (vetores.length !== textos.length || vetores.some((v) => v.length !== DIMENSAO))
    falhar(`resposta do Ollama sem ${textos.length} vetores de ${DIMENSAO}.`);
  return vetores;
}

async function preencher(tabela: keyof typeof TEXTO) {
  const resposta = await pedir(
    `${supabaseUrl}/rest/v1/${tabela}?select=${COLUNAS[tabela]}&embedding=is.null&limit=50000`,
    { headers: cabecalhos },
    'Supabase local',
  );
  const linhas = (await resposta.json()) as Linha[];
  for (let i = 0; i < linhas.length; i += LOTE) {
    const lote = linhas.slice(i, i + LOTE);
    const vetores = await gerarEmbeddings(lote.map(TEXTO[tabela]));
    for (const [j, linha] of lote.entries()) {
      await pedir(
        `${supabaseUrl}/rest/v1/${tabela}?id=eq.${linha.id}`,
        {
          method: 'PATCH',
          headers: { ...cabecalhos, Prefer: 'return=minimal' },
          body: JSON.stringify({ embedding: JSON.stringify(vetores[j]) }),
        },
        'Supabase local',
      );
    }
  }
  console.log(`${tabela}: ${linhas.length} embeddings gerados.`);
}

async function principal() {
  await preencher('base_exercicios');
  await preencher('base_alimentos');
}

principal();
