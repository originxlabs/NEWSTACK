-- Data Cleanup Migration: Delete all existing stories and sources for fresh ingestion
-- This ensures clean slate for properly sanitized data

-- Step 1: Delete all story sources first (foreign key constraint)
DELETE FROM public.story_sources;

-- Step 2: Delete all stories
DELETE FROM public.stories;

-- Step 3: Reset RSS feed last_fetched_at to force re-fetch all feeds
UPDATE public.rss_feeds SET last_fetched_at = NULL;

-- Step 4: Create ingestion_runs table to track pipeline executions
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    
    -- Pipeline step tracking
    step_fetch_feeds TEXT DEFAULT 'pending',
    step_fetch_feeds_count INTEGER DEFAULT 0,
    step_normalize TEXT DEFAULT 'pending',
    step_normalize_count INTEGER DEFAULT 0,
    step_validate TEXT DEFAULT 'pending',
    step_validate_rejected INTEGER DEFAULT 0,
    step_classify TEXT DEFAULT 'pending',
    step_classify_count INTEGER DEFAULT 0,
    step_dedupe TEXT DEFAULT 'pending',
    step_dedupe_merged INTEGER DEFAULT 0,
    step_store TEXT DEFAULT 'pending',
    step_store_created INTEGER DEFAULT 0,
    step_cleanup TEXT DEFAULT 'pending',
    step_cleanup_deleted INTEGER DEFAULT 0,
    
    -- Tier breakdown
    tier1_feeds INTEGER DEFAULT 0,
    tier2_feeds INTEGER DEFAULT 0,
    tier3_feeds INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_step TEXT,
    
    -- Summary
    total_feeds_processed INTEGER DEFAULT 0,
    total_stories_created INTEGER DEFAULT 0,
    total_stories_merged INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ingestion_runs
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read ingestion runs (for dashboard)
CREATE POLICY "Authenticated users can view ingestion runs" 
ON public.ingestion_runs 
FOR SELECT 
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at ON public.ingestion_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON public.ingestion_runs(status);

-- Add comment explaining the table
COMMENT ON TABLE public.ingestion_runs IS 'Tracks RSS ingestion pipeline executions with step-by-step progress and error reporting';