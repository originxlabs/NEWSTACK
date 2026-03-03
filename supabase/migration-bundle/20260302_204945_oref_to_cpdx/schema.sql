-- NEWSTACK baseline schema assembled from local migration files
-- Source project (intended): <old_project_ref>
-- Target project (intended): cpdxgnrpboreraiwcqgl
-- Generated at: 2026-03-02T15:19:45Z

-- ==================================================================
-- FILE: supabase/migrations/20260110112813_c656c790-7c30-4cc7-b7a0-360c6317c566.sql
-- ==================================================================
-- Languages table for multilingual support
CREATE TABLE public.languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  direction TEXT DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl'))
);

-- Insert supported languages
INSERT INTO public.languages (code, name, native_name, direction) VALUES
  ('en', 'English', 'English', 'ltr'),
  ('hi', 'Hindi', 'हिन्दी', 'ltr'),
  ('es', 'Spanish', 'Español', 'ltr'),
  ('fr', 'French', 'Français', 'ltr'),
  ('de', 'German', 'Deutsch', 'ltr'),
  ('zh', 'Chinese', '中文', 'ltr'),
  ('ja', 'Japanese', '日本語', 'ltr'),
  ('ar', 'Arabic', 'العربية', 'rtl'),
  ('pt', 'Portuguese', 'Português', 'ltr'),
  ('ru', 'Russian', 'Русский', 'ltr'),
  ('ko', 'Korean', '한국어', 'ltr'),
  ('it', 'Italian', 'Italiano', 'ltr');

-- Countries table
CREATE TABLE public.countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT,
  flag_emoji TEXT,
  default_language TEXT REFERENCES public.languages(code)
);

-- Insert popular countries
INSERT INTO public.countries (code, name, native_name, flag_emoji, default_language) VALUES
  ('US', 'United States', 'United States', '🇺🇸', 'en'),
  ('IN', 'India', 'भारत', '🇮🇳', 'en'),
  ('GB', 'United Kingdom', 'United Kingdom', '🇬🇧', 'en'),
  ('CA', 'Canada', 'Canada', '🇨🇦', 'en'),
  ('AU', 'Australia', 'Australia', '🇦🇺', 'en'),
  ('DE', 'Germany', 'Deutschland', '🇩🇪', 'de'),
  ('FR', 'France', 'France', '🇫🇷', 'fr'),
  ('JP', 'Japan', '日本', '🇯🇵', 'ja'),
  ('CN', 'China', '中国', '🇨🇳', 'zh'),
  ('BR', 'Brazil', 'Brasil', '🇧🇷', 'pt'),
  ('MX', 'Mexico', 'México', '🇲🇽', 'es'),
  ('ES', 'Spain', 'España', '🇪🇸', 'es'),
  ('IT', 'Italy', 'Italia', '🇮🇹', 'it'),
  ('RU', 'Russia', 'Россия', '🇷🇺', 'ru'),
  ('KR', 'South Korea', '대한민국', '🇰🇷', 'ko'),
  ('AE', 'UAE', 'الإمارات', '🇦🇪', 'ar'),
  ('SA', 'Saudi Arabia', 'السعودية', '🇸🇦', 'ar'),
  ('SG', 'Singapore', 'Singapore', '🇸🇬', 'en');

-- Topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default topics
INSERT INTO public.topics (slug, name, icon, description, color) VALUES
  ('ai', 'AI & Technology', 'cpu', 'Artificial Intelligence and Tech news', '#8B5CF6'),
  ('business', 'Business', 'briefcase', 'Business and corporate news', '#3B82F6'),
  ('finance', 'Finance', 'trending-up', 'Markets, stocks, and economy', '#10B981'),
  ('politics', 'Politics', 'landmark', 'Political news and governance', '#EF4444'),
  ('world', 'World', 'globe', 'Global news and events', '#F59E0B'),
  ('sports', 'Sports', 'trophy', 'Sports news and updates', '#EC4899'),
  ('entertainment', 'Entertainment', 'film', 'Movies, music, and culture', '#6366F1'),
  ('health', 'Health', 'heart', 'Health and wellness', '#14B8A6'),
  ('climate', 'Climate', 'cloud-sun', 'Climate and environment', '#22C55E'),
  ('startups', 'Startups', 'rocket', 'Startup news and funding', '#F97316'),
  ('crypto', 'Crypto', 'bitcoin', 'Cryptocurrency and blockchain', '#FBBF24');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  display_name TEXT,
  avatar_url TEXT,
  country_code TEXT REFERENCES public.countries(code),
  language_code TEXT DEFAULT 'en' REFERENCES public.languages(code),
  preferred_mode TEXT DEFAULT 'read' CHECK (preferred_mode IN ('read', 'listen', 'both')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise', 'lifetime')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User topic preferences
CREATE TABLE public.user_topic_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- News articles table
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headline TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  ai_analysis TEXT,
  why_matters TEXT,
  perspectives JSONB,
  source_name TEXT,
  source_url TEXT,
  source_logo TEXT,
  image_url TEXT,
  audio_url TEXT,
  topic_id UUID REFERENCES public.topics(id),
  country_code TEXT REFERENCES public.countries(code),
  language_code TEXT DEFAULT 'en' REFERENCES public.languages(code),
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  trust_score INTEGER DEFAULT 85 CHECK (trust_score >= 0 AND trust_score <= 100),
  is_breaking BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  listens_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User interactions with news
CREATE TABLE public.user_news_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  listened BOOLEAN DEFAULT false,
  read_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

-- Saved news for quick access
CREATE TABLE public.saved_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

-- Enable RLS on all tables
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_news_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Languages are publicly readable" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Countries are publicly readable" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Topics are publicly readable" ON public.topics FOR SELECT USING (true);
CREATE POLICY "News is publicly readable" ON public.news FOR SELECT USING (true);

-- Profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Topic preferences policies
CREATE POLICY "Users can view their topic preferences" ON public.user_topic_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their topic preferences" ON public.user_topic_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their topic preferences" ON public.user_topic_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their topic preferences" ON public.user_topic_preferences FOR DELETE USING (auth.uid() = user_id);

-- User interactions policies
CREATE POLICY "Users can view their interactions" ON public.user_news_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create interactions" ON public.user_news_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their interactions" ON public.user_news_interactions FOR UPDATE USING (auth.uid() = user_id);

-- Saved news policies
CREATE POLICY "Users can view their saved news" ON public.saved_news FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save news" ON public.saved_news FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave news" ON public.saved_news FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_news_interactions_updated_at BEFORE UPDATE ON public.user_news_interactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ==================================================================
-- FILE: supabase/migrations/20260110112819_262e736d-1d09-40c6-a7a7-d24a60570c9a.sql
-- ==================================================================
-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
-- ==================================================================
-- FILE: supabase/migrations/20260110115404_354a6084-4187-4972-9a00-9b5d12ab5e12.sql
-- ==================================================================
-- Add more Indian languages
INSERT INTO public.languages (code, name, native_name, direction) VALUES
  ('ta', 'Tamil', 'தமிழ்', 'ltr'),
  ('te', 'Telugu', 'తెలుగు', 'ltr'),
  ('kn', 'Kannada', 'ಕನ್ನಡ', 'ltr'),
  ('ml', 'Malayalam', 'മലയാളം', 'ltr'),
  ('mr', 'Marathi', 'मराठी', 'ltr'),
  ('gu', 'Gujarati', 'ગુજરાતી', 'ltr'),
  ('bn', 'Bengali', 'বাংলা', 'ltr'),
  ('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'ltr'),
  ('or', 'Odia', 'ଓଡ଼ିଆ', 'ltr')
ON CONFLICT (code) DO NOTHING;
-- ==================================================================
-- FILE: supabase/migrations/20260110124637_960fe796-6cc7-4441-8650-0bd6b3382a86.sql
-- ==================================================================
-- Create saved_places table for users to save favorite places
CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place_name TEXT NOT NULL,
  place_address TEXT,
  place_image_url TEXT,
  place_lat DOUBLE PRECISION,
  place_lng DOUBLE PRECISION,
  place_rating DOUBLE PRECISION,
  liked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

-- Enable RLS
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved places"
ON public.saved_places FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save places"
ON public.saved_places FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved places"
ON public.saved_places FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved places"
ON public.saved_places FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX idx_saved_places_place_id ON public.saved_places(place_id);
-- ==================================================================
-- FILE: supabase/migrations/20260110132002_9166898c-1e3d-42a5-998b-c44996bca2e0.sql
-- ==================================================================
-- Create discussions table for news and places
CREATE TABLE public.discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'place')),
  content_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  message TEXT NOT NULL,
  agrees_count INTEGER DEFAULT 0,
  disagrees_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  reported_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discussion reactions table
CREATE TABLE public.discussion_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  anonymous_id TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('agree', 'disagree')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discussion_id, user_id),
  UNIQUE(discussion_id, anonymous_id)
);

-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  order_id TEXT,
  status TEXT DEFAULT 'pending',
  donation_type TEXT DEFAULT 'one-time' CHECK (donation_type IN ('one-time', 'monthly', 'annual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Discussions policies
CREATE POLICY "Anyone can view non-hidden discussions"
ON public.discussions FOR SELECT
USING (is_hidden = false);

CREATE POLICY "Anyone can create discussions"
ON public.discussions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own discussions"
ON public.discussions FOR UPDATE
USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Anyone can view reactions"
ON public.discussion_reactions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create reactions"
ON public.discussion_reactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
ON public.discussion_reactions FOR DELETE
USING (auth.uid() = user_id OR anonymous_id IS NOT NULL);

-- Newsletter policies
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Donations policies
CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create donations"
ON public.donations FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_discussions_content ON public.discussions(content_type, content_id);
CREATE INDEX idx_discussions_created ON public.discussions(created_at DESC);
CREATE INDEX idx_reactions_discussion ON public.discussion_reactions(discussion_id);

-- Add trigger for updated_at
CREATE TRIGGER update_discussions_updated_at
BEFORE UPDATE ON public.discussions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- ==================================================================
-- FILE: supabase/migrations/20260110133535_f7be53a4-afe1-407c-9247-31c6c8303373.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260110142000_5937e8af-0cb8-45b5-a060-187a63e14e13.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260110183815_c2412cd0-adc0-4bc8-90a8-b9f98733e456.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260110184416_8223fa8a-ac16-4bc2-b95d-0c0c1f06bf5a.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260110185329_c7edc60b-de2d-44c6-b62f-d9021e608c9b.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260111041109_53f3227f-c660-4262-a1ef-7de1da988199.sql
-- ==================================================================
-- Insert admin user for OriginXLabs@gmail.com
INSERT INTO admin_users (email, role) 
VALUES ('OriginXLabs@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- ==================================================================
-- FILE: supabase/migrations/20260111143821_5a0753d3-a0fd-49a5-a6bc-ab7618238be4.sql
-- ==================================================================
-- Drop unused tables (discussions feature removed, news replaced by stories)
DROP TABLE IF EXISTS discussion_reactions;
DROP TABLE IF EXISTS discussions;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS cached_news;
-- ==================================================================
-- FILE: supabase/migrations/20260111153135_3e14bbec-675f-488a-a61b-f7a0fa1a7226.sql
-- ==================================================================
-- Phase 1: Extend rss_feeds table with source classification
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'secondary';
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS reliability_tier text DEFAULT 'tier_2';
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS publisher text;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS fetch_interval_minutes integer DEFAULT 30;

-- Add constraints for rss_feeds
ALTER TABLE public.rss_feeds ADD CONSTRAINT valid_source_type 
  CHECK (source_type IN ('primary', 'secondary', 'opinion', 'aggregator'));
ALTER TABLE public.rss_feeds ADD CONSTRAINT valid_reliability_tier 
  CHECK (reliability_tier IN ('tier_1', 'tier_2', 'tier_3'));

-- Phase 2: Extend stories table with intelligence fields
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS story_state text DEFAULT 'single_source';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'low';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS primary_source_count integer DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS has_contradictions boolean DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS verified_source_count integer DEFAULT 0;

-- Add constraints for stories
ALTER TABLE public.stories ADD CONSTRAINT valid_story_state 
  CHECK (story_state IN ('single_source', 'developing', 'confirmed', 'contradicted'));
ALTER TABLE public.stories ADD CONSTRAINT valid_confidence_level 
  CHECK (confidence_level IN ('low', 'medium', 'high'));

-- Phase 3: Extend story_sources table with tier information
ALTER TABLE public.story_sources ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'secondary';
ALTER TABLE public.story_sources ADD COLUMN IF NOT EXISTS reliability_tier text DEFAULT 'tier_2';
ALTER TABLE public.story_sources ADD COLUMN IF NOT EXISTS is_primary_reporting boolean DEFAULT false;

-- Create index for faster tier-based queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_tier ON public.rss_feeds(reliability_tier);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_source_type ON public.rss_feeds(source_type);
CREATE INDEX IF NOT EXISTS idx_stories_confidence ON public.stories(confidence_level);
CREATE INDEX IF NOT EXISTS idx_stories_state ON public.stories(story_state);
-- ==================================================================
-- FILE: supabase/migrations/20260111155551_2fdfa6cf-640a-41eb-8493-a04b84bd8279.sql
-- ==================================================================
-- Data Cleanup Migration: Delete all existing stories and sources for fresh ingestion
-- This ensures clean slate for properly sanitized data

-- Step 1: Delete all story sources first (foreign key constraint)
DELETE FROM public.story_sources;

-- Step 2: Delete all stories
DELETE FROM public.stories;

-- Step 3: Reset RSS feed last_fetched_at to force re-fetch all feeds
UPDATE public.rss_feeds SET last_fetched_at = NULL;

-- Step 4: Create ingestion_runs table to track pipeline executions
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    
    -- Pipeline step tracking
    step_fetch_feeds TEXT DEFAULT 'pending',
    step_fetch_feeds_count INTEGER DEFAULT 0,
    step_normalize TEXT DEFAULT 'pending',
    step_normalize_count INTEGER DEFAULT 0,
    step_validate TEXT DEFAULT 'pending',
    step_validate_rejected INTEGER DEFAULT 0,
    step_classify TEXT DEFAULT 'pending',
    step_classify_count INTEGER DEFAULT 0,
    step_dedupe TEXT DEFAULT 'pending',
    step_dedupe_merged INTEGER DEFAULT 0,
    step_store TEXT DEFAULT 'pending',
    step_store_created INTEGER DEFAULT 0,
    step_cleanup TEXT DEFAULT 'pending',
    step_cleanup_deleted INTEGER DEFAULT 0,
    
    -- Tier breakdown
    tier1_feeds INTEGER DEFAULT 0,
    tier2_feeds INTEGER DEFAULT 0,
    tier3_feeds INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_step TEXT,
    
    -- Summary
    total_feeds_processed INTEGER DEFAULT 0,
    total_stories_created INTEGER DEFAULT 0,
    total_stories_merged INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ingestion_runs
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read ingestion runs (for dashboard)
CREATE POLICY "Authenticated users can view ingestion runs" 
ON public.ingestion_runs 
FOR SELECT 
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at ON public.ingestion_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON public.ingestion_runs(status);

-- Add comment explaining the table
COMMENT ON TABLE public.ingestion_runs IS 'Tracks RSS ingestion pipeline executions with step-by-step progress and error reporting';
-- ==================================================================
-- FILE: supabase/migrations/20260111160037_1c83a771-694f-4152-8585-3dcff327752e.sql
-- ==================================================================
-- Create role enum for newsroom access levels
CREATE TYPE public.newsroom_role AS ENUM ('owner', 'superadmin', 'admin', 'editor', 'viewer');

-- Create newsroom_members table for role-based access
CREATE TABLE public.newsroom_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    role newsroom_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.newsroom_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check newsroom role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_newsroom_role(_user_id UUID)
RETURNS newsroom_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.newsroom_members 
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

-- Function to check if user has at least a certain role level
CREATE OR REPLACE FUNCTION public.has_newsroom_access(_user_id UUID, _min_role newsroom_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.newsroom_members
    WHERE user_id = _user_id 
    AND is_active = true
    AND (
      role = 'owner' OR
      (role = 'superadmin' AND _min_role IN ('superadmin', 'admin', 'editor', 'viewer')) OR
      (role = 'admin' AND _min_role IN ('admin', 'editor', 'viewer')) OR
      (role = 'editor' AND _min_role IN ('editor', 'viewer')) OR
      (role = 'viewer' AND _min_role = 'viewer')
    )
  );
$$;

-- Function to check if user is owner or superadmin (for sensitive operations)
CREATE OR REPLACE FUNCTION public.is_newsroom_owner_or_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.newsroom_members
    WHERE user_id = _user_id 
    AND is_active = true
    AND role IN ('owner', 'superadmin')
  );
$$;

-- RLS Policies for newsroom_members
-- Only owners and superadmins can view all members
CREATE POLICY "Owners and superadmins can view all members"
ON public.newsroom_members FOR SELECT
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Only owners can insert new members
CREATE POLICY "Owners can insert members"
ON public.newsroom_members FOR INSERT
TO authenticated
WITH CHECK (public.get_newsroom_role(auth.uid()) = 'owner');

-- Only owners can update members
CREATE POLICY "Owners can update members"
ON public.newsroom_members FOR UPDATE
TO authenticated
USING (public.get_newsroom_role(auth.uid()) = 'owner');

-- Only owners can delete members
CREATE POLICY "Owners can delete members"
ON public.newsroom_members FOR DELETE
TO authenticated
USING (public.get_newsroom_role(auth.uid()) = 'owner');

-- Update RLS for rss_feeds to allow owner/superadmin to manage feeds
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

-- Anyone can read feeds (for public API)
CREATE POLICY "Anyone can read feeds"
ON public.rss_feeds FOR SELECT
USING (true);

-- Only owners and superadmins can insert feeds
CREATE POLICY "Owners and superadmins can insert feeds"
ON public.rss_feeds FOR INSERT
TO authenticated
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Only owners and superadmins can update feeds
CREATE POLICY "Owners and superadmins can update feeds"
ON public.rss_feeds FOR UPDATE
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Only owners and superadmins can delete feeds
CREATE POLICY "Owners and superadmins can delete feeds"
ON public.rss_feeds FOR DELETE
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Enable realtime for ingestion_runs
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingestion_runs;

-- Add index for faster lookups
CREATE INDEX idx_newsroom_members_user_id ON public.newsroom_members(user_id);
CREATE INDEX idx_newsroom_members_email ON public.newsroom_members(email);

-- Add comments
COMMENT ON TABLE public.newsroom_members IS 'Newsroom access control with role hierarchy: owner > superadmin > admin > editor > viewer';
COMMENT ON FUNCTION public.get_newsroom_role IS 'Returns the newsroom role for a user';
COMMENT ON FUNCTION public.has_newsroom_access IS 'Checks if user has at least the specified role level';
COMMENT ON FUNCTION public.is_newsroom_owner_or_superadmin IS 'Checks if user is owner or superadmin for sensitive operations';
-- ==================================================================
-- FILE: supabase/migrations/20260111161914_fd55be29-2149-4be9-9d42-55fecc0a4620.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260111162748_76bf57d5-4a2b-481b-95c2-2a9372c04f89.sql
-- ==================================================================
-- Create function to increment API usage counter
CREATE OR REPLACE FUNCTION public.increment_api_usage(key_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys 
  SET requests_used = requests_used + 1
  WHERE id = key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- ==================================================================
-- FILE: supabase/migrations/20260112040434_1e18448a-6e0f-4c46-89d2-5be58ada19a7.sql
-- ==================================================================
-- Create OTP verification table for custom email OTP system
CREATE TABLE public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_email_otps_email ON public.email_otps(email);
CREATE INDEX idx_email_otps_expires ON public.email_otps(expires_at);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage OTPs (using service role key)
-- No public access policies needed as this is managed by edge functions only

-- Create cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ==================================================================
-- FILE: supabase/migrations/20260112042913_009e2e1e-1cb4-442e-ade2-0f294033d323.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260112044559_e0fc36af-aa30-42b3-855e-f4eb91e2cc89.sql
-- ==================================================================
-- Add password_last_set_at to newsroom_members for 30-day expiry tracking
ALTER TABLE public.newsroom_members 
ADD COLUMN IF NOT EXISTS password_last_set_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing owner records to have password_last_set_at set
UPDATE public.newsroom_members 
SET password_last_set_at = now() 
WHERE password_last_set_at IS NULL;
-- ==================================================================
-- FILE: supabase/migrations/20260112050617_cfe9109c-b87f-453e-88c7-52be4c443572.sql
-- ==================================================================
-- Enable realtime for stories and story_sources tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_sources;
-- ==================================================================
-- FILE: supabase/migrations/20260112070542_8623af24-f308-4bd2-88a8-edd9a9d81549.sql
-- ==================================================================
-- Add language options to rss_feeds table with proper enum
-- First, let's add some regional language RSS feeds for India

-- Insert Hindi language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Dainik Jagran Hindi', 'https://www.jagran.com/rss/news/national.xml', 'Jagran Prakashan', 'IN', 'hi', 'politics', 'tier_2', true, 30, 5),
  ('Amar Ujala Hindi', 'https://www.amarujala.com/rss/india-news.xml', 'Amar Ujala', 'IN', 'hi', 'world', 'tier_2', true, 30, 5),
  ('NavBharat Times Hindi', 'https://navbharattimes.indiatimes.com/rssfeedstopstories.cms', 'Times Group', 'IN', 'hi', 'politics', 'tier_2', true, 30, 5),
  ('BBC Hindi', 'https://feeds.bbci.co.uk/hindi/india/rss.xml', 'BBC', 'IN', 'hi', 'world', 'tier_1', true, 15, 8),
  ('Hindustan Hindi', 'https://feed.livehindustan.com/rss/3127', 'HT Media', 'IN', 'hi', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Tamil language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Dinamalar Tamil', 'https://www.dinamalar.com/rss/rss.xml', 'Dinamalar', 'IN', 'ta', 'world', 'tier_2', true, 30, 5),
  ('Dinamani Tamil', 'https://www.dinamani.com/rss/all.xml', 'New Indian Express', 'IN', 'ta', 'politics', 'tier_2', true, 30, 5),
  ('BBC Tamil', 'https://feeds.bbci.co.uk/tamil/rss.xml', 'BBC', 'IN', 'ta', 'world', 'tier_1', true, 15, 8),
  ('Tamil The Hindu', 'https://www.hindutamil.in/feed', 'The Hindu', 'IN', 'ta', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Odia language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Sambad Odia', 'https://sambad.in/feed/', 'Sambad', 'IN', 'or', 'world', 'tier_2', true, 30, 5),
  ('Dharitri Odia', 'https://dharitri.com/feed/', 'Dharitri', 'IN', 'or', 'politics', 'tier_2', true, 30, 5),
  ('Pragativadi Odia', 'https://pragativadi.com/feed/', 'Pragativadi', 'IN', 'or', 'world', 'tier_3', true, 30, 4),
  ('Odisha TV Odia', 'https://odishatv.in/feed', 'OTV', 'IN', 'or', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Telugu language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Eenadu Telugu', 'https://www.eenadu.net/home/homeheadlines/rss', 'Eenadu', 'IN', 'te', 'politics', 'tier_2', true, 30, 5),
  ('Sakshi Telugu', 'https://www.sakshi.com/rss/top-stories', 'Sakshi Media', 'IN', 'te', 'world', 'tier_2', true, 30, 5),
  ('TV9 Telugu', 'https://www.tv9telugu.com/feed', 'TV9 Network', 'IN', 'te', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Kannada language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Vijaya Karnataka Kannada', 'https://vijaykarnataka.com/rss.cms', 'Times Group', 'IN', 'kn', 'politics', 'tier_2', true, 30, 5),
  ('Prajavani Kannada', 'https://www.prajavani.net/feed', 'Deccan Herald', 'IN', 'kn', 'world', 'tier_2', true, 30, 5),
  ('Udayavani Kannada', 'https://www.udayavani.com/rss.xml', 'Udayavani', 'IN', 'kn', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Malayalam language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Malayala Manorama', 'https://www.manoramaonline.com/news/rss.xml', 'Manorama', 'IN', 'ml', 'world', 'tier_1', true, 15, 7),
  ('Mathrubhumi Malayalam', 'https://www.mathrubhumi.com/rss/news', 'Mathrubhumi', 'IN', 'ml', 'politics', 'tier_2', true, 30, 5),
  ('Asianet Malayalam', 'https://www.asianetnews.com/rss/news-feed', 'Asianet', 'IN', 'ml', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Bengali language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Anandabazar Bengali', 'https://www.anandabazar.com/rss/rssfeed.xml', 'ABP Group', 'IN', 'bn', 'politics', 'tier_2', true, 30, 5),
  ('Ei Samay Bengali', 'https://eisamay.com/rss.cms', 'Times Group', 'IN', 'bn', 'world', 'tier_2', true, 30, 5),
  ('BBC Bengali', 'https://feeds.bbci.co.uk/bengali/rss.xml', 'BBC', 'IN', 'bn', 'world', 'tier_1', true, 15, 8)
ON CONFLICT (url) DO NOTHING;

-- Insert Marathi language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Maharashtra Times Marathi', 'https://maharashtratimes.com/rss.cms', 'Times Group', 'IN', 'mr', 'politics', 'tier_2', true, 30, 5),
  ('Lokmat Marathi', 'https://www.lokmat.com/feed/', 'Lokmat Media', 'IN', 'mr', 'world', 'tier_2', true, 30, 5),
  ('Loksatta Marathi', 'https://www.loksatta.com/feed/', 'Indian Express', 'IN', 'mr', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Gujarati language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Gujarat Samachar Gujarati', 'https://www.gujaratsamachar.com/rss', 'Gujarat Samachar', 'IN', 'gu', 'politics', 'tier_2', true, 30, 5),
  ('Divya Bhaskar Gujarati', 'https://www.divyabhaskar.co.in/rss/topstories.xml', 'Dainik Bhaskar', 'IN', 'gu', 'world', 'tier_2', true, 30, 5),
  ('Sandesh Gujarati', 'https://sandesh.com/feed/', 'Sandesh', 'IN', 'gu', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- Insert Punjabi language feeds
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Ajit Punjab Punjabi', 'https://www.ajitjalandhar.com/feed/', 'Ajit', 'IN', 'pa', 'politics', 'tier_2', true, 30, 5),
  ('Jagbani Punjabi', 'https://www.jagbani.com/rss', 'Jagran', 'IN', 'pa', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
-- ==================================================================
-- FILE: supabase/migrations/20260112072835_23fa8610-2dfc-48ac-95ea-ca4103539639.sql
-- ==================================================================
-- Add 50+ more state-level and regional language RSS feeds for comprehensive India coverage
-- This includes local city newspapers, regional language portals, and state-specific sources

INSERT INTO public.rss_feeds (name, url, category, country_code, language, is_active, priority, reliability_tier, source_type, publisher)
VALUES
-- ASSAMESE (Assam)
('Asomiya Pratidin Assamese', 'https://www.asomiyapratidin.in/feed/', 'politics', 'IN', 'as', true, 2, 'tier_2', 'primary', 'Asomiya Pratidin'),
('Niyomiya Barta Assamese', 'https://www.niyomiyabarta.com/feed/', 'world', 'IN', 'as', true, 2, 'tier_2', 'primary', 'Niyomiya Barta'),
('Dainik Agradoot Assamese', 'https://www.dainikagradoot.in/feed/', 'politics', 'IN', 'as', true, 3, 'tier_2', 'primary', 'Dainik Agradoot'),
('Guwahati Plus Assamese', 'https://www.guwahatiplus.com/feed/', 'local', 'IN', 'as', true, 2, 'tier_2', 'secondary', 'Guwahati Plus'),

-- HINDI (More state-specific)
('Rajasthan Patrika Hindi', 'https://www.patrika.com/rss/rajasthan.xml', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Rajasthan Patrika'),
('Prabhat Khabar Hindi Bihar', 'https://www.prabhatkhabar.com/feed/', 'politics', 'IN', 'hi', true, 2, 'tier_2', 'primary', 'Prabhat Khabar'),
('Dainik Bhaskar MP Hindi', 'https://www.bhaskar.com/rss-feed/madhya-pradesh/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar UP Hindi', 'https://www.bhaskar.com/rss-feed/uttar-pradesh/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar Rajasthan Hindi', 'https://www.bhaskar.com/rss-feed/rajasthan/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar Bihar Hindi', 'https://www.bhaskar.com/rss-feed/bihar/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar Jharkhand Hindi', 'https://www.bhaskar.com/rss-feed/jharkhand/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar Chhattisgarh Hindi', 'https://www.bhaskar.com/rss-feed/chhattisgarh/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar Haryana Hindi', 'https://www.bhaskar.com/rss-feed/haryana/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Dainik Bhaskar Delhi Hindi', 'https://www.bhaskar.com/rss-feed/delhi/', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Dainik Bhaskar'),
('Amar Ujala UP Hindi', 'https://www.amarujala.com/rss/uttar-pradesh.xml', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Amar Ujala'),
('Amar Ujala Delhi Hindi', 'https://www.amarujala.com/rss/delhi-ncr.xml', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Amar Ujala'),
('Amar Ujala Uttarakhand Hindi', 'https://www.amarujala.com/rss/uttarakhand.xml', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Amar Ujala'),
('Amar Ujala HP Hindi', 'https://www.amarujala.com/rss/himachal-pradesh.xml', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Amar Ujala'),
('Hindustan UP Hindi', 'https://www.livehindustan.com/rss/uttar-pradesh', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Hindustan'),
('Hindustan Bihar Hindi', 'https://www.livehindustan.com/rss/bihar', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Hindustan'),
('Hindustan Jharkhand Hindi', 'https://www.livehindustan.com/rss/jharkhand', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Hindustan'),
('Hindustan Delhi Hindi', 'https://www.livehindustan.com/rss/delhi', 'local', 'IN', 'hi', true, 1, 'tier_1', 'primary', 'Hindustan'),

-- TAMIL (More city-specific)
('The News Minute Tamil', 'https://www.thenewsminute.com/tamil/feed', 'politics', 'IN', 'ta', true, 2, 'tier_2', 'secondary', 'The News Minute'),
('Vikatan Tamil', 'https://www.vikatan.com/feed/', 'world', 'IN', 'ta', true, 1, 'tier_1', 'primary', 'Vikatan'),
('Thanthi TV Tamil', 'https://www.thanthitv.com/feed/', 'world', 'IN', 'ta', true, 2, 'tier_2', 'primary', 'Thanthi TV'),
('Puthiya Thalaimurai Tamil', 'https://www.puthiyathalaimurai.com/feed/', 'politics', 'IN', 'ta', true, 2, 'tier_2', 'primary', 'Puthiya Thalaimurai'),

-- TELUGU (More coverage)
('NTV Telugu', 'https://www.ntvtelugu.com/feed/', 'world', 'IN', 'te', true, 2, 'tier_2', 'primary', 'NTV'),
('ABN Telugu', 'https://www.andhrajyothy.com/feed/', 'politics', 'IN', 'te', true, 2, 'tier_2', 'primary', 'ABN Andhra Jyothy'),
('V6 News Telugu', 'https://www.v6news.tv/feed/', 'politics', 'IN', 'te', true, 2, 'tier_2', 'primary', 'V6 News'),
('10TV Telugu', 'https://www.10tv.in/feed/', 'world', 'IN', 'te', true, 2, 'tier_2', 'primary', '10TV'),

-- KANNADA (More city coverage)
('Suvarna News Kannada', 'https://www.suvarnanews.com/feed/', 'world', 'IN', 'kn', true, 2, 'tier_2', 'primary', 'Suvarna News'),
('Public TV Kannada', 'https://www.publictv.in/feed/', 'politics', 'IN', 'kn', true, 2, 'tier_2', 'primary', 'Public TV'),
('TV9 Kannada', 'https://www.tv9kannada.com/feed/', 'world', 'IN', 'kn', true, 2, 'tier_2', 'primary', 'TV9 Kannada'),
('Kannada Prabha', 'https://www.kannadaprabha.com/feed/', 'politics', 'IN', 'kn', true, 2, 'tier_2', 'primary', 'Kannada Prabha'),

-- MALAYALAM (More coverage)
('Manorama News Malayalam', 'https://www.manoramanews.com/feed/', 'world', 'IN', 'ml', true, 1, 'tier_1', 'primary', 'Manorama News'),
('24 News Malayalam', 'https://www.twentyfournews.com/feed/', 'politics', 'IN', 'ml', true, 2, 'tier_2', 'primary', '24 News'),
('Kairali TV Malayalam', 'https://www.kairalitv.in/feed/', 'politics', 'IN', 'ml', true, 2, 'tier_2', 'primary', 'Kairali'),
('Madhyamam Malayalam', 'https://www.madhyamam.com/feed/', 'politics', 'IN', 'ml', true, 2, 'tier_2', 'primary', 'Madhyamam'),

-- MARATHI (More city-specific)
('TV9 Marathi', 'https://www.tv9marathi.com/feed/', 'world', 'IN', 'mr', true, 2, 'tier_2', 'primary', 'TV9 Marathi'),
('ABP Majha Marathi', 'https://marathi.abplive.com/feed/', 'politics', 'IN', 'mr', true, 2, 'tier_2', 'primary', 'ABP Majha'),
('Pudhari Marathi', 'https://www.pudhari.news/feed/', 'politics', 'IN', 'mr', true, 2, 'tier_2', 'primary', 'Pudhari'),
('Sakal Marathi', 'https://www.esakal.com/feed/', 'world', 'IN', 'mr', true, 1, 'tier_1', 'primary', 'Sakal'),
('Saamana Marathi', 'https://www.saamana.com/feed/', 'politics', 'IN', 'mr', true, 2, 'tier_2', 'primary', 'Saamana'),

-- BENGALI (More city-specific)
('ABP Ananda Bengali', 'https://bengali.abplive.com/feed/', 'world', 'IN', 'bn', true, 1, 'tier_1', 'primary', 'ABP Ananda'),
('Zee 24 Ghanta Bengali', 'https://zeenews.india.com/bengali/feed/', 'world', 'IN', 'bn', true, 2, 'tier_2', 'primary', 'Zee 24 Ghanta'),
('Bartaman Bengali', 'https://www.bartamanpatrika.com/feed/', 'politics', 'IN', 'bn', true, 2, 'tier_2', 'primary', 'Bartaman'),
('Sangbad Pratidin Bengali', 'https://www.sangbadpratidin.in/feed/', 'world', 'IN', 'bn', true, 2, 'tier_2', 'primary', 'Sangbad Pratidin'),

-- GUJARATI (More coverage)
('TV9 Gujarati', 'https://www.tv9gujarati.com/feed/', 'world', 'IN', 'gu', true, 2, 'tier_2', 'primary', 'TV9 Gujarati'),
('ABP Asmita Gujarati', 'https://gujarati.abplive.com/feed/', 'politics', 'IN', 'gu', true, 2, 'tier_2', 'primary', 'ABP Asmita'),
('News18 Gujarati', 'https://gujarati.news18.com/feed/', 'world', 'IN', 'gu', true, 2, 'tier_2', 'primary', 'News18 Gujarati'),
('Akila News Gujarati', 'https://www.akilanews.com/feed/', 'politics', 'IN', 'gu', true, 3, 'tier_2', 'primary', 'Akila News'),

-- PUNJABI (More coverage)
('ABP Sanjha Punjabi', 'https://punjabi.abplive.com/feed/', 'world', 'IN', 'pa', true, 2, 'tier_2', 'primary', 'ABP Sanjha'),
('PTC News Punjabi', 'https://www.ptcnews.tv/feed/', 'politics', 'IN', 'pa', true, 2, 'tier_2', 'primary', 'PTC News'),
('Daily Post Punjabi', 'https://www.dailypostpunjabi.in/feed/', 'local', 'IN', 'pa', true, 3, 'tier_2', 'secondary', 'Daily Post Punjabi'),
('Rozana Spokesman Punjabi', 'https://www.rozanaspokesman.com/feed/', 'politics', 'IN', 'pa', true, 2, 'tier_2', 'primary', 'Rozana Spokesman'),

-- ODIA (More coverage)
('OTV Odia', 'https://www.odishatv.in/feed/', 'world', 'IN', 'or', true, 2, 'tier_2', 'primary', 'OTV'),
('Kanak News Odia', 'https://www.kanaknews.com/feed/', 'politics', 'IN', 'or', true, 2, 'tier_2', 'primary', 'Kanak News'),
('News7 Odia', 'https://www.news7odia.com/feed/', 'world', 'IN', 'or', true, 2, 'tier_2', 'primary', 'News7 Odia'),
('Kalinga TV Odia', 'https://www.kalingatv.com/feed/', 'politics', 'IN', 'or', true, 2, 'tier_2', 'primary', 'Kalinga TV'),

-- ENGLISH (State-specific)
('Deccan Chronicle Telangana', 'https://www.deccanchronicle.com/nation/current-affairs/rss', 'politics', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Deccan Chronicle'),
('New Indian Express TN', 'https://www.newindianexpress.com/states/tamil-nadu/rssfeed', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'New Indian Express'),
('New Indian Express Karnataka', 'https://www.newindianexpress.com/states/karnataka/rssfeed', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'New Indian Express'),
('New Indian Express Kerala', 'https://www.newindianexpress.com/states/kerala/rssfeed', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'New Indian Express'),
('New Indian Express AP', 'https://www.newindianexpress.com/states/andhra-pradesh/rssfeed', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'New Indian Express'),
('New Indian Express Telangana', 'https://www.newindianexpress.com/states/telangana/rssfeed', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'New Indian Express'),
('New Indian Express Odisha', 'https://www.newindianexpress.com/states/odisha/rssfeed', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'New Indian Express'),
('Telangana Today', 'https://telanganatoday.com/feed', 'local', 'IN', 'en', true, 2, 'tier_2', 'primary', 'Telangana Today'),
('Tribune Punjab', 'https://www.tribuneindia.com/rss/punjab', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'The Tribune'),
('Tribune Haryana', 'https://www.tribuneindia.com/rss/haryana', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'The Tribune'),
('Tribune HP', 'https://www.tribuneindia.com/rss/himachal', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'The Tribune'),
('Tribune JK', 'https://www.tribuneindia.com/rss/jammu-kashmir', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'The Tribune'),
('Nagpur Today', 'https://www.nagpurtoday.in/feed/', 'local', 'IN', 'en', true, 3, 'tier_3', 'secondary', 'Nagpur Today'),
('Pune Mirror', 'https://punemirror.com/feed/', 'local', 'IN', 'en', true, 2, 'tier_2', 'primary', 'Pune Mirror'),
('Mumbai Mirror', 'https://mumbaimirror.indiatimes.com/rssfeedstopstories.cms', 'local', 'IN', 'en', true, 2, 'tier_2', 'primary', 'Mumbai Mirror'),
('Bangalore Mirror', 'https://bangaloremirror.indiatimes.com/rssfeedstopstories.cms', 'local', 'IN', 'en', true, 2, 'tier_2', 'primary', 'Bangalore Mirror'),
('Delhi TOI', 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Chennai TOI', 'https://timesofindia.indiatimes.com/rssfeeds/2673929.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Kolkata TOI', 'https://timesofindia.indiatimes.com/rssfeeds/52673931.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Ahmedabad TOI', 'https://timesofindia.indiatimes.com/rssfeeds/52673929.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Hyderabad TOI', 'https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Lucknow TOI', 'https://timesofindia.indiatimes.com/rssfeeds/-2128816011.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Jaipur TOI', 'https://timesofindia.indiatimes.com/rssfeeds/-2128807284.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Chandigarh TOI', 'https://timesofindia.indiatimes.com/rssfeeds/-2128769355.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India'),
('Goa TOI', 'https://timesofindia.indiatimes.com/rssfeeds/36692495.cms', 'local', 'IN', 'en', true, 1, 'tier_1', 'primary', 'Times of India')
ON CONFLICT (url) DO NOTHING;
-- ==================================================================
-- FILE: supabase/migrations/20260112080200_9a27d9eb-3d1b-46b1-a892-234ea8b7d76d.sql
-- ==================================================================
-- Add proper location fields to stories table for drill-down navigation
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS locality TEXT DEFAULT NULL;

-- Create indexes for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_stories_state ON public.stories(state);
CREATE INDEX IF NOT EXISTS idx_stories_district ON public.stories(district);
CREATE INDEX IF NOT EXISTS idx_stories_city ON public.stories(city);
CREATE INDEX IF NOT EXISTS idx_stories_locality ON public.stories(locality);

-- Composite index for common location hierarchical queries
CREATE INDEX IF NOT EXISTS idx_stories_location_hierarchy 
ON public.stories(country_code, state, district, city);
-- ==================================================================
-- FILE: supabase/migrations/20260112090051_4502a894-b10c-4504-b42a-36c4fabe3e8c.sql
-- ==================================================================
-- Add columns for original language content (Odia, Hindi, etc.)
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS original_headline TEXT,
ADD COLUMN IF NOT EXISTS original_summary TEXT,
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10);

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_stories_original_language ON public.stories(original_language);

COMMENT ON COLUMN public.stories.original_headline IS 'Original headline in native language (Odia, Hindi, etc.)';
COMMENT ON COLUMN public.stories.original_summary IS 'Original summary in native language';
COMMENT ON COLUMN public.stories.original_language IS 'ISO 639-1 language code of original content (or, hi, ta, etc.)';
-- ==================================================================
-- FILE: supabase/migrations/20260112125542_fbdd4ff8-d332-4931-827f-6cf6ab3af082.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260112150542_7515175e-4e37-40ce-b783-d1e37171d58a.sql
-- ==================================================================
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
-- ==================================================================
-- FILE: supabase/migrations/20260113040722_fc9f16cd-2588-45c8-ae47-8b232d7b6d3c.sql
-- ==================================================================
-- Ensure ingestion run metrics are publicly readable for dashboards
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'ingestion_runs'
      AND policyname = 'Public can read ingestion runs'
  ) THEN
    CREATE POLICY "Public can read ingestion runs"
    ON public.ingestion_runs
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Optional: ingestion user logs are safe to show only in aggregate; keep table protected by default.
-- (No policy changes here.)

-- ==================================================================
-- FILE: supabase/migrations/20260113041455_26c952aa-4470-4ce0-88c3-14f02c2c0e61.sql
-- ==================================================================
-- Add state_id column to rss_feeds for per-state feed mapping
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS state_id TEXT;

-- Add feed health tracking columns
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS total_fetch_count INTEGER DEFAULT 0;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS avg_stories_per_fetch NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS last_error_message TEXT;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;

-- Create index on state_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_state_id ON public.rss_feeds(state_id);

-- Create ingestion user access table for tracking who triggered ingestion
CREATE TABLE IF NOT EXISTS public.ingestion_access_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  location JSONB,
  terms_accepted BOOLEAN DEFAULT false,
  cookie_policy_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_ingestion_at TIMESTAMP WITH TIME ZONE,
  total_ingestions INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  otp_verified_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS to ingestion_access_users
ALTER TABLE public.ingestion_access_users ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for registration)
CREATE POLICY "Public can insert access users"
  ON public.ingestion_access_users
  FOR INSERT
  WITH CHECK (true);

-- Allow reading own data
CREATE POLICY "Users can read their own data"
  ON public.ingestion_access_users
  FOR SELECT
  USING (true);

-- Allow updates
CREATE POLICY "Users can update their own data"
  ON public.ingestion_access_users
  FOR UPDATE
  USING (true);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_ingestion_access_users_email ON public.ingestion_access_users(email);

-- Add ingestion_access_user_id to ingestion_user_logs for linking
ALTER TABLE public.ingestion_user_logs ADD COLUMN IF NOT EXISTS access_user_id UUID REFERENCES public.ingestion_access_users(id);

-- Create per-feed fetch results table
CREATE TABLE IF NOT EXISTS public.feed_fetch_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_run_id UUID REFERENCES public.ingestion_runs(id),
  feed_id UUID REFERENCES public.rss_feeds(id),
  feed_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stories_fetched INTEGER DEFAULT 0,
  stories_inserted INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feed_fetch_results
ALTER TABLE public.feed_fetch_results ENABLE ROW LEVEL SECURITY;

-- Allow public read for monitoring
CREATE POLICY "Public can read feed fetch results"
  ON public.feed_fetch_results
  FOR SELECT
  USING (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_feed_fetch_results_run_id ON public.feed_fetch_results(ingestion_run_id);
CREATE INDEX IF NOT EXISTS idx_feed_fetch_results_feed_id ON public.feed_fetch_results(feed_id);
-- ==================================================================
-- FILE: supabase/migrations/20260113042650_d66cbd55-cde0-4b33-8d8e-56added01e75.sql
-- ==================================================================
-- Update RSS feeds with accurate state_id mappings based on feed names and languages
-- Odisha feeds
UPDATE public.rss_feeds SET state_id = 'odisha' WHERE 
  (lower(name) LIKE '%odia%' OR lower(name) LIKE '%odisha%' OR lower(name) LIKE '%bhubaneswar%' OR lower(name) LIKE '%cuttack%' OR lower(name) LIKE '%bhadrak%' OR lower(name) LIKE '%argus%' OR lower(name) LIKE '%sambad%' OR lower(name) LIKE '%dharitri%' OR lower(name) LIKE '%samaja%' OR lower(name) LIKE '%kalinga%')
  AND country_code = 'IN' AND language = 'or';

-- West Bengal feeds
UPDATE public.rss_feeds SET state_id = 'west-bengal' WHERE 
  (lower(name) LIKE '%bengal%' OR lower(name) LIKE '%kolkata%' OR lower(name) LIKE '%anandabazar%' OR lower(name) LIKE '%bartaman%' OR lower(name) LIKE '%aajkaal%' OR lower(name) LIKE '%abp ananda%')
  AND country_code = 'IN';

UPDATE public.rss_feeds SET state_id = 'west-bengal' WHERE 
  language = 'bn' AND country_code = 'IN' AND state_id IS NULL
  AND (lower(name) LIKE '%bengali%' OR lower(name) LIKE '%bangla%');

-- Maharashtra feeds
UPDATE public.rss_feeds SET state_id = 'maharashtra' WHERE 
  (lower(name) LIKE '%maharashtra%' OR lower(name) LIKE '%mumbai%' OR lower(name) LIKE '%pune%' OR lower(name) LIKE '%marathi%' OR lower(name) LIKE '%abp majha%' OR lower(name) LIKE '%lokmat%' OR lower(name) LIKE '%loksatta%' OR lower(name) LIKE '%pudhari%' OR lower(name) LIKE '%sakal%')
  AND country_code = 'IN';

-- Gujarat feeds
UPDATE public.rss_feeds SET state_id = 'gujarat' WHERE 
  (lower(name) LIKE '%gujarat%' OR lower(name) LIKE '%ahmedabad%' OR lower(name) LIKE '%gujarati%' OR lower(name) LIKE '%divya bhaskar%' OR lower(name) LIKE '%sandesh%' OR lower(name) LIKE '%abp asmita%' OR lower(name) LIKE '%akila%')
  AND country_code = 'IN';

-- Tamil Nadu feeds
UPDATE public.rss_feeds SET state_id = 'tamil-nadu' WHERE 
  (lower(name) LIKE '%tamil%' OR lower(name) LIKE '%chennai%' OR lower(name) LIKE '%dinamani%' OR lower(name) LIKE '%dinakaran%' OR lower(name) LIKE '%dinamalar%' OR lower(name) LIKE '%vikatan%' OR lower(name) LIKE '%thanthi%' OR lower(name) LIKE '%puthiya thalaimurai%')
  AND country_code = 'IN';

-- Andhra Pradesh feeds
UPDATE public.rss_feeds SET state_id = 'andhra-pradesh' WHERE 
  (lower(name) LIKE '%andhra%' OR lower(name) LIKE '%hyderabad%' OR lower(name) LIKE '%vijayawada%' OR lower(name) LIKE '%andhra jyothi%' OR lower(name) LIKE '%eenadu%' OR lower(name) LIKE '%sakshi%')
  AND country_code = 'IN' AND lower(name) NOT LIKE '%telangana%';

-- Telangana feeds
UPDATE public.rss_feeds SET state_id = 'telangana' WHERE 
  (lower(name) LIKE '%telangana%' OR lower(name) LIKE '%telugu%' OR lower(name) LIKE '%10tv%' OR lower(name) LIKE '%abn%' OR lower(name) LIKE '%ntv%' OR lower(name) LIKE '%tv9 telugu%' OR lower(name) LIKE '%t news%')
  AND country_code = 'IN' AND state_id IS NULL;

-- Karnataka feeds
UPDATE public.rss_feeds SET state_id = 'karnataka' WHERE 
  (lower(name) LIKE '%karnataka%' OR lower(name) LIKE '%bangalore%' OR lower(name) LIKE '%bengaluru%' OR lower(name) LIKE '%kannada%' OR lower(name) LIKE '%prajavani%' OR lower(name) LIKE '%vijaya karnataka%' OR lower(name) LIKE '%udayavani%' OR lower(name) LIKE '%public tv%')
  AND country_code = 'IN';

-- Kerala feeds
UPDATE public.rss_feeds SET state_id = 'kerala' WHERE 
  (lower(name) LIKE '%kerala%' OR lower(name) LIKE '%kochi%' OR lower(name) LIKE '%thiruvananthapuram%' OR lower(name) LIKE '%malayalam%' OR lower(name) LIKE '%mathrubhumi%' OR lower(name) LIKE '%manorama%' OR lower(name) LIKE '%madhyamam%' OR lower(name) LIKE '%asianet%' OR lower(name) LIKE '%24 news%')
  AND country_code = 'IN';

-- Punjab feeds
UPDATE public.rss_feeds SET state_id = 'punjab' WHERE 
  (lower(name) LIKE '%punjab%' OR lower(name) LIKE '%punjabi%' OR lower(name) LIKE '%ludhiana%' OR lower(name) LIKE '%amritsar%' OR lower(name) LIKE '%jagbani%' OR lower(name) LIKE '%ajit%' OR lower(name) LIKE '%abp sanjha%' OR lower(name) LIKE '%rozana spokesman%')
  AND country_code = 'IN';

-- Assam feeds
UPDATE public.rss_feeds SET state_id = 'assam' WHERE 
  (lower(name) LIKE '%assam%' OR lower(name) LIKE '%assamese%' OR lower(name) LIKE '%guwahati%' OR lower(name) LIKE '%asomiya%' OR lower(name) LIKE '%pratidin%' OR lower(name) LIKE '%amar asom%' OR lower(name) LIKE '%prag news%')
  AND country_code = 'IN';

-- Bihar feeds  
UPDATE public.rss_feeds SET state_id = 'bihar' WHERE 
  (lower(name) LIKE '%bihar%' OR lower(name) LIKE '%patna%' OR lower(name) LIKE '%dainik jagran bihar%' OR lower(name) LIKE '%prabhat khabar%' OR lower(name) LIKE '%hindustan bihar%')
  AND country_code = 'IN';

-- Jharkhand feeds
UPDATE public.rss_feeds SET state_id = 'jharkhand' WHERE 
  (lower(name) LIKE '%jharkhand%' OR lower(name) LIKE '%ranchi%' OR lower(name) LIKE '%jamshedpur%')
  AND country_code = 'IN';

-- Rajasthan feeds
UPDATE public.rss_feeds SET state_id = 'rajasthan' WHERE 
  (lower(name) LIKE '%rajasthan%' OR lower(name) LIKE '%jaipur%' OR lower(name) LIKE '%jodhpur%' OR lower(name) LIKE '%rajasthan patrika%')
  AND country_code = 'IN';

-- Uttar Pradesh feeds
UPDATE public.rss_feeds SET state_id = 'uttar-pradesh' WHERE 
  (lower(name) LIKE '%uttar pradesh%' OR lower(name) LIKE '% up %' OR lower(name) LIKE '%lucknow%' OR lower(name) LIKE '%varanasi%' OR lower(name) LIKE '%amar ujala up%')
  AND country_code = 'IN';

-- Madhya Pradesh feeds
UPDATE public.rss_feeds SET state_id = 'madhya-pradesh' WHERE 
  (lower(name) LIKE '%madhya pradesh%' OR lower(name) LIKE '%bhopal%' OR lower(name) LIKE '%indore%' OR lower(name) LIKE '%nai dunia%')
  AND country_code = 'IN';

-- Delhi feeds
UPDATE public.rss_feeds SET state_id = 'delhi' WHERE 
  (lower(name) LIKE '%delhi%' OR lower(name) LIKE '%ncr%')
  AND country_code = 'IN';

-- Haryana feeds
UPDATE public.rss_feeds SET state_id = 'haryana' WHERE 
  (lower(name) LIKE '%haryana%' OR lower(name) LIKE '%gurugram%' OR lower(name) LIKE '%gurgaon%' OR lower(name) LIKE '%chandigarh%')
  AND country_code = 'IN' AND state_id IS NULL;

-- Himachal Pradesh feeds
UPDATE public.rss_feeds SET state_id = 'himachal-pradesh' WHERE 
  (lower(name) LIKE '%himachal%' OR lower(name) LIKE '%shimla%' OR lower(name) LIKE '%amar ujala hp%')
  AND country_code = 'IN';

-- Uttarakhand feeds
UPDATE public.rss_feeds SET state_id = 'uttarakhand' WHERE 
  (lower(name) LIKE '%uttarakhand%' OR lower(name) LIKE '%dehradun%' OR lower(name) LIKE '%amar ujala uttarakhand%')
  AND country_code = 'IN';

-- Goa feeds
UPDATE public.rss_feeds SET state_id = 'goa' WHERE 
  (lower(name) LIKE '%goa%' OR lower(name) LIKE '%konkani%' OR lower(name) LIKE '%gomantak%' OR lower(name) LIKE '%herald goa%')
  AND country_code = 'IN';

-- Chhattisgarh feeds
UPDATE public.rss_feeds SET state_id = 'chhattisgarh' WHERE 
  (lower(name) LIKE '%chhattisgarh%' OR lower(name) LIKE '%raipur%')
  AND country_code = 'IN';

-- Remaining language-based mappings for feeds without explicit state mentions
-- Odia feeds to Odisha
UPDATE public.rss_feeds SET state_id = 'odisha' WHERE 
  language = 'or' AND country_code = 'IN' AND state_id IS NULL;

-- Bengali feeds to West Bengal (if not from other states)
UPDATE public.rss_feeds SET state_id = 'west-bengal' WHERE 
  language = 'bn' AND country_code = 'IN' AND state_id IS NULL;

-- Telugu feeds - split between AP and Telangana (default to Telangana for now)
UPDATE public.rss_feeds SET state_id = 'telangana' WHERE 
  language = 'te' AND country_code = 'IN' AND state_id IS NULL;

-- Marathi feeds to Maharashtra
UPDATE public.rss_feeds SET state_id = 'maharashtra' WHERE 
  language = 'mr' AND country_code = 'IN' AND state_id IS NULL;

-- Gujarati feeds to Gujarat
UPDATE public.rss_feeds SET state_id = 'gujarat' WHERE 
  language = 'gu' AND country_code = 'IN' AND state_id IS NULL;

-- Tamil feeds to Tamil Nadu
UPDATE public.rss_feeds SET state_id = 'tamil-nadu' WHERE 
  language = 'ta' AND country_code = 'IN' AND state_id IS NULL;

-- Kannada feeds to Karnataka
UPDATE public.rss_feeds SET state_id = 'karnataka' WHERE 
  language = 'kn' AND country_code = 'IN' AND state_id IS NULL;

-- Malayalam feeds to Kerala
UPDATE public.rss_feeds SET state_id = 'kerala' WHERE 
  language = 'ml' AND country_code = 'IN' AND state_id IS NULL;

-- Punjabi feeds to Punjab
UPDATE public.rss_feeds SET state_id = 'punjab' WHERE 
  language = 'pa' AND country_code = 'IN' AND state_id IS NULL;

-- Assamese feeds to Assam
UPDATE public.rss_feeds SET state_id = 'assam' WHERE 
  language = 'as' AND country_code = 'IN' AND state_id IS NULL;
