-- OpenNews Public Grievances module (Public Beta 1.0.0)

CREATE TABLE IF NOT EXISTS public.public_grievance_sectors (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.public_grievance_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  region_code TEXT NOT NULL DEFAULT 'national',
  sector_key TEXT NOT NULL REFERENCES public.public_grievance_sectors(key) ON DELETE RESTRICT,
  authority_name TEXT NOT NULL,
  department_level TEXT NOT NULL DEFAULT 'national',
  contact_email TEXT,
  contact_phone TEXT,
  grievance_url TEXT NOT NULL,
  website_url TEXT,
  escalation_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url TEXT,
  data_version TEXT NOT NULL DEFAULT '2026-03-03',
  last_verified_at DATE NOT NULL DEFAULT DATE '2026-03-03',
  data_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT public_grievance_authorities_unique UNIQUE (country_code, region_code, sector_key, authority_name)
);

CREATE TABLE IF NOT EXISTS public.public_grievance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no TEXT NOT NULL UNIQUE,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  country_code TEXT NOT NULL,
  region_code TEXT NOT NULL DEFAULT 'national',
  sector_key TEXT NOT NULL REFERENCES public.public_grievance_sectors(key) ON DELETE RESTRICT,
  authority_id UUID REFERENCES public.public_grievance_authorities(id) ON DELETE SET NULL,
  authority_name_snapshot TEXT NOT NULL,
  authority_email_snapshot TEXT,
  subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  ai_assisted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'forwarded', 'acknowledged', 'closed', 'failed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  mail_to TEXT[] NOT NULL DEFAULT '{}'::text[],
  mail_cc TEXT[] NOT NULL DEFAULT '{}'::text[],
  outbound_message_id TEXT,
  acknowledgement_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.public_grievance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.public_grievance_tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id UUID,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_grievance_authorities_country_sector
  ON public.public_grievance_authorities (country_code, sector_key, is_active, data_refreshed_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_grievance_authorities_region
  ON public.public_grievance_authorities (region_code, is_active);

CREATE INDEX IF NOT EXISTS idx_public_grievance_tickets_email_created
  ON public.public_grievance_tickets (requester_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_grievance_tickets_status_created
  ON public.public_grievance_tickets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_grievance_events_ticket_created
  ON public.public_grievance_events (ticket_id, created_at DESC);

ALTER TABLE public.public_grievance_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_grievance_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_grievance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_grievance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read grievance sectors" ON public.public_grievance_sectors;
CREATE POLICY "public can read grievance sectors"
  ON public.public_grievance_sectors
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "public can read grievance authorities" ON public.public_grievance_authorities;
CREATE POLICY "public can read grievance authorities"
  ON public.public_grievance_authorities
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "users can read own grievance tickets" ON public.public_grievance_tickets;
CREATE POLICY "users can read own grievance tickets"
  ON public.public_grievance_tickets
  FOR SELECT
  TO authenticated
  USING (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "users can read own grievance events" ON public.public_grievance_events;
CREATE POLICY "users can read own grievance events"
  ON public.public_grievance_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.public_grievance_tickets t
      WHERE t.id = public_grievance_events.ticket_id
        AND t.requester_user_id = auth.uid()
    )
  );

-- No direct ticket inserts from clients. Tickets are created via edge function with service role.

INSERT INTO public.public_grievance_sectors (key, name, description)
VALUES
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
  ('local-civic', 'Local Civic Services', 'Municipal, sanitation, roads, water and local public service issues.')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Initial baseline contacts seeded with data_version and last_verified_at = 2026-03-03.
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
  ('IN', 'national', 'politics-governance', 'CPGRAMS - Central Public Grievance Redress And Monitoring System', 'national', NULL, '1800-11-1555', 'https://pgportal.gov.in/', 'https://darpg.gov.in/',
   '[{"level":"L1","label":"CPGRAMS","email":null,"portal":"https://pgportal.gov.in/"}]'::jsonb,
   'https://pgportal.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'consumer-affairs', 'National Consumer Helpline', 'national', 'support@nch.gov.in', '1915', 'https://consumerhelpline.gov.in/', 'https://consumeraffairs.nic.in/',
   '[{"level":"L1","label":"NCH","email":"support@nch.gov.in","portal":"https://consumerhelpline.gov.in/"}]'::jsonb,
   'https://consumerhelpline.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'law-order', 'National Cyber Crime Reporting Portal', 'national', NULL, '1930', 'https://cybercrime.gov.in/', 'https://www.mha.gov.in/',
   '[{"level":"L1","label":"Cyber Crime Portal","email":null,"portal":"https://cybercrime.gov.in/"}]'::jsonb,
   'https://cybercrime.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'railways', 'RailMadad', 'national', NULL, '139', 'https://railmadad.indianrailways.gov.in/', 'https://indianrailways.gov.in/',
   '[{"level":"L1","label":"RailMadad","email":null,"portal":"https://railmadad.indianrailways.gov.in/"}]'::jsonb,
   'https://railmadad.indianrailways.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'telecom', 'Department of Telecommunications - Public Grievance', 'national', NULL, NULL, 'https://dot.gov.in/public-grievances', 'https://dot.gov.in/',
   '[{"level":"L1","label":"DoT Grievance","email":null,"portal":"https://dot.gov.in/public-grievances"}]'::jsonb,
   'https://dot.gov.in/public-grievances', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'agriculture', 'Ministry of Agriculture & Farmers Welfare - Public Grievance', 'national', NULL, NULL, 'https://agricoop.gov.in/', 'https://agricoop.gov.in/',
   '[{"level":"L1","label":"MoA&FW","email":null,"portal":"https://agricoop.gov.in/"}]'::jsonb,
   'https://agricoop.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'defence', 'Ministry of Defence - Public Interface', 'national', NULL, NULL, 'https://mod.gov.in/', 'https://mod.gov.in/',
   '[{"level":"L1","label":"MoD","email":null,"portal":"https://mod.gov.in/"}]'::jsonb,
   'https://mod.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'health', 'Ministry of Health & Family Welfare - Public Interface', 'national', NULL, '1075', 'https://www.mohfw.gov.in/', 'https://www.mohfw.gov.in/',
   '[{"level":"L1","label":"MoHFW","email":null,"portal":"https://www.mohfw.gov.in/"}]'::jsonb,
   'https://www.mohfw.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'education', 'Ministry of Education - Public Grievance', 'national', NULL, NULL, 'https://www.education.gov.in/', 'https://www.education.gov.in/',
   '[{"level":"L1","label":"MoE","email":null,"portal":"https://www.education.gov.in/"}]'::jsonb,
   'https://www.education.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'finance-tax', 'Ministry of Finance - Grievance Channels', 'national', NULL, NULL, 'https://financialservices.gov.in/grievance-redressal-mechanism', 'https://financialservices.gov.in/',
   '[{"level":"L1","label":"MoF/DFS","email":null,"portal":"https://financialservices.gov.in/grievance-redressal-mechanism"}]'::jsonb,
   'https://financialservices.gov.in/grievance-redressal-mechanism', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'power-energy', 'Ministry of Power - Grievance Interface', 'national', NULL, NULL, 'https://powermin.gov.in/', 'https://powermin.gov.in/',
   '[{"level":"L1","label":"MoP","email":null,"portal":"https://powermin.gov.in/"}]'::jsonb,
   'https://powermin.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'labour', 'Ministry of Labour & Employment - Centralised Public Grievance', 'national', NULL, NULL, 'https://labour.gov.in/', 'https://labour.gov.in/',
   '[{"level":"L1","label":"MoLE","email":null,"portal":"https://labour.gov.in/"}]'::jsonb,
   'https://labour.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'women-child', 'Ministry of Women and Child Development - Contact', 'national', NULL, '181', 'https://wcd.gov.in/', 'https://wcd.gov.in/',
   '[{"level":"L1","label":"MWCD","email":null,"portal":"https://wcd.gov.in/"}]'::jsonb,
   'https://wcd.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'environment', 'Ministry of Environment, Forest and Climate Change', 'national', NULL, NULL, 'https://moef.gov.in/', 'https://moef.gov.in/',
   '[{"level":"L1","label":"MoEFCC","email":null,"portal":"https://moef.gov.in/"}]'::jsonb,
   'https://moef.gov.in/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('IN', 'national', 'local-civic', 'Swachhata-MoHUA Grievance Portal', 'national', NULL, NULL, 'https://swachh.city/', 'https://mohua.gov.in/',
   '[{"level":"L1","label":"MoHUA Swachhata","email":null,"portal":"https://swachh.city/"}]'::jsonb,
   'https://swachh.city/', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('US', 'national', 'consumer-affairs', 'USA.gov Complaint and Consumer Support', 'national', NULL, NULL, 'https://www.usa.gov/consumer-complaints', 'https://www.usa.gov/',
   '[{"level":"L1","label":"USA.gov","email":null,"portal":"https://www.usa.gov/consumer-complaints"}]'::jsonb,
   'https://www.usa.gov/consumer-complaints', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('GB', 'national', 'local-civic', 'UK Government Complaints and Ombudsman Pathway', 'national', NULL, NULL, 'https://www.gov.uk/complain-about-government-department', 'https://www.gov.uk/',
   '[{"level":"L1","label":"GOV.UK","email":null,"portal":"https://www.gov.uk/complain-about-government-department"}]'::jsonb,
   'https://www.gov.uk/complain-about-government-department', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('AU', 'national', 'consumer-affairs', 'Australia Government Complaint Directory', 'national', NULL, NULL, 'https://www.australia.gov.au/help-and-support', 'https://www.australia.gov.au/',
   '[{"level":"L1","label":"Australia.gov.au","email":null,"portal":"https://www.australia.gov.au/help-and-support"}]'::jsonb,
   'https://www.australia.gov.au/help-and-support', '2026-03-03', DATE '2026-03-03', now(), true, now()),

  ('CA', 'national', 'consumer-affairs', 'Government of Canada - Complaints Process', 'national', NULL, NULL, 'https://www.canada.ca/en/contact/feedback.html', 'https://www.canada.ca/',
   '[{"level":"L1","label":"Canada Contact","email":null,"portal":"https://www.canada.ca/en/contact/feedback.html"}]'::jsonb,
   'https://www.canada.ca/en/contact/feedback.html', '2026-03-03', DATE '2026-03-03', now(), true, now())
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
