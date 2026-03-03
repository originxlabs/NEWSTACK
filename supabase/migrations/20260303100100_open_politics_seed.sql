-- Open Politics seed graph (beta baseline)
-- Note: This seed provides broad India + world structure.
-- Continuous sync jobs should refresh incumbents from public sources.

INSERT INTO opennews.parties (name, slug, country_code, ideology)
VALUES
  ('Bharatiya Janata Party', 'bharatiya-janata-party', 'IN', 'Right'),
  ('Indian National Congress', 'indian-national-congress', 'IN', 'Centrist'),
  ('Aam Aadmi Party', 'aam-aadmi-party', 'IN', 'Center-left'),
  ('All India Trinamool Congress', 'all-india-trinamool-congress', 'IN', 'Center-left'),
  ('Dravida Munnetra Kazhagam', 'dravida-munnetra-kazhagam', 'IN', 'Regional'),
  ('Conservative Party (UK)', 'conservative-party-uk', 'GB', 'Centre-right'),
  ('Labour Party (UK)', 'labour-party-uk', 'GB', 'Centre-left'),
  ('Democratic Party (US)', 'democratic-party-us', 'US', 'Center-left'),
  ('Republican Party (US)', 'republican-party-us', 'US', 'Center-right')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO opennews.politicians (
  party_id,
  name,
  slug,
  country_code,
  state_code,
  district,
  current_position,
  office_level,
  is_major_leader,
  bio,
  metadata,
  wikipedia_url
)
SELECT p.id, x.name, x.slug, x.country_code, x.state_code, x.district, x.current_position, x.office_level, x.is_major_leader, x.bio, x.metadata::jsonb, x.wikipedia_url
FROM (
  VALUES
    (NULL, 'Open Politics India', 'open-politics-india-root', 'IN', NULL, NULL, 'India Leadership Root', 'country_root', true, 'Hierarchy root node for India leadership tree.', '{"seed":"beta_1_0","node_type":"root"}', NULL),
    ('bharatiya-janata-party', 'Narendra Modi', 'narendra-modi', 'IN', NULL, NULL, 'Prime Minister of India', 'national', true, 'Prime Minister of India.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Narendra_Modi'),
    (NULL, 'Droupadi Murmu', 'droupadi-murmu', 'IN', NULL, NULL, 'President of India', 'national', true, 'President of India.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Droupadi_Murmu'),
    ('bharatiya-janata-party', 'Amit Shah', 'amit-shah', 'IN', NULL, NULL, 'Union Home Minister', 'national', true, 'Union Home Minister of India.', '{"seed":"beta_1_0"}', 'https://en.wikipedia.org/wiki/Amit_Shah'),
    ('bharatiya-janata-party', 'Rajnath Singh', 'rajnath-singh', 'IN', NULL, NULL, 'Union Defence Minister', 'national', true, 'Union Defence Minister of India.', '{"seed":"beta_1_0"}', 'https://en.wikipedia.org/wiki/Rajnath_Singh'),
    ('bharatiya-janata-party', 'Nirmala Sitharaman', 'nirmala-sitharaman', 'IN', NULL, NULL, 'Union Finance Minister', 'national', true, 'Union Finance Minister of India.', '{"seed":"beta_1_0"}', 'https://en.wikipedia.org/wiki/Nirmala_Sitharaman'),
    ('bharatiya-janata-party', 'S. Jaishankar', 's-jaishankar', 'IN', NULL, NULL, 'Union External Affairs Minister', 'national', true, 'Union External Affairs Minister of India.', '{"seed":"beta_1_0"}', 'https://en.wikipedia.org/wiki/Subrahmanyam_Jaishankar'),

    (NULL, 'Chief Minister - Andhra Pradesh', 'cm-andhra-pradesh', 'IN', 'AP', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Andhra Pradesh"}', NULL),
    (NULL, 'Chief Minister - Arunachal Pradesh', 'cm-arunachal-pradesh', 'IN', 'AR', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Arunachal Pradesh"}', NULL),
    (NULL, 'Chief Minister - Assam', 'cm-assam', 'IN', 'AS', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Assam"}', NULL),
    (NULL, 'Chief Minister - Bihar', 'cm-bihar', 'IN', 'BR', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Bihar"}', NULL),
    (NULL, 'Chief Minister - Chhattisgarh', 'cm-chhattisgarh', 'IN', 'CG', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Chhattisgarh"}', NULL),
    (NULL, 'Chief Minister - Goa', 'cm-goa', 'IN', 'GA', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Goa"}', NULL),
    (NULL, 'Chief Minister - Gujarat', 'cm-gujarat', 'IN', 'GJ', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Gujarat"}', NULL),
    (NULL, 'Chief Minister - Haryana', 'cm-haryana', 'IN', 'HR', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Haryana"}', NULL),
    (NULL, 'Chief Minister - Himachal Pradesh', 'cm-himachal-pradesh', 'IN', 'HP', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Himachal Pradesh"}', NULL),
    (NULL, 'Chief Minister - Jharkhand', 'cm-jharkhand', 'IN', 'JH', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Jharkhand"}', NULL),
    (NULL, 'Chief Minister - Karnataka', 'cm-karnataka', 'IN', 'KA', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Karnataka"}', NULL),
    (NULL, 'Chief Minister - Kerala', 'cm-kerala', 'IN', 'KL', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Kerala"}', NULL),
    (NULL, 'Chief Minister - Madhya Pradesh', 'cm-madhya-pradesh', 'IN', 'MP', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Madhya Pradesh"}', NULL),
    (NULL, 'Chief Minister - Maharashtra', 'cm-maharashtra', 'IN', 'MH', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Maharashtra"}', NULL),
    (NULL, 'Chief Minister - Manipur', 'cm-manipur', 'IN', 'MN', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Manipur"}', NULL),
    (NULL, 'Chief Minister - Meghalaya', 'cm-meghalaya', 'IN', 'ML', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Meghalaya"}', NULL),
    (NULL, 'Chief Minister - Mizoram', 'cm-mizoram', 'IN', 'MZ', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Mizoram"}', NULL),
    (NULL, 'Chief Minister - Nagaland', 'cm-nagaland', 'IN', 'NL', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Nagaland"}', NULL),
    (NULL, 'Chief Minister - Odisha', 'cm-odisha', 'IN', 'OD', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Odisha"}', NULL),
    (NULL, 'Chief Minister - Punjab', 'cm-punjab', 'IN', 'PB', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Punjab"}', NULL),
    (NULL, 'Chief Minister - Rajasthan', 'cm-rajasthan', 'IN', 'RJ', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Rajasthan"}', NULL),
    (NULL, 'Chief Minister - Sikkim', 'cm-sikkim', 'IN', 'SK', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Sikkim"}', NULL),
    (NULL, 'Chief Minister - Tamil Nadu', 'cm-tamil-nadu', 'IN', 'TN', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Tamil Nadu"}', NULL),
    (NULL, 'Chief Minister - Telangana', 'cm-telangana', 'IN', 'TG', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Telangana"}', NULL),
    (NULL, 'Chief Minister - Tripura', 'cm-tripura', 'IN', 'TR', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Tripura"}', NULL),
    (NULL, 'Chief Minister - Uttar Pradesh', 'cm-uttar-pradesh', 'IN', 'UP', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Uttar Pradesh"}', NULL),
    (NULL, 'Chief Minister - Uttarakhand', 'cm-uttarakhand', 'IN', 'UK', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"Uttarakhand"}', NULL),
    (NULL, 'Chief Minister - West Bengal', 'cm-west-bengal', 'IN', 'WB', NULL, 'Chief Minister (Sync Pending)', 'state', true, 'Chief Minister profile placeholder. Sync job will update incumbent details.', '{"seed":"beta_1_0","sync_pending":true,"state_name":"West Bengal"}', NULL),

    (NULL, 'Open Politics World', 'open-politics-world-root', 'WW', NULL, NULL, 'World Leadership Root', 'world_root', true, 'Hierarchy root node for world leadership tree.', '{"seed":"beta_1_0","node_type":"root"}', NULL),
    ('republican-party-us', 'Donald Trump', 'donald-trump', 'US', NULL, NULL, 'President of the United States', 'national', true, 'Current US President profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Donald_Trump'),
    ('labour-party-uk', 'Keir Starmer', 'keir-starmer', 'GB', NULL, NULL, 'Prime Minister of the United Kingdom', 'national', true, 'Current UK Prime Minister profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Keir_Starmer'),
    (NULL, 'Emmanuel Macron', 'emmanuel-macron', 'FR', NULL, NULL, 'President of France', 'national', true, 'Current French President profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Emmanuel_Macron'),
    (NULL, 'Olaf Scholz', 'olaf-scholz', 'DE', NULL, NULL, 'Chancellor of Germany', 'national', true, 'Current German Chancellor profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Olaf_Scholz'),
    (NULL, 'Vladimir Putin', 'vladimir-putin', 'RU', NULL, NULL, 'President of Russia', 'national', true, 'Current Russian President profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Vladimir_Putin'),
    (NULL, 'Xi Jinping', 'xi-jinping', 'CN', NULL, NULL, 'President of China', 'national', true, 'Current Chinese President profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Xi_Jinping'),
    (NULL, 'Shigeru Ishiba', 'shigeru-ishiba', 'JP', NULL, NULL, 'Prime Minister of Japan', 'national', true, 'Current Japanese Prime Minister profile.', '{"seed":"beta_1_0","sync_priority":"high"}', 'https://en.wikipedia.org/wiki/Shigeru_Ishiba')
) AS x(party_slug, name, slug, country_code, state_code, district, current_position, office_level, is_major_leader, bio, metadata, wikipedia_url)
LEFT JOIN opennews.parties p ON p.slug = x.party_slug
ON CONFLICT (slug) DO UPDATE SET
  current_position = EXCLUDED.current_position,
  office_level = EXCLUDED.office_level,
  is_major_leader = EXCLUDED.is_major_leader,
  metadata = opennews.politicians.metadata || EXCLUDED.metadata,
  wikipedia_url = COALESCE(EXCLUDED.wikipedia_url, opennews.politicians.wikipedia_url),
  updated_at = now();

INSERT INTO opennews.office_terms (politician_id, office_title, region, started_on, ended_on)
SELECT pol.id, x.office_title, x.region, x.started_on::date, x.ended_on::date
FROM (
  VALUES
    ('narendra-modi', 'Prime Minister of India', 'India', DATE '2014-05-26', NULL),
    ('droupadi-murmu', 'President of India', 'India', DATE '2022-07-25', NULL),
    ('amit-shah', 'Union Home Minister', 'India', DATE '2019-05-30', NULL),
    ('rajnath-singh', 'Union Defence Minister', 'India', DATE '2019-05-31', NULL),
    ('nirmala-sitharaman', 'Union Finance Minister', 'India', DATE '2019-05-31', NULL),
    ('s-jaishankar', 'Union External Affairs Minister', 'India', DATE '2019-05-31', NULL),
    ('donald-trump', 'President of the United States', 'United States', DATE '2025-01-20', NULL),
    ('keir-starmer', 'Prime Minister of the United Kingdom', 'United Kingdom', DATE '2024-07-05', NULL),
    ('emmanuel-macron', 'President of France', 'France', DATE '2017-05-14', NULL),
    ('olaf-scholz', 'Chancellor of Germany', 'Germany', DATE '2021-12-08', NULL),
    ('vladimir-putin', 'President of Russia', 'Russia', DATE '2012-05-07', NULL),
    ('xi-jinping', 'President of China', 'China', DATE '2013-03-14', NULL),
    ('shigeru-ishiba', 'Prime Minister of Japan', 'Japan', DATE '2024-10-01', NULL)
) AS x(slug, office_title, region, started_on, ended_on)
JOIN opennews.politicians pol ON pol.slug = x.slug
ON CONFLICT DO NOTHING;

INSERT INTO opennews.political_hierarchy (parent_politician_id, child_politician_id, relation_type, country_code, state_code, display_order, metadata)
SELECT parent_pol.id, child_pol.id, x.relation_type, x.country_code, x.state_code, x.display_order, x.metadata::jsonb
FROM (
  VALUES
    ('open-politics-india-root', 'droupadi-murmu', 'constitutional_head', 'IN', NULL, 10, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'narendra-modi', 'executive_head', 'IN', NULL, 20, '{"seed":"beta_1_0"}'),
    ('narendra-modi', 'amit-shah', 'cabinet', 'IN', NULL, 30, '{"seed":"beta_1_0"}'),
    ('narendra-modi', 'rajnath-singh', 'cabinet', 'IN', NULL, 40, '{"seed":"beta_1_0"}'),
    ('narendra-modi', 'nirmala-sitharaman', 'cabinet', 'IN', NULL, 50, '{"seed":"beta_1_0"}'),
    ('narendra-modi', 's-jaishankar', 'cabinet', 'IN', NULL, 60, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-andhra-pradesh', 'state_government', 'IN', 'AP', 101, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-arunachal-pradesh', 'state_government', 'IN', 'AR', 102, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-assam', 'state_government', 'IN', 'AS', 103, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-bihar', 'state_government', 'IN', 'BR', 104, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-chhattisgarh', 'state_government', 'IN', 'CG', 105, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-goa', 'state_government', 'IN', 'GA', 106, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-gujarat', 'state_government', 'IN', 'GJ', 107, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-haryana', 'state_government', 'IN', 'HR', 108, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-himachal-pradesh', 'state_government', 'IN', 'HP', 109, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-jharkhand', 'state_government', 'IN', 'JH', 110, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-karnataka', 'state_government', 'IN', 'KA', 111, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-kerala', 'state_government', 'IN', 'KL', 112, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-madhya-pradesh', 'state_government', 'IN', 'MP', 113, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-maharashtra', 'state_government', 'IN', 'MH', 114, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-manipur', 'state_government', 'IN', 'MN', 115, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-meghalaya', 'state_government', 'IN', 'ML', 116, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-mizoram', 'state_government', 'IN', 'MZ', 117, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-nagaland', 'state_government', 'IN', 'NL', 118, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-odisha', 'state_government', 'IN', 'OD', 119, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-punjab', 'state_government', 'IN', 'PB', 120, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-rajasthan', 'state_government', 'IN', 'RJ', 121, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-sikkim', 'state_government', 'IN', 'SK', 122, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-tamil-nadu', 'state_government', 'IN', 'TN', 123, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-telangana', 'state_government', 'IN', 'TG', 124, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-tripura', 'state_government', 'IN', 'TR', 125, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-uttar-pradesh', 'state_government', 'IN', 'UP', 126, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-uttarakhand', 'state_government', 'IN', 'UK', 127, '{"seed":"beta_1_0"}'),
    ('open-politics-india-root', 'cm-west-bengal', 'state_government', 'IN', 'WB', 128, '{"seed":"beta_1_0"}'),

    ('open-politics-world-root', 'donald-trump', 'country_head', 'US', NULL, 10, '{"seed":"beta_1_0"}'),
    ('open-politics-world-root', 'keir-starmer', 'country_head', 'GB', NULL, 20, '{"seed":"beta_1_0"}'),
    ('open-politics-world-root', 'emmanuel-macron', 'country_head', 'FR', NULL, 30, '{"seed":"beta_1_0"}'),
    ('open-politics-world-root', 'olaf-scholz', 'country_head', 'DE', NULL, 40, '{"seed":"beta_1_0"}'),
    ('open-politics-world-root', 'vladimir-putin', 'country_head', 'RU', NULL, 50, '{"seed":"beta_1_0"}'),
    ('open-politics-world-root', 'xi-jinping', 'country_head', 'CN', NULL, 60, '{"seed":"beta_1_0"}'),
    ('open-politics-world-root', 'shigeru-ishiba', 'country_head', 'JP', NULL, 70, '{"seed":"beta_1_0"}')
) AS x(parent_slug, child_slug, relation_type, country_code, state_code, display_order, metadata)
JOIN opennews.politicians parent_pol ON parent_pol.slug = x.parent_slug
JOIN opennews.politicians child_pol ON child_pol.slug = x.child_slug
ON CONFLICT (parent_politician_id, child_politician_id, relation_type) DO NOTHING;

INSERT INTO opennews.politician_sources (politician_id, source_type, source_url, source_title, payload)
SELECT p.id, 'wikipedia', p.wikipedia_url, 'Wikipedia', jsonb_build_object('seed', 'beta_1_0')
FROM opennews.politicians p
WHERE p.wikipedia_url IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO opennews.politician_snapshot_history (politician_id, snapshot_month, current_position, party_id, is_major_leader, metadata)
SELECT p.id, date_trunc('month', now())::date, p.current_position, p.party_id, p.is_major_leader, jsonb_build_object('seed', 'beta_1_0')
FROM opennews.politicians p
WHERE p.slug IN (
  'open-politics-india-root',
  'narendra-modi',
  'droupadi-murmu',
  'amit-shah',
  'rajnath-singh',
  'nirmala-sitharaman',
  's-jaishankar',
  'open-politics-world-root',
  'donald-trump',
  'keir-starmer',
  'emmanuel-macron',
  'olaf-scholz',
  'vladimir-putin',
  'xi-jinping',
  'shigeru-ishiba'
)
ON CONFLICT (politician_id, snapshot_month) DO UPDATE SET
  current_position = EXCLUDED.current_position,
  party_id = EXCLUDED.party_id,
  is_major_leader = EXCLUDED.is_major_leader,
  metadata = opennews.politician_snapshot_history.metadata || EXCLUDED.metadata,
  recorded_at = now();
