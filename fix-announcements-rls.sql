-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Fix: Announcements not showing (RLS + Table check)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Make sure the announcements table exists with all columns
-- (safe to run even if it already exists)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  message     TEXT,
  priority    TEXT DEFAULT 'normal',
  image_url   TEXT,
  images      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- If the table already exists but is missing columns, add them:
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority   TEXT DEFAULT 'normal';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url  TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS images     TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Enable Row Level Security
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Allow anyone (anon) to READ announcements
-- This is what lets the home page (index.html) show them publicly
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can read announcements" ON announcements;
CREATE POLICY "Public can read announcements"
  ON announcements
  FOR SELECT
  USING (true);


-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Allow anyone (anon) to INSERT announcements
-- This is what lets the admin dashboard publish announcements
-- without needing Supabase Auth login
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
CREATE POLICY "Admin can insert announcements"
  ON announcements
  FOR INSERT
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- STEP 5: Allow anyone (anon) to DELETE announcements
-- This lets the admin dashboard delete old announcements
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;
CREATE POLICY "Admin can delete announcements"
  ON announcements
  FOR DELETE
  USING (true);


-- ─────────────────────────────────────────────────────────────────
-- STEP 6: page_views table — tracks visits for the admin dashboard
-- stats (Visits Today, This Week, All-Time) and the live visitor
-- counter on the home page.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT,
  visited_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT a view (visitors record their own visit)
DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
CREATE POLICY "Anyone can insert page_views"
  ON page_views
  FOR INSERT
  WITH CHECK (true);

-- Anyone can SELECT page_views (admin dashboard reads counts)
DROP POLICY IF EXISTS "Anyone can read page_views" ON page_views;
CREATE POLICY "Anyone can read page_views"
  ON page_views
  FOR SELECT
  USING (true);

-- Optional referrer column for richer analytics
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer TEXT;


-- ─────────────────────────────────────────────────────────────────
-- STEP 7: Enable Realtime for announcements (live delete/publish sync)
-- ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;


-- ─────────────────────────────────────────────────────────────────
-- STEP 8: Allow UPDATE on announcements (edit from admin dashboard)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;
CREATE POLICY "Admin can update announcements"
  ON announcements
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- STEP 9: Verify — check your existing policies and rows
-- After running above, run these SELECT statements to confirm:
-- ─────────────────────────────────────────────────────────────────

-- See what RLS policies now exist:
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('announcements', 'page_views')
ORDER BY tablename, policyname;

-- See how many announcements are currently in the DB:
SELECT id, title, priority, created_at FROM announcements ORDER BY created_at DESC LIMIT 20;

-- See recent page views:
SELECT page, visited_at FROM page_views ORDER BY visited_at DESC LIMIT 10;

-- ══════════════════════════════════════════════════════════════════
-- DONE. After running this:
--   1. Go to admin-dashboard.html → Announcements
--   2. Post a test announcement
--   3. Open index.html (home page) on a different browser/incognito
--   4. The announcement should appear immediately
--   5. Delete the announcement from admin → it disappears from the
--      home page within seconds (realtime subscription)
--   6. Visit counts (Today / This Week / All-Time) will start
--      incrementing as users browse the site
--   7. "Online Now" on the home page uses live Supabase presence
-- ══════════════════════════════════════════════════════════════════
