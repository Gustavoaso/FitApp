// Gera supabase/migrations/20261103000000_alimentos_taco_e_basicos.sql.
//   node scripts/gerar-migration-basicos.js
// Fonte dos alimentos: TACO 4ª ed. (NEPA/Unicamp, 2011), CSVs em scripts/dados/taco/
// (conferidos contra o .xls original: 597/597 alimentos, valores iguais; "Tr" vira 0).
// Só alimentos com kcal, proteína, lipídeos e carboidrato preenchidos entram.
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const aqui = path.dirname(process.argv[1]);
const dir = path.join(aqui, 'dados', 'taco');
const ler = (f) => parse(fs.readFileSync(path.join(dir, f)), { columns: true });
const categorias = Object.fromEntries(ler('categories.csv').map((c) => [c.id, c.name]));
const nutrientes = Object.fromEntries(ler('nutrients.csv').map((n) => [n.foodId, n]));

// Alimentos básicos (id TACO → porção típica em gramas e descrição). Só comida de
// verdade, no preparo em que se come (cozido, grelhado, assado ou cru de fruta).
// Sem industrializado, suplemento, diet, frito, embutido nem vísceras.
const BASICOS = {
  // cereais, tubérculos e pães
  1: [100, '4 colheres de sopa'],
  3: [100, '4 colheres de sopa'],
  5: [100, '4 colheres de sopa'],
  7: [30, '3 colheres de sopa'],
  52: [50, '2 fatias'],
  53: [50, '1 pãozinho'],
  44: [100, '1 espiga pequena'],
  88: [100, '1 unidade pequena'],
  129: [100, '2 pedaços'],
  102: [100, '1 pedaço'],
  // leguminosas
  561: [100, '1 concha'],
  563: [100, '1 concha'],
  567: [100, '1 concha'],
  577: [100, '1 concha'],
  584: [100, '1 fatia'],
  // carnes e aves
  328: [100, '1 bife pequeno'],
  326: [100, '4 colheres de sopa'],
  337: [100, '1 bife'],
  346: [100, '1 bife'],
  349: [100, '1 bife'],
  351: [100, '1 bife'],
  358: [100, '1 bife'],
  363: [100, '1 fatia'],
  368: [100, '1 fatia'],
  370: [100, '1 bife'],
  371: [100, '1 fatia'],
  374: [100, '1 fatia'],
  377: [100, '1 bife'],
  383: [100, '1 fatia'],
  398: [100, '1 coxa'],
  404: [100, '1 porção'],
  408: [100, '1 filé'],
  410: [100, '1 filé'],
  403: [100, '1 porção'],
  413: [100, '1 sobrecoxa'],
  425: [100, '2 fatias'],
  429: [100, '1 bisteca'],
  432: [100, '2 fatias'],
  435: [100, '1 fatia'],
  // peixes e frutos do mar
  274: [100, '1 filé'],
  276: [100, '1 filé'],
  282: [100, '1 posta'],
  284: [100, '6 unidades'],
  294: [100, '1 filé'],
  301: [100, '1 filé'],
  313: [100, '1 filé'],
  317: [100, '1 filé'],
  318: [100, '2 unidades'],
  277: [60, '1/2 lata'],
  // ovos
  486: [33, '1 clara'],
  488: [50, '1 ovo'],
  // laticínios
  448: [170, '1 pote'],
  449: [170, '1 pote'],
  461: [30, '1 fatia'],
  463: [20, '1 fatia'],
  469: [30, '1 fatia'],
  468: [30, '1 colher de sopa'],
  // gorduras e oleaginosas
  260: [13, '1 colher de sopa'],
  262: [10, '1 colher de sobremesa'],
  557: [30, '1 punhado'],
  589: [15, '2 unidades'],
  594: [10, '1 colher de sopa'],
  597: [20, '4 unidades'],
  // frutas
  163: [100, '1/2 unidade'],
  164: [100, '1 fatia'],
  179: [100, '1 unidade'],
  182: [80, '1 unidade'],
  214: [150, '1 unidade'],
  222: [130, '1 unidade'],
  226: [150, '1/2 unidade'],
  229: [120, '1/2 unidade'],
  231: [120, '1/2 unidade'],
  235: [200, '1 fatia'],
  239: [100, '6 unidades'],
  256: [100, '1 cacho pequeno'],
  207: [75, '1 unidade'],
  225: [150, '1 fatia'],
};

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const num = (v) => (v === '' || v === undefined ? null : Number(v));

const linhas = [];
let semDados = 0;
for (const f of ler('food.csv')) {
  const n = nutrientes[f.id];
  // Óleos e gorduras: "NA" de proteína ou carboidrato na TACO é zero.
  const zeroSeNA = (v) => (f.categoryId === '4' ? (num(v) ?? 0) : num(v));
  const [kcal, lip] = [n.kcal, n.lipids].map(num);
  const [prot, carb] = [n.protein, n.carbohydrates].map(zeroSeNA);
  if ([kcal, prot, lip, carb].some((v) => v === null)) {
    if (BASICOS[f.id]) throw new Error(`Básico ${f.id} (${f.name}) sem dados na TACO`);
    semDados++;
    continue;
  }
  const basico = BASICOS[f.id];
  if (basico && kcal <= 0) throw new Error(`Básico ${f.id} sem kcal`);
  linhas.push(
    `(${f.id}, ${q(f.name.replace(/\s+/g, ' ').trim())}, ${q(categorias[f.categoryId])}, ${kcal}, ${prot}, ${carb}, ${lip}, ${num(n.dietaryFiber) ?? 'null'}, ` +
      `${basico ? q(basico[1]) : 'null'}, ${basico ? basico[0] : 'null'}, ${basico ? 'true' : 'false'})`,
  );
}
const faltando = Object.keys(BASICOS).filter((id) => !nutrientes[id] || nutrientes[id].kcal === '');
if (faltando.length) throw new Error(`Básicos sem dados na TACO: ${faltando}`);

// Exercícios que existem na maioria das academias (nome exato da base_exercicios).
const EXERCICIOS = [
  // peito
  'Supino Reto com Barra - Pegada Média',
  'Supino Inclinado com Barra - Pegada Média',
  'Supino com Halteres',
  'Supino Inclinado com Halteres',
  'Crucifixo com Halteres',
  'Supino Máquina',
  'Butterfly',
  'Crossover na Polia',
  'Flexões',
  'Supino no Smith Machine',
  // costas
  'Pulldown com Pegada Larga',
  'Pulldown Frente em Pegada Fechada',
  'Remada Sentada no Pulley',
  'Remada Curvada com Barra',
  'Remada Unilateral com Halter',
  'Barra Fixa',
  'Puxada no Pulley com Barra V',
  'Pulldown com Braços Retos',
  'Remada Curvada com Dois Halteres',
  // ombros
  'Desenvolvimento de Ombros com Halteres',
  'Desenvolvimento Militar com Barra',
  'Desenvolvimento Militar Máquina',
  'Desenvolvimento de Ombros na Máquina de Alavanca',
  'Elevação Lateral com Halteres',
  'Elevação Frontal com Halteres',
  'Crucifixo Invertido na Máquina',
  'Face Pull',
  'Crucifixo Inverso',
  // bíceps
  'Rosca Direta com Barra',
  'Rosca Alternada com Halteres',
  'Rosca Martelo',
  'Rosca Scott Máquina',
  'Rosca Direta Máquina',
  'Rosca Concentrada',
  'Rosca com Barra W',
  // tríceps
  'Tríceps Pulley',
  'Tríceps Pulley com Corda',
  'Tríceps Testa com Barra W',
  'Tríceps Francês Sentado',
  'Máquina de Mergulho',
  'Mergulho no Banco',
  'Extensão de Tríceps com Halter Unilateral',
  'Supino Reto com Barra em Pegada Fechada',
  'Tríceps Coice com Halter',
  // quadríceps
  'Agachamento com Barra',
  'Leg Press',
  'Extensão de Pernas',
  'Agachamento Hack',
  'Agachamento no Smith',
  'Agachamento com Halteres',
  'Afundo com Halteres',
  'Agachamento Corporal',
  'Step Up com Halteres',
  'Agachamento Sumô com Halter',
  // posterior
  'Cadeira Flexora',
  'Cadeira Flexora Sentada',
  'Levantamento Terra Romeno',
  'Levantamento Terra com Pernas Rígidas',
  'Levantamento Terra com Barra',
  'Stiff-Legged Deadlift no Smith',
  'Levantamento Terra com Halteres Pernas Estendidas',
  'Flexão de Pernas em Pé',
  // glúteos, abdutores e adutores
  'Elevação Pélvica com Barra',
  'Elevação de Quadril (Ponte)',
  'Coice com Cabo e uma Perna',
  'Abdutor de Coxas',
  'Adutor de Coxas',
  'Pull Through',
  'Coice de Glúteo',
  // panturrilha
  'Elevação de Panturrilha em Pé',
  'Elevação de Panturrilha Sentada',
  'Press de Panturrilha',
  'Elevação de Panturrilha com Halteres em Pé',
  'Elevação de Panturrilha no Smith Machine',
  // abdômen
  'Máquina de Abdominal',
  'Abdominal',
  'Prancha',
  'Elevação de Pernas na Barra',
  'Abdominal na Polia',
  'Abdominal com Corda no Pulley',
  'Abdominal Inverso',
  'Abdominal Cruzado',
  'Bicicleta no Ar',
  'Prancha Lateral',
  'Abdominal Declinado',
  // antebraço e trapézio
  'Flexão de Punho com Barra Sentado, Palma para Cima',
  'Rosca Inversa com Barra',
  'Rosca Inversa no Cabo',
  'Flexão de Punho com Halter Sentado, Palma para Cima',
  'Encolhimento de Ombros com Barra',
  'Encolhimento de Ombros com Halteres',
  'Encolhimento com Alavanca',
];

const sql = `-- Dieta e treino só com o que é básico (RN14 revista em 2026-11-03).
-- Gerada por scripts/gerar-migration-basicos.js; não editar à mão.
-- 1) base_alimentos ganha origem (fonte), id da TACO e o marcador e_basico.
--    Os 23.413 alimentos já existentes vêm do Open Food Facts (crowdsourcing,
--    com marca, suplemento e diet): ficam para a busca/registro, mas nunca
--    entram na geração do plano (e_basico = false).
-- 2) Entra a TACO 4ª ed. (NEPA/Unicamp, 2011): ${linhas.length} alimentos, ${Object.keys(BASICOS).length} marcados como básicos
--    (cozidos, grelhados ou frutas, com porção típica). ${semDados} da TACO ficam de fora por não terem
--    todos os macros na tabela.
-- 3) buscar_alimentos_rag só devolve e_basico.
-- 4) Exercícios: is_curado passa a valer só para os ${EXERCICIOS.length} exercícios básicos
--    de máquinas, barras, halteres, polias e peso do corpo comuns em academias.
-- Idempotente.

alter table public.base_alimentos
  add column if not exists fonte text not null default 'off' check (fonte in ('off', 'taco')),
  add column if not exists id_taco integer,
  add column if not exists e_basico boolean not null default false;

create unique index if not exists idx_base_alimentos_id_taco
  on public.base_alimentos (id_taco) where id_taco is not null;
create index if not exists idx_base_alimentos_basico
  on public.base_alimentos (e_basico) where e_basico;

insert into public.base_alimentos
  (id_taco, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g,
   fibras_100g, porcao_descricao, porcao_gramas, e_basico, fonte)
select v.id_taco, v.nome, v.categoria, v.kcal, v.prot, v.carb, v.lip, v.fibra,
       v.porcao_descricao, v.porcao_gramas, v.e_basico, 'taco'
from (values
${linhas.join(',\n')}
) as v(id_taco, nome, categoria, kcal, prot, carb, lip, fibra, porcao_descricao, porcao_gramas, e_basico)
where not exists (select 1 from public.base_alimentos a where a.id_taco = v.id_taco);

create or replace function public.buscar_alimentos_rag(
  query_embedding extensions.vector(1024),
  termos_excluidos text[] default null,
  termos_proteina text[] default null,
  limite_por_slot int default 20
)
returns table (
  id bigint,
  nome text,
  categoria text,
  calorias_100g numeric,
  proteinas_100g numeric,
  carboidratos_100g numeric,
  gorduras_100g numeric,
  slot text,
  similaridade float
)
language sql stable
security invoker
set search_path = public, extensions
as $$
  select id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g,
         gorduras_100g, slot, similaridade
  from (
    select c.*,
           row_number() over (
             partition by c.slot order by c.distancia nulls last, c.id
           ) as posicao
    from (
      select a.id, a.nome, a.categoria, a.calorias_100g, a.proteinas_100g,
             a.carboidratos_100g, a.gorduras_100g,
             a.embedding <=> query_embedding as distancia,
             1 - (a.embedding <=> query_embedding) as similaridade,
             case
               when a.proteinas_100g * 4 / a.calorias_100g >= 0.4 then 'proteina'
               when exists (select 1 from unnest(termos_proteina) t
                            where texto_sem_acento(a.nome || ' ' || a.categoria) like '%' || t || '%')
                 then 'proteina'
               when a.gorduras_100g * 9 / a.calorias_100g >= 0.6 then 'complemento'
               when a.carboidratos_100g * 4 / a.calorias_100g >= 0.5
                and a.carboidratos_100g >= 12 then 'carboidrato'
             end as slot
      from base_alimentos a
      where a.e_basico
        and a.calorias_100g > 0
        and a.proteinas_100g >= 0
        and a.carboidratos_100g >= 0
        and a.gorduras_100g >= 0
        and not exists (select 1 from unnest(termos_excluidos) t
                        where texto_sem_acento(a.nome || ' ' || a.categoria) like '%' || t || '%')
    ) c
    where c.slot is not null
  ) ranqueados
  where posicao <= least(greatest(limite_por_slot, 1), 50)
  order by similaridade desc nulls last, id;
$$;

update public.base_exercicios
set is_curado = nome in (${EXERCICIOS.map(q).join(', ')});
`;

const saida = path.join(
  aqui,
  '..',
  'supabase',
  'migrations',
  '20261103000000_alimentos_taco_e_basicos.sql',
);
fs.writeFileSync(saida, sql);
console.log(
  `${linhas.length} alimentos TACO (${semDados} sem dados), ${Object.keys(BASICOS).length} básicos, ${EXERCICIOS.length} exercícios → ${saida}`,
);
