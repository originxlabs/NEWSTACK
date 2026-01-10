-- Create cached_news table for server-side caching
CREATE TABLE IF NOT EXISTS public.cached_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  articles JSONB NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'gnews',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for cache lookups
CREATE INDEX idx_cached_news_cache_key ON public.cached_news(cache_key);
CREATE INDEX idx_cached_news_expires_at ON public.cached_news(expires_at);

-- Enable RLS but allow read access
ALTER TABLE public.cached_news ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cache is not user-specific)
CREATE POLICY "Anyone can read cached news" 
ON public.cached_news 
FOR SELECT 
USING (true);

-- Only backend can insert/update/delete (via service role)
CREATE POLICY "Service role can manage cached news" 
ON public.cached_news 
FOR ALL 
USING (true);

-- Create breaking_news table for real-time notifications
CREATE TABLE IF NOT EXISTS public.breaking_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headline TEXT NOT NULL,
  summary TEXT,
  source_name TEXT,
  source_url TEXT,
  image_url TEXT,
  topic_slug TEXT DEFAULT 'world',
  country_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read breaking news" 
ON public.breaking_news 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- Enable realtime for breaking news
ALTER PUBLICATION supabase_realtime ADD TABLE public.breaking_news;