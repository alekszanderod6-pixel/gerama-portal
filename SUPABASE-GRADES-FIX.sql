-- ============================================================
-- GERAMA — GRADES FIX
-- Paste this entire block into Supabase → SQL Editor → Run
-- ============================================================

-- Step 1: Add missing columns to student_grades
ALTER TABLE student_grades ADD COLUMN IF NOT EXISTS student_name    text;
ALTER TABLE student_grades ADD COLUMN IF NOT EXISTS course          text;
ALTER TABLE student_grades ADD COLUMN IF NOT EXISTS total_marks     numeric;
ALTER TABLE student_grades ADD COLUMN IF NOT EXISTS points          numeric;
ALTER TABLE student_grades ADD COLUMN IF NOT EXISTS participated_at timestamptz;

-- Step 2: Drop old conflicting unique constraint if it exists
ALTER TABLE student_grades DROP CONSTRAINT IF EXISTS student_grades_submission_id_key;

-- Step 3: Add the unique constraint the app upsert relies on
ALTER TABLE student_grades DROP CONSTRAINT IF EXISTS student_grades_student_email_assignment_title_key;
ALTER TABLE student_grades ADD CONSTRAINT student_grades_student_email_assignment_title_key UNIQUE (student_email, assignment_title);

-- Step 4: Reset RLS to wide-open
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_student_grades"    ON student_grades;
DROP POLICY IF EXISTS "Anyone can read grades"  ON student_grades;
DROP POLICY IF EXISTS "Anyone can upsert grades" ON student_grades;
CREATE POLICY "open_student_grades" ON student_grades FOR ALL USING (true) WITH CHECK (true);
