-- Seed baseline extracted from repo migrations (INSERT statements)
-- Generated at: 2026-03-02T15:19:45Z

-- FILE: supabase/migrations/20260112072835_23fa8610-2dfc-48ac-95ea-ca4103539639.sql
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

-- FILE: supabase/migrations/20260110115404_354a6084-4187-4972-9a00-9b5d12ab5e12.sql
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

-- FILE: supabase/migrations/20260110142000_5937e8af-0cb8-45b5-a060-187a63e14e13.sql
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

-- FILE: supabase/migrations/20260112070542_8623af24-f308-4bd2-88a8-edd9a9d81549.sql
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Dainik Jagran Hindi', 'https://www.jagran.com/rss/news/national.xml', 'Jagran Prakashan', 'IN', 'hi', 'politics', 'tier_2', true, 30, 5),
  ('Amar Ujala Hindi', 'https://www.amarujala.com/rss/india-news.xml', 'Amar Ujala', 'IN', 'hi', 'world', 'tier_2', true, 30, 5),
  ('NavBharat Times Hindi', 'https://navbharattimes.indiatimes.com/rssfeedstopstories.cms', 'Times Group', 'IN', 'hi', 'politics', 'tier_2', true, 30, 5),
  ('BBC Hindi', 'https://feeds.bbci.co.uk/hindi/india/rss.xml', 'BBC', 'IN', 'hi', 'world', 'tier_1', true, 15, 8),
  ('Hindustan Hindi', 'https://feed.livehindustan.com/rss/3127', 'HT Media', 'IN', 'hi', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Dinamalar Tamil', 'https://www.dinamalar.com/rss/rss.xml', 'Dinamalar', 'IN', 'ta', 'world', 'tier_2', true, 30, 5),
  ('Dinamani Tamil', 'https://www.dinamani.com/rss/all.xml', 'New Indian Express', 'IN', 'ta', 'politics', 'tier_2', true, 30, 5),
  ('BBC Tamil', 'https://feeds.bbci.co.uk/tamil/rss.xml', 'BBC', 'IN', 'ta', 'world', 'tier_1', true, 15, 8),
  ('Tamil The Hindu', 'https://www.hindutamil.in/feed', 'The Hindu', 'IN', 'ta', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Sambad Odia', 'https://sambad.in/feed/', 'Sambad', 'IN', 'or', 'world', 'tier_2', true, 30, 5),
  ('Dharitri Odia', 'https://dharitri.com/feed/', 'Dharitri', 'IN', 'or', 'politics', 'tier_2', true, 30, 5),
  ('Pragativadi Odia', 'https://pragativadi.com/feed/', 'Pragativadi', 'IN', 'or', 'world', 'tier_3', true, 30, 4),
  ('Odisha TV Odia', 'https://odishatv.in/feed', 'OTV', 'IN', 'or', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Eenadu Telugu', 'https://www.eenadu.net/home/homeheadlines/rss', 'Eenadu', 'IN', 'te', 'politics', 'tier_2', true, 30, 5),
  ('Sakshi Telugu', 'https://www.sakshi.com/rss/top-stories', 'Sakshi Media', 'IN', 'te', 'world', 'tier_2', true, 30, 5),
  ('TV9 Telugu', 'https://www.tv9telugu.com/feed', 'TV9 Network', 'IN', 'te', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Vijaya Karnataka Kannada', 'https://vijaykarnataka.com/rss.cms', 'Times Group', 'IN', 'kn', 'politics', 'tier_2', true, 30, 5),
  ('Prajavani Kannada', 'https://www.prajavani.net/feed', 'Deccan Herald', 'IN', 'kn', 'world', 'tier_2', true, 30, 5),
  ('Udayavani Kannada', 'https://www.udayavani.com/rss.xml', 'Udayavani', 'IN', 'kn', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Malayala Manorama', 'https://www.manoramaonline.com/news/rss.xml', 'Manorama', 'IN', 'ml', 'world', 'tier_1', true, 15, 7),
  ('Mathrubhumi Malayalam', 'https://www.mathrubhumi.com/rss/news', 'Mathrubhumi', 'IN', 'ml', 'politics', 'tier_2', true, 30, 5),
  ('Asianet Malayalam', 'https://www.asianetnews.com/rss/news-feed', 'Asianet', 'IN', 'ml', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Anandabazar Bengali', 'https://www.anandabazar.com/rss/rssfeed.xml', 'ABP Group', 'IN', 'bn', 'politics', 'tier_2', true, 30, 5),
  ('Ei Samay Bengali', 'https://eisamay.com/rss.cms', 'Times Group', 'IN', 'bn', 'world', 'tier_2', true, 30, 5),
  ('BBC Bengali', 'https://feeds.bbci.co.uk/bengali/rss.xml', 'BBC', 'IN', 'bn', 'world', 'tier_1', true, 15, 8)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Maharashtra Times Marathi', 'https://maharashtratimes.com/rss.cms', 'Times Group', 'IN', 'mr', 'politics', 'tier_2', true, 30, 5),
  ('Lokmat Marathi', 'https://www.lokmat.com/feed/', 'Lokmat Media', 'IN', 'mr', 'world', 'tier_2', true, 30, 5),
  ('Loksatta Marathi', 'https://www.loksatta.com/feed/', 'Indian Express', 'IN', 'mr', 'politics', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Gujarat Samachar Gujarati', 'https://www.gujaratsamachar.com/rss', 'Gujarat Samachar', 'IN', 'gu', 'politics', 'tier_2', true, 30, 5),
  ('Divya Bhaskar Gujarati', 'https://www.divyabhaskar.co.in/rss/topstories.xml', 'Dainik Bhaskar', 'IN', 'gu', 'world', 'tier_2', true, 30, 5),
  ('Sandesh Gujarati', 'https://sandesh.com/feed/', 'Sandesh', 'IN', 'gu', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;
INSERT INTO public.rss_feeds (name, url, publisher, country_code, language, category, reliability_tier, is_active, fetch_interval_minutes, priority)
VALUES 
  ('Ajit Punjab Punjabi', 'https://www.ajitjalandhar.com/feed/', 'Ajit', 'IN', 'pa', 'politics', 'tier_2', true, 30, 5),
  ('Jagbani Punjabi', 'https://www.jagbani.com/rss', 'Jagran', 'IN', 'pa', 'world', 'tier_2', true, 30, 5)
ON CONFLICT (url) DO NOTHING;

-- FILE: supabase/migrations/20260110112813_c656c790-7c30-4cc7-b7a0-360c6317c566.sql
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

-- FILE: supabase/migrations/20260111041109_53f3227f-c660-4262-a1ef-7de1da988199.sql
INSERT INTO admin_users (email, role) 
VALUES ('OriginXLabs@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

