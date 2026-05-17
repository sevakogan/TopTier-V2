-- TTMC V2 — Garage Pass migration
-- Additive only. Safe to run on the existing schema (no drops, no data loss).
-- Run in the Supabase SQL editor.

-- 1. New columns on members to support the free Garage Pass tier
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS membership_interest TEXT,         -- tier they applied for: 'Core' | 'VIP' | 'Strategic'
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;           -- when they upgraded from garage pass to applicant

-- Garage Pass semantics (no schema change, just documented conventions):
--   tier   = 'garage'          -> free Garage Pass holder (prospect)
--   tier   = 'Core'|'VIP'|'Strategic' -> paid member
--   status = 'garage_pass'     -> free account, browsing teaser content
--   status = 'pending_membership' -> applied for a paid tier, in admin review
--   status = 'active'          -> approved + paid member

-- 2. RLS: a signed-in user may create THEIR OWN members row (self-serve Garage Pass)
DROP POLICY IF EXISTS "Users can create own garage pass" ON members;
CREATE POLICY "Users can create own garage pass"
  ON members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. RLS: a signed-in user may update THEIR OWN members row (to apply for membership)
DROP POLICY IF EXISTS "Users can update own row" ON members;
CREATE POLICY "Users can update own row"
  ON members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Helpful index for the "is this user already a member?" lookup on every login
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
