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
-- STEP 6: Verify — check your existing policies and rows
-- After running above, run these SELECT statements to confirm:
-- ─────────────────────────────────────────────────────────────────

-- See what RLS policies now exist:
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'announcements';

-- See how many announcements are currently in the DB:
SELECT id, title, priority, created_at FROM announcements ORDER BY created_at DESC LIMIT 20;

-- ══════════════════════════════════════════════════════════════════
-- DONE. After running this:
--   1. Go to admin-dashboard.html → Announcements
--   2. Post a test announcement
--   3. Open index.html (home page) on a different browser/incognito
--   4. The announcement should appear immediately
-- ══════════════════════════════════════════════════════════════════
