-- Create role enum for newsroom access levels
CREATE TYPE public.newsroom_role AS ENUM ('owner', 'superadmin', 'admin', 'editor', 'viewer');

-- Create newsroom_members table for role-based access
CREATE TABLE public.newsroom_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    role newsroom_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.newsroom_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check newsroom role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_newsroom_role(_user_id UUID)
RETURNS newsroom_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.newsroom_members 
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

-- Function to check if user has at least a certain role level
CREATE OR REPLACE FUNCTION public.has_newsroom_access(_user_id UUID, _min_role newsroom_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.newsroom_members
    WHERE user_id = _user_id 
    AND is_active = true
    AND (
      role = 'owner' OR
      (role = 'superadmin' AND _min_role IN ('superadmin', 'admin', 'editor', 'viewer')) OR
      (role = 'admin' AND _min_role IN ('admin', 'editor', 'viewer')) OR
      (role = 'editor' AND _min_role IN ('editor', 'viewer')) OR
      (role = 'viewer' AND _min_role = 'viewer')
    )
  );
$$;

-- Function to check if user is owner or superadmin (for sensitive operations)
CREATE OR REPLACE FUNCTION public.is_newsroom_owner_or_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.newsroom_members
    WHERE user_id = _user_id 
    AND is_active = true
    AND role IN ('owner', 'superadmin')
  );
$$;

-- RLS Policies for newsroom_members
-- Only owners and superadmins can view all members
CREATE POLICY "Owners and superadmins can view all members"
ON public.newsroom_members FOR SELECT
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Only owners can insert new members
CREATE POLICY "Owners can insert members"
ON public.newsroom_members FOR INSERT
TO authenticated
WITH CHECK (public.get_newsroom_role(auth.uid()) = 'owner');

-- Only owners can update members
CREATE POLICY "Owners can update members"
ON public.newsroom_members FOR UPDATE
TO authenticated
USING (public.get_newsroom_role(auth.uid()) = 'owner');

-- Only owners can delete members
CREATE POLICY "Owners can delete members"
ON public.newsroom_members FOR DELETE
TO authenticated
USING (public.get_newsroom_role(auth.uid()) = 'owner');

-- Update RLS for rss_feeds to allow owner/superadmin to manage feeds
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

-- Anyone can read feeds (for public API)
CREATE POLICY "Anyone can read feeds"
ON public.rss_feeds FOR SELECT
USING (true);

-- Only owners and superadmins can insert feeds
CREATE POLICY "Owners and superadmins can insert feeds"
ON public.rss_feeds FOR INSERT
TO authenticated
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Only owners and superadmins can update feeds
CREATE POLICY "Owners and superadmins can update feeds"
ON public.rss_feeds FOR UPDATE
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Only owners and superadmins can delete feeds
CREATE POLICY "Owners and superadmins can delete feeds"
ON public.rss_feeds FOR DELETE
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

-- Enable realtime for ingestion_runs
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingestion_runs;

-- Add index for faster lookups
CREATE INDEX idx_newsroom_members_user_id ON public.newsroom_members(user_id);
CREATE INDEX idx_newsroom_members_email ON public.newsroom_members(email);

-- Add comments
COMMENT ON TABLE public.newsroom_members IS 'Newsroom access control with role hierarchy: owner > superadmin > admin > editor > viewer';
COMMENT ON FUNCTION public.get_newsroom_role IS 'Returns the newsroom role for a user';
COMMENT ON FUNCTION public.has_newsroom_access IS 'Checks if user has at least the specified role level';
COMMENT ON FUNCTION public.is_newsroom_owner_or_superadmin IS 'Checks if user is owner or superadmin for sensitive operations';