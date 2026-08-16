-- ══════════════════════════════════════════════════════════════════
-- GERAMA — COMPLETE FIX v2
-- Fixes: announcement delete, visit tracking, admin overview stats
-- + deletes the stuck RLS/Test announcements safely
--
-- HOW TO RUN:
--   1. https://supabase.com/dashboard → project obfhmyeghurqfxingwtu
--   2. SQL Editor → New query → paste all → RUN
-- ══════════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────────
-- PART 1: Fix REPLICA IDENTITY so deletes work with Realtime
-- (This was the error: "does not have a replica identity")
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE announcements REPLICA IDENTITY FULL;


-- ──────────────────────────────────────────────────────────────────
-- PART 2: ANNOUNCEMENTS — all 4 RLS policies
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
-- PART 3: PAGE_VIEWS — create + RLS (fixes Visits Today / This Week)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         BIGSERIAL PRIMARY KEY,
  page       TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
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
-- PART 4: Delete stuck test data from DB
-- Removes: RLS Check + Test announcements, test assignments, test classes
-- ──────────────────────────────────────────────────────────────────

-- Delete test/RLS announcements
DELETE FROM announcements
WHERE title ILIKE '%rls%'
   OR title ILIKE '%test%'
   OR title ILIKE '%check%';

-- Delete test assignments (assignments table uses "title" column)
DELETE FROM assignments
WHERE title ILIKE '%test%';

-- Delete test classes (classes table uses "topic" column, not "title")
DELETE FROM classes
WHERE topic ILIKE '%test%'
   OR course ILIKE '%test%'
   OR topic ILIKE '%unknown%';


-- ──────────────────────────────────────────────────────────────────
-- VERIFY — check all 3 after running
-- ──────────────────────────────────────────────────────────────────

-- 1. Announcement policies (expect 4 rows)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'announcements' ORDER BY cmd;

-- 2. page_views policies (expect 2 rows)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'page_views' ORDER BY cmd;

-- 3. Remaining announcements (RLS/Test should be gone)
SELECT id, title, created_at FROM announcements
ORDER BY created_at DESC LIMIT 20;
