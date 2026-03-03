-- OpenNews Beta 1.0 defaults
INSERT INTO opennews.trending_config (
  id,
  like_weight,
  repost_weight,
  quote_weight,
  reply_weight,
  bookmark_weight,
  poll_vote_weight,
  unique_engager_weight,
  decay_half_life_hours,
  journalist_weight,
  newsroom_weight,
  controversy_multiplier
)
VALUES (1, 1, 3, 2.5, 2, 1.5, 0.8, 2, 18, 1.25, 1.15, 0.25)
ON CONFLICT (id) DO UPDATE SET
  like_weight = EXCLUDED.like_weight,
  repost_weight = EXCLUDED.repost_weight,
  quote_weight = EXCLUDED.quote_weight,
  reply_weight = EXCLUDED.reply_weight,
  bookmark_weight = EXCLUDED.bookmark_weight,
  poll_vote_weight = EXCLUDED.poll_vote_weight,
  unique_engager_weight = EXCLUDED.unique_engager_weight,
  decay_half_life_hours = EXCLUDED.decay_half_life_hours,
  journalist_weight = EXCLUDED.journalist_weight,
  newsroom_weight = EXCLUDED.newsroom_weight,
  controversy_multiplier = EXCLUDED.controversy_multiplier,
  updated_at = now();

INSERT INTO opennews.banned_terms (term, mode, severity, is_active)
VALUES
  ('kill all', 'exact', 5, true),
  ('ethnic cleansing', 'exact', 5, true),
  ('lynch', 'exact', 4, true),
  ('rape', 'exact', 5, true),
  ('nazi', 'exact', 4, true),
  ('terror funding', 'exact', 5, true),
  ('incite riot', 'exact', 5, true)
ON CONFLICT (term, mode) DO NOTHING;

-- Seed placeholder entities for political tracker shell
INSERT INTO opennews.parties (name, slug, country_code, ideology)
VALUES
  ('Indian National Congress', 'indian-national-congress', 'IN', 'Centrist'),
  ('Bharatiya Janata Party', 'bharatiya-janata-party', 'IN', 'Right')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO opennews.politicians (name, slug, country_code, state_code, current_position)
VALUES
  ('Sample Local Representative', 'sample-local-representative', 'IN', 'OD', 'Legislator')
ON CONFLICT (slug) DO NOTHING;

-- Link existing newsroom owners/superadmins into opennews accounts for admin visibility
INSERT INTO opennews.accounts (user_id, role, journalist_verified)
SELECT DISTINCT nm.user_id,
  CASE
    WHEN nm.role IN ('owner', 'superadmin') THEN 'newsroom_owner'::opennews.opennews_role
    WHEN nm.role = 'admin' THEN 'admin'::opennews.opennews_role
    ELSE 'user'::opennews.opennews_role
  END,
  false
FROM public.newsroom_members nm
WHERE nm.is_active = true
ON CONFLICT (user_id) DO NOTHING;
