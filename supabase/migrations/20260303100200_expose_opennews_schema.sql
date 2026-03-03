-- Ensure PostgREST can access OpenNews schema for Edge Function REST queries.
DO $$
BEGIN
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_schemas = ''public,storage,graphql_public,opennews''';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter authenticator pgrst.db_schemas: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload config';
