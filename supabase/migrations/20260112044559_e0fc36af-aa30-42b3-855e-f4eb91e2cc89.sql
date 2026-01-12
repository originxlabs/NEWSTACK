-- Add password_last_set_at to newsroom_members for 30-day expiry tracking
ALTER TABLE public.newsroom_members 
ADD COLUMN IF NOT EXISTS password_last_set_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing owner records to have password_last_set_at set
UPDATE public.newsroom_members 
SET password_last_set_at = now() 
WHERE password_last_set_at IS NULL;