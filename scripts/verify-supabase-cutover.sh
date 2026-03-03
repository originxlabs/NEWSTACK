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

OLD_REF="${OLD_REF:-}"
NEW_REF="${NEW_REF:-${VITE_SUPABASE_PROJECT_ID:-}}"

if [[ -z "${NEW_REF}" ]]; then
  echo "Missing NEW_REF and VITE_SUPABASE_PROJECT_ID" >&2
  exit 1
fi

echo "[1/6] Verify runtime old project references are gone"
if [[ -n "${OLD_REF}" ]]; then
  rg -n "${OLD_REF}|https://${OLD_REF}\\.supabase\\.co" \
    .env src vercel.json supabase/config.toml -S || true
else
  echo "Skipping old-ref grep (set OLD_REF to enable strict old-project scan)."
fi

echo "[2/6] Verify target refs present in active config"
rg -n "${NEW_REF}" .env vercel.json supabase/config.toml -S

echo "[3/6] Verify service-role key is not exposed in frontend code"
if rg -n "SUPABASE_SERVICE_ROLE_KEY" src -S; then
  echo "ERROR: Found service role key reference in frontend" >&2
  exit 1
fi

echo "[4/6] Build application"
npm run build

echo "[5/6] Verify migration bundle files exist"
ls -la supabase/migration-bundle/*_oref_to_cpdx/*.sql

echo "[6/6] Done. Run auth/RLS smoke tests manually from app and SQL checks."
