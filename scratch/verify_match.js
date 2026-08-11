import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY
)

async function run() {
  const json = JSON.parse(fs.readFileSync('/Users/gustavosoares/Documents/Projetos/FitApp/scratch/exercicios-bd-ptbr/exercises/exercises-ptbr-full-translation.json', 'utf8'))
  
  const { data: exerciciosDb, error } = await supabase.from('base_exercicios').select('id, nome, id_externo')
  if (error) throw error

  let matches = 0
  let noMatches = []

  // Create a map from normalized ID to translated exercise
  const map = {}
  for (const ex of json) {
    const normalizedId = ex.id.toLowerCase().replace(/_/g, ' ')
    map[normalizedId] = ex
  }

  for (const exDb of exerciciosDb) {
    const normalizedName = exDb.nome.toLowerCase().replace(/-/g, ' ')
    
    // try to find in map
    let found = null
    // some might have dashes instead of spaces
    for (const key of Object.keys(map)) {
      if (key.replace(/-/g, ' ') === normalizedName) {
        found = map[key]
        break
      }
    }
    
    if (found) {
      matches++
    } else {
      noMatches.push(exDb.nome)
    }
  }

  console.log(`Matches: ${matches}`)
  console.log(`No matches: ${noMatches.length}`)
  if (noMatches.length > 0) {
    console.log('Sample no matches:', noMatches.slice(0, 5))
  }
}

run()
