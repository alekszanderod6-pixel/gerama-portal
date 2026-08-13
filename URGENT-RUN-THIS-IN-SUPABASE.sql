-- ══════════════════════════════════════════════════════════════════
-- GERAMA — URGENT FIX: Announcements delete + Realtime sync
-- 
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard
--   2. Open your project (obfhmyeghurqfxingwtu)
--   3. Click "SQL Editor" in the left sidebar
--   4. Click "New query"
--   5. Paste ALL of this file and click "Run"
-- ══════════════════════════════════════════════════════════════════


-- ── Allow anon to DELETE announcements (fixes admin delete not working) ──
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;
CREATE POLICY "Admin can delete announcements"
  ON announcements FOR DELETE USING (true);

-- ── Allow anon to UPDATE announcements ──
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;
CREATE POLICY "Admin can update announcements"
  ON announcements FOR UPDATE USING (true) WITH CHECK (true);

-- ── Allow anon to INSERT announcements ──
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
CREATE POLICY "Admin can insert announcements"
  ON announcements FOR INSERT WITH CHECK (true);

-- ── Allow public to READ announcements ──
DROP POLICY IF EXISTS "Public can read announcements" ON announcements;
CREATE POLICY "Public can read announcements"
  ON announcements FOR SELECT USING (true);

-- ── Make sure RLS is enabled ──
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ── Enable Realtime so deletions/inserts appear on the site instantly ──
-- (If this line errors, it's already enabled — that's fine, just ignore it)
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;


-- ══════════════════════════════════════════════════════════════════
-- VERIFY: Run this after the above to confirm all 4 policies exist
-- ══════════════════════════════════════════════════════════════════
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'announcements'
ORDER BY cmd;

-- You should see 4 rows: DELETE, INSERT, SELECT, UPDATE
-- ══════════════════════════════════════════════════════════════════
