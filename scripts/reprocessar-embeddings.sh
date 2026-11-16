#!/usr/bin/env bash
# Preenche os embeddings gte-small (`embedding_384`) chamando a Edge Function
# reprocessar-embeddings, um lote por chamada, até `restantes` zerar em todas as bases.
#
# LOCAL (padrão): `npx supabase functions serve --env-file <arquivo com REPROCESSAR_SEGREDO=...>`
#   REPROCESSAR_SEGREDO=<o mesmo> bash scripts/reprocessar-embeddings.sh
# REMOTO (só o dono executa): defina FUNCAO_URL=https://<ref>.supabase.co/functions/v1/reprocessar-embeddings
#   e ANON_KEY (a function tem verify_jwt ligado); o segredo é o secret REPROCESSAR_SEGREDO da function.
set -euo pipefail

: "${REPROCESSAR_SEGREDO:?defina REPROCESSAR_SEGREDO}"
FUNCAO_URL="${FUNCAO_URL:-http://127.0.0.1:54321/functions/v1/reprocessar-embeddings}"
ANON_KEY="${ANON_KEY:-}"

for _ in $(seq 1000); do
  resposta=$(curl -sf -X POST "$FUNCAO_URL" \
    -H "x-reprocessar-segredo: $REPROCESSAR_SEGREDO" \
    ${ANON_KEY:+-H "Authorization: Bearer $ANON_KEY"}) || { echo "Erro: a function recusou ou não respondeu." >&2; exit 1; }
  echo "$resposta"
  restantes=$(echo "$resposta" | node -e "let t='';process.stdin.on('data',d=>t+=d).on('end',()=>{const r=JSON.parse(t);console.log(Object.values(r).filter(v=>v&&typeof v==='object').reduce((s,v)=>s+v.restantes,0))})")
  [ "$restantes" = 0 ] && { echo "Embeddings em dia."; exit 0; }
done
echo "Erro: ainda há linhas sem embedding depois de 1000 chamadas." >&2
exit 1
