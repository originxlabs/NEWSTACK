-- Expand RSS feed coverage for India + international mainstream/local outlets
-- Generated on 2026-03-02T16:34:59.606061Z from live URL validation.
-- Only feed URLs that returned RSS/Atom in validation were included.

-- Normalize historical category values to match ingestion taxonomy.
UPDATE public.rss_feeds
SET category = CASE
  WHEN lower(coalesce(category, '')) IN ('ai') THEN 'AI'
  WHEN lower(coalesce(category, '')) IN ('business') THEN 'Business'
  WHEN lower(coalesce(category, '')) IN ('finance') THEN 'Finance'
  WHEN lower(coalesce(category, '')) IN ('politics') THEN 'Politics'
  WHEN lower(coalesce(category, '')) IN ('startups', 'startup') THEN 'Startups'
  WHEN lower(coalesce(category, '')) IN ('technology', 'tech') THEN 'Technology'
  WHEN lower(coalesce(category, '')) IN ('climate') THEN 'Climate'
  WHEN lower(coalesce(category, '')) IN ('health') THEN 'Health'
  WHEN lower(coalesce(category, '')) IN ('sports') THEN 'Sports'
  WHEN lower(coalesce(category, '')) IN ('entertainment') THEN 'Entertainment'
  WHEN lower(coalesce(category, '')) IN ('science') THEN 'Science'
  WHEN lower(coalesce(category, '')) IN ('world') THEN 'World'
  WHEN lower(coalesce(category, '')) IN ('india') THEN 'India'
  WHEN lower(coalesce(category, '')) IN ('local') THEN 'Local'
  ELSE category
END
WHERE category IS NOT NULL;

-- Keep feed metadata consistent.
UPDATE public.rss_feeds
SET
  source_type = coalesce(source_type, 'secondary'),
  reliability_tier = coalesce(reliability_tier, 'tier_2'),
  fetch_interval_minutes = coalesce(fetch_interval_minutes, 30),
  language = coalesce(language, 'en'),
  category = coalesce(category, 'World');

-- Upsert curated feeds (global + India + local/state coverage).
INSERT INTO public.rss_feeds (
  name,
  url,
  publisher,
  country_code,
  language,
  category,
  reliability_tier,
  source_type,
  fetch_interval_minutes,
  priority,
  state_id
)
VALUES
  ('NYTimes Home', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', 'The New York Times', 'US', 'en', 'World', 'tier_1', 'primary', 15, 95, NULL),
  ('NYTimes World', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'The New York Times', 'US', 'en', 'World', 'tier_1', 'primary', 15, 94, NULL),
  ('NYTimes US', 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml', 'The New York Times', 'US', 'en', 'World', 'tier_1', 'primary', 20, 92, NULL),
  ('NYTimes Business', 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', 'The New York Times', 'US', 'en', 'Business', 'tier_1', 'primary', 20, 90, NULL),
  ('Washington Post World', 'https://feeds.washingtonpost.com/rss/world', 'The Washington Post', 'US', 'en', 'World', 'tier_1', 'primary', 20, 90, NULL),
  ('LA Times', 'https://www.latimes.com/world-nation/rss2.0.xml', 'Los Angeles Times', 'US', 'en', 'World', 'tier_2', 'secondary', 30, 82, NULL),
  ('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'NPR', 'US', 'en', 'World', 'tier_1', 'primary', 15, 90, NULL),
  ('CNN Top', 'http://rss.cnn.com/rss/edition.rss', 'CNN', 'US', 'en', 'World', 'tier_2', 'secondary', 20, 84, NULL),
  ('CNN World', 'http://rss.cnn.com/rss/edition_world.rss', 'CNN', 'US', 'en', 'World', 'tier_2', 'secondary', 20, 84, NULL),
  ('Fox News Latest', 'https://moxie.foxnews.com/google-publisher/latest.xml', 'Fox News', 'US', 'en', 'World', 'tier_2', 'secondary', 20, 80, NULL),
  ('CBS Top', 'https://www.cbsnews.com/latest/rss/main', 'CBS News', 'US', 'en', 'World', 'tier_2', 'secondary', 20, 82, NULL),
  ('ABC Top', 'https://abcnews.go.com/abcnews/topstories', 'ABC News', 'US', 'en', 'World', 'tier_2', 'secondary', 20, 82, NULL),
  ('Politico Playbook', 'https://www.politico.com/rss/politicopicks.xml', 'Politico', 'US', 'en', 'Politics', 'tier_2', 'secondary', 30, 76, NULL),
  ('Guardian World', 'https://www.theguardian.com/world/rss', 'The Guardian', 'GB', 'en', 'World', 'tier_1', 'primary', 15, 93, NULL),
  ('Guardian UK', 'https://www.theguardian.com/uk/rss', 'The Guardian', 'GB', 'en', 'World', 'tier_1', 'primary', 20, 91, NULL),
  ('Sky News Home', 'https://feeds.skynews.com/feeds/rss/home.xml', 'Sky News', 'GB', 'en', 'World', 'tier_2', 'secondary', 20, 84, NULL),
  ('Sky News World', 'https://feeds.skynews.com/feeds/rss/world.xml', 'Sky News', 'GB', 'en', 'World', 'tier_2', 'secondary', 20, 84, NULL),
  ('BBC UK', 'http://feeds.bbci.co.uk/news/uk/rss.xml', 'BBC', 'GB', 'en', 'World', 'tier_1', 'primary', 15, 95, NULL),
  ('BBC Business', 'http://feeds.bbci.co.uk/news/business/rss.xml', 'BBC', 'GB', 'en', 'Business', 'tier_1', 'primary', 15, 93, NULL),
  ('BBC Technology', 'http://feeds.bbci.co.uk/news/technology/rss.xml', 'BBC', 'GB', 'en', 'Technology', 'tier_1', 'primary', 20, 90, NULL),
  ('CBC Top', 'https://www.cbc.ca/cmlink/rss-topstories', 'CBC', 'CA', 'en', 'World', 'tier_1', 'primary', 20, 90, NULL),
  ('Global News Canada', 'https://globalnews.ca/feed/', 'Global News', 'CA', 'en', 'World', 'tier_2', 'secondary', 20, 82, NULL),
  ('ABC Australia Top', 'https://www.abc.net.au/news/feed/51120/rss.xml', 'ABC Australia', 'AU', 'en', 'World', 'tier_1', 'primary', 20, 90, NULL),
  ('SBS Australia', 'https://www.sbs.com.au/news/feed', 'SBS News', 'AU', 'en', 'World', 'tier_2', 'secondary', 20, 82, NULL),
  ('Sydney Morning Herald', 'https://www.smh.com.au/rss/feed.xml', 'Sydney Morning Herald', 'AU', 'en', 'World', 'tier_2', 'secondary', 30, 78, NULL),
  ('DW Top', 'https://rss.dw.com/rdf/rss-en-top', 'Deutsche Welle', 'DE', 'en', 'World', 'tier_1', 'primary', 20, 90, NULL),
  ('France24', 'https://www.france24.com/en/rss', 'France 24', 'FR', 'en', 'World', 'tier_1', 'primary', 20, 90, NULL),
  ('Euronews', 'https://www.euronews.com/rss?format=mrss', 'Euronews', 'FR', 'en', 'World', 'tier_2', 'secondary', 20, 80, NULL),
  ('ANSA World', 'https://www.ansa.it/sito/ansait_rss.xml', 'ANSA', 'IT', 'it', 'World', 'tier_2', 'secondary', 30, 76, NULL),
  ('Japan Times', 'https://www.japantimes.co.jp/feed/', 'The Japan Times', 'JP', 'en', 'World', 'tier_1', 'primary', 20, 88, NULL),
  ('NHK World', 'https://www3.nhk.or.jp/rss/news/cat0.xml', 'NHK', 'JP', 'en', 'World', 'tier_1', 'primary', 20, 88, NULL),
  ('SCMP', 'https://www.scmp.com/rss/91/feed', 'South China Morning Post', 'HK', 'en', 'World', 'tier_2', 'secondary', 20, 82, NULL),
  ('Channel NewsAsia', 'https://www.channelnewsasia.com/rssfeeds/8395986', 'CNA', 'SG', 'en', 'World', 'tier_1', 'primary', 20, 88, NULL),
  ('Straits Times', 'https://www.straitstimes.com/news/singapore/rss.xml', 'The Straits Times', 'SG', 'en', 'World', 'tier_1', 'primary', 20, 88, NULL),
  ('Jerusalem Post', 'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx', 'Jerusalem Post', 'IL', 'en', 'World', 'tier_2', 'secondary', 20, 80, NULL),
  ('Times of Israel', 'https://www.timesofisrael.com/feed/', 'Times of Israel', 'IL', 'en', 'World', 'tier_2', 'secondary', 20, 80, NULL),
  ('Al Jazeera Middle East', 'https://www.aljazeera.com/xml/rss/all.xml', 'Al Jazeera', 'QA', 'en', 'World', 'tier_1', 'primary', 15, 90, NULL),
  ('Daily Star Bangladesh', 'https://www.thedailystar.net/frontpage/rss.xml', 'The Daily Star', 'BD', 'en', 'World', 'tier_2', 'secondary', 25, 80, NULL),
  ('Kathmandu Post', 'https://kathmandupost.com/rss', 'Kathmandu Post', 'NP', 'en', 'World', 'tier_2', 'secondary', 25, 78, NULL),
  ('Mail and Guardian', 'https://mg.co.za/feed/', 'Mail & Guardian', 'ZA', 'en', 'World', 'tier_2', 'secondary', 30, 76, NULL),
  ('Vanguard Nigeria', 'https://www.vanguardngr.com/feed/', 'Vanguard', 'NG', 'en', 'World', 'tier_2', 'secondary', 25, 76, NULL),
  ('Punch Nigeria', 'https://punchng.com/feed/', 'Punch', 'NG', 'en', 'World', 'tier_2', 'secondary', 25, 76, NULL),
  ('Folha Brazil', 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', 'Folha de S.Paulo', 'BR', 'pt', 'World', 'tier_2', 'secondary', 30, 74, NULL),
  ('Mexico News Daily', 'https://mexiconewsdaily.com/feed/', 'Mexico News Daily', 'MX', 'en', 'World', 'tier_2', 'secondary', 30, 72, NULL),
  ('Rappler Philippines', 'https://www.rappler.com/rss/', 'Rappler', 'PH', 'en', 'World', 'tier_2', 'secondary', 25, 78, NULL),
  ('VNExpress', 'https://vnexpress.net/rss/tin-moi-nhat.rss', 'VNExpress', 'VN', 'vi', 'World', 'tier_2', 'secondary', 25, 74, NULL),
  ('South China Morning Post World', 'https://www.scmp.com/rss/4/feed', 'South China Morning Post', 'HK', 'en', 'World', 'tier_2', 'secondary', 20, 80, NULL),
  ('India Today', 'https://www.indiatoday.in/rss/home', 'India Today', 'IN', 'en', 'India', 'tier_2', 'secondary', 15, 88, NULL),
  ('Times of India Top', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'Times of India', 'IN', 'en', 'India', 'tier_1', 'primary', 15, 90, NULL),
  ('Times of India India', 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', 'Times of India', 'IN', 'en', 'India', 'tier_1', 'primary', 15, 90, NULL),
  ('Hindustan Times India', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'Hindustan Times', 'IN', 'en', 'India', 'tier_1', 'primary', 15, 90, NULL),
  ('Firstpost India', 'https://www.firstpost.com/commonfeeds/v1/mfp/rss/india.xml', 'Firstpost', 'IN', 'en', 'India', 'tier_2', 'secondary', 20, 84, NULL),
  ('Economic Times', 'https://economictimes.indiatimes.com/rssfeedsdefault.cms', 'Economic Times', 'IN', 'en', 'Business', 'tier_1', 'primary', 15, 90, NULL),
  ('Greater Kashmir', 'https://www.greaterkashmir.com/feed/', 'Greater Kashmir', 'IN', 'en', 'Local', 'tier_2', 'secondary', 25, 74, 'jammu-kashmir'),
  ('EastMojo', 'https://www.eastmojo.com/feed/', 'EastMojo', 'IN', 'en', 'Local', 'tier_2', 'secondary', 25, 74, NULL),
  ('Kashmir Observer', 'https://kashmirobserver.net/feed/', 'Kashmir Observer', 'IN', 'en', 'Local', 'tier_2', 'secondary', 30, 72, 'jammu-kashmir'),
  ('The Shillong Times', 'https://theshillongtimes.com/feed/', 'The Shillong Times', 'IN', 'en', 'Local', 'tier_2', 'secondary', 30, 72, 'meghalaya'),
  ('Goa Chronicle', 'https://goachronicle.com/feed/', 'Goa Chronicle', 'IN', 'en', 'Local', 'tier_3', 'secondary', 30, 68, 'goa'),
  ('News Karnataka', 'https://newskarnataka.com/feed/', 'News Karnataka', 'IN', 'en', 'Local', 'tier_3', 'secondary', 30, 68, 'karnataka'),
  ('Kashmir Life', 'https://kashmirlife.net/feed/', 'Kashmir Life', 'IN', 'en', 'Local', 'tier_3', 'secondary', 30, 68, 'jammu-kashmir')
ON CONFLICT (url)
DO UPDATE SET
  name = EXCLUDED.name,
  publisher = EXCLUDED.publisher,
  country_code = EXCLUDED.country_code,
  language = EXCLUDED.language,
  category = EXCLUDED.category,
  reliability_tier = EXCLUDED.reliability_tier,
  source_type = EXCLUDED.source_type,
  fetch_interval_minutes = EXCLUDED.fetch_interval_minutes,
  priority = EXCLUDED.priority,
  state_id = coalesce(EXCLUDED.state_id, public.rss_feeds.state_id),
  is_active = true;

-- Performance indexes to keep cron ingestion responsive on larger feed sets.
CREATE INDEX IF NOT EXISTS idx_rss_feeds_active_tier_priority
  ON public.rss_feeds(is_active, reliability_tier, priority DESC);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_active_last_fetch
  ON public.rss_feeds(is_active, last_fetched_at);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_country_category
  ON public.rss_feeds(country_code, category);
