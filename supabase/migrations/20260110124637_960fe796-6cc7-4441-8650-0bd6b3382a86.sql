-- Create saved_places table for users to save favorite places
CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place_name TEXT NOT NULL,
  place_address TEXT,
  place_image_url TEXT,
  place_lat DOUBLE PRECISION,
  place_lng DOUBLE PRECISION,
  place_rating DOUBLE PRECISION,
  liked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

-- Enable RLS
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved places"
ON public.saved_places FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save places"
ON public.saved_places FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved places"
ON public.saved_places FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved places"
ON public.saved_places FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX idx_saved_places_place_id ON public.saved_places(place_id);