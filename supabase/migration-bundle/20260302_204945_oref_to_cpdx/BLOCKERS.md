# Migration Blockers (Live Old->New Clone)

## 1) Old Project Access
Attempting to access the source project from current Supabase CLI profile returns `403` (insufficient privileges).

Affected commands:
- `supabase link --project-ref <old_project_ref>`
- `supabase secrets list --project-ref <old_project_ref>`

## 2) Docker Not Running for `supabase db dump`
`supabase db dump` requires Docker on this machine with current CLI (`v2.67.1`).

Error seen:
- `failed to inspect docker image: Cannot connect to the Docker daemon ...`

## Resolution Paths
- Provide old-project DB connection string (`OLD_DB_URL`) so `pg_dump`/`psql` can be used directly without Supabase project-level access.
- Or grant this CLI profile access to the source project.
- Start Docker Desktop if `supabase db dump` workflow is preferred.

## Already Completed
- New project runtime config switched (`.env`, `vercel.json`, `supabase/config.toml`).
- New project DB migrations pushed successfully.
- All edge functions deployed to destination project.
- TypeScript Supabase types regenerated from destination project.
