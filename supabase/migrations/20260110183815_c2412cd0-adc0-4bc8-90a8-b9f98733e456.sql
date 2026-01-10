-- Create table to track newsletter popup analytics
CREATE TABLE public.newsletter_popup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'close', 'submit')),
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  popup_trigger_minute INTEGER,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.newsletter_popup_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (anonymous tracking)
CREATE POLICY "Anyone can create popup events" 
  ON public.newsletter_popup_events FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read for analytics (can restrict later if needed)
CREATE POLICY "Anyone can read popup events" 
  ON public.newsletter_popup_events FOR SELECT 
  USING (true);

-- Create indexes for analytics queries
CREATE INDEX idx_newsletter_popup_events_type_date 
  ON public.newsletter_popup_events(event_type, created_at);

CREATE INDEX idx_newsletter_popup_events_trigger 
  ON public.newsletter_popup_events(popup_trigger_minute, created_at);