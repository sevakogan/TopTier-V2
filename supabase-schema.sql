-- TTMC V2 Supabase Schema
-- Run this in your Supabase SQL editor after creating the project

-- Applications (public insert, admin read)
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  instagram TEXT,
  car TEXT,
  modifications TEXT,
  source TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Members (created after approval)
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  application_id UUID REFERENCES applications(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  instagram TEXT,
  car TEXT,
  modifications TEXT,
  tier TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  type TEXT,
  description TEXT,
  capacity INT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RSVPs
CREATE TABLE event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  member_id UUID REFERENCES members(id),
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, member_id)
);

-- Perks/Sponsors
CREATE TABLE perks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  discount TEXT NOT NULL,
  description TEXT,
  code TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit application"
  ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read applications"
  ON applications FOR SELECT
  USING (auth.email() IN ('sevakogan@gmail.com', 'seva@thelevelteam.com'));

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see own data"
  ON members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins see all members"
  ON members FOR ALL
  USING (auth.email() IN ('sevakogan@gmail.com', 'seva@thelevelteam.com'));

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public events visible to all"
  ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Admins manage events"
  ON events FOR ALL
  USING (auth.email() IN ('sevakogan@gmail.com', 'seva@thelevelteam.com'));

ALTER TABLE perks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active perks visible to all"
  ON perks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage perks"
  ON perks FOR ALL
  USING (auth.email() IN ('sevakogan@gmail.com', 'seva@thelevelteam.com'));
