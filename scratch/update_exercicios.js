import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY
)

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function run() {
  const jsonPath = '/Users/gustavosoares/Documents/Projetos/FitApp/scratch/exercicios-bd-ptbr/exercises/exercises-ptbr-full-translation.json';
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  const { data: exerciciosDb, error } = await supabase.from('base_exercicios').select('id, nome, id_externo');
  if (error) {
    console.error('Error fetching db:', error);
    return;
  }

  // Pre-process json names
  const repoExs = json.map(ex => {
    return {
      ptName: ex.name,
      enId: ex.id.toLowerCase().replace(/_/g, ' ')
    };
  });

  let updatedCount = 0;
  
  for (const exDb of exerciciosDb) {
    const dbName = exDb.nome.toLowerCase().replace(/-/g, ' ');
    
    let bestMatch = null;
    let bestDist = Infinity;
    
    for (const repoEx of repoExs) {
      const dist = levenshtein(dbName, repoEx.enId);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = repoEx;
      }
    }
    
    // Calculate similarity score (0 to 1)
    const maxLength = Math.max(dbName.length, bestMatch.enId.length);
    const similarity = (maxLength - bestDist) / maxLength;
    
    if (similarity > 0.7) { // Reasonable threshold for matching names
      console.log(`Updating '${exDb.nome}' -> '${bestMatch.ptName}' (matched '${bestMatch.enId}', sim: ${similarity.toFixed(2)})`);
      
      const { error: updateErr } = await supabase
        .from('base_exercicios')
        .update({ nome: bestMatch.ptName })
        .eq('id', exDb.id);
        
      if (updateErr) {
        console.error('Failed to update:', updateErr);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`No good match for '${exDb.nome}' (best was '${bestMatch.enId}' with sim: ${similarity.toFixed(2)})`);
    }
  }

  console.log(`\nUpdated ${updatedCount} out of ${exerciciosDb.length} exercises.`);
}

run();
