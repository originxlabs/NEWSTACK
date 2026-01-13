-- Ensure ingestion run metrics are publicly readable for dashboards
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'ingestion_runs'
      AND policyname = 'Public can read ingestion runs'
  ) THEN
    CREATE POLICY "Public can read ingestion runs"
    ON public.ingestion_runs
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Optional: ingestion user logs are safe to show only in aggregate; keep table protected by default.
-- (No policy changes here.)
