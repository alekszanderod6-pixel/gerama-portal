-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Fix Portal Traffic Statistics
-- Issue: Traffic stats stuck at 20104 - not incrementing
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Check current page_views table status
-- ─────────────────────────────────────────────────────────────────
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT DATE(visited_at)) as days_tracked,
  MIN(visited_at) as first_visit,
  MAX(visited_at) as last_visit,
  COUNT(CASE WHEN visited_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today_count,
  COUNT(CASE WHEN visited_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_count
FROM page_views;

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Check if RLS is blocking inserts
-- ─────────────────────────────────────────────────────────────────
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'page_views';

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Check existing RLS policies
-- ─────────────────────────────────────────────────────────────────
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'page_views';

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Fix RLS policies (if needed)
-- ─────────────────────────────────────────────────────────────────

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Allow public read" ON page_views;
DROP POLICY IF EXISTS "Allow public insert" ON page_views;
DROP POLICY IF EXISTS "Allow insert for everyone" ON page_views;
DROP POLICY IF EXISTS "Enable insert for all users" ON page_views;

-- Create proper RLS policies for page_views
CREATE POLICY "Anyone can view page_views"
  ON page_views
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert page_views"
  ON page_views
  FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: Verify RLS is enabled and policies are active
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- STEP 6: Test insert (you can delete this row after)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO page_views (page, device, referrer, visited_at)
VALUES ('/test-page', 'test-device', 'sql-test', NOW())
RETURNING id, page, visited_at;

-- If the above INSERT works, the tracking should now work!
-- You can delete the test row:
-- DELETE FROM page_views WHERE page = '/test-page' AND device = 'test-device';

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: Verify new count
-- ─────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_count FROM page_views;

-- ═══════════════════════════════════════════════════════════════
-- EXPLANATION
-- ═══════════════════════════════════════════════════════════════
-- The issue is likely that:
-- 1. RLS policies are too restrictive and blocking anonymous inserts
-- 2. The page_views table exists but new visits aren't being recorded
-- 
-- After running this:
-- - New page visits will be tracked properly
-- - Stats will start incrementing from current count
-- - No data will be lost
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 8: Check recent visits (last 24 hours)
-- ─────────────────────────────────────────────────────────────────
SELECT 
  DATE_TRUNC('hour', visited_at) as hour,
  COUNT(*) as visits,
  COUNT(DISTINCT page) as unique_pages
FROM page_views
WHERE visited_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', visited_at)
ORDER BY hour DESC;

-- If you see NO recent visits (within last few hours), that confirms
-- the tracking was broken and is now fixed!
