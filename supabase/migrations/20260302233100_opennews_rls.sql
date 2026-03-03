-- OpenNews RLS and helper functions
CREATE SCHEMA IF NOT EXISTS opennews;

CREATE OR REPLACE FUNCTION opennews.get_effective_role(_user_id UUID)
RETURNS opennews.opennews_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, opennews
AS $$
DECLARE
  account_role opennews.opennews_role;
  newsroom_role public.newsroom_role;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'anonymous';
  END IF;

  SELECT role INTO account_role
  FROM opennews.accounts
  WHERE user_id = _user_id
  LIMIT 1;

  IF account_role IS NOT NULL THEN
    RETURN account_role;
  END IF;

  SELECT role INTO newsroom_role
  FROM public.newsroom_members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;

  IF newsroom_role IN ('owner', 'superadmin') THEN
    RETURN 'newsroom_owner';
  ELSIF newsroom_role = 'admin' THEN
    RETURN 'admin';
  END IF;

  RETURN 'user';
END;
$$;

CREATE OR REPLACE FUNCTION opennews.can_moderate(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, opennews
AS $$
  SELECT opennews.get_effective_role(_user_id) IN ('moderator', 'admin', 'newsroom_owner');
$$;

CREATE OR REPLACE FUNCTION opennews.can_manage_trending(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, opennews
AS $$
  SELECT opennews.get_effective_role(_user_id) IN ('admin', 'newsroom_owner');
$$;

CREATE OR REPLACE FUNCTION opennews.is_shadow_banned(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, opennews
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM opennews.shadow_bans sb
    WHERE sb.user_id = _user_id
      AND sb.active = true
      AND (sb.expires_at IS NULL OR sb.expires_at > now())
  );
$$;

ALTER TABLE opennews.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.anonymous_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.newsrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.newsroom_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.banned_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.shadow_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.abuse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.office_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.controversies ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.public_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.historical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_politician_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.trending_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.post_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.debate_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.headline_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opennews.x_publish_queue ENABLE ROW LEVEL SECURITY;

-- Accounts
DROP POLICY IF EXISTS "accounts_select_self" ON opennews.accounts;
CREATE POLICY "accounts_select_self"
ON opennews.accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "accounts_insert_self" ON opennews.accounts;
CREATE POLICY "accounts_insert_self"
ON opennews.accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "accounts_update_self" ON opennews.accounts;
CREATE POLICY "accounts_update_self"
ON opennews.accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR opennews.can_moderate(auth.uid()))
WITH CHECK (user_id = auth.uid() OR opennews.can_moderate(auth.uid()));

-- Posts
DROP POLICY IF EXISTS "posts_public_read" ON opennews.posts;
CREATE POLICY "posts_public_read"
ON opennews.posts FOR SELECT
USING (
  (
    visibility = 'public'
    AND moderation_status IN ('clean', 'approved_override')
  )
  OR author_id = auth.uid()
  OR opennews.can_moderate(auth.uid())
);

DROP POLICY IF EXISTS "posts_insert_owner" ON opennews.posts;
CREATE POLICY "posts_insert_owner"
ON opennews.posts FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (NOT opennews.is_shadow_banned(auth.uid()))
);

DROP POLICY IF EXISTS "posts_update_owner_or_mod" ON opennews.posts;
CREATE POLICY "posts_update_owner_or_mod"
ON opennews.posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid() OR opennews.can_moderate(auth.uid()))
WITH CHECK (author_id = auth.uid() OR opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "posts_delete_owner_or_mod" ON opennews.posts;
CREATE POLICY "posts_delete_owner_or_mod"
ON opennews.posts FOR DELETE
TO authenticated
USING (author_id = auth.uid() OR opennews.can_moderate(auth.uid()));

-- Engagement and bookmarks
DROP POLICY IF EXISTS "engagements_read" ON opennews.post_engagements;
CREATE POLICY "engagements_read"
ON opennews.post_engagements FOR SELECT
USING (true);

DROP POLICY IF EXISTS "engagements_insert_auth" ON opennews.post_engagements;
CREATE POLICY "engagements_insert_auth"
ON opennews.post_engagements FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "engagements_delete_auth" ON opennews.post_engagements;
CREATE POLICY "engagements_delete_auth"
ON opennews.post_engagements FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "bookmarks_manage_own" ON opennews.bookmarks;
CREATE POLICY "bookmarks_manage_own"
ON opennews.bookmarks
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Moderation tables
DROP POLICY IF EXISTS "moderation_read_mods" ON opennews.moderation_queue;
CREATE POLICY "moderation_read_mods"
ON opennews.moderation_queue FOR SELECT
TO authenticated
USING (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "moderation_write_mods" ON opennews.moderation_queue;
CREATE POLICY "moderation_write_mods"
ON opennews.moderation_queue
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "banned_terms_mods" ON opennews.banned_terms;
CREATE POLICY "banned_terms_mods"
ON opennews.banned_terms
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "shadow_bans_mods" ON opennews.shadow_bans;
CREATE POLICY "shadow_bans_mods"
ON opennews.shadow_bans
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "mod_events_mods" ON opennews.moderation_events;
CREATE POLICY "mod_events_mods"
ON opennews.moderation_events
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

-- Political transparency tables: public read, moderated write
DROP POLICY IF EXISTS "parties_public_read" ON opennews.parties;
CREATE POLICY "parties_public_read" ON opennews.parties FOR SELECT USING (true);
DROP POLICY IF EXISTS "politicians_public_read" ON opennews.politicians;
CREATE POLICY "politicians_public_read" ON opennews.politicians FOR SELECT USING (true);
DROP POLICY IF EXISTS "regimes_public_read" ON opennews.regimes;
CREATE POLICY "regimes_public_read" ON opennews.regimes FOR SELECT USING (true);
DROP POLICY IF EXISTS "office_terms_public_read" ON opennews.office_terms;
CREATE POLICY "office_terms_public_read" ON opennews.office_terms FOR SELECT USING (true);
DROP POLICY IF EXISTS "controversies_public_read" ON opennews.controversies;
CREATE POLICY "controversies_public_read" ON opennews.controversies FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_promises_public_read" ON opennews.public_promises;
CREATE POLICY "public_promises_public_read" ON opennews.public_promises FOR SELECT USING (true);
DROP POLICY IF EXISTS "historical_events_public_read" ON opennews.historical_events;
CREATE POLICY "historical_events_public_read" ON opennews.historical_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "politics_write_mods" ON opennews.parties;
CREATE POLICY "politics_write_mods" ON opennews.parties
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "politicians_write_mods" ON opennews.politicians;
CREATE POLICY "politicians_write_mods" ON opennews.politicians
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "regimes_write_mods" ON opennews.regimes;
CREATE POLICY "regimes_write_mods" ON opennews.regimes
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "office_terms_write_mods" ON opennews.office_terms;
CREATE POLICY "office_terms_write_mods" ON opennews.office_terms
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "controversies_write_mods" ON opennews.controversies;
CREATE POLICY "controversies_write_mods" ON opennews.controversies
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "promises_write_mods" ON opennews.public_promises;
CREATE POLICY "promises_write_mods" ON opennews.public_promises
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "history_write_mods" ON opennews.historical_events;
CREATE POLICY "history_write_mods" ON opennews.historical_events
TO authenticated USING (opennews.can_moderate(auth.uid())) WITH CHECK (opennews.can_moderate(auth.uid()));

-- Trending config and snapshots
DROP POLICY IF EXISTS "trending_config_public_read" ON opennews.trending_config;
CREATE POLICY "trending_config_public_read" ON opennews.trending_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "trending_config_admin_write" ON opennews.trending_config;
CREATE POLICY "trending_config_admin_write"
ON opennews.trending_config
TO authenticated
USING (opennews.can_manage_trending(auth.uid()))
WITH CHECK (opennews.can_manage_trending(auth.uid()));

DROP POLICY IF EXISTS "scores_public_read" ON opennews.post_score_snapshots;
CREATE POLICY "scores_public_read" ON opennews.post_score_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "scores_mod_write" ON opennews.post_score_snapshots;
CREATE POLICY "scores_mod_write"
ON opennews.post_score_snapshots
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

-- API usage logs and x queue are moderator/admin visible
DROP POLICY IF EXISTS "api_usage_mods" ON opennews.api_usage_logs;
CREATE POLICY "api_usage_mods"
ON opennews.api_usage_logs FOR SELECT
TO authenticated
USING (opennews.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "x_queue_mods" ON opennews.x_publish_queue;
CREATE POLICY "x_queue_mods"
ON opennews.x_publish_queue
TO authenticated
USING (opennews.can_moderate(auth.uid()))
WITH CHECK (opennews.can_moderate(auth.uid()));

-- Public readable supporting tables
DROP POLICY IF EXISTS "post_metrics_read" ON opennews.post_metrics;
CREATE POLICY "post_metrics_read" ON opennews.post_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "hashtags_read" ON opennews.post_hashtags;
CREATE POLICY "hashtags_read" ON opennews.post_hashtags FOR SELECT USING (true);
DROP POLICY IF EXISTS "mentions_read" ON opennews.post_mentions;
CREATE POLICY "mentions_read" ON opennews.post_mentions FOR SELECT USING (true);
DROP POLICY IF EXISTS "polls_read" ON opennews.polls;
CREATE POLICY "polls_read" ON opennews.polls FOR SELECT USING (true);
DROP POLICY IF EXISTS "poll_options_read" ON opennews.poll_options;
CREATE POLICY "poll_options_read" ON opennews.poll_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "poll_votes_read" ON opennews.poll_votes;
CREATE POLICY "poll_votes_read" ON opennews.poll_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "debate_pairs_read" ON opennews.debate_pairs;
CREATE POLICY "debate_pairs_read" ON opennews.debate_pairs FOR SELECT USING (true);
DROP POLICY IF EXISTS "headline_suggestions_read" ON opennews.headline_suggestions;
CREATE POLICY "headline_suggestions_read" ON opennews.headline_suggestions FOR SELECT USING (true);
DROP POLICY IF EXISTS "mentions_map_read" ON opennews.post_politician_mentions;
CREATE POLICY "mentions_map_read" ON opennews.post_politician_mentions FOR SELECT USING (true);

