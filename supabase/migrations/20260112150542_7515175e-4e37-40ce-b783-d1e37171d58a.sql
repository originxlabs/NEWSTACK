-- Create enterprise_subscriptions table for API plan management
CREATE TABLE public.enterprise_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'sandbox', -- sandbox, starter, pro, enterprise
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, annual
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, pending
  razorpay_subscription_id TEXT,
  razorpay_order_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  price_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  enterprise_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create api_usage_tracking table for detailed usage analytics
CREATE TABLE public.api_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID,
  enterprise_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  response_time_ms INTEGER,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_hour INTEGER DEFAULT EXTRACT(HOUR FROM now()),
  ip_address TEXT,
  user_agent TEXT,
  is_sandbox BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily/monthly aggregation table for fast dashboard queries
CREATE TABLE public.api_usage_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  news_requests INTEGER DEFAULT 0,
  world_requests INTEGER DEFAULT 0,
  places_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(api_key_id, usage_date)
);

-- Add enterprise_id to api_keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS enterprise_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.enterprise_subscriptions(id);

-- Create function to generate enterprise ID
CREATE OR REPLACE FUNCTION public.generate_enterprise_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ENT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE public.enterprise_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_daily ENABLE ROW LEVEL SECURITY;

-- RLS policies for enterprise_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.enterprise_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.enterprise_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.enterprise_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for api_usage_tracking (via api_key ownership)
CREATE POLICY "Users can view usage for their API keys"
ON public.api_usage_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE api_keys.id = api_usage_tracking.api_key_id 
    AND api_keys.customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- RLS policies for api_usage_daily
CREATE POLICY "Users can view daily usage for their API keys"
ON public.api_usage_daily FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE api_keys.id = api_usage_daily.api_key_id 
    AND api_keys.customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Create index for faster queries
CREATE INDEX idx_api_usage_tracking_api_key_date ON public.api_usage_tracking(api_key_id, request_date);
CREATE INDEX idx_api_usage_tracking_enterprise_id ON public.api_usage_tracking(enterprise_id);
CREATE INDEX idx_api_usage_daily_api_key_date ON public.api_usage_daily(api_key_id, usage_date);
CREATE INDEX idx_enterprise_subscriptions_user ON public.enterprise_subscriptions(user_id);
CREATE INDEX idx_api_keys_enterprise_id ON public.api_keys(enterprise_id);