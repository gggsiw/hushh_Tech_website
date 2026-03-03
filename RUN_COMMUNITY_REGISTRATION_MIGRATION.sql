-- Run this in Supabase Dashboard → SQL Editor
-- Creates the community_registrations table for event registration

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
  pr_link TEXT,
  prd_document_url TEXT,
  demo_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_reg_email ON public.community_registrations(university_email);
CREATE INDEX IF NOT EXISTS idx_community_reg_track ON public.community_registrations(track);

ALTER TABLE public.community_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (no auth required to register)
CREATE POLICY "Anyone can register" ON public.community_registrations
  FOR INSERT WITH CHECK (true);

-- Users can read their own registrations
CREATE POLICY "Users can read own registrations" ON public.community_registrations
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Also create the storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-uploads', 'community-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to community-uploads bucket
CREATE POLICY "Public community uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'community-uploads');

CREATE POLICY "Public read community uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-uploads');
