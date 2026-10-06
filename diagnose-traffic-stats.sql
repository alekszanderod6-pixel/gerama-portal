-- ══════════════════════════════════════════════════════════════════
-- DIAGNOSE Portal Traffic Statistics Issue
-- This will tell us WHY the stats are stuck at 20104
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- Question 1: How many visits are actually in the database?
-- ─────────────────────────────────────────────────────────────────
SELECT 
  '1. Total visits in database' as check_name,
  COUNT(*) as result
FROM page_views;

-- ─────────────────────────────────────────────────────────────────
-- Question 2: When was the last visit recorded?
-- ─────────────────────────────────────────────────────────────────
SELECT 
  '2. Last visit recorded' as check_name,
  MAX(visited_at) as last_visit,
  NOW() - MAX(visited_at) as time_since_last_visit
FROM page_views;

-- ─────────────────────────────────────────────────────────────────
-- Question 3: Are there any visits from TODAY?
-- ─────────────────────────────────────────────────────────────────
SELECT 
  '3. Visits today' as check_name,
  COUNT(*) as visits_today,
  array_agg(DISTINCT page ORDER BY page) as pages_visited
FROM page_views
WHERE visited_at >= CURRENT_DATE;

-- ─────────────────────────────────────────────────────────────────
-- Question 4: Last 10 visits breakdown
-- ─────────────────────────────────────────────────────────────────
SELECT 
  '4. Recent visits (last 10)' as info,
  visited_at,
  page,
  device
FROM page_views
ORDER BY visited_at DESC
LIMIT 10;

-- ─────────────────────────────────────────────────────────────────
-- Question 5: What RLS policies exist?
-- ─────────────────────────────────────────────────────────────────
SELECT 
  '5. RLS Policies' as info,
  policyname,
  cmd as command_type,
  CASE 
    WHEN qual = 'true' THEN '✅ Allows ALL'
    WHEN qual IS NULL THEN '✅ No restrictions'
    ELSE '❌ Has restrictions: ' || qual
  END as access_check,
  CASE 
    WHEN with_check = 'true' THEN '✅ Allows ALL'
    WHEN with_check IS NULL THEN '✅ No restrictions'
    ELSE '❌ Has restrictions: ' || with_check
  END as insert_check
FROM pg_policies 
WHERE tablename = 'page_views';

-- ─────────────────────────────────────────────────────────────────
-- Question 6: Can we insert RIGHT NOW?
-- ─────────────────────────────────────────────────────────────────
-- Try to insert a test row
INSERT INTO page_views (page, device, referrer, visited_at)
VALUES ('/diagnostic-test', 'sql-diagnostic', 'manual-check', NOW())
RETURNING 
  '6. Test insert result' as info,
  id as row_id,
  page,
  visited_at;

-- Clean up the test
DELETE FROM page_views 
WHERE page = '/diagnostic-test' 
AND device = 'sql-diagnostic';

-- ═══════════════════════════════════════════════════════════════
-- INTERPRETATION GUIDE:
-- ═══════════════════════════════════════════════════════════════
-- 
-- Check 1 (Total visits):
-- - If result = 20104 exactly: No new visits are being recorded
-- - If result > 20104: Tracking IS working! Just need to refresh dashboard
--
-- Check 2 (Last visit):
-- - If time_since_last_visit is DAYS/WEEKS old: Tracking is broken
-- - If time_since_last_visit is MINUTES/HOURS old: Tracking is working!
--
-- Check 3 (Visits today):
-- - If visits_today = 0: No one visited today, OR tracking is broken
-- - If visits_today > 0: Tracking IS working!
--
-- Check 5 (RLS Policies):
-- - If you see ❌ (restrictions): That's the problem!
-- - If you see ✅ (allows all): Policies are fine
--
-- Check 6 (Test insert):
-- - If ERROR: RLS is blocking inserts - need to fix policies
-- - If SUCCESS: Tracking should work - might just need time/visits
--
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- FINAL SUMMARY QUERY
-- ─────────────────────────────────────────────────────────────────
SELECT 
  COUNT(*) as total_visits,
  COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '24 hours') as last_24_hours,
  COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '7 days') as last_7_days,
  MIN(visited_at) as first_ever_visit,
  MAX(visited_at) as most_recent_visit,
  NOW() - MAX(visited_at) as time_since_last
FROM page_views;
