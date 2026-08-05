// ============================================================
// EDGE FUNCTION (SUPABASE): Sincronização de Bases de Dados
// (supabase/functions/sincronizar-bases/index.ts)
// ============================================================
// Cron Job de Servidor: Sincroniza em background (ex: todo domingo)
// as tabelas `base_alimentos` (TacoAPI RapidAPI paginada dinamicamente) e `base_exercicios` (ExerciseDB) no Supabase.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || 'b7ad932498mshe71f08cf869dea7p18025ajsnd3fa621703a2';
const RAPIDAPI_HOST = 'taco-api-br1.p.rapidapi.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
  }

  try {
    console.log('🔄 Cron Backend: Iniciando sincronização paginada dinâmica das bases...');

    // 1. Sincroniza TacoAPI RapidAPI com paginação 100% dinâmica (sem hardcode)
    let totalAlimentos = 0;
    try {
      const todosAlimentos: any[] = [];
      let pagina = 1;
      let temMaisPaginas = true;

      while (temMaisPaginas) {
        const url = `https://taco-api-br1.p.rapidapi.com/foods/?page=${pagina}&limit=100`;

        let tentativa = 0;
        let sucesso = false;
        let resultadosPagina: any[] = [];
        let totalPaginasMeta = 0;

        while (tentativa < 3 && !sucesso) {
          try {
            const respTaco = await fetch(url, {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY,
              },
            });

            if (respTaco.status === 429) {
              tentativa++;
              await new Promise((r) => setTimeout(r, 600));
              continue;
            }

            if (!respTaco.ok) break;

            const dadosTaco = await respTaco.json();
            const meta = dadosTaco.meta || {};
            totalPaginasMeta = meta.total_pages || meta.totalPages || meta.pages || 0;
            resultadosPagina = dadosTaco.results || (Array.isArray(dadosTaco) ? dadosTaco : []);
            sucesso = true;
          } catch {
            tentativa++;
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (!sucesso || resultadosPagina.length === 0) {
          temMaisPaginas = false;
          break;
        }

        todosAlimentos.push(...resultadosPagina);

        if (resultadosPagina.length < 100 || (totalPaginasMeta > 0 && pagina >= totalPaginasMeta)) {
          temMaisPaginas = false;
        } else {
          pagina++;
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      if (todosAlimentos.length < 500) {
        try {
          const respUnicamp = await fetch('https://raw.githubusercontent.com/marcelosanto/tabela_taco/main/TACO.json');
          if (respUnicamp.ok) {
            const dadosU = await respUnicamp.json();
            if (Array.isArray(dadosU)) {
              const existentes = new Set(todosAlimentos.map((a) => String(a.id || a.description || a.nome)));
              for (const item of dadosU) {
                const chave = String(item.id || item.description || item.nome);
                if (!existentes.has(chave)) {
                  todosAlimentos.push(item);
                }
              }
            }
          }
        } catch {}
      }

      if (todosAlimentos.length > 0) {
        const payloadAlimentos = todosAlimentos.map((item: any, index: number) => {
          const nome = item.nome || item.name || item.description || item.descricao || `Alimento ${index + 1}`;

          let categoria = 'Geral';
          if (typeof item.category === 'object' && item.category !== null && item.category.name) {
            categoria = item.category.name;
          } else if (typeof item.categoria === 'object' && item.categoria !== null && item.categoria.name) {
            categoria = item.categoria.name;
          } else if (typeof item.categoria === 'string') {
            categoria = item.categoria;
          } else if (typeof item.category === 'string') {
            categoria = item.category;
          }

          const rawId = item.id ?? item.id_taco ?? index + 1;
          const calorias = item.calorias ?? item.energy_kcal ?? item.kcal ?? 0;
          const proteinas = item.proteinas ?? item.protein_g ?? item.protein ?? 0;
          const carboidratos = item.carboidratos ?? item.carbohydrate_g ?? item.carbohydrate ?? 0;
          const gorduras = item.gorduras ?? item.lipid_g ?? item.lipids ?? item.lipid ?? 0;
          const fibras = item.fibras ?? item.fiber_g ?? item.dietaryFiber ?? null;

          const nomeFormatado = String(nome).trim();
          const idExterno = `taco-${rawId}-${nomeFormatado.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

          return {
            id_externo: idExterno,
            nome: nomeFormatado,
            categoria: String(categoria).trim(),
            calorias_100g: Number(calorias),
            proteinas_100g: Number(proteinas),
            carboidratos_100g: Number(carboidratos),
            gorduras_100g: Number(gorduras),
            fibras_100g: fibras != null ? Number(fibras) : null,
          };
        });

        // Grava no Supabase em lotes de 50
        for (let i = 0; i < payloadAlimentos.length; i += 50) {
          const lote = payloadAlimentos.slice(i, i + 50);
          await supabase.from('base_alimentos').upsert(lote, { onConflict: 'id_externo' });
        }
        totalAlimentos = payloadAlimentos.length;
        console.log(`✅ Cron Backend: ${totalAlimentos} alimentos sincronizados.`);
      }
    } catch (e) {
      console.error('⚠️ Cron Backend: Erro ao sincronizar TacoAPI Paginada:', e);
    }

    // 2. Sincroniza ExerciseDB → base_exercicios
    let totalExercicios = 0;
    try {
      const respEx = await fetch('https://oss.exercisedb.dev/api/v1/exercises?limit=300');
      if (respEx.ok) {
        const jsonEx = await respEx.json();
        const listaEx = jsonEx.data || [];

        const payloadEx = listaEx.map((ex: any) => ({
          id_externo: ex.exerciseId,
          nome: ex.name,
          grupo_primario: ex.targetMuscles?.[0] || ex.bodyParts?.[0] || 'Geral',
          grupo_secundario: ex.secondaryMuscles?.join(', ') || null,
          equipamento: ex.equipments?.[0] || 'Livre',
          nivel: ex.equipments?.[0] === 'body weight' ? 'iniciante' : 'intermediario',
          instrucoes: ex.instructions?.join('\n') || '',
          gif_url: ex.gifUrl || null,
        }));

        for (let i = 0; i < payloadEx.length; i += 50) {
          const lote = payloadEx.slice(i, i + 50);
          await supabase.from('base_exercicios').upsert(lote, { onConflict: 'id_externo' });
        }
        totalExercicios = payloadEx.length;
        console.log(`✅ Cron Backend: ${totalExercicios} exercícios sincronizados.`);
      }
    } catch (e) {
      console.error('⚠️ Cron Backend: Erro ao sincronizar ExerciseDB:', e);
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        mensagem: 'Sincronização paginada dinâmica executada com sucesso.',
        totalAlimentos,
        totalExercicios,
        executadoEm: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (erro: any) {
    return new Response(
      JSON.stringify({ sucesso: false, erro: erro.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
