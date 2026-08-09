-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Fix: Opportunities Images + Stats (Run in Supabase SQL Editor)
-- ══════════════════════════════════════════════════════════════════
-- This file fixes:
--   1. apply_count never incrementing (missing RPC function)
--   2. view_count never incrementing (recreate RPC to be safe)
--   3. page_views table missing (visit stats showing 0)
--   4. Storage bucket public read policy for opportunity images
-- ══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. RPC: increment opportunity VIEW count
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_opp_views(opp_id UUID)
RETURNS void AS $$
  UPDATE opportunities
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = opp_id;
$$ LANGUAGE SQL SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────
-- 2. RPC: increment opportunity APPLY count (was missing!)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_opp_applies(opp_id UUID)
RETURNS void AS $$
  UPDATE opportunities
  SET apply_count = COALESCE(apply_count, 0) + 1
  WHERE id = opp_id;
$$ LANGUAGE SQL SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────
-- 3. page_views table (for site visit statistics)
--    Safe to run even if it already exists.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page       TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  referrer   TEXT
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read page views" ON page_views;
CREATE POLICY "Anyone can read page views"
  ON page_views FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────
-- 4. Storage: make gerama-materials bucket publicly readable
--    This is what allows opportunity images (and other uploads)
--    to display on the website.
--    NOTE: If you get "policy already exists" errors, that is fine.
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Public read for entire bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'Public read gerama-materials'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Public read gerama-materials"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'gerama-materials');
    $p$;
  END IF;

  -- Allow anon uploads to opportunities folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'Allow opportunity uploads anon'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Allow opportunity uploads anon"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'gerama-materials');
    $p$;
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════════════
-- ALSO: In Supabase Dashboard → Storage → gerama-materials
--       Click the bucket → Settings → toggle "Public bucket" ON
--       This is the EASIEST way to make images publicly accessible.
-- ══════════════════════════════════════════════════════════════════
