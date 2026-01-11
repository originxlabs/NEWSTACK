-- Create function to increment API usage counter
CREATE OR REPLACE FUNCTION public.increment_api_usage(key_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys 
  SET requests_used = requests_used + 1
  WHERE id = key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;