-- Phase 7: Question bank visibility — public (shared) vs personal
-- Adds is_public flag so questions created in lists stay private
-- while curated questions can be published to the general bank.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Update RLS: the old policy from 0006 combined own+org+public.
-- Replace it with explicit named policies so each path is clear.
DROP POLICY IF EXISTS "questions_select_own_or_org_or_public" ON public.questions;

-- Users always see their own questions (regardless of is_public).
CREATE POLICY "questions_select_own" ON public.questions
  FOR SELECT USING (owner_id = auth.uid());

-- Authenticated users see any question marked as public.
CREATE POLICY "questions_select_public" ON public.questions
  FOR SELECT USING (is_public = true);

-- Org members see questions shared within their org.
CREATE POLICY "questions_select_org" ON public.questions
  FOR SELECT USING (
    org_id IS NOT NULL AND is_org_member(org_id)
  );
