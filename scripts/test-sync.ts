// ============================================================
// SCRIPT DE TESTE DEV: Teste Manual de APIs (scripts/test-sync.ts)
// ============================================================
// Permite ao desenvolvedor executar a busca da TacoAPI e ExerciseDB
// a qualquer momento e inspecionar a resposta completa no terminal.
//
// COMO RODAR:
// npx tsx scripts/test-sync.ts
// ============================================================

import dotenv from 'dotenv';
dotenv.config({ path: 'apps/mobile/.env' });

async function testarTacoAPI() {
  console.log('\n========================================');
  console.log('🧪 TESTANDO CONEXÃO E PAGINAÇÃO DINÂMICA: TacoAPI (RapidAPI)');
  console.log('========================================');

  const apiKey = 'b7ad932498mshe71f08cf869dea7p18025ajsnd3fa621703a2';
  const rapidHost = 'taco-api-br1.p.rapidapi.com';

  let todosAlimentos: any[] = [];
  let pagina = 1;
  let temMais = true;

  const inicio = Date.now();
  try {
    while (temMais) {
      const url = `https://taco-api-br1.p.rapidapi.com/foods/?page=${pagina}&limit=100`;

      let tentativa = 0;
      let sucesso = false;
      let resultadosPagina: any[] = [];
      let totalMeta = 0;

      while (tentativa < 3 && !sucesso) {
        try {
          const resp = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'x-rapidapi-host': rapidHost,
              'x-rapidapi-key': apiKey,
            },
          });

          if (resp.status === 429) {
            tentativa++;
            console.log(`⚠️ HTTP 429 Rate Limit na Página ${pagina}. Aguardando 600ms (Tentativa ${tentativa}/3)...`);
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }

          if (!resp.ok) break;

          const dados = await resp.json();
          const meta = dados.meta || {};
          totalMeta = meta.total_pages || 0;
          resultadosPagina = dados.results || [];
          sucesso = true;
        } catch {
          tentativa++;
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (!sucesso || resultadosPagina.length === 0) {
        temMais = false;
        break;
      }

      todosAlimentos.push(...resultadosPagina);
      console.log(`📄 Página ${pagina} (total_pages meta: ${totalMeta}): ${resultadosPagina.length} alimentos obtidos.`);

      if (resultadosPagina.length < 100 || (totalMeta > 0 && pagina >= totalMeta)) {
        temMais = false;
      } else {
        pagina++;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (todosAlimentos.length < 500) {
      console.log('ℹ️ Complementando base via Tabela TACO UNICAMP (597 itens)...');
      try {
        const respU = await fetch('https://raw.githubusercontent.com/marcelosanto/tabela_taco/main/TACO.json');
        if (respU.ok) {
          const dadosU = await respU.json();
          if (Array.isArray(dadosU)) {
            const existentes = new Set(todosAlimentos.map((a) => String(a.id || a.description)));
            for (const item of dadosU) {
              if (!existentes.has(String(item.id || item.description))) {
                todosAlimentos.push(item);
              }
            }
          }
        }
      } catch {}
    }

    const tempo = Date.now() - inicio;
    console.log(`\n⏱️ Tempo Total: ${tempo}ms`);
    console.log(`✅ SUCESSO! Total Geral de Alimentos Obtidos: ${todosAlimentos.length}`);

    if (todosAlimentos.length > 0) {
      console.log('\n🔍 Exemplo do 1º alimento retornado:');
      console.dir(todosAlimentos[0], { depth: null, colors: true });
    }
  } catch (err) {
    console.error('❌ Falha na requisição paginada:', err);
  }
}

async function testarExerciseDB() {
  console.log('\n========================================');
  console.log('🧪 TESTANDO CONEXÃO E RESPOSTA: ExerciseDB');
  console.log('========================================');

  const url = 'https://oss.exercisedb.dev/api/v1/exercises?limit=50';
  console.log(`📡 GET ${url}`);

  const inicio = Date.now();
  try {
    const resp = await fetch(url);
    const tempo = Date.now() - inicio;

    console.log(`⏱️ Tempo de resposta: ${tempo}ms`);
    console.log(`STATUS: ${resp.status} ${resp.statusText}`);

    if (!resp.ok) {
      console.error(`❌ Erro na ExerciseDB: HTTP ${resp.status}`);
      return;
    }

    const json = await resp.json();
    const lista = json.data || [];

    console.log(`📊 TOTAL DE EXERCÍCIOS NESTE LOTE: ${lista.length}`);
    console.log(`📄 Próxima página disponível? ${json.meta?.hasNextPage ? 'SIM' : 'NÃO'}`);
    if (lista.length > 0) {
      console.log('\n🔍 Exemplo dos 2 primeiros exercícios retornados pela API:');
      console.dir(lista.slice(0, 2), { depth: null, colors: true });
    }
  } catch (err) {
    console.error('❌ Falha na requisição da ExerciseDB:', err);
  }
}

async function executar() {
  await testarTacoAPI();
  await testarExerciseDB();
  console.log('\n========================================\n');
}

executar();
