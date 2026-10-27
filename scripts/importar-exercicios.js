import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

async function run() {
  const jsonPath = '/Users/gustavosoares/Documents/Projetos/FitApp/scratch/exercicios-bd-ptbr/exercises/exercises-ptbr-full-translation.json';
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log('Deletando todos os exercícios atuais...');
  const { error: deleteErr } = await supabase
    .from('base_exercicios')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Truncate equivalent in Supabase JS (matches all rows)

  if (deleteErr) {
    console.error('Erro ao deletar:', deleteErr);
    return;
  }

  console.log('Mapeando novos exercícios...');
  const novosExercicios = json.map(ex => ({
    nome: ex.name,
    grupo_primario: ex.primaryMuscles ? ex.primaryMuscles.join(', ') : null,
    grupo_secundario: ex.secondaryMuscles ? ex.secondaryMuscles.join(', ') : null,
    equipamento: ex.equipment || 'não especificado',
    nivel: ex.level,
    instrucoes: ex.instructions ? ex.instructions.join('\n') : null,
    id_externo: ex.id,
    gif_url: ex.images && ex.images.length > 0
      ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`
      : null
  }));

  console.log(`Inserindo ${novosExercicios.length} exercícios...`);

  // Supabase limits bulk inserts, so we'll do chunks of 200
  const chunkSize = 200;
  for (let i = 0; i < novosExercicios.length; i += chunkSize) {
    const chunk = novosExercicios.slice(i, i + chunkSize);
    const { error: insertErr } = await supabase
      .from('base_exercicios')
      .insert(chunk);

    if (insertErr) {
      console.error(`Erro ao inserir chunk ${i}:`, insertErr);
    } else {
      console.log(`Inseridos de ${i} a ${i + chunk.length}`);
    }
  }

  console.log('Importação concluída com sucesso!');
}

run();
