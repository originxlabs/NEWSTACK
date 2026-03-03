-- Public Grievances enhancements for location-default filters and full sector coverage.
-- Baseline reference date: 2026-03-03.

INSERT INTO public.public_grievance_sectors (key, name, description)
VALUES
  ('auth', 'Auth & Identity', 'Identity, Aadhaar, digital identity and authentication grievances.'),
  ('agriculture', 'Agriculture', 'Farming, crop support, agri credit, procurement, irrigation grievances.'),
  ('defence', 'Defence', 'Defence-related citizen grievances and ex-servicemen issue routing.'),
  ('railways', 'Railways', 'Rail operations, passenger issues, station complaints, service grievances.'),
  ('power-energy', 'Power & Energy', 'Electricity supply, transmission, billing escalation contacts.'),
  ('telecom', 'Telecom & Digital', 'Telecom service quality, spam fraud, internet and digital public services.'),
  ('education', 'Education', 'School and higher education grievances and institutional escalation routes.'),
  ('health', 'Health & Public Health', 'Hospital access, healthcare delivery, public health reporting channels.'),
  ('finance-tax', 'Finance & Tax', 'Banking, taxation, public finance and citizen financial grievance pathways.'),
  ('consumer-affairs', 'Consumer Affairs', 'Consumer rights, fraud, unfair trade practices and complaint filing.'),
  ('labour', 'Labour & Employment', 'Workplace and labour policy grievances, welfare and employment services.'),
  ('women-child', 'Women & Child Welfare', 'Women and child support channels, safety and welfare complaints.'),
  ('environment', 'Environment', 'Pollution, climate, forest and wildlife governance complaints.'),
  ('law-order', 'Law, Order & Cyber', 'Police, cybercrime, legal process and public security channels.'),
  ('politics-governance', 'Politics & Governance', 'Elected office, governance conduct and policy grievances.'),
  ('local-civic', 'Local Civic Services', 'Municipal, sanitation, roads, water and local public service issues.'),
  ('transport', 'Transport', 'Road transport, civil aviation and multimodal transport complaints.'),
  ('housing-urban', 'Housing & Urban Affairs', 'Housing schemes, urban development and city infrastructure grievances.'),
  ('rural-development', 'Rural Development', 'Rural development schemes and village infrastructure grievances.'),
  ('social-justice', 'Social Justice', 'Social justice, welfare and inclusion grievances.'),
  ('minority-affairs', 'Minority Affairs', 'Minority welfare and access-related grievances.'),
  ('tribal-affairs', 'Tribal Affairs', 'Tribal welfare and rights-related grievance channels.'),
  ('food-public-distribution', 'Food & Public Distribution', 'Food supply, ration and PDS grievance routes.'),
  ('water-sanitation', 'Water & Sanitation', 'Water supply and sanitation grievances.'),
  ('disaster-management', 'Disaster Management', 'Disaster response, relief and emergency grievance channels.'),
  ('judiciary-legal', 'Judiciary & Legal Services', 'Legal aid and justice service-related grievances.'),
  ('immigration-passport', 'Immigration & Passport', 'Passport and immigration grievance pathways.'),
  ('pensions-senior-citizens', 'Pensions & Senior Citizens', 'Pension and senior citizen grievance channels.'),
  ('business-msme', 'Business & MSME', 'Industry, startup and MSME support grievance channels.'),
  ('tourism-culture', 'Tourism & Culture', 'Tourism and culture service grievances.')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.public_grievance_authorities (
  country_code,
  region_code,
  sector_key,
  authority_name,
  department_level,
  contact_email,
  contact_phone,
  grievance_url,
  website_url,
  escalation_contacts,
  source_url,
  data_version,
  last_verified_at,
  data_refreshed_at,
  is_active,
  updated_at
)
VALUES
  (
    'IN',
    'national',
    'auth',
    'UIDAI + CPGRAMS Identity Grievance Route',
    'national',
    'help@uidai.gov.in',
    '1947',
    'https://pgportal.gov.in/',
    'https://uidai.gov.in/',
    '[{"level":"L1","label":"UIDAI Helpline","email":"help@uidai.gov.in","portal":"https://uidai.gov.in/"},{"level":"L2","label":"CPGRAMS","email":null,"portal":"https://pgportal.gov.in/"}]'::jsonb,
    'https://uidai.gov.in/',
    '2026-03-03',
    DATE '2026-03-03',
    now(),
    true,
    now()
  )
ON CONFLICT (country_code, region_code, sector_key, authority_name) DO UPDATE SET
  department_level = EXCLUDED.department_level,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  grievance_url = EXCLUDED.grievance_url,
  website_url = EXCLUDED.website_url,
  escalation_contacts = EXCLUDED.escalation_contacts,
  source_url = EXCLUDED.source_url,
  data_version = EXCLUDED.data_version,
  last_verified_at = EXCLUDED.last_verified_at,
  data_refreshed_at = EXCLUDED.data_refreshed_at,
  is_active = EXCLUDED.is_active,
  updated_at = now();

WITH state_codes(code) AS (
  VALUES
    ('AN'), ('AP'), ('AR'), ('AS'), ('BR'), ('CH'), ('CG'), ('DN'), ('DL'),
    ('GA'), ('GJ'), ('HR'), ('HP'), ('JK'), ('JH'), ('KA'), ('KL'), ('LA'),
    ('LD'), ('MP'), ('MH'), ('MN'), ('ML'), ('MZ'), ('NL'), ('OD'), ('PY'),
    ('PB'), ('RJ'), ('SK'), ('TN'), ('TG'), ('TR'), ('UP'), ('UK'), ('WB')
)
INSERT INTO public.public_grievance_authorities (
  country_code,
  region_code,
  sector_key,
  authority_name,
  department_level,
  contact_email,
  contact_phone,
  grievance_url,
  website_url,
  escalation_contacts,
  source_url,
  data_version,
  last_verified_at,
  data_refreshed_at,
  is_active,
  updated_at
)
SELECT
  'IN',
  code,
  'auth',
  'State Identity + CPGRAMS Grievance (' || code || ')',
  'state',
  'help@uidai.gov.in',
  '1947',
  'https://pgportal.gov.in/',
  'https://uidai.gov.in/',
  '[{"level":"L1","label":"UIDAI Helpline","email":"help@uidai.gov.in","portal":"https://uidai.gov.in/"},{"level":"L2","label":"CPGRAMS","email":null,"portal":"https://pgportal.gov.in/"}]'::jsonb,
  'https://pgportal.gov.in/',
  '2026-03-03',
  DATE '2026-03-03',
  now(),
  true,
  now()
FROM state_codes
ON CONFLICT (country_code, region_code, sector_key, authority_name) DO UPDATE SET
  department_level = EXCLUDED.department_level,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  grievance_url = EXCLUDED.grievance_url,
  website_url = EXCLUDED.website_url,
  escalation_contacts = EXCLUDED.escalation_contacts,
  source_url = EXCLUDED.source_url,
  data_version = EXCLUDED.data_version,
  last_verified_at = EXCLUDED.last_verified_at,
  data_refreshed_at = EXCLUDED.data_refreshed_at,
  is_active = EXCLUDED.is_active,
  updated_at = now();

