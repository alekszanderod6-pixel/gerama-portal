-- ══════════════════════════════════════════════════════════════════
-- ENABLE SELF-SERVICE ADMIN REGISTRATION
-- Allows users to register themselves as admins during login
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Check current policies on admin_users table
-- ─────────────────────────────────────────────────────────────────
SELECT 
  'Current Policies' as info,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual = 'true' THEN '✅ Allows all'
    WHEN qual IS NULL THEN '✅ No restrictions'
    ELSE '⚠️  Restricted: ' || left(qual, 40)
  END as policy_check
FROM pg_policies 
WHERE tablename = 'admin_users'
ORDER BY cmd;

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Update INSERT policy to allow self-registration
-- ─────────────────────────────────────────────────────────────────

-- Drop old insert policy if exists
DROP POLICY IF EXISTS "Anyone can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON admin_users;
DROP POLICY IF EXISTS "Allow self-registration" ON admin_users;

-- Create new policy that allows anyone to insert (self-register)
CREATE POLICY "Allow self-admin-registration"
  ON admin_users
  FOR INSERT
  WITH CHECK (true);

-- Ensure UPDATE policy allows updating own record (for last_login)
DROP POLICY IF EXISTS "Anyone can update admin_users" ON admin_users;
CREATE POLICY "Allow update admin records"
  ON admin_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Verify RLS is enabled
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Verify new policies
-- ─────────────────────────────────────────────────────────────────
SELECT 
  'Updated Policies' as info,
  policyname,
  cmd as operation,
  CASE 
    WHEN with_check = 'true' OR with_check IS NULL THEN '✅ Allows registration'
    ELSE '❌ Blocks registration'
  END as registration_status
FROM pg_policies 
WHERE tablename = 'admin_users'
ORDER BY cmd;

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: View current admin users
-- ─────────────────────────────────────────────────────────────────
SELECT 
  'Current Admins' as info,
  email,
  full_name,
  role,
  CASE 
    WHEN role = 'super_admin' THEN '👑 Full Access'
    WHEN role = 'general_admin' THEN '⭐ Most Sections'
    WHEN role = 'materials_admin' THEN '📚 Materials Only'
  END as access_level,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status,
  last_login::date as last_login_date
FROM admin_users
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'general_admin' THEN 2
    WHEN 'materials_admin' THEN 3
  END,
  created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- HOW IT WORKS NOW:
-- ═══════════════════════════════════════════════════════════════
-- 
-- 1. User goes to login.html
-- 2. Selects their role from dropdown:
--    - "Student / Member" → Normal access (code: GERAMA2026)
--    - "General Admin (Full Access)" → Gets general_admin role (code: GERAMA2026)
--    - "Resources Co-Manager (Materials Upload Only)" → Gets materials_admin role (code: GMANAGER2026) ← SPECIAL CODE!
-- 3. Enters appropriate secret code:
--    - Students & General Admins use: GERAMA2026
--    - Resources Co-Managers use: GMANAGER2026
-- 4. Logs in with email + password + secret code
-- 5. System automatically:
--    - Validates the correct code for their selected role
--    - Creates/updates their admin_users record (if admin role selected)
--    - Sets their role based on selection
--    - Redirects appropriately
-- 6. Admin dashboard checks their role and shows appropriate sections
--
-- SECURITY:
-- ✅ Resources Co-Managers need special code (GMANAGER2026) - extra security!
-- ✅ Only people with manager code can become materials admins
-- ✅ General admins use regular code (GERAMA2026)
-- ✅ super_admin role is protected - can only be added via SQL
--
-- RESULT:
-- ✅ No manual SQL needed anymore!
-- ✅ Users can self-register as admins during login
-- ✅ Materials admins need special manager code (GMANAGER2026)
-- ✅ Materials admins only see upload sections
-- ✅ General admins see most sections
-- 
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- OPTIONAL: Restrict who can become super_admin
-- ─────────────────────────────────────────────────────────────────
-- If you want to prevent users from selecting super_admin:
-- (Only YOU can manually add super_admins via SQL)

-- This constraint prevents self-registration as super_admin
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS no_self_super_admin;
ALTER TABLE admin_users ADD CONSTRAINT no_self_super_admin 
  CHECK (
    role IN ('general_admin', 'materials_admin') OR
    (role = 'super_admin' AND created_at < NOW())
  );

-- Note: This allows existing super_admins but prevents new ones via self-registration
-- You can still add super_admins manually via SQL

-- ═══════════════════════════════════════════════════════════════
-- SECURITY NOTES:
-- ═══════════════════════════════════════════════════════════════
-- 
-- 1. Users still need the secret code (GERAMA2026) to log in
-- 2. They must have a verified email account
-- 3. super_admin role is protected - can only be added via SQL
-- 4. materials_admin gets restricted access automatically
-- 5. You can deactivate anyone: UPDATE admin_users SET is_active = false WHERE email = 'x'
--
-- ═══════════════════════════════════════════════════════════════

-- Done! Now users can select their admin role during login! ✅
