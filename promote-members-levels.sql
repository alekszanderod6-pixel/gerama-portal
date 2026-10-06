-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Promote All Members to Next Academic Level
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════
-- 
-- This script:
-- - L100 students → L200
-- - L200 students → L300
-- - L300 students → L400
-- - L400 students → Graduate
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- PREVIEW: See who will be promoted (RUN THIS FIRST!)
-- ─────────────────────────────────────────────────────────────────
SELECT 
  email,
  full_name,
  level as current_level,
  program,
  CASE 
    WHEN level = 'L100' THEN 'L200'
    WHEN level = 'L200' THEN 'L300'
    WHEN level = 'L300' THEN 'L400'
    WHEN level = 'L400' THEN 'Graduate'
    ELSE level
  END as new_level
FROM user_profiles
WHERE level IN ('L100', 'L200', 'L300', 'L400')
ORDER BY 
  CASE 
    WHEN level = 'L100' THEN 1
    WHEN level = 'L200' THEN 2
    WHEN level = 'L300' THEN 3
    WHEN level = 'L400' THEN 4
  END,
  full_name;

-- ─────────────────────────────────────────────────────────────────
-- COUNT: How many students per level
-- ─────────────────────────────────────────────────────────────────
SELECT 
  level,
  COUNT(*) as student_count,
  CASE 
    WHEN level = 'L100' THEN 'L200'
    WHEN level = 'L200' THEN 'L300'
    WHEN level = 'L300' THEN 'L400'
    WHEN level = 'L400' THEN 'Graduate'
    ELSE 'No change'
  END as will_become
FROM user_profiles
WHERE level IN ('L100', 'L200', 'L300', 'L400')
GROUP BY level
ORDER BY 
  CASE 
    WHEN level = 'L100' THEN 1
    WHEN level = 'L200' THEN 2
    WHEN level = 'L300' THEN 3
    WHEN level = 'L400' THEN 4
  END;

-- ─────────────────────────────────────────────────────────────────
-- EXECUTE: Promote all members (CAREFUL - THIS UPDATES THE DATABASE!)
-- ─────────────────────────────────────────────────────────────────
-- ⚠️ IMPORTANT: Review the preview above before running this!
-- ⚠️ Once run, changes are permanent (unless you manually revert)

-- Promote L400 to Graduate
UPDATE user_profiles
SET level = 'Graduate',
    updated_at = NOW()
WHERE level = 'L400';

-- Promote L300 to L400
UPDATE user_profiles
SET level = 'L400',
    updated_at = NOW()
WHERE level = 'L300';

-- Promote L200 to L300
UPDATE user_profiles
SET level = 'L300',
    updated_at = NOW()
WHERE level = 'L200';

-- Promote L100 to L200
UPDATE user_profiles
SET level = 'L200',
    updated_at = NOW()
WHERE level = 'L100';

-- ─────────────────────────────────────────────────────────────────
-- VERIFY: Check the results
-- ─────────────────────────────────────────────────────────────────
SELECT 
  level,
  COUNT(*) as student_count
FROM user_profiles
GROUP BY level
ORDER BY 
  CASE 
    WHEN level = 'L100' THEN 1
    WHEN level = 'L200' THEN 2
    WHEN level = 'L300' THEN 3
    WHEN level = 'L400' THEN 4
    WHEN level = 'Graduate' THEN 5
    ELSE 6
  END;

-- ─────────────────────────────────────────────────────────────────
-- OPTIONAL: See recently promoted students
-- ─────────────────────────────────────────────────────────────────
SELECT 
  email,
  full_name,
  level,
  program,
  updated_at
FROM user_profiles
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY level, full_name;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (if you made a mistake)
-- ══════════════════════════════════════════════════════════════════
-- ⚠️ Only run if you need to undo the promotion!
-- 
-- Demote Graduate to L400
-- UPDATE user_profiles SET level = 'L400' WHERE level = 'Graduate';
-- 
-- Demote L400 to L300
-- UPDATE user_profiles SET level = 'L300' WHERE level = 'L400';
-- 
-- Demote L300 to L200
-- UPDATE user_profiles SET level = 'L200' WHERE level = 'L300';
-- 
-- Demote L200 to L100
-- UPDATE user_profiles SET level = 'L100' WHERE level = 'L200';
-- ══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- NOTES:
-- ══════════════════════════════════════════════════════════════════
-- 1. This script updates the user_profiles table
-- 2. Updates happen in reverse order (L400 first) to avoid conflicts
-- 3. Each update sets updated_at = NOW() for tracking
-- 4. Graduates keep their "Graduate" status (no further promotion)
-- 5. Alumni and other statuses are NOT affected
-- 
-- USAGE:
-- 1. Run PREVIEW query first to see who will be promoted
-- 2. Run COUNT query to verify numbers
-- 3. Run EXECUTE section to perform the promotion
-- 4. Run VERIFY query to confirm changes
-- 5. Run OPTIONAL query to see recent changes
-- ══════════════════════════════════════════════════════════════════
