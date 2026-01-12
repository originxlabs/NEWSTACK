-- Add columns for original language content (Odia, Hindi, etc.)
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS original_headline TEXT,
ADD COLUMN IF NOT EXISTS original_summary TEXT,
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10);

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_stories_original_language ON public.stories(original_language);

COMMENT ON COLUMN public.stories.original_headline IS 'Original headline in native language (Odia, Hindi, etc.)';
COMMENT ON COLUMN public.stories.original_summary IS 'Original summary in native language';
COMMENT ON COLUMN public.stories.original_language IS 'ISO 639-1 language code of original content (or, hi, ta, etc.)';