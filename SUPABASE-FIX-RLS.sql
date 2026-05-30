-- ============================================================
-- GERAMA PORTAL — COMPLETE RLS FIX
-- Run this entire block in Supabase → SQL Editor
-- This opens all tables for read/write (security via secret code in app)
-- ============================================================

-- MATERIALS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_materials" ON materials;
CREATE POLICY "open_materials" ON materials USING (true) WITH CHECK (true);

-- ANNOUNCEMENTS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_announcements" ON announcements;
CREATE POLICY "open_announcements" ON announcements USING (true) WITH CHECK (true);

-- ANNOUNCEMENT LIKES
ALTER TABLE announcement_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_announcement_likes" ON announcement_likes;
CREATE POLICY "open_announcement_likes" ON announcement_likes USING (true) WITH CHECK (true);

-- CLASSES
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_classes" ON classes;
CREATE POLICY "open_classes" ON classes USING (true) WITH CHECK (true);

-- ATTENDANCE SESSIONS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_attendance_sessions" ON attendance_sessions;
CREATE POLICY "open_attendance_sessions" ON attendance_sessions USING (true) WITH CHECK (true);

-- ATTENDANCE RECORDS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_attendance_records" ON attendance_records;
CREATE POLICY "open_attendance_records" ON attendance_records USING (true) WITH CHECK (true);

-- CLASS REQUESTS
ALTER TABLE class_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_class_requests" ON class_requests;
CREATE POLICY "open_class_requests" ON class_requests USING (true) WITH CHECK (true);

-- ASSIGNMENTS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_assignments" ON assignments;
CREATE POLICY "open_assignments" ON assignments USING (true) WITH CHECK (true);

-- ASSIGNMENT SUBMISSIONS
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_assignment_submissions" ON assignment_submissions;
CREATE POLICY "open_assignment_submissions" ON assignment_submissions USING (true) WITH CHECK (true);

-- STUDENT GRADES
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_student_grades" ON student_grades;
CREATE POLICY "open_student_grades" ON student_grades USING (true) WITH CHECK (true);

-- QUIZZES
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_quizzes" ON quizzes;
CREATE POLICY "open_quizzes" ON quizzes USING (true) WITH CHECK (true);

-- QUIZ ATTEMPTS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_quiz_attempts" ON quiz_attempts;
CREATE POLICY "open_quiz_attempts" ON quiz_attempts USING (true) WITH CHECK (true);

-- QUIZ REQUESTS
ALTER TABLE quiz_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_quiz_requests" ON quiz_requests;
CREATE POLICY "open_quiz_requests" ON quiz_requests USING (true) WITH CHECK (true);

-- USER PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_user_profiles" ON user_profiles;
CREATE POLICY "open_user_profiles" ON user_profiles USING (true) WITH CHECK (true);

-- PAGE VIEWS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_page_views" ON page_views;
CREATE POLICY "open_page_views" ON page_views USING (true) WITH CHECK (true);

-- QUESTIONS (Q&A)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_questions" ON questions;
CREATE POLICY "open_questions" ON questions USING (true) WITH CHECK (true);

-- ANSWERS
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_answers" ON answers;
CREATE POLICY "open_answers" ON answers USING (true) WITH CHECK (true);

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_comments" ON comments;
CREATE POLICY "open_comments" ON comments USING (true) WITH CHECK (true);

-- POTW NOMINATIONS
ALTER TABLE potw_nominations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_potw_nominations" ON potw_nominations;
CREATE POLICY "open_potw_nominations" ON potw_nominations USING (true) WITH CHECK (true);

-- SOFTWARE
ALTER TABLE software ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_software" ON software;
CREATE POLICY "open_software" ON software USING (true) WITH CHECK (true);

-- REELS
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_reels" ON reels;
CREATE POLICY "open_reels" ON reels USING (true) WITH CHECK (true);

-- Also fix missing columns on assignment_submissions
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS score numeric;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS graded_at timestamptz;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS index_number text;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'submitted';

-- Also fix missing columns on classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_type text DEFAULT 'virtual';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS map_link text;

-- Also fix missing columns on announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS images text;

-- Also fix missing columns on materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'file';

-- Also fix missing columns on user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS index_number text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text;
