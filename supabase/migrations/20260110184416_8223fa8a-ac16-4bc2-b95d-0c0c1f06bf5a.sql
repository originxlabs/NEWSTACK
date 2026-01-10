-- Add admin_emails column to identify admins (email-based)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin list
CREATE POLICY "Admins can view admin list" 
  ON public.admin_users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Add premium features to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_donations INTEGER DEFAULT 0;

-- RSS feed ingestion logs for health monitoring
CREATE TABLE public.rss_ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID,
  feed_name TEXT,
  feed_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  stories_fetched INTEGER DEFAULT 0,
  stories_inserted INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rss_ingestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ingestion logs" 
  ON public.rss_ingestion_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert ingestion logs" 
  ON public.rss_ingestion_logs FOR INSERT 
  WITH CHECK (true);

-- Page views analytics
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views" 
  ON public.page_views FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view page views" 
  ON public.page_views FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Click events for clickstream analytics
CREATE TABLE public.click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID,
  element_id TEXT,
  element_type TEXT,
  element_text TEXT,
  page_path TEXT,
  x_position INTEGER,
  y_position INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert click events" 
  ON public.click_events FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view click events" 
  ON public.click_events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Cron job execution logs
CREATE TABLE public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cron logs" 
  ON public.cron_job_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert cron logs" 
  ON public.cron_job_logs FOR INSERT 
  WITH CHECK (true);

-- Update donations table to track Razorpay details
ALTER TABLE public.donations 
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS subscription_months INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium_granted BOOLEAN DEFAULT false;

-- Create indexes for analytics queries
CREATE INDEX idx_page_views_date ON public.page_views(created_at);
CREATE INDEX idx_page_views_path ON public.page_views(page_path);
CREATE INDEX idx_click_events_date ON public.click_events(created_at);
CREATE INDEX idx_rss_ingestion_logs_date ON public.rss_ingestion_logs(created_at);
CREATE INDEX idx_cron_job_logs_date ON public.cron_job_logs(created_at);
CREATE INDEX idx_donations_date ON public.donations(created_at);

-- Allow admins to manage RSS feeds
CREATE POLICY "Admins can insert RSS feeds" 
  ON public.rss_feeds FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can update RSS feeds" 
  ON public.rss_feeds FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can delete RSS feeds" 
  ON public.rss_feeds FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Anyone can read RSS feeds" 
  ON public.rss_feeds FOR SELECT 
  USING (true);