-- Add state_id column to rss_feeds for per-state feed mapping
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS state_id TEXT;

-- Add feed health tracking columns
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS total_fetch_count INTEGER DEFAULT 0;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS avg_stories_per_fetch NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS last_error_message TEXT;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;

-- Create index on state_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_state_id ON public.rss_feeds(state_id);

-- Create ingestion user access table for tracking who triggered ingestion
CREATE TABLE IF NOT EXISTS public.ingestion_access_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  location JSONB,
  terms_accepted BOOLEAN DEFAULT false,
  cookie_policy_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_ingestion_at TIMESTAMP WITH TIME ZONE,
  total_ingestions INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  otp_verified_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS to ingestion_access_users
ALTER TABLE public.ingestion_access_users ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for registration)
CREATE POLICY "Public can insert access users"
  ON public.ingestion_access_users
  FOR INSERT
  WITH CHECK (true);

-- Allow reading own data
CREATE POLICY "Users can read their own data"
  ON public.ingestion_access_users
  FOR SELECT
  USING (true);

-- Allow updates
CREATE POLICY "Users can update their own data"
  ON public.ingestion_access_users
  FOR UPDATE
  USING (true);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_ingestion_access_users_email ON public.ingestion_access_users(email);

-- Add ingestion_access_user_id to ingestion_user_logs for linking
ALTER TABLE public.ingestion_user_logs ADD COLUMN IF NOT EXISTS access_user_id UUID REFERENCES public.ingestion_access_users(id);

-- Create per-feed fetch results table
CREATE TABLE IF NOT EXISTS public.feed_fetch_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_run_id UUID REFERENCES public.ingestion_runs(id),
  feed_id UUID REFERENCES public.rss_feeds(id),
  feed_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stories_fetched INTEGER DEFAULT 0,
  stories_inserted INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feed_fetch_results
ALTER TABLE public.feed_fetch_results ENABLE ROW LEVEL SECURITY;

-- Allow public read for monitoring
CREATE POLICY "Public can read feed fetch results"
  ON public.feed_fetch_results
  FOR SELECT
  USING (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_feed_fetch_results_run_id ON public.feed_fetch_results(ingestion_run_id);
CREATE INDEX IF NOT EXISTS idx_feed_fetch_results_feed_id ON public.feed_fetch_results(feed_id);