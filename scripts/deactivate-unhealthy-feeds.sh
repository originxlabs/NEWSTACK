#!/usr/bin/env bash
set -euo pipefail

HEALTH_CSV_PATH="${1:-data/rss-feeds/current-feed-health-20260302.csv}"
PAYLOAD_PATH="/tmp/newstack-deactivate-unhealthy.json"

if [[ ! -f .env ]]; then
  echo "Missing .env" >&2
  exit 1
fi

if [[ ! -f "$HEALTH_CSV_PATH" ]]; then
  echo "Missing health CSV: $HEALTH_CSV_PATH" >&2
  exit 1
fi

load_env_file() {
  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="${raw#${raw%%[![:space:]]*}}"
    line="${line%${line##*[![:space:]]}}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" != *"="* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    key="${key%${key##*[![:space:]]}}"
    key="${key#${key%%[![:space:]]*}}"
    value="${value#${value%%[![:space:]]*}}"
    value="${value%${value##*[![:space:]]}}"

    [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < .env
}

load_env_file

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
PUBLIC_KEY="${VITE_SUPABASE_ANON_KEY:-${VITE_SUPABASE_PUBLISHABLE_KEY:-}}"
SYNC_SECRET="${CRON_INGEST_SECRET:-}"

if [[ -z "$SUPABASE_URL" || -z "$PUBLIC_KEY" || -z "$SYNC_SECRET" ]]; then
  echo "Missing VITE_SUPABASE_URL, public key, or CRON_INGEST_SECRET in .env" >&2
  exit 1
fi

python3 - <<'PY' "$HEALTH_CSV_PATH" "$PAYLOAD_PATH"
import csv, json, sys
health_path, payload_path = sys.argv[1], sys.argv[2]
rows = list(csv.DictReader(open(health_path, encoding='utf-8')))
urls = sorted({r['url'] for r in rows if r.get('status') != 'ok' and r.get('url')})
with open(payload_path, 'w', encoding='utf-8') as f:
    json.dump({'deactivate_urls': urls}, f)
print(f"Prepared deactivate payload with {len(urls)} URLs")
PY

curl -sS "$SUPABASE_URL/functions/v1/sync-rss-feeds" \
  -H "Content-Type: application/json" \
  -H "apikey: $PUBLIC_KEY" \
  -H "Authorization: Bearer $PUBLIC_KEY" \
  -H "x-sync-secret: $SYNC_SECRET" \
  --data-binary "@$PAYLOAD_PATH"

echo
echo "Deactivation sync completed."
