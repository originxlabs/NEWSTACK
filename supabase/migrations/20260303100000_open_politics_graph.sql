-- Open Politics expansion: hierarchy graph + public source snapshots

ALTER TABLE opennews.politicians
  ADD COLUMN IF NOT EXISTS official_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS wikipedia_url TEXT,
  ADD COLUMN IF NOT EXISTS wikidata_id TEXT,
  ADD COLUMN IF NOT EXISTS office_level TEXT DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS is_major_leader BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS qualifications TEXT,
  ADD COLUMN IF NOT EXISTS declared_income_text TEXT,
  ADD COLUMN IF NOT EXISTS criminal_case_summary TEXT,
  ADD COLUMN IF NOT EXISTS corruption_case_summary TEXT,
  ADD COLUMN IF NOT EXISTS achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS government_email TEXT,
  ADD COLUMN IF NOT EXISTS source_last_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS opennews.political_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_politician_id UUID REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  child_politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'reports_to',
  country_code TEXT NOT NULL,
  state_code TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT political_hierarchy_unique_edge UNIQUE(parent_politician_id, child_politician_id, relation_type)
);

CREATE TABLE IF NOT EXISTS opennews.politician_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT,
  source_published_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_hash TEXT
);

CREATE TABLE IF NOT EXISTS opennews.politician_snapshot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  snapshot_month DATE NOT NULL,
  current_position TEXT,
  party_id UUID REFERENCES opennews.parties(id) ON DELETE SET NULL,
  is_major_leader BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (politician_id, snapshot_month)
);

CREATE INDEX IF NOT EXISTS idx_opennews_politicians_geo_level
  ON opennews.politicians (country_code, state_code, office_level, is_major_leader);
CREATE INDEX IF NOT EXISTS idx_opennews_hierarchy_parent
  ON opennews.political_hierarchy (parent_politician_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_opennews_hierarchy_child
  ON opennews.political_hierarchy (child_politician_id, is_active);
CREATE INDEX IF NOT EXISTS idx_opennews_hierarchy_geo
  ON opennews.political_hierarchy (country_code, state_code, is_active);
CREATE INDEX IF NOT EXISTS idx_opennews_politician_sources_recent
  ON opennews.politician_sources (politician_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_opennews_snapshot_month
  ON opennews.politician_snapshot_history (snapshot_month DESC, politician_id);

DROP TRIGGER IF EXISTS trg_opennews_political_hierarchy_updated_at ON opennews.political_hierarchy;
CREATE TRIGGER trg_opennews_political_hierarchy_updated_at
BEFORE UPDATE ON opennews.political_hierarchy
FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();

ALTER TABLE opennews.political_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.politician_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.politician_snapshot_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "political_hierarchy_public_read" ON opennews.political_hierarchy;
CREATE POLICY "political_hierarchy_public_read"
ON opennews.political_hierarchy
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "politician_sources_public_read" ON opennews.politician_sources;
CREATE POLICY "politician_sources_public_read"
ON opennews.politician_sources
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "politician_snapshots_public_read" ON opennews.politician_snapshot_history;
CREATE POLICY "politician_snapshots_public_read"
ON opennews.politician_snapshot_history
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "political_hierarchy_mod_write" ON opennews.political_hierarchy;
CREATE POLICY "political_hierarchy_mod_write"
ON opennews.political_hierarchy
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "politician_sources_mod_write" ON opennews.politician_sources;
CREATE POLICY "politician_sources_mod_write"
ON opennews.politician_sources
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "politician_snapshots_mod_write" ON opennews.politician_snapshot_history;
CREATE POLICY "politician_snapshots_mod_write"
ON opennews.politician_snapshot_history
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));
