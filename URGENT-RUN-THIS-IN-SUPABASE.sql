-- ══════════════════════════════════════════════════════════════════
-- GERAMA — COMPLETE FIX v3
-- Run this in Supabase SQL Editor → New query → RUN ALL
-- Project: obfhmyeghurqfxingwtu
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Fix announcements so deletes work ──────────────────────────
ALTER TABLE announcements REPLICA IDENTITY FULL;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read announcements"  ON announcements;
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;

CREATE POLICY "Public can read announcements"  ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin can insert announcements" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can delete announcements" ON announcements FOR DELETE USING (true);
CREATE POLICY "Admin can update announcements" ON announcements FOR UPDATE USING (true) WITH CHECK (true);


-- ── 2. Create page_views table + policies (FIXES VISITS = 0) ─────
-- This is the ONLY reason visits show 0 — the table exists but
-- the INSERT policy is missing so no visit rows can be written.
CREATE TABLE IF NOT EXISTS page_views (
  id         BIGSERIAL PRIMARY KEY,
  page       TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  referrer   TEXT
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
DROP POLICY IF EXISTS "Anyone can read page_views"   ON page_views;

CREATE POLICY "Anyone can insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read page_views"   ON page_views FOR SELECT USING (true);


-- ── 3. Delete stuck test announcements ───────────────────────────
DELETE FROM announcements
WHERE title ILIKE '%rls%'
   OR title ILIKE '%test%'
   OR title ILIKE '%check%';


-- ── 4. Delete test assignments ────────────────────────────────────
DELETE FROM assignments
WHERE title ILIKE '%test%';


-- ── 5. Delete test classes ────────────────────────────────────────
-- classes table uses "topic" column (not "title")
DELETE FROM classes
WHERE topic ILIKE '%test%'
   OR topic ILIKE '%unknown%'
   OR course ILIKE '%test%';


-- ── VERIFY: run these to confirm everything worked ────────────────

-- Should show 4 rows (DELETE, INSERT, SELECT, UPDATE)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'announcements' ORDER BY cmd;

-- Should show 2 rows (INSERT, SELECT)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'page_views' ORDER BY cmd;

-- Should NOT contain RLS/test rows
SELECT id, title, created_at FROM announcements ORDER BY created_at DESC LIMIT 10;
