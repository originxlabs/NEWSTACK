-- Add proper location fields to stories table for drill-down navigation
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS locality TEXT DEFAULT NULL;

-- Create indexes for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_stories_state ON public.stories(state);
CREATE INDEX IF NOT EXISTS idx_stories_district ON public.stories(district);
CREATE INDEX IF NOT EXISTS idx_stories_city ON public.stories(city);
CREATE INDEX IF NOT EXISTS idx_stories_locality ON public.stories(locality);

-- Composite index for common location hierarchical queries
CREATE INDEX IF NOT EXISTS idx_stories_location_hierarchy 
ON public.stories(country_code, state, district, city);