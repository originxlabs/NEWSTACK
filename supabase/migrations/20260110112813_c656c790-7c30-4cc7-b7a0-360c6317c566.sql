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