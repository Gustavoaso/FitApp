const fs = require('fs');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// Você deve rodar este script fornecendo as variáveis de ambiente:
// SUPABASE_URL=... SUPABASE_KEY=... node scripts/importar_off.js caminho/para/arquivo.csv
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://asuxqjbwgetdcldjoaqm.supabase.co';
// ATENÇÃO: Use a "Service Role Key" para ignorar políticas RLS (Row Level Security) durante a importação em massa.
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('ERRO: Defina a variável de ambiente SUPABASE_KEY antes de rodar o script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const FILE_PATH = process.argv[2];

if (!FILE_PATH) {
  console.error(
    'ERRO: Forneça o caminho do arquivo TSV. Ex: node scripts/importar_off.js dados.csv',
  );
  process.exit(1);
}

const BATCH_SIZE = 1000;
let batch = [];
let totalImported = 0;
let totalProcessed = 0;

// O arquivo do Open Food Facts utiliza Tabulação (\t) como delimitador, apesar da extensão ser .csv
const parser = parse({
  delimiter: '\t',
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
  skip_records_with_error: true,
});

async function insertBatch() {
  if (batch.length === 0) return;
  const currentBatch = [...batch];
  batch = []; // Limpa o batch para a próxima iteração

  const { error } = await supabase
    .from('base_alimentos')
    .upsert(currentBatch, { onConflict: 'codigo_barras' });

  if (error) {
    console.error('Erro ao inserir batch:', error.message);
  } else {
    totalImported += currentBatch.length;
    console.log(`Importados: ${totalImported} produtos válidos. Processados: ${totalProcessed}...`);
  }
}

console.log(`Iniciando a leitura do arquivo: ${FILE_PATH}`);

fs.createReadStream(FILE_PATH)
  .pipe(parser)
  .on('readable', async function () {
    let record;
    while ((record = parser.read()) !== null) {
      totalProcessed++;

      if (totalProcessed % 50000 === 0) {
        console.log(`Lendo o arquivo... ${totalProcessed} linhas analisadas até agora.`);
      }

      // Filtros do Open Food Facts:

      // 1. Deve ser vendido no Brasil (para economizar milhões de produtos inúteis no app)
      const countries = (record.countries_tags || '').toLowerCase();
      if (!countries.includes('brazil') && !countries.includes('brasil')) {
        continue;
      }

      // 2. Extrai os macronutrientes (converte para Float)
      const calorias = parseFloat(record['energy-kcal_100g']);
      const proteinas = parseFloat(record['proteins_100g']);
      const carboidratos = parseFloat(record['carbohydrates_100g']);
      const gorduras = parseFloat(record['fat_100g']);

      // 3. O produto DEVE ter a tabela nutricional completa preenchida (obrigatório para o app)
      if (isNaN(calorias) || isNaN(proteinas) || isNaN(carboidratos) || isNaN(gorduras)) {
        continue;
      }

      // Extrai categoria (limpando a string que as vezes vem com prefixos como "en:")
      let categoriaLimpa = record.main_category || record.categories || 'Sem categoria';
      if (categoriaLimpa.startsWith('en:')) categoriaLimpa = categoriaLimpa.replace('en:', '');
      if (categoriaLimpa.startsWith('pt:')) categoriaLimpa = categoriaLimpa.replace('pt:', '');

      // Formatação para o seu schema base_alimentos
      batch.push({
        codigo_barras: record.code,
        nome: record.product_name || 'Produto sem nome',
        marca: record.brands || null,
        categoria: categoriaLimpa,
        calorias_100g: calorias,
        proteinas_100g: proteinas,
        carboidratos_100g: carboidratos,
        gorduras_100g: gorduras,
        fibras_100g: parseFloat(record['fiber_100g']) || null,
        porcao_descricao: record.serving_size || null,
        porcao_gramas: parseFloat(record.serving_quantity) || null,
      });

      // Se atingiu o limite do batch, faz a inserção no Supabase
      if (batch.length >= BATCH_SIZE) {
        // Pausa a leitura do arquivo para aguardar a rede e o banco de dados
        parser.pause();
        await insertBatch();
        parser.resume();
      }
    }
  })
  .on('error', function (err) {
    console.error('Erro de leitura do arquivo:', err.message);
  })
  .on('end', async function () {
    // Insere os últimos itens que sobraram no array
    await insertBatch();
    console.log('✅ Finalizado com sucesso!');
    console.log(`Total geral processado no TSV: ${totalProcessed}`);
    console.log(`Total de produtos importados para o banco: ${totalImported}`);
  });
