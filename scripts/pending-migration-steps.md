# Pending Steps to Complete Full Old->New Supabase Clone

## 1) Provide source-project credentials
Required env vars for scripted completion:
- `OLD_SUPABASE_URL` (old project URL)
- `OLD_SERVICE_ROLE_KEY` (old project service_role key)
- `OLD_DB_URL` (old project Postgres connection string)
- `NEW_SUPABASE_URL` (defaults to `https://cpdxgnrpboreraiwcqgl.supabase.co`)
- `NEW_SERVICE_ROLE_KEY`
- `NEW_DB_URL` (new project Postgres connection string)

## 2) Set destination secrets
1. Copy `supabase/.secrets.new.env.example` -> `supabase/.secrets.new.env`
2. Fill all keys
3. Run:
```bash
scripts/set-supabase-secrets.sh
```

## 3) Run live schema/data export + apply
```bash
export OLD_DB_URL='postgresql://...'
export NEW_DB_URL='postgresql://...'
# Optional cutover flags:
# export APPLY_RLS_BUNDLE=true
# export APPLY_SEED_DATA=true
supabase/migration-bundle/20260302_204945_oref_to_cpdx/run_live_clone.sh
```

## 4) Migrate auth users (fallback strategy)
```bash
export OLD_SUPABASE_URL='https://<old-project-ref>.supabase.co'
export OLD_SERVICE_ROLE_KEY='...'
export NEW_SUPABASE_URL='https://cpdxgnrpboreraiwcqgl.supabase.co'
export NEW_SERVICE_ROLE_KEY='...'
# Dry run first
DRY_RUN=true node scripts/migrate-auth-users.mjs
# Execute
DRY_RUN=false node scripts/migrate-auth-users.mjs
```

## 5) Migrate storage buckets + objects
```bash
export OLD_SUPABASE_URL='https://<old-project-ref>.supabase.co'
export OLD_SERVICE_ROLE_KEY='...'
export NEW_SUPABASE_URL='https://cpdxgnrpboreraiwcqgl.supabase.co'
export NEW_SERVICE_ROLE_KEY='...'
# Dry run first
DRY_RUN=true node scripts/migrate-storage-objects.mjs
# Execute
DRY_RUN=false node scripts/migrate-storage-objects.mjs
```

## 6) Validate
```bash
scripts/verify-supabase-cutover.sh
scripts/smoke-test-functions.sh
```

## 7) Apply RSS expansion migration + ingestion updates
New migration file:
- `supabase/migrations/20260302221000_expand_rss_feeds_global_local.sql`

If Supabase CLI in repo root fails on `[[cron]]`, use temp workdir:
```bash
TMP_DIR="$(mktemp -d /tmp/newstack-db-push.XXXXXX)"
mkdir -p "$TMP_DIR/supabase"
cp -R supabase/migrations "$TMP_DIR/supabase/migrations"
cat > "$TMP_DIR/supabase/config.toml" <<'EOF'
project_id = "cpdxgnrpboreraiwcqgl"
EOF

# Requires linked project in this temp dir, or run with --db-url
supabase db push --linked --include-all --workdir "$TMP_DIR"
```

Deploy updated functions (same temp-workdir workaround):
```bash
TMP_FN_DIR="$(mktemp -d /tmp/newstack-fn-deploy.XXXXXX)"
mkdir -p "$TMP_FN_DIR/supabase"
cp -R supabase/functions "$TMP_FN_DIR/supabase/functions"
cat > "$TMP_FN_DIR/supabase/config.toml" <<'EOF'
project_id = "cpdxgnrpboreraiwcqgl"
EOF

supabase functions deploy ingest-rss --project-ref cpdxgnrpboreraiwcqgl --workdir "$TMP_FN_DIR" --no-verify-jwt
supabase functions deploy get-stories --project-ref cpdxgnrpboreraiwcqgl --workdir "$TMP_FN_DIR" --no-verify-jwt
supabase functions deploy sync-rss-feeds --project-ref cpdxgnrpboreraiwcqgl --workdir "$TMP_FN_DIR" --no-verify-jwt
```

Sync curated feed dataset to `rss_feeds` (idempotent upsert):
```bash
scripts/sync-rss-feeds.sh
```

Deactivate currently unhealthy feed URLs from latest health report:
```bash
scripts/deactivate-unhealthy-feeds.sh
```

## 8) Manual dashboard parity checks (non-SQL)
- Auth provider settings
- Site URL + redirect URLs
- SMTP and email templates
- Auth hook settings
- Storage access policies
