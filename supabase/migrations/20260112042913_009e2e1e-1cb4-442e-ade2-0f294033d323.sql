-- Create audit log table for owner-init and admin access attempts
CREATE TABLE public.owner_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'owner_init_view', 'owner_init_otp_request', 'owner_init_otp_verify', 'owner_init_success', 'owner_init_failed', 'admin_access_denied'
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_access_logs ENABLE ROW LEVEL SECURITY;

-- Only owners can view audit logs
CREATE POLICY "Only owners can view audit logs"
  ON public.owner_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.newsroom_members
      WHERE newsroom_members.user_id = auth.uid()
      AND newsroom_members.role = 'owner'
      AND newsroom_members.is_active = true
    )
  );

-- Anyone can insert (for logging attempts before auth)
CREATE POLICY "Anyone can insert audit logs"
  ON public.owner_access_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_owner_access_logs_email ON public.owner_access_logs(email);
CREATE INDEX idx_owner_access_logs_event_type ON public.owner_access_logs(event_type);
CREATE INDEX idx_owner_access_logs_created_at ON public.owner_access_logs(created_at DESC);