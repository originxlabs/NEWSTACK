#!/usr/bin/env bash
set -euo pipefail

# Required env vars:
#   OLD_DB_URL: postgres connection string to source project
#   NEW_DB_URL: postgres connection string to destination project
# Optional:
#   BUNDLE_DIR: output dir (default: this script directory)
#   APPLY_RLS_BUNDLE: set to true to replay rls_policies.sql (default: false)
#   APPLY_SEED_DATA: set to true to replay seed_data.sql (default: false)

OLD_REF="${OLD_REF:-source_project}"
NEW_REF="${NEW_REF:-destination_project}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_DIR="${BUNDLE_DIR:-$SCRIPT_DIR}"
APPLY_RLS_BUNDLE="${APPLY_RLS_BUNDLE:-false}"
APPLY_SEED_DATA="${APPLY_SEED_DATA:-false}"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TMP_WORKDIR="$(mktemp -d /tmp/newstack-supa-migrate.XXXXXX)"
cleanup() { rm -rf "$TMP_WORKDIR"; }
trap cleanup EXIT

if [[ -z "${OLD_DB_URL:-}" || -z "${NEW_DB_URL:-}" ]]; then
  echo "ERROR: Set OLD_DB_URL and NEW_DB_URL before running." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump is required but not installed." >&2
  exit 1
fi

echo "[1/9] Exporting schema from old project ${OLD_REF}"
pg_dump "$OLD_DB_URL" \
  --schema=public --schema=auth --schema=storage --schema=extensions \
  --schema-only --no-owner --no-privileges \
  --file "$BUNDLE_DIR/schema.sql"

echo "[2/9] Exporting public data from old project ${OLD_REF}"
pg_dump "$OLD_DB_URL" \
  --schema=public --data-only --no-owner --no-privileges \
  --file "$BUNDLE_DIR/seed_data.sql"

echo "[3/9] Exporting storage bucket definitions"
pg_dump "$OLD_DB_URL" \
  --table=storage.buckets --data-only --no-owner --no-privileges \
  --file "$BUNDLE_DIR/storage_buckets.sql"
{
  echo
  echo "-- Storage buckets from source project"
  cat "$BUNDLE_DIR/storage_buckets.sql"
} >> "$BUNDLE_DIR/seed_data.sql"

echo "[4/9] Deriving RLS policy file"
perl -0777 -ne 'while(/((?:ALTER TABLE\s+[^;]+(?:ENABLE|FORCE)\s+ROW LEVEL SECURITY;)|(?:CREATE POLICY\s+.+?;))/gms){print "$1\n\n"}' \
  "$BUNDLE_DIR/schema.sql" > "$BUNDLE_DIR/rls_policies.sql"

echo "[5/9] Applying local migrations to destination project ${NEW_REF}"
mkdir -p "$TMP_WORKDIR/supabase"
cp -R "$REPO_ROOT/supabase/migrations" "$TMP_WORKDIR/supabase/"
(
  cd "$TMP_WORKDIR"
  supabase db push --db-url "$NEW_DB_URL" --include-all
)

echo "[6/9] Optionally applying RLS bundle (APPLY_RLS_BUNDLE=${APPLY_RLS_BUNDLE})"
if [[ "$APPLY_RLS_BUNDLE" == "true" ]]; then
  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f "$BUNDLE_DIR/rls_policies.sql"
else
  echo "Skipping explicit RLS replay (already included in migrations)."
fi

echo "[7/9] Optionally applying seed/data bundle (APPLY_SEED_DATA=${APPLY_SEED_DATA})"
if [[ "$APPLY_SEED_DATA" == "true" ]]; then
  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f "$BUNDLE_DIR/seed_data.sql"
else
  echo "Skipping data replay by default; enable for maintenance-window cutover."
fi

echo "[8/9] Deploying edge functions"
cp -R "$REPO_ROOT/supabase/functions" "$TMP_WORKDIR/supabase/"
for fn in $(ls "$TMP_WORKDIR/supabase/functions"); do
  (
    cd "$TMP_WORKDIR"
    supabase functions deploy "$fn" --project-ref "$NEW_REF" --no-verify-jwt
  )
done

echo "[9/9] Complete. Next: set secrets + run verification script."
