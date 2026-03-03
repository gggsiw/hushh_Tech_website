-- Community Event Registrations
-- Stores hackathon, bug bash, demo day, and office hours registrations.
-- Two tracks: engineering (PR link) and mba (PDF upload).

CREATE TABLE IF NOT EXISTS public.community_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  track TEXT NOT NULL CHECK (track IN ('engineering', 'mba')),
  full_name TEXT NOT NULL,
  university TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  university_email TEXT NOT NULL,
  personal_email TEXT NOT NULL,
  photo_url TEXT,
  team_participants TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  -- Engineering track fields
  pr_link TEXT,
  -- MBA track fields
  prd_document_url TEXT,
  -- Both tracks
  demo_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS idx_community_reg_email ON public.community_registrations(university_email);
CREATE INDEX IF NOT EXISTS idx_community_reg_track ON public.community_registrations(track);

-- Enable RLS
ALTER TABLE public.community_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public registration)
CREATE POLICY "Anyone can register" ON public.community_registrations
  FOR INSERT WITH CHECK (true);

-- Users can read their own registrations
CREATE POLICY "Users can read own registrations" ON public.community_registrations
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
