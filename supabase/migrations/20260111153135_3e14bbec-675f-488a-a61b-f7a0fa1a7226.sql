-- Phase 1: Extend rss_feeds table with source classification
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'secondary';
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS reliability_tier text DEFAULT 'tier_2';
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS publisher text;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS fetch_interval_minutes integer DEFAULT 30;

-- Add constraints for rss_feeds
ALTER TABLE public.rss_feeds ADD CONSTRAINT valid_source_type 
  CHECK (source_type IN ('primary', 'secondary', 'opinion', 'aggregator'));
ALTER TABLE public.rss_feeds ADD CONSTRAINT valid_reliability_tier 
  CHECK (reliability_tier IN ('tier_1', 'tier_2', 'tier_3'));

-- Phase 2: Extend stories table with intelligence fields
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS story_state text DEFAULT 'single_source';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'low';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS primary_source_count integer DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS has_contradictions boolean DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS verified_source_count integer DEFAULT 0;

-- Add constraints for stories
ALTER TABLE public.stories ADD CONSTRAINT valid_story_state 
  CHECK (story_state IN ('single_source', 'developing', 'confirmed', 'contradicted'));
ALTER TABLE public.stories ADD CONSTRAINT valid_confidence_level 
  CHECK (confidence_level IN ('low', 'medium', 'high'));

-- Phase 3: Extend story_sources table with tier information
ALTER TABLE public.story_sources ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'secondary';
ALTER TABLE public.story_sources ADD COLUMN IF NOT EXISTS reliability_tier text DEFAULT 'tier_2';
ALTER TABLE public.story_sources ADD COLUMN IF NOT EXISTS is_primary_reporting boolean DEFAULT false;

-- Create index for faster tier-based queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_tier ON public.rss_feeds(reliability_tier);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_source_type ON public.rss_feeds(source_type);
CREATE INDEX IF NOT EXISTS idx_stories_confidence ON public.stories(confidence_level);
CREATE INDEX IF NOT EXISTS idx_stories_state ON public.stories(story_state);