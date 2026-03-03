-- OpenNews Beta 1.0 schema foundation
CREATE SCHEMA IF NOT EXISTS opennews;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'opennews_role' AND n.nspname = 'opennews') THEN
    CREATE TYPE opennews.opennews_role AS ENUM ('anonymous', 'user', 'journalist', 'moderator', 'admin', 'newsroom_owner');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'moderation_status' AND n.nspname = 'opennews') THEN
    CREATE TYPE opennews.moderation_status AS ENUM ('clean', 'watch', 'queued', 'hidden_auto', 'approved_override', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'post_visibility' AND n.nspname = 'opennews') THEN
    CREATE TYPE opennews.post_visibility AS ENUM ('public', 'followers', 'private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'engagement_type' AND n.nspname = 'opennews') THEN
    CREATE TYPE opennews.engagement_type AS ENUM ('like', 'repost', 'quote', 'reply', 'bookmark', 'poll_vote');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'queue_status' AND n.nspname = 'opennews') THEN
    CREATE TYPE opennews.queue_status AS ENUM ('pending', 'approved', 'rejected', 'published', 'failed');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS opennews.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role opennews.opennews_role NOT NULL DEFAULT 'user',
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  journalist_verified BOOLEAN NOT NULL DEFAULT false,
  newsroom_id UUID NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.anonymous_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT UNIQUE NOT NULL,
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 40,
  abuse_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.newsrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  is_enterprise BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounts_newsroom_fk'
  ) THEN
    ALTER TABLE opennews.accounts
      ADD CONSTRAINT accounts_newsroom_fk
      FOREIGN KEY (newsroom_id) REFERENCES opennews.newsrooms(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS opennews.newsroom_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsroom_id UUID NOT NULL REFERENCES opennews.newsrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role opennews.opennews_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(newsroom_id, user_id)
);

CREATE TABLE IF NOT EXISTS opennews.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status opennews.queue_status NOT NULL DEFAULT 'pending',
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_post_id UUID NULL REFERENCES opennews.posts(id) ON DELETE SET NULL,
  parent_post_id UUID NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  quote_post_id UUID NULL REFERENCES opennews.posts(id) ON DELETE SET NULL,
  author_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_identity_id UUID NULL REFERENCES opennews.anonymous_identities(id) ON DELETE SET NULL,
  newsroom_id UUID NULL REFERENCES opennews.newsrooms(id) ON DELETE SET NULL,
  author_name TEXT NULL,
  author_role opennews.opennews_role NOT NULL DEFAULT 'user',
  headline TEXT NULL,
  body TEXT NOT NULL,
  tldr TEXT NULL,
  ai_summary TEXT NULL,
  moderation_level TEXT NOT NULL DEFAULT 'standard',
  moderation_status opennews.moderation_status NOT NULL DEFAULT 'clean',
  moderation_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility opennews.post_visibility NOT NULL DEFAULT 'public',
  comments_enabled BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  controversy_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  journalist_credibility_score NUMERIC(6,3) NOT NULL DEFAULT 50,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_document tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(headline, '') || ' ' || coalesce(body, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  editor_id UUID REFERENCES auth.users(id),
  old_body TEXT,
  new_body TEXT,
  revision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, hashtag)
);

CREATE TABLE IF NOT EXISTS opennews.post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES auth.users(id),
  handle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.post_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_identity_id UUID NULL REFERENCES opennews.anonymous_identities(id) ON DELETE CASCADE,
  engagement_type opennews.engagement_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, engagement_type),
  UNIQUE (post_id, anonymous_identity_id, engagement_type)
);

CREATE TABLE IF NOT EXISTS opennews.post_metrics (
  post_id UUID PRIMARY KEY REFERENCES opennews.posts(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  reposts INTEGER NOT NULL DEFAULT 0,
  quotes INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  poll_votes INTEGER NOT NULL DEFAULT 0,
  unique_engagers INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID UNIQUE NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES opennews.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (poll_id, sort_order)
);

CREATE TABLE IF NOT EXISTS opennews.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id UUID NOT NULL REFERENCES opennews.poll_options(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_identity_id UUID NULL REFERENCES opennews.anonymous_identities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_option_id, user_id),
  UNIQUE (poll_option_id, anonymous_identity_id)
);

CREATE TABLE IF NOT EXISTS opennews.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS opennews.banned_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'exact',
  severity SMALLINT NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(term, mode)
);

CREATE TABLE IF NOT EXISTS opennews.moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES opennews.posts(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  decision TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  status opennews.queue_status NOT NULL DEFAULT 'pending',
  priority SMALLINT NOT NULL DEFAULT 5,
  flagged_categories TEXT[] NOT NULL DEFAULT '{}',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id)
);

CREATE TABLE IF NOT EXISTS opennews.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES auth.users(id),
  reporter_anonymous_identity_id UUID REFERENCES opennews.anonymous_identities(id),
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.shadow_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, active)
);

CREATE TABLE IF NOT EXISTS opennews.abuse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  anonymous_identity_id UUID REFERENCES opennews.anonymous_identities(id),
  ip_hash TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,
  ideology TEXT,
  founded_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES opennews.parties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,
  state_code TEXT,
  district TEXT,
  current_position TEXT,
  credibility_score NUMERIC(6,3) NOT NULL DEFAULT 50,
  controversy_count INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  title TEXT NOT NULL,
  started_on DATE,
  ended_on DATE,
  governing_party_id UUID REFERENCES opennews.parties(id) ON DELETE SET NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.office_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  office_title TEXT NOT NULL,
  region TEXT,
  started_on DATE,
  ended_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.controversies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity SMALLINT NOT NULL DEFAULT 3,
  source_url TEXT,
  happened_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.public_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  promise_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'tracking',
  promised_on DATE,
  due_on DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.historical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  happened_on DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.post_politician_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  politician_id UUID NOT NULL REFERENCES opennews.politicians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, politician_id)
);

CREATE TABLE IF NOT EXISTS opennews.trending_config (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  like_weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  repost_weight NUMERIC(6,3) NOT NULL DEFAULT 3,
  quote_weight NUMERIC(6,3) NOT NULL DEFAULT 2.5,
  reply_weight NUMERIC(6,3) NOT NULL DEFAULT 2,
  bookmark_weight NUMERIC(6,3) NOT NULL DEFAULT 1.5,
  poll_vote_weight NUMERIC(6,3) NOT NULL DEFAULT 0.8,
  unique_engager_weight NUMERIC(6,3) NOT NULL DEFAULT 2,
  decay_half_life_hours NUMERIC(6,3) NOT NULL DEFAULT 18,
  journalist_weight NUMERIC(6,3) NOT NULL DEFAULT 1.25,
  newsroom_weight NUMERIC(6,3) NOT NULL DEFAULT 1.15,
  controversy_multiplier NUMERIC(6,3) NOT NULL DEFAULT 0.25,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.post_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  score NUMERIC(12,6) NOT NULL,
  score_window TEXT NOT NULL DEFAULT '24h',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, score_window, calculated_at)
);

CREATE TABLE IF NOT EXISTS opennews.debate_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  left_post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  right_post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(left_post_id, right_post_id)
);

CREATE TABLE IF NOT EXISTS opennews.headline_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  status_code INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opennews.x_publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES opennews.posts(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status opennews.queue_status NOT NULL DEFAULT 'pending',
  tweet_text TEXT NOT NULL,
  external_tweet_id TEXT,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS product TEXT NOT NULL DEFAULT 'newstack';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{read:news}';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS rate_limit_rpm INTEGER NOT NULL DEFAULT 60;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS monthly_quota INTEGER NOT NULL DEFAULT 50000;

CREATE OR REPLACE FUNCTION opennews.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opennews_accounts_updated_at ON opennews.accounts;
CREATE TRIGGER trg_opennews_accounts_updated_at BEFORE UPDATE ON opennews.accounts FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_posts_updated_at ON opennews.posts;
CREATE TRIGGER trg_opennews_posts_updated_at BEFORE UPDATE ON opennews.posts FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_newsrooms_updated_at ON opennews.newsrooms;
CREATE TRIGGER trg_opennews_newsrooms_updated_at BEFORE UPDATE ON opennews.newsrooms FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_verification_updated_at ON opennews.verification_requests;
CREATE TRIGGER trg_opennews_verification_updated_at BEFORE UPDATE ON opennews.verification_requests FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_queue_updated_at ON opennews.moderation_queue;
CREATE TRIGGER trg_opennews_queue_updated_at BEFORE UPDATE ON opennews.moderation_queue FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_party_updated_at ON opennews.parties;
CREATE TRIGGER trg_opennews_party_updated_at BEFORE UPDATE ON opennews.parties FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_politicians_updated_at ON opennews.politicians;
CREATE TRIGGER trg_opennews_politicians_updated_at BEFORE UPDATE ON opennews.politicians FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_trending_cfg_updated_at ON opennews.trending_config;
CREATE TRIGGER trg_opennews_trending_cfg_updated_at BEFORE UPDATE ON opennews.trending_config FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();
DROP TRIGGER IF EXISTS trg_opennews_x_queue_updated_at ON opennews.x_publish_queue;
CREATE TRIGGER trg_opennews_x_queue_updated_at BEFORE UPDATE ON opennews.x_publish_queue FOR EACH ROW EXECUTE FUNCTION opennews.touch_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opennews_posts_visibility_status_created ON opennews.posts (created_at DESC, moderation_status, visibility);
CREATE INDEX IF NOT EXISTS idx_opennews_posts_root_parent ON opennews.posts (root_post_id, parent_post_id);
CREATE INDEX IF NOT EXISTS idx_opennews_post_engagements_post_type ON opennews.post_engagements (post_id, engagement_type);
CREATE INDEX IF NOT EXISTS idx_opennews_post_hashtags_hash_created ON opennews.post_hashtags (hashtag, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opennews_politicians_geo_name ON opennews.politicians (country_code, state_code, name);
CREATE INDEX IF NOT EXISTS idx_opennews_mentions_politician_created ON opennews.post_politician_mentions (politician_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opennews_queue_status_priority_created ON opennews.moderation_queue (status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_opennews_posts_tsv ON opennews.posts USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_opennews_posts_metadata_gin ON opennews.posts USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_opennews_score_snapshots_post_window_time ON opennews.post_score_snapshots (post_id, score_window, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_opennews_x_publish_queue_status_created ON opennews.x_publish_queue (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opennews_api_usage_logs_key_endpoint_time ON opennews.api_usage_logs (api_key_id, endpoint, created_at DESC);
