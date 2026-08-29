-- ══════════════════════════════════════════════════════════════════
-- GERAMA — MASTER FIX v5  (run this ONCE in Supabase SQL Editor)
-- Project: obfhmyeghurqfxingwtu
-- ══════════════════════════════════════════════════════════════════
-- IMPORTANT: If visit counts show 0 in the admin dashboard after
-- running this, check the VERIFY section at the bottom — specifically
-- whether recent page_views rows exist. If not, clear your browser's
-- sessionStorage (DevTools → Application → Storage → Clear site data)
-- and reload any GERAMA page. A new visit row will be inserted.
-- ══════════════════════════════════════════════════════════════════


-- ── 1. page_views: create + RLS + indexes ────────────────────────
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
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE page_views;
EXCEPTION WHEN others THEN NULL; -- already a member, that's fine
END $$;


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
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
EXCEPTION WHEN others THEN NULL; -- already a member, that's fine
END $$;

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

-- ① Should show INSERT + SELECT + DELETE for page_views
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('page_views','announcements','user_profiles','materials','assignment_submissions')
ORDER BY tablename, cmd;

-- ② Test INSERT — inserts a dummy row to prove RLS allows it
--    (Delete it after checking the VERIFY query below)
INSERT INTO page_views (page, visited_at, referrer)
VALUES ('__test_rls_check__', NOW(), 'sql-test');

-- ③ Confirm the test row landed (should show 1 row)
SELECT id, page, visited_at FROM page_views
WHERE page = '__test_rls_check__'
ORDER BY id DESC LIMIT 1;

-- ④ Delete the test row once confirmed
DELETE FROM page_views WHERE page = '__test_rls_check__';

-- ⑤ Most recent real page views
SELECT page, COUNT(*) AS visits
FROM page_views
WHERE page != '__test_rls_check__'
GROUP BY page
ORDER BY visits DESC
LIMIT 20;

-- ⑥ Registered users count
SELECT COUNT(*) AS registered_users FROM user_profiles;

-- ⑦ Recent announcements
SELECT id, title, priority, created_at FROM announcements ORDER BY created_at DESC LIMIT 10;

-- ══════════════════════════════════════════════════════════════════
-- AFTER RUNNING THIS FILE:
-- 1. Step ② above inserts a test row. If it fails with a permission
--    error, something is still wrong with RLS — re-run step 1.
-- 2. Step ③ must return exactly 1 row. If it returns 0, the INSERT
--    policy is not active.
-- 3. Step ④ deletes the test row — run it to keep the table clean.
-- 4. Visit stats will START accumulating immediately on every
--    student page load (index.html, classroom.html, etc.).
-- 5. IMPORTANT: sessionStorage prevents double-counting per session.
--    To force a fresh visit for testing: DevTools → Application →
--    Storage → Clear Site Data → reload any GERAMA page.
-- 6. Admin dashboard registered users count (#statUsers) now works.
-- ══════════════════════════════════════════════════════════════════
