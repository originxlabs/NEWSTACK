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