-- Complete India state/UT feed coverage for OpenNews.
-- Adds validated regional RSS feeds for states/UTs that had no active mapping.
-- Also corrects known state_id mapping drift for existing feeds.

-- Fix known incorrect mappings.
UPDATE public.rss_feeds
SET state_id = 'telangana'
WHERE url = 'https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms';

UPDATE public.rss_feeds
SET state_id = 'chandigarh'
WHERE url = 'https://timesofindia.indiatimes.com/rssfeeds/-2128769355.cms';

-- Add state/UT fallback streams (Google News regional RSS) so every India state/UT has coverage.
-- These are kept as aggregator sources with lower priority than direct publisher feeds.
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
  state_id,
  is_active
)
VALUES
  ('Google News Andaman & Nicobar', 'https://news.google.com/rss/search?q=Andaman+and+Nicobar+Islands+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'andaman-nicobar', true),
  ('Google News Arunachal Pradesh', 'https://news.google.com/rss/search?q=Arunachal+Pradesh+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'arunachal-pradesh', true),
  ('Google News Chandigarh', 'https://news.google.com/rss/search?q=Chandigarh+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'chandigarh', true),
  ('Google News Chhattisgarh', 'https://news.google.com/rss/search?q=Chhattisgarh+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'chhattisgarh', true),
  ('Google News DNHDD', 'https://news.google.com/rss/search?q=Dadra+Nagar+Haveli+Daman+Diu+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'dadra-nagar-haveli-daman-diu', true),
  ('Google News Haryana', 'https://news.google.com/rss/search?q=Haryana+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'haryana', true),
  ('Google News Jharkhand', 'https://news.google.com/rss/search?q=Jharkhand+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'jharkhand', true),
  ('Google News Ladakh', 'https://news.google.com/rss/search?q=Ladakh+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'ladakh', true),
  ('Google News Lakshadweep', 'https://news.google.com/rss/search?q=Lakshadweep+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'lakshadweep', true),
  ('Google News Madhya Pradesh', 'https://news.google.com/rss/search?q=Madhya+Pradesh+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'madhya-pradesh', true),
  ('Google News Manipur', 'https://news.google.com/rss/search?q=Manipur+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'manipur', true),
  ('Google News Mizoram', 'https://news.google.com/rss/search?q=Mizoram+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'mizoram', true),
  ('Google News Nagaland', 'https://news.google.com/rss/search?q=Nagaland+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'nagaland', true),
  ('Google News Puducherry', 'https://news.google.com/rss/search?q=Puducherry+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'puducherry', true),
  ('Google News Punjab', 'https://news.google.com/rss/search?q=Punjab+India+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'punjab', true),
  ('Google News Sikkim', 'https://news.google.com/rss/search?q=Sikkim+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'sikkim', true),
  ('Google News Tripura', 'https://news.google.com/rss/search?q=Tripura+local+news&hl=en-IN&gl=IN&ceid=IN:en', 'Google News (Regional)', 'IN', 'en', 'Local', 'tier_2', 'aggregator', 20, 62, 'tripura', true)
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
  state_id = EXCLUDED.state_id,
  is_active = true;
