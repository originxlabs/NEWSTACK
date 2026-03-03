#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="cpdxgnrpboreraiwcqgl"
SECRETS_FILE="supabase/.secrets.new.env"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Missing $SECRETS_FILE. Copy supabase/.secrets.new.env.example first." >&2
  exit 1
fi

supabase secrets set --project-ref "$PROJECT_REF" --env-file "$SECRETS_FILE"
supabase secrets list --project-ref "$PROJECT_REF"
