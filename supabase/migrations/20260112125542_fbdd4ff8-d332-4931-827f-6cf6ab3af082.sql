-- Create table to log RSS ingestion runs with user/IP details
CREATE TABLE IF NOT EXISTS public.ingestion_user_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ingestion_run_id UUID REFERENCES public.ingestion_runs(id),
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  country_code TEXT,
  province_id TEXT,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.ingestion_user_logs ENABLE ROW LEVEL SECURITY;

-- Allow owners and superadmins to view all ingestion logs
CREATE POLICY "Newsroom owners can view ingestion logs"
  ON public.ingestion_user_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.newsroom_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'superadmin')
      AND is_active = true
    )
  );

-- Allow inserting logs from edge functions (using service role)
CREATE POLICY "Service role can insert ingestion logs"
  ON public.ingestion_user_logs
  FOR INSERT
  WITH CHECK (true);

-- Fix incorrect state/country data - remove Indian states from non-Indian stories
UPDATE public.stories 
SET state = NULL 
WHERE country_code != 'IN' 
AND state IN ('Goa', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Gujarat', 'Rajasthan', 'Punjab', 'West Bengal', 'Uttar Pradesh', 'Delhi', 'Andhra Pradesh', 'Telangana', 'Bihar', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh', 'Madhya Pradesh', 'Haryana', 'Himachal Pradesh', 'Uttarakhand');

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ingestion_user_logs_created_at ON public.ingestion_user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_user_logs_user_id ON public.ingestion_user_logs(user_id);