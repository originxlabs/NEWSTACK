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