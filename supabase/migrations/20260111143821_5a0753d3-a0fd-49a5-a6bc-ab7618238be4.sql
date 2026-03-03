-- Drop unused tables (discussions feature removed, news replaced by stories)
DROP TABLE IF EXISTS discussion_reactions;
DROP TABLE IF EXISTS discussions;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS cached_news;