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