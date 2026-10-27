#!/usr/bin/env bash
# Popula as bases do Supabase LOCAL para a avaliação dos planos (etapa 13):
# troca as bases do seed pelo free-exercise-db completo e faz a ingestão da
# etapa 7 (Ollama local). Nunca no remoto. Só dados públicos/fictícios.
# O truncate apaga o plano da conta A do seed: `npx supabase db reset` o recria.
#
# COMO RODAR: npx supabase start && bash scripts/preparar-bases-locais.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER=supabase_db_FitApp
psql_local() { docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" ||
  { echo "Erro: banco local fora do ar. Rode \`npx supabase start\`." >&2; exit 1; }

chave=$(npx supabase status -o json | node -e "let t='';process.stdin.on('data',d=>t+=d).on('end',()=>process.stdout.write(JSON.parse(t).SERVICE_ROLE_KEY))")

# Recarrega do zero para o script poder rodar de novo.
psql_local -c "truncate base_exercicios, base_alimentos cascade"
# free-exercise-db traduzido (JSON local em scratch/), como no banco do dono.
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_KEY="$chave" node scripts/importar-exercicios.js > /dev/null
psql_local < supabase/seed/001_exercicios.sql
psql_local < supabase/seed/002_alimentos.sql
# A migration de curadoria rodou com a tabela vazia: repete só o UPDATE dela.
awk '/^update public.base_exercicios/,0' supabase/migrations/20261026000100_curadoria_base_exercicios.sql | psql_local
# PREMISSA: no banco local, os alimentos do seed (TACO) contam como curados;
# a curadoria real de alimentos é do banco do dono.
psql_local -c "update base_alimentos set is_curado = true"

SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY="$chave" node scripts/ingestao-conhecimento.ts > /dev/null
psql_local -Atc "select 'exercícios curados: ' || count(*) filter (where is_curado) from base_exercicios
  union all select 'alimentos curados: ' || count(*) filter (where is_curado) from base_alimentos
  union all select 'trechos de conhecimento: ' || count(*) from base_conhecimento"
