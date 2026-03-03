-- Grant schema/table access for OpenNews schema.
GRANT USAGE ON SCHEMA opennews TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA opennews TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA opennews TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA opennews TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA opennews TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA opennews
GRANT SELECT ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA opennews
GRANT INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA opennews
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA opennews
GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
