-- Harden ingestion access and manual trigger surfaces.

ALTER TABLE public.ingestion_access_users
  ADD COLUMN IF NOT EXISTS qr_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qr_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_email TEXT;

CREATE OR REPLACE FUNCTION public.is_newsroom_admin_or_higher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_newsroom_role(_user_id) IN ('owner', 'superadmin', 'admin');
$$;

-- Replace permissive ingestion_access_users policies.
DROP POLICY IF EXISTS "Public can insert access users" ON public.ingestion_access_users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.ingestion_access_users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.ingestion_access_users;

CREATE POLICY "Ingestion access users read own or admin"
ON public.ingestion_access_users
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  OR public.is_newsroom_admin_or_higher(auth.uid())
);

CREATE POLICY "Ingestion access users insert admin only"
ON public.ingestion_access_users
FOR INSERT
TO authenticated
WITH CHECK (
  lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  AND public.is_newsroom_admin_or_higher(auth.uid())
);

CREATE POLICY "Ingestion access users update own or admin"
ON public.ingestion_access_users
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  OR public.is_newsroom_admin_or_higher(auth.uid())
)
WITH CHECK (
  lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  OR public.is_newsroom_admin_or_higher(auth.uid())
);

-- ingestion_user_logs: include admin in read scope.
DROP POLICY IF EXISTS "Newsroom owners can view ingestion logs" ON public.ingestion_user_logs;
CREATE POLICY "Newsroom admins can view ingestion logs"
  ON public.ingestion_user_logs
  FOR SELECT
  TO authenticated
  USING (public.is_newsroom_admin_or_higher(auth.uid()));

-- Restrict run/feed telemetry tables to admin+ only.
DROP POLICY IF EXISTS "Public can read ingestion runs" ON public.ingestion_runs;
CREATE POLICY "Newsroom admins can read ingestion runs"
  ON public.ingestion_runs
  FOR SELECT
  TO authenticated
  USING (public.is_newsroom_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Public can read feed fetch results" ON public.feed_fetch_results;
CREATE POLICY "Newsroom admins can read feed fetch results"
  ON public.feed_fetch_results
  FOR SELECT
  TO authenticated
  USING (public.is_newsroom_admin_or_higher(auth.uid()));
