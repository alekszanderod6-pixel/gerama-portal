-- ══════════════════════════════════════════════════════════════════
-- ADD ADMIN USERS TO GERAMA PORTAL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Check current admin users
-- ─────────────────────────────────────────────────────────────────
SELECT 
  'Current Admins' as info,
  email,
  role,
  is_active,
  created_at::date as added_date
FROM admin_users
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'general_admin' THEN 2
    WHEN 'materials_admin' THEN 3
  END,
  email;

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Add YOUR admin accounts below
-- ─────────────────────────────────────────────────────────────────

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SUPER ADMIN (Full access to everything)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- You (Alexander) - Already added, just updating to ensure it's correct
INSERT INTO admin_users (email, full_name, role, is_active)
VALUES 
  ('alexandero.dwumaah@gmail.com', 'Alexander Opoku Dwumaah', 'super_admin', true)
ON CONFLICT (email) DO UPDATE 
  SET role = 'super_admin',
      full_name = EXCLUDED.full_name,
      is_active = true;

-- Add other SUPER ADMINs here (if any):
-- INSERT INTO admin_users (email, full_name, role, is_active)
-- VALUES 
--   ('another-super-admin@example.com', 'Full Name', 'super_admin', true)
-- ON CONFLICT (email) DO UPDATE SET role = 'super_admin', is_active = true;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- GENERAL ADMIN (Access to most things, but not super critical stuff)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Add general admins here:
-- INSERT INTO admin_users (email, full_name, role, is_active)
-- VALUES 
--   ('general-admin1@uenr.edu.gh', 'Admin Name 1', 'general_admin', true),
--   ('general-admin2@uenr.edu.gh', 'Admin Name 2', 'general_admin', true)
-- ON CONFLICT (email) DO UPDATE SET role = 'general_admin', is_active = true;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MATERIALS ADMIN (Only access to materials upload sections)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- These admins can ONLY access:
-- ✅ Upload Materials
-- ✅ Upload Software  
-- ✅ Materials History
-- ✅ Review Submissions
-- ✅ Announcements
--
-- They CANNOT access:
-- ❌ Overview/Dashboard
-- ❌ Members Management
-- ❌ Assignments
-- ❌ Grades
-- ❌ Quizzes
-- ❌ Classes
-- ❌ Other admin sections

-- Add materials admins here (EDIT WITH REAL EMAILS):
INSERT INTO admin_users (email, full_name, role, is_active)
VALUES 
  ('materials-admin1@example.com', 'Materials Admin 1', 'materials_admin', true),
  ('materials-admin2@example.com', 'Materials Admin 2', 'materials_admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'materials_admin', is_active = true;

-- Add more materials admins as needed:
-- ('another-materials-admin@example.com', 'Name', 'materials_admin', true),


-- ─────────────────────────────────────────────────────────────────
-- STEP 3: View updated admin list
-- ─────────────────────────────────────────────────────────────────
SELECT 
  'Updated Admin List' as info,
  email,
  full_name,
  role,
  CASE 
    WHEN role = 'super_admin' THEN '👑 Full Access'
    WHEN role = 'general_admin' THEN '⭐ Most Access'
    WHEN role = 'materials_admin' THEN '📚 Materials Only'
  END as access_level,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM admin_users
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'general_admin' THEN 2
    WHEN 'materials_admin' THEN 3
  END,
  email;

-- ═══════════════════════════════════════════════════════════════
-- IMPORTANT NOTES:
-- ═══════════════════════════════════════════════════════════════
-- 
-- 1. ADMINS MUST CREATE ACCOUNTS FIRST
--    Before adding someone as admin, they MUST:
--    a) Go to login.html
--    b) Sign up with their email
--    c) Verify their email (check inbox)
--    d) THEN you add them to admin_users table
--
-- 2. DEFAULT PASSWORD
--    After signup, they use password: Gerama2026!
--    They should change it after first login
--
-- 3. ROLE DESCRIPTIONS:
--    
--    super_admin:
--    - Full access to everything
--    - Can manage other admins
--    - Can see all statistics
--    - Use this for yourself and core leadership
--    
--    general_admin:
--    - Access to most features
--    - Cannot modify critical settings
--    - Use this for trusted team members
--    
--    materials_admin:
--    - ONLY sees: Upload Materials, Upload Software, Materials History,
--                 Review Submissions, Announcements
--    - Perfect for people who just handle material uploads
--    - All other sections are hidden
--
-- 4. TO REMOVE AN ADMIN:
--    UPDATE admin_users SET is_active = false WHERE email = 'their-email@example.com';
--
-- 5. TO CHANGE SOMEONE'S ROLE:
--    UPDATE admin_users SET role = 'new_role' WHERE email = 'their-email@example.com';
--    
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- QUICK COMMANDS (Uncomment and edit as needed)
-- ─────────────────────────────────────────────────────────────────

-- Deactivate an admin:
-- UPDATE admin_users SET is_active = false WHERE email = 'admin@example.com';

-- Reactivate an admin:
-- UPDATE admin_users SET is_active = true WHERE email = 'admin@example.com';

-- Change role to materials_admin:
-- UPDATE admin_users SET role = 'materials_admin' WHERE email = 'admin@example.com';

-- Change role to general_admin:
-- UPDATE admin_users SET role = 'general_admin' WHERE email = 'admin@example.com';

-- Delete an admin completely:
-- DELETE FROM admin_users WHERE email = 'admin@example.com';

-- View specific admin:
-- SELECT * FROM admin_users WHERE email = 'admin@example.com';
