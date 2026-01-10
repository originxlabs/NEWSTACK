-- Create stories table for canonical deduplicated news
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_hash TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  normalized_headline TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  category TEXT DEFAULT 'world',
  country_code TEXT,
  city TEXT,
  is_global BOOLEAN DEFAULT true,
  first_published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_count INTEGER DEFAULT 1,
  engagement_reads INTEGER DEFAULT 0,
  engagement_listens INTEGER DEFAULT 0,
  engagement_saves INTEGER DEFAULT 0,
  trend_score NUMERIC DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_sources table for tracking all sources of a story
CREATE TABLE IF NOT EXISTS public.story_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, source_url)
);

-- Create RSS feeds configuration table
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'world',
  country_code TEXT,
  language TEXT DEFAULT 'en',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_last_updated ON public.stories(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_trend_score ON public.stories(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_country ON public.stories(country_code);
CREATE INDEX IF NOT EXISTS idx_stories_normalized ON public.stories(normalized_headline);
CREATE INDEX IF NOT EXISTS idx_story_sources_story ON public.story_sources(story_id);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

-- Public read access for stories (everyone can read news)
CREATE POLICY "Stories are publicly readable" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Story sources are publicly readable" ON public.story_sources FOR SELECT USING (true);
CREATE POLICY "RSS feeds are publicly readable" ON public.rss_feeds FOR SELECT USING (true);

-- Insert initial RSS feeds
INSERT INTO public.rss_feeds (name, url, category, country_code, priority) VALUES
-- India feeds
('The Hindu', 'https://www.thehindu.com/news/feeder/default.rss', 'world', 'IN', 80),
('The Hindu National', 'https://www.thehindu.com/news/national/feeder/default.rss', 'politics', 'IN', 85),
('The Hindu Business', 'https://www.thehindu.com/business/feeder/default.rss', 'business', 'IN', 75),
('Indian Express', 'https://indianexpress.com/section/india/feed/', 'world', 'IN', 80),
('Indian Express World', 'https://indianexpress.com/section/world/feed/', 'world', 'IN', 70),
('LiveMint', 'https://www.livemint.com/rss/news', 'business', 'IN', 75),
('NDTV', 'https://feeds.feedburner.com/ndtvnews-top-stories', 'world', 'IN', 80),
-- Global feeds
('Reuters Top', 'https://feeds.reuters.com/reuters/topNews', 'world', NULL, 95),
('Reuters World', 'https://feeds.reuters.com/Reuters/worldNews', 'world', NULL, 90),
('BBC News', 'http://feeds.bbci.co.uk/news/rss.xml', 'world', NULL, 95),
('BBC World', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'world', NULL, 90),
('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'world', NULL, 85),
('NPR', 'https://feeds.npr.org/1001/rss.xml', 'world', NULL, 80)
ON CONFLICT (url) DO NOTHING;

-- Create function to update trend scores
CREATE OR REPLACE FUNCTION public.calculate_trend_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate trend score based on source count, recency, and engagement
  NEW.trend_score := (
    (NEW.source_count * 10 * 0.5) +
    (GREATEST(0, 100 - EXTRACT(EPOCH FROM (now() - NEW.first_published_at)) / 3600) * 0.3) +
    ((NEW.engagement_reads + NEW.engagement_listens * 2 + NEW.engagement_saves * 3) * 0.2)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trend score calculation
DROP TRIGGER IF EXISTS update_trend_score ON public.stories;
CREATE TRIGGER update_trend_score
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_trend_score();