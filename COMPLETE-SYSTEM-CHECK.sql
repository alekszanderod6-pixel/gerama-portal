-- ══════════════════════════════════════════════════════════════════
-- GERAMA COMPLETE SYSTEM HEALTH CHECK
-- Verifies all database tables, RLS policies, and data integrity
-- Run this in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════'
\echo 'GERAMA SYSTEM HEALTH CHECK'
\echo 'Starting comprehensive verification...'
\echo '═══════════════════════════════════════════════════════════════'

-- ─────────────────────────────────────────────────────────────────
-- 1. DATABASE TABLES CHECK
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '1️⃣  CHECKING DATABASE TABLES...'

SELECT 
  'Database Tables' as check_category,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '⚠️  RLS Disabled'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'announcements', 'materials', 'page_views', 
  'admin_users', 'assignments', 'quizzes', 'classes',
  'submissions', 'quiz_attempts', 'attendance'
)
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────────
-- 2. USERS & AUTHENTICATION
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '2️⃣  CHECKING USERS & AUTHENTICATION...'

SELECT 
  '📊 Total Registered Users' as metric,
  COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
  '📊 Users by Level - L100',
  COUNT(*)::text
FROM users WHERE level = 'L100'
UNION ALL
SELECT 
  '📊 Users by Level - L200',
  COUNT(*)::text
FROM users WHERE level = 'L200'
UNION ALL
SELECT 
  '📊 Users by Level - L300',
  COUNT(*)::text
FROM users WHERE level = 'L300'
UNION ALL
SELECT 
  '📊 Users by Level - L400',
  COUNT(*)::text
FROM users WHERE level = 'L400'
UNION ALL
SELECT 
  '📊 Graduate Members',
  COUNT(*)::text
FROM users WHERE level = 'Graduate';

-- Check for duplicate emails (data integrity issue)
SELECT 
  '⚠️  Duplicate Emails Found' as issue,
  COUNT(*) as count
FROM (
  SELECT email, COUNT(*) as cnt
  FROM users
  GROUP BY email
  HAVING COUNT(*) > 1
) duplicates;

-- ─────────────────────────────────────────────────────────────────
-- 3. ADMIN USERS & ROLES
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '3️⃣  CHECKING ADMIN USERS & ROLES...'

SELECT 
  '👤 Admin Users' as category,
  email,
  role,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status,
  last_login::date as last_login_date
FROM admin_users
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'general_admin' THEN 2
    WHEN 'materials_admin' THEN 3
    ELSE 4
  END,
  email;

-- Check admin_users RLS policies
SELECT 
  'Admin RLS Policies' as check_type,
  policyname,
  cmd as command,
  CASE 
    WHEN qual = 'true' OR qual IS NULL THEN '✅ Open Access'
    ELSE '⚠️  Restricted: ' || left(qual, 50)
  END as policy_check
FROM pg_policies 
WHERE tablename = 'admin_users'
ORDER BY cmd;

-- ─────────────────────────────────────────────────────────────────
-- 4. ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '4️⃣  CHECKING ANNOUNCEMENTS...'

SELECT 
  '📢 Total Announcements' as metric,
  COUNT(*)::text as value
FROM announcements
UNION ALL
SELECT 
  '📢 Recent (Last 7 Days)',
  COUNT(*)::text
FROM announcements 
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  '📢 With Images',
  COUNT(*)::text
FROM announcements 
WHERE image_url IS NOT NULL OR images IS NOT NULL;

-- Latest 3 announcements
SELECT 
  'Latest Announcements' as category,
  title,
  LEFT(message, 60) || '...' as preview,
  created_at::date as date
FROM announcements
ORDER BY created_at DESC
LIMIT 3;

-- Check announcements RLS
SELECT 
  'Announcements RLS' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN qual = 'true' OR qual IS NULL THEN '✅ Public Access'
    ELSE '⚠️  Restricted'
  END as access_level
FROM pg_policies 
WHERE tablename = 'announcements';

-- ─────────────────────────────────────────────────────────────────
-- 5. MATERIALS & RESOURCES
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '5️⃣  CHECKING MATERIALS & RESOURCES...'

SELECT 
  '📚 Total Materials' as metric,
  COUNT(*)::text as value
FROM materials
UNION ALL
SELECT 
  '📚 Approved Materials',
  COUNT(*)::text
FROM materials WHERE status = 'approved'
UNION ALL
SELECT 
  '📚 Pending Review',
  COUNT(*)::text
FROM materials WHERE status = 'pending'
UNION ALL
SELECT 
  '📚 Materials by Type - Lecture Notes',
  COUNT(*)::text
FROM materials WHERE type = 'lecture_notes'
UNION ALL
SELECT 
  '📚 Materials by Type - Past Questions',
  COUNT(*)::text
FROM materials WHERE type = 'past_questions';

-- Check materials RLS
SELECT 
  'Materials RLS' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%approved%' THEN '✅ Shows Approved Only'
    WHEN qual = 'true' OR qual IS NULL THEN '✅ Open Access'
    ELSE '⚠️  Custom: ' || left(qual, 40)
  END as policy_info
FROM pg_policies 
WHERE tablename = 'materials';

-- ─────────────────────────────────────────────────────────────────
-- 6. PORTAL TRAFFIC STATISTICS
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '6️⃣  CHECKING PORTAL TRAFFIC STATISTICS...'

SELECT 
  '📊 Page Views - Total' as metric,
  COUNT(*)::text as value
FROM page_views
UNION ALL
SELECT 
  '📊 Page Views - Today',
  COUNT(*)::text
FROM page_views 
WHERE visited_at >= CURRENT_DATE
UNION ALL
SELECT 
  '📊 Page Views - This Week',
  COUNT(*)::text
FROM page_views 
WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  '📊 Page Views - This Month',
  COUNT(*)::text
FROM page_views 
WHERE visited_at >= DATE_TRUNC('month', CURRENT_DATE)
UNION ALL
SELECT 
  '📊 Last Visit Time',
  COALESCE(MAX(visited_at)::text, 'No visits recorded')
FROM page_views;

-- Test page_views insert capability
DO $$
BEGIN
  INSERT INTO page_views (page, device, referrer, visited_at)
  VALUES ('/system-check', 'sql-test', 'health-check', NOW());
  
  RAISE NOTICE '✅ Page views INSERT test: SUCCESS';
  
  DELETE FROM page_views WHERE page = '/system-check' AND device = 'sql-test';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Page views INSERT test: FAILED - %', SQLERRM;
END $$;

-- Check page_views RLS
SELECT 
  'Page Views RLS' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN with_check = 'true' OR with_check IS NULL THEN '✅ Allows Insert'
    ELSE '❌ Blocks Insert'
  END as insert_status
FROM pg_policies 
WHERE tablename = 'page_views';

-- ─────────────────────────────────────────────────────────────────
-- 7. ASSIGNMENTS & SUBMISSIONS
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '7️⃣  CHECKING ASSIGNMENTS & SUBMISSIONS...'

SELECT 
  '📝 Total Assignments' as metric,
  COUNT(*)::text as value
FROM assignments
UNION ALL
SELECT 
  '📝 Active Assignments',
  COUNT(*)::text
FROM assignments 
WHERE due_date >= CURRENT_DATE
UNION ALL
SELECT 
  '📝 Total Submissions',
  COUNT(*)::text
FROM submissions
UNION ALL
SELECT 
  '📝 Graded Submissions',
  COUNT(*)::text
FROM submissions 
WHERE grade IS NOT NULL
UNION ALL
SELECT 
  '📝 Ungraded Submissions',
  COUNT(*)::text
FROM submissions 
WHERE grade IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 8. QUIZZES & ATTEMPTS
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '8️⃣  CHECKING QUIZZES & QUIZ ATTEMPTS...'

SELECT 
  '🎯 Total Quizzes' as metric,
  COUNT(*)::text as value
FROM quizzes
UNION ALL
SELECT 
  '🎯 Active Quizzes',
  COUNT(*)::text
FROM quizzes 
WHERE status = 'active'
UNION ALL
SELECT 
  '🎯 Total Quiz Attempts',
  COUNT(*)::text
FROM quiz_attempts
UNION ALL
SELECT 
  '🎯 Completed Attempts',
  COUNT(*)::text
FROM quiz_attempts 
WHERE completed = true;

-- ─────────────────────────────────────────────────────────────────
-- 9. CLASSES & ATTENDANCE
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '9️⃣  CHECKING CLASSES & ATTENDANCE...'

SELECT 
  '🎓 Total Classes' as metric,
  COUNT(*)::text as value
FROM classes
UNION ALL
SELECT 
  '🎓 Active Classes',
  COUNT(*)::text
FROM classes 
WHERE status = 'active'
UNION ALL
SELECT 
  '🎓 Total Attendance Records',
  COUNT(*)::text
FROM attendance
UNION ALL
SELECT 
  '🎓 Attendance This Month',
  COUNT(*)::text
FROM attendance 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- ─────────────────────────────────────────────────────────────────
-- 10. DATA INTEGRITY CHECKS
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '🔟 RUNNING DATA INTEGRITY CHECKS...'

-- Check for orphaned submissions (no assignment)
SELECT 
  '⚠️  Orphaned Submissions' as issue,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ None found'
    ELSE '❌ Found ' || COUNT(*) || ' orphaned records'
  END as status
FROM submissions s
LEFT JOIN assignments a ON s.assignment_id = a.id
WHERE a.id IS NULL;

-- Check for orphaned quiz attempts (no quiz)
SELECT 
  '⚠️  Orphaned Quiz Attempts' as issue,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ None found'
    ELSE '❌ Found ' || COUNT(*) || ' orphaned records'
  END as status
FROM quiz_attempts qa
LEFT JOIN quizzes q ON qa.quiz_id = q.id
WHERE q.id IS NULL;

-- Check for missing timestamps
SELECT 
  '⚠️  Materials Without created_at' as issue,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All have timestamps'
    ELSE '❌ Found ' || COUNT(*) || ' records'
  END as status
FROM materials
WHERE created_at IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- 11. STORAGE & BUCKET CHECK
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '1️⃣1️⃣  CHECKING STORAGE BUCKETS...'

SELECT 
  'Storage Buckets' as category,
  name as bucket_name,
  CASE WHEN public THEN '🌍 Public' ELSE '🔒 Private' END as access,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  created_at::date as created
FROM storage.buckets
WHERE name IN ('gerama-materials', 'gerama-images', 'gerama-uploads')
ORDER BY name;

-- ─────────────────────────────────────────────────────────────────
-- 12. SYSTEM HEALTH SUMMARY
-- ─────────────────────────────────────────────────────────────────
\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '📊 SYSTEM HEALTH SUMMARY'
\echo '═══════════════════════════════════════════════════════════════'

SELECT 
  '✅ Users Registered' as component,
  COUNT(*)::text as count,
  '🟢 Operational' as status
FROM users
UNION ALL
SELECT 
  '✅ Admin Accounts',
  COUNT(*)::text,
  '🟢 Operational'
FROM admin_users WHERE is_active = true
UNION ALL
SELECT 
  '✅ Announcements',
  COUNT(*)::text,
  CASE 
    WHEN COUNT(*) > 0 THEN '🟢 Operational'
    ELSE '🟡 Empty'
  END
FROM announcements
UNION ALL
SELECT 
  '✅ Materials Available',
  COUNT(*)::text,
  CASE 
    WHEN COUNT(*) > 0 THEN '🟢 Operational'
    ELSE '🟡 Empty'
  END
FROM materials WHERE status = 'approved'
UNION ALL
SELECT 
  '✅ Portal Traffic Tracking',
  COUNT(*)::text,
  CASE 
    WHEN MAX(visited_at) > NOW() - INTERVAL '24 hours' THEN '🟢 Active'
    WHEN MAX(visited_at) > NOW() - INTERVAL '7 days' THEN '🟡 Slow'
    ELSE '🔴 Stale'
  END
FROM page_views
UNION ALL
SELECT 
  '✅ Assignments System',
  COUNT(*)::text,
  '🟢 Operational'
FROM assignments
UNION ALL
SELECT 
  '✅ Quiz System',
  COUNT(*)::text,
  '🟢 Operational'
FROM quizzes;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '✅ SYSTEM CHECK COMPLETE!'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Review the results above to identify any issues.'
\echo 'Look for:'
\echo '  • ❌ or 🔴 indicators (problems)'
\echo '  • ⚠️  warnings (potential issues)'
\echo '  • ✅ or 🟢 indicators (healthy components)'
\echo ''
