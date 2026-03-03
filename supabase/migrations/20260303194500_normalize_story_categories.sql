-- Normalize existing story categories to the locked taxonomy.
UPDATE public.stories
SET category = CASE
  WHEN lower(coalesce(category, '')) IN ('ai') THEN 'AI'
  WHEN lower(coalesce(category, '')) IN ('business') THEN 'Business'
  WHEN lower(coalesce(category, '')) IN ('finance') THEN 'Finance'
  WHEN lower(coalesce(category, '')) IN ('politics', 'political') THEN 'Politics'
  WHEN lower(coalesce(category, '')) IN ('startups', 'startup') THEN 'Startups'
  WHEN lower(coalesce(category, '')) IN ('technology', 'tech') THEN 'Technology'
  WHEN lower(coalesce(category, '')) IN ('climate', 'environment') THEN 'Climate'
  WHEN lower(coalesce(category, '')) IN ('health', 'healthcare') THEN 'Health'
  WHEN lower(coalesce(category, '')) IN ('sports', 'sport') THEN 'Sports'
  WHEN lower(coalesce(category, '')) IN ('entertainment') THEN 'Entertainment'
  WHEN lower(coalesce(category, '')) IN ('science') THEN 'Science'
  WHEN lower(coalesce(category, '')) IN ('india', 'national') THEN 'India'
  WHEN lower(coalesce(category, '')) IN ('local') THEN 'Local'
  WHEN lower(coalesce(category, '')) IN ('world', 'international') THEN 'World'
  ELSE 'World'
END
WHERE category IS NULL
   OR btrim(category) = ''
   OR category NOT IN (
    'AI', 'Business', 'Finance', 'Politics', 'Startups', 'Technology',
    'Climate', 'Health', 'Sports', 'Entertainment', 'Science', 'World', 'India', 'Local'
   );
