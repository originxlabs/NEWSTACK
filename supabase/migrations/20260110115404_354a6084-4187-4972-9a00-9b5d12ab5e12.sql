-- Add more Indian languages
INSERT INTO public.languages (code, name, native_name, direction) VALUES
  ('ta', 'Tamil', 'தமிழ்', 'ltr'),
  ('te', 'Telugu', 'తెలుగు', 'ltr'),
  ('kn', 'Kannada', 'ಕನ್ನಡ', 'ltr'),
  ('ml', 'Malayalam', 'മലയാളം', 'ltr'),
  ('mr', 'Marathi', 'मराठी', 'ltr'),
  ('gu', 'Gujarati', 'ગુજરાતી', 'ltr'),
  ('bn', 'Bengali', 'বাংলা', 'ltr'),
  ('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'ltr'),
  ('or', 'Odia', 'ଓଡ଼ିଆ', 'ltr')
ON CONFLICT (code) DO NOTHING;