#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "Missing .env" >&2
  exit 1
fi

load_env_file() {
  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="${raw#"${raw%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" != *"="* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    key="${key%"${key##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < .env
}

load_env_file

PUBLIC_KEY="${VITE_SUPABASE_ANON_KEY:-${VITE_SUPABASE_PUBLISHABLE_KEY:-}}"

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${PUBLIC_KEY}" ]]; then
  echo "Missing VITE_SUPABASE_URL and public key (VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY) in .env" >&2
  exit 1
fi

echo "[1/3] api-health"
code=$(curl -sS -o /tmp/api_health_resp.json -w "%{http_code}" \
  "$VITE_SUPABASE_URL/functions/v1/api-health" \
  -H "apikey: $PUBLIC_KEY" \
  -H "Authorization: Bearer $PUBLIC_KEY")
echo "status=$code"
head -c 280 /tmp/api_health_resp.json; echo

echo "[2/3] get-stories"
code=$(curl -sS -o /tmp/get_stories_resp.json -w "%{http_code}" \
  "$VITE_SUPABASE_URL/functions/v1/get-stories" \
  -H "Content-Type: application/json" \
  -H "apikey: $PUBLIC_KEY" \
  -H "Authorization: Bearer $PUBLIC_KEY" \
  -d '{"feedType":"recent","page":1,"pageSize":5}')
echo "status=$code"
head -c 280 /tmp/get_stories_resp.json; echo

echo "[3/3] send-otp (expected to fail if RESEND_API_KEY missing)"
code=$(curl -sS -o /tmp/send_otp_resp.json -w "%{http_code}" \
  "$VITE_SUPABASE_URL/functions/v1/send-otp" \
  -H "Content-Type: application/json" \
  -H "apikey: $PUBLIC_KEY" \
  -H "Authorization: Bearer $PUBLIC_KEY" \
  -d '{"email":"migration-check@example.com"}')
echo "status=$code"
head -c 280 /tmp/send_otp_resp.json; echo
