-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Fix Portal Traffic Statistics (Simple Version)
-- Issue: Traffic stats stuck at 20104
-- This version checks before creating policies
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Check current status
-- ─────────────────────────────────────────────────────────────────
SELECT 
  COUNT(*) as total_visits,
  COUNT(CASE WHEN visited_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today,
  COUNT(CASE WHEN visited_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
  MAX(visited_at) as last_visit
FROM page_views;

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Check existing policies
-- ─────────────────────────────────────────────────────────────────
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN qual = 'true' THEN 'Allows ALL'
    ELSE 'Restricted'
  END as access_level
FROM pg_policies 
WHERE tablename = 'page_views'
ORDER BY cmd;

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Test if you can insert right now
-- ─────────────────────────────────────────────────────────────────
INSERT INTO page_views (page, device, referrer, visited_at)
VALUES ('/test-insert', 'sql-test', 'manual-test', NOW())
RETURNING id, page, visited_at;

-- If the above INSERT succeeded, your tracking is working! ✅
-- The stats should start incrementing with new visits.

-- Clean up the test row:
DELETE FROM page_views 
WHERE page = '/test-insert' 
AND device = 'sql-test' 
AND referrer = 'manual-test';

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Verify total count (should be same as before)
-- ─────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_visits FROM page_views;

-- ═══════════════════════════════════════════════════════════════
-- RESULT INTERPRETATION:
-- ═══════════════════════════════════════════════════════════════
-- ✅ If STEP 3 (INSERT) worked: Your tracking is ALREADY working!
--    The issue might be that the admin dashboard needs a hard refresh
--    or there just haven't been new visits yet.
--
-- ❌ If STEP 3 (INSERT) failed: You have a permissions issue.
--    Run the fix below.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: If the test insert FAILED, run this fix:
-- ─────────────────────────────────────────────────────────────────

-- First, drop all existing policies
DROP POLICY IF EXISTS "Anyone can view page_views" ON page_views;
DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
DROP POLICY IF EXISTS "Allow public read" ON page_views;
DROP POLICY IF EXISTS "Allow public insert" ON page_views;
DROP POLICY IF EXISTS "Enable insert for all users" ON page_views;
DROP POLICY IF EXISTS "Allow insert for everyone" ON page_views;

-- Create new permissive policies with unique names
CREATE POLICY "public_read_page_views"
  ON page_views
  FOR SELECT
  USING (true);

CREATE POLICY "public_insert_page_views"
  ON page_views
  FOR INSERT
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- STEP 6: Test again after fix
-- ─────────────────────────────────────────────────────────────────
INSERT INTO page_views (page, device, visited_at)
VALUES ('/test-after-fix', 'sql-test-2', NOW())
RETURNING id, page, visited_at;

-- Should work now! Clean up:
DELETE FROM page_views WHERE page IN ('/test-after-fix');

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: Check recent activity (last 24 hours)
-- ─────────────────────────────────────────────────────────────────
SELECT 
  DATE_TRUNC('hour', visited_at) as hour,
  COUNT(*) as visits,
  array_agg(DISTINCT page) as pages
FROM page_views
WHERE visited_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', visited_at)
ORDER BY hour DESC
LIMIT 24;

-- If you see NO recent activity (empty result), that means:
-- No one has visited the site in the last 24 hours, OR
-- The tracking WAS broken and is now fixed!

-- ═══════════════════════════════════════════════════════════════
-- FINAL CHECK:
-- ═══════════════════════════════════════════════════════════════
SELECT 
  'Total Visits' as metric,
  COUNT(*) as value
FROM page_views
UNION ALL
SELECT 
  'Today',
  COUNT(*)
FROM page_views
WHERE visited_at >= CURRENT_DATE
UNION ALL
SELECT 
  'This Week',
  COUNT(*)
FROM page_views
WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'Last Visit',
  CAST(MAX(visited_at) AS TEXT)
FROM page_views;

-- ═══════════════════════════════════════════════════════════════
-- WHAT TO DO NEXT:
-- ═══════════════════════════════════════════════════════════════
-- 1. Visit your homepage a few times (opens new tabs, refresh, etc.)
-- 2. Wait 2-3 minutes
-- 3. Go to admin dashboard
-- 4. Click refresh icon on Portal Traffic card
-- 5. Numbers should be incrementing! 🎉
-- 
-- If STILL stuck:
-- - Check browser console for errors
-- - Verify js/main.js is loaded
-- - Check if page_views inserts are failing in browser console
-- ═══════════════════════════════════════════════════════════════
