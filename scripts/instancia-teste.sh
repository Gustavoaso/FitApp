#!/usr/bin/env bash
# Instância de teste: Supabase LOCAL com o seed + app no simulador iOS (Expo Go).
# Sem Expo web: o projeto não tem react-native-web.
# Nunca aponta para o banco remoto nem lê o .env (EXPO_NO_DOTENV).
#
# USO: bash scripts/instancia-teste.sh subir | derrubar
#   COM_EDGE=1 sobe também o edge-runtime (excluir-conta, gerar-plano); pede mais memória.
#   Geração de plano local: `npx supabase functions serve --env-file <arquivo com GROQ_API_KEY>`.
# Contas: conta-a@exemplo.com (com plano) e conta-b@exemplo.com (nova), senha senha-teste-123.
set -euo pipefail
cd "$(dirname "$0")/.."

ARQUIVO_PID="${TMPDIR:-/tmp}/fitapp-instancia-teste.pid"
LOG_EXPO="${TMPDIR:-/tmp}/fitapp-instancia-teste-expo.log"
# Mac de 8 GB: só banco, API, Auth e Kong.
EXCLUIR=studio,imgproxy,vector,logflare,realtime,storage-api,edge-runtime,supavisor,postgres-meta,mailpit

falhar() { echo "Erro: $1" >&2; exit 1; }

status_local() {
  npx supabase status -o json 2>/dev/null |
    node -e "let t='';process.stdin.on('data',d=>t+=d).on('end',()=>{const s=JSON.parse(t);console.log(s.API_URL+' '+s.ANON_KEY+' '+s.SERVICE_ROLE_KEY)})"
}

porta_livre() {
  local porta=8081
  while lsof -i ":$porta" -sTCP:LISTEN > /dev/null 2>&1; do porta=$((porta + 1)); done
  echo "$porta"
}

subir() {
  [ -f "$ARQUIVO_PID" ] && falhar "instância já no ar ($ARQUIVO_PID). Rode \`derrubar\` antes."

  local iniciou_supabase=0
  if ! status_local > /dev/null 2>&1; then
    [ "${COM_EDGE:-0}" = 1 ] && EXCLUIR=${EXCLUIR/edge-runtime,/}
    npx supabase start -x "$EXCLUIR"
    iniciou_supabase=1
  fi

  local url anon servico
  read -r url anon servico < <(status_local)
  case "$url" in
    http://127.0.0.1:*|http://localhost:*) ;;
    *) falhar "a URL do Supabase não é local ($url). Recusado." ;;
  esac

  npx supabase db reset
  # O reset reinicia os containers; espera o Auth voltar.
  for _ in $(seq 30); do
    curl -sf "$url/auth/v1/health" -H "apikey: $anon" > /dev/null && break
    sleep 2
  done

  # Base de conhecimento (RAG) sem vetor; scripts/reprocessar-embeddings.sh preenche com a function no ar.
  SUPABASE_URL="$url" SUPABASE_SERVICE_ROLE_KEY="$servico" node scripts/ingestao-conhecimento.ts > /dev/null

  local porta
  porta=$(porta_livre)
  # CI=1: sem perguntas. Sem --ios: ele usa osascript, que falha fora de um terminal.
  # set -m: o Expo fica num grupo de processos próprio e sobrevive ao fim deste shell.
  set -m
  EXPO_NO_DOTENV=1 CI=1 \
    EXPO_PUBLIC_SUPABASE_URL="$url" EXPO_PUBLIC_SUPABASE_ANON_KEY="$anon" \
    nohup npx expo start --clear --port "$porta" > "$LOG_EXPO" 2>&1 &
  set +m
  printf 'expo %s\nporta %s\nsupabase %s\n' "$!" "$porta" "$iniciou_supabase" > "$ARQUIVO_PID"

  for _ in $(seq 90); do
    curl -sf "http://localhost:$porta/status" | grep -q running && break
    sleep 2
  done
  curl -sf "http://localhost:$porta/status" | grep -q running ||
    { derrubar; falhar "o Expo não respondeu. Log: $LOG_EXPO"; }
  abrir_no_simulador "$porta"
  echo "App no ar: simulador iOS em exp://127.0.0.1:$porta (log: $LOG_EXPO)"
}

# Usa o simulador ligado ou liga o primeiro iPhone; o Expo Go precisa estar instalado nele.
abrir_no_simulador() {
  local porta=$1 aparelho
  if ! xcrun simctl list devices booted | grep -q iPhone; then
    aparelho=$(xcrun simctl list devices available | grep -m1 -oE 'iPhone[^(]*\(([0-9A-F-]{36})\)' | grep -oE '[0-9A-F-]{36}')
    [ -n "$aparelho" ] || falhar "nenhum simulador de iPhone disponível."
    xcrun simctl boot "$aparelho"
    open -a Simulator
  fi
  xcrun simctl listapps booted | grep -q host.exp.Exponent ||
    echo "Aviso: Expo Go não instalado no simulador; rode \`npx expo start --ios\` uma vez num terminal." >&2
  # No primeiro boot o openurl às vezes estoura o tempo; tenta de novo.
  for _ in 1 2 3; do
    xcrun simctl openurl booted "exp://127.0.0.1:$porta" 2> /dev/null && break
    sleep 5
  done
}

derrubar() {
  [ -f "$ARQUIVO_PID" ] || { echo "Nada no ar."; return 0; }
  local pid porta supabase
  pid=$(awk '$1=="expo"{print $2}' "$ARQUIVO_PID")
  porta=$(awk '$1=="porta"{print $2}' "$ARQUIVO_PID")
  supabase=$(awk '$1=="supabase"{print $2}' "$ARQUIVO_PID")

  kill -- "-$pid" 2> /dev/null || true
  # O Metro pode ficar num processo neto; libera a porta de qualquer jeito.
  local restantes
  restantes=$(lsof -ti ":$porta" -sTCP:LISTEN || true)
  [ -n "$restantes" ] && kill $restantes 2> /dev/null || true
  # Só para o Supabase se foi este script que o subiu.
  [ "$supabase" = 1 ] && npx supabase stop
  rm -f "$ARQUIVO_PID"
  echo "Instância derrubada (porta $porta livre)."
}

case "${1:-}" in
  subir) subir ;;
  derrubar) derrubar ;;
  *) falhar "uso: bash scripts/instancia-teste.sh subir|derrubar" ;;
esac
