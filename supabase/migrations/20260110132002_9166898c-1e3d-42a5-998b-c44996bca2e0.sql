-- Create discussions table for news and places
CREATE TABLE public.discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'place')),
  content_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  message TEXT NOT NULL,
  agrees_count INTEGER DEFAULT 0,
  disagrees_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  reported_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discussion reactions table
CREATE TABLE public.discussion_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  anonymous_id TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('agree', 'disagree')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discussion_id, user_id),
  UNIQUE(discussion_id, anonymous_id)
);

-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  order_id TEXT,
  status TEXT DEFAULT 'pending',
  donation_type TEXT DEFAULT 'one-time' CHECK (donation_type IN ('one-time', 'monthly', 'annual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Discussions policies
CREATE POLICY "Anyone can view non-hidden discussions"
ON public.discussions FOR SELECT
USING (is_hidden = false);

CREATE POLICY "Anyone can create discussions"
ON public.discussions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own discussions"
ON public.discussions FOR UPDATE
USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Anyone can view reactions"
ON public.discussion_reactions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create reactions"
ON public.discussion_reactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
ON public.discussion_reactions FOR DELETE
USING (auth.uid() = user_id OR anonymous_id IS NOT NULL);

-- Newsletter policies
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Donations policies
CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create donations"
ON public.donations FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_discussions_content ON public.discussions(content_type, content_id);
CREATE INDEX idx_discussions_created ON public.discussions(created_at DESC);
CREATE INDEX idx_reactions_discussion ON public.discussion_reactions(discussion_id);

-- Add trigger for updated_at
CREATE TRIGGER update_discussions_updated_at
BEFORE UPDATE ON public.discussions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();