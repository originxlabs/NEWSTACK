-- Create push subscriptions table for PWA notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert subscriptions
CREATE POLICY "Anyone can insert push subscriptions" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (true);

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their subscriptions" 
  ON public.push_subscriptions FOR SELECT 
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their subscriptions" 
  ON public.push_subscriptions FOR UPDATE 
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Create index
CREATE INDEX idx_push_subscriptions_active ON public.push_subscriptions(is_active);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);