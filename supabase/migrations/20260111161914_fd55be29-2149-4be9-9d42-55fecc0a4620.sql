-- API Keys table for customer API access
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  requests_limit INTEGER NOT NULL DEFAULT 100000,
  requests_used INTEGER NOT NULL DEFAULT 0,
  rate_limit_per_second INTEGER NOT NULL DEFAULT 10,
  allowed_endpoints TEXT[] DEFAULT ARRAY['news'],
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- API Key usage logs for tracking
CREATE TABLE public.api_key_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook subscriptions for customers
CREATE TABLE public.webhook_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['story.created'],
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status_code INTEGER,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  delivery_time_ms INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only owner/superadmin can manage API keys
CREATE POLICY "Owner and superadmin can view API keys"
ON public.api_keys FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can create API keys"
ON public.api_keys FOR INSERT
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can update API keys"
ON public.api_keys FOR UPDATE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can delete API keys"
ON public.api_keys FOR DELETE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Usage logs - owner/superadmin can view
CREATE POLICY "Owner and superadmin can view usage logs"
ON public.api_key_usage_logs FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Webhook subscriptions - owner/superadmin can manage
CREATE POLICY "Owner and superadmin can view webhook subscriptions"
ON public.webhook_subscriptions FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can create webhook subscriptions"
ON public.webhook_subscriptions FOR INSERT
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can update webhook subscriptions"
ON public.webhook_subscriptions FOR UPDATE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can delete webhook subscriptions"
ON public.webhook_subscriptions FOR DELETE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Webhook delivery logs - owner/superadmin can view
CREATE POLICY "Owner and superadmin can view webhook delivery logs"
ON public.webhook_delivery_logs FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_api_keys_api_key ON public.api_keys(api_key);
CREATE INDEX idx_api_keys_customer_email ON public.api_keys(customer_email);
CREATE INDEX idx_api_key_usage_logs_api_key_id ON public.api_key_usage_logs(api_key_id);
CREATE INDEX idx_api_key_usage_logs_created_at ON public.api_key_usage_logs(created_at DESC);
CREATE INDEX idx_webhook_subscriptions_api_key_id ON public.webhook_subscriptions(api_key_id);
CREATE INDEX idx_webhook_delivery_logs_subscription_id ON public.webhook_delivery_logs(subscription_id);

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_prefix TEXT := 'nsk_';
  key_suffix TEXT;
BEGIN
  key_suffix := encode(gen_random_bytes(24), 'base64');
  key_suffix := replace(replace(replace(key_suffix, '+', ''), '/', ''), '=', '');
  RETURN key_prefix || substring(key_suffix from 1 for 32);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate webhook secret
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS TEXT AS $$
DECLARE
  secret TEXT;
BEGIN
  secret := encode(gen_random_bytes(32), 'hex');
  RETURN 'whsec_' || secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;