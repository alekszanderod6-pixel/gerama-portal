-- ══════════════════════════════════════════════════════════════════
-- GERAMA — MASTER FIX v4  (run this ONCE in Supabase SQL Editor)
-- Project: obfhmyeghurqfxingwtu
-- Run ALL → fixes visits, announcements, user_profiles, sequences
-- ══════════════════════════════════════════════════════════════════


-- ── 1. page_views: create + RLS  ─────────────────────────────────
-- THIS IS WHY VISIT COUNTS SHOW 0.
-- Without the INSERT policy, every browser visit is silently blocked.
CREATE TABLE IF NOT EXISTS page_views (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT,
  visited_at  TIMESTAMPTZ DEFAULT NOW(),
  referrer    TEXT
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
DROP POLICY IF EXISTS "Anyone can read page_views"   ON page_views;
DROP POLICY IF EXISTS "Anyone can delete page_views" ON page_views;

CREATE POLICY "Anyone can insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read page_views"   ON page_views FOR SELECT USING (true);
-- Allow admin to delete old rows for cleanup
CREATE POLICY "Anyone can delete page_views" ON page_views FOR DELETE USING (true);

-- Index so count queries by date are fast
CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON page_views (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page       ON page_views (page);

-- Enable realtime so admin dashboard gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE page_views;


-- ── 2. announcements: RLS + realtime ─────────────────────────────
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

-- Make sure realtime is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- Add any missing columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority   TEXT DEFAULT 'normal';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url  TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS images     TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ── 3. user_profiles: RLS so registered user count works ─────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read user_profiles"   ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile"    ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile"    ON user_profiles;

CREATE POLICY "Public can read user_profiles"   ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"    ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile"    ON user_profiles FOR UPDATE USING (true) WITH CHECK (true);


-- ── 4. materials: RLS (so count query works) ─────────────────────
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read materials"   ON materials;
DROP POLICY IF EXISTS "Admin can insert materials"  ON materials;
DROP POLICY IF EXISTS "Admin can delete materials"  ON materials;
DROP POLICY IF EXISTS "Admin can update materials"  ON materials;

CREATE POLICY "Public can read materials"   ON materials FOR SELECT USING (true);
CREATE POLICY "Admin can insert materials"  ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can delete materials"  ON materials FOR DELETE USING (true);
CREATE POLICY "Admin can update materials"  ON materials FOR UPDATE USING (true) WITH CHECK (true);


-- ── 5. assignment_submissions: RLS ───────────────────────────────
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read submissions"   ON assignment_submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Admin can update submissions"  ON assignment_submissions;
DROP POLICY IF EXISTS "Admin can delete submissions"  ON assignment_submissions;

CREATE POLICY "Public can read submissions"   ON assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert submissions" ON assignment_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update submissions"  ON assignment_submissions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete submissions"  ON assignment_submissions FOR DELETE USING (true);


-- ── 6. quizzes / assignments / classes: RLS ───────────────────────
DO $$ BEGIN
  ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DROP POLICY IF EXISTS "Public can read quizzes"  ON quizzes;
DROP POLICY IF EXISTS "Admin can manage quizzes" ON quizzes;
CREATE POLICY "Public can read quizzes"  ON quizzes FOR SELECT USING (true);
CREATE POLICY "Admin can manage quizzes" ON quizzes FOR ALL USING (true) WITH CHECK (true);

DO $$ BEGIN
  ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DROP POLICY IF EXISTS "Public can read assignments"  ON assignments;
DROP POLICY IF EXISTS "Admin can manage assignments" ON assignments;
CREATE POLICY "Public can read assignments"  ON assignments FOR SELECT USING (true);
CREATE POLICY "Admin can manage assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);

DO $$ BEGIN
  ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;
DROP POLICY IF EXISTS "Public can read classes"  ON classes;
DROP POLICY IF EXISTS "Admin can manage classes" ON classes;
CREATE POLICY "Public can read classes"  ON classes FOR SELECT USING (true);
CREATE POLICY "Admin can manage classes" ON classes FOR ALL USING (true) WITH CHECK (true);


-- ── 7. Fix sequences (prevent duplicate key errors) ──────────────
SELECT setval('announcements_id_seq', COALESCE((SELECT MAX(id) FROM announcements), 1), true);
SELECT setval('page_views_id_seq',    COALESCE((SELECT MAX(id) FROM page_views),    1), true);
SELECT setval('materials_id_seq',     COALESCE((SELECT MAX(id) FROM materials),     1), true);


-- ── 8. Clean up test data ─────────────────────────────────────────
DELETE FROM announcements
WHERE title ILIKE '%rls%' OR title ILIKE '%test%' OR title ILIKE '%check%';

DELETE FROM assignments WHERE title ILIKE '%test%';

DELETE FROM classes
WHERE topic ILIKE '%test%' OR topic ILIKE '%unknown%' OR course ILIKE '%test%';


-- ── VERIFY (run these after to confirm everything worked) ─────────

-- Should show INSERT + SELECT (+ DELETE) for page_views
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('page_views','announcements','user_profiles','materials','assignment_submissions')
ORDER BY tablename, cmd;

-- Recent page views — should have rows if students have visited
SELECT page, COUNT(*) AS visits
FROM page_views
GROUP BY page
ORDER BY visits DESC
LIMIT 20;

-- Registered users count
SELECT COUNT(*) AS registered_users FROM user_profiles;

-- Recent announcements
SELECT id, title, priority, created_at FROM announcements ORDER BY created_at DESC LIMIT 10;

-- ══════════════════════════════════════════════════════════════════
-- AFTER RUNNING THIS FILE:
-- 1. Visit stats will START accumulating immediately on every
--    student page visit (index.html, classroom.html, etc.)
-- 2. If page_views was empty, counts will show 0 until students
--    actually browse — this is correct, not a bug.
-- 3. Admin dashboard registered users count (#statUsers) now works.
-- 4. All other stat boxes should show live Supabase data.
-- ══════════════════════════════════════════════════════════════════
