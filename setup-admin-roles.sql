-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Admin Role-Based Access Control Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Create admin_users table to track admin roles
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'materials_admin',
  -- Roles: 'super_admin', 'general_admin', 'materials_admin'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Enable Row Level Security
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Allow public read access (so login can check roles)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read admin_users" ON admin_users;
CREATE POLICY "Anyone can read admin_users"
  ON admin_users
  FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Allow inserting new admins (for signup/registration)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can insert admin_users" ON admin_users;
CREATE POLICY "Anyone can insert admin_users"
  ON admin_users
  FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: Allow updating admin records (for last_login tracking)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can update admin_users" ON admin_users;
CREATE POLICY "Anyone can update admin_users"
  ON admin_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 6: Insert yourself as super admin (CHANGE EMAIL BELOW!)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO admin_users (email, full_name, role, is_active)
VALUES 
  ('alexandero.dwumaah@gmail.com', 'Alexander Opoku Dwumaah', 'super_admin', true)
ON CONFLICT (email) DO UPDATE 
  SET role = 'super_admin', 
      full_name = EXCLUDED.full_name,
      is_active = true;

-- ⚠️ ADD YOUR ADMIN EMAILS HERE:
-- INSERT INTO admin_users (email, full_name, role, is_active)
-- VALUES 
--   ('your-email@example.com', 'Your Name', 'general_admin', true),
--   ('materials-admin@example.com', 'Materials Admin', 'materials_admin', true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: Create function to check if user is admin
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = user_email 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- STEP 8: Create function to get user role
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM admin_users 
  WHERE email = user_email 
  AND is_active = true;
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- STEP 9: Verify Setup
-- ─────────────────────────────────────────────────────────────────
-- Check all admin users
SELECT 
  email, 
  full_name, 
  role, 
  is_active, 
  created_at 
FROM admin_users 
ORDER BY created_at DESC;

-- Test the functions
SELECT is_admin('alexandero.dwumaah@gmail.com') as is_admin_check;
SELECT get_admin_role('alexandero.dwumaah@gmail.com') as role_check;

-- ══════════════════════════════════════════════════════════════════
-- ROLE DESCRIPTIONS:
-- ══════════════════════════════════════════════════════════════════
-- super_admin: Full access to everything (you)
-- general_admin: Access to all sections except critical settings
-- materials_admin: Only access to:
--   - Upload Materials
--   - Materials History
--   - Review Submissions
--   All other sections are hidden
-- ══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- NEXT STEPS:
-- ══════════════════════════════════════════════════════════════════
-- 1. Run this SQL in Supabase
-- 2. Add your admin emails in STEP 6
-- 3. The admin dashboard will automatically check roles on load
-- 4. Materials admins will see only upload-related sections
-- 5. Use admin-dashboard.html to manage all features
-- ══════════════════════════════════════════════════════════════════
