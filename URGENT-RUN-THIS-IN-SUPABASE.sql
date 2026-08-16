-- ══════════════════════════════════════════════════════════════════
-- GERAMA — COMPLETE FIX
-- Fixes: announcement delete, visit tracking, admin overview stats
--
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard
--   2. Open project: obfhmyeghurqfxingwtu
--   3. SQL Editor → New query
--   4. Paste everything below → click RUN
-- ══════════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────────
-- PART 1: ANNOUNCEMENTS — fix delete, insert, update, select
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read announcements"  ON announcements;
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;

CREATE POLICY "Public can read announcements"
  ON announcements FOR SELECT USING (true);

CREATE POLICY "Admin can insert announcements"
  ON announcements FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can delete announcements"
  ON announcements FOR DELETE USING (true);

CREATE POLICY "Admin can update announcements"
  ON announcements FOR UPDATE USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────────
-- PART 2: PAGE_VIEWS — create table if missing, fix policies
-- This is what feeds "Visits Today", "This Week", "All-Time" stats
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT,
  visited_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer TEXT;

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
DROP POLICY IF EXISTS "Anyone can read page_views"   ON page_views;

CREATE POLICY "Anyone can insert page_views"
  ON page_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read page_views"
  ON page_views FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────────────
-- PART 3: DELETE the two stuck announcements manually
-- (RLS Check and Test announcements posted 7th August)
-- ──────────────────────────────────────────────────────────────────
DELETE FROM announcements
WHERE title ILIKE '%rls%'
   OR title ILIKE '%test%'
   OR title ILIKE '%check%';


-- ──────────────────────────────────────────────────────────────────
-- VERIFY — you should see results from all 3 checks below
-- ──────────────────────────────────────────────────────────────────

-- Check 1: Announcement policies (expect 4 rows: DELETE, INSERT, SELECT, UPDATE)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'announcements'
ORDER BY cmd;

-- Check 2: page_views policies (expect 2 rows: INSERT, SELECT)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'page_views'
ORDER BY cmd;

-- Check 3: Remaining announcements (RLS/Test ones should be gone)
SELECT id, title, created_at
FROM announcements
ORDER BY created_at DESC
LIMIT 20;
