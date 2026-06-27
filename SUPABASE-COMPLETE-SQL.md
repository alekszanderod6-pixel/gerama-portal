# GERAMA Portal — Complete Supabase SQL Setup

Run each block separately in Supabase → SQL Editor.

---

## BLOCK 1 — Core Tables

```sql
-- Materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  course text,
  level text,
  semester int,
  type text,
  file_url text,
  source_type text DEFAULT 'file',
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read materials" ON materials FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert materials" ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete materials" ON materials FOR DELETE USING (true);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text,
  priority text DEFAULT 'normal',
  image_url text,
  images text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert announcements" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete announcements" ON announcements FOR DELETE USING (true);

-- Announcement Likes
CREATE TABLE IF NOT EXISTS announcement_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id text NOT NULL,
  user_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_email)
);
ALTER TABLE announcement_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read likes" ON announcement_likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can upsert likes" ON announcement_likes FOR ALL USING (true) WITH CHECK (true);
```

---

## BLOCK 2 — Classes & Attendance

```sql
-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course text,
  topic text,
  tutor text,
  description text,
  scheduled_at timestamptz,
  status text DEFAULT 'upcoming',
  meet_link text,
  class_type text DEFAULT 'virtual',
  meet_platform text DEFAULT 'jitsi',
  venue text,
  map_link text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read classes" ON classes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update classes" ON classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete classes" ON classes FOR DELETE USING (true);

-- Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_title text NOT NULL,
  code text NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read sessions" ON attendance_sessions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert sessions" ON attendance_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update sessions" ON attendance_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  class_title text,
  student_name text,
  student_email text,
  student_phone text,
  index_number text,
  points int DEFAULT 1,
  latitude numeric,
  longitude numeric,
  location_name text,
  marked_at timestamptz DEFAULT now()
);
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read attendance" ON attendance_records FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert attendance" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete attendance" ON attendance_records FOR DELETE USING (true);

-- Class Requests
CREATE TABLE IF NOT EXISTS class_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text,
  student_email text,
  course text,
  topic text,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE class_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read class requests" ON class_requests FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert class requests" ON class_requests FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update class requests" ON class_requests FOR UPDATE USING (true) WITH CHECK (true);
```

---

## BLOCK 3 — Assignments & Quizzes

```sql
-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  course text,
  tutor text,
  description text,
  deadline timestamptz,
  points int,
  file_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert assignments" ON assignments FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update assignments" ON assignments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete assignments" ON assignments FOR DELETE USING (true);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid REFERENCES assignments(id) ON DELETE SET NULL,
  assignment_title text,
  student_name text,
  student_email text,
  index_number text,
  comment text,
  file_url text,
  storage_path text,
  status text DEFAULT 'submitted',
  score numeric,
  graded_at timestamptz,
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read submissions" ON assignment_submissions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert submissions" ON assignment_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update submissions" ON assignment_submissions FOR UPDATE USING (true) WITH CHECK (true);

-- Student Grades
CREATE TABLE IF NOT EXISTS student_grades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email text NOT NULL,
  assignment_title text NOT NULL,
  score numeric NOT NULL,
  submission_id uuid,
  graded_at timestamptz DEFAULT now(),
  UNIQUE(submission_id)
);
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read grades" ON student_grades FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can upsert grades" ON student_grades FOR ALL USING (true) WITH CHECK (true);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  course text,
  description text,
  questions jsonb,
  deadline timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert quizzes" ON quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update quizzes" ON quizzes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete quizzes" ON quizzes FOR DELETE USING (true);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  student_email text,
  student_name text,
  answers jsonb,
  score numeric,
  completed_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read quiz attempts" ON quiz_attempts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (true);

-- Quiz Requests (students requesting quizzes)
CREATE TABLE IF NOT EXISTS quiz_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text,
  student_email text,
  title text,
  course text,
  description text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read quiz requests" ON quiz_requests FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert quiz requests" ON quiz_requests FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update quiz requests" ON quiz_requests FOR UPDATE USING (true) WITH CHECK (true);
```

---

## BLOCK 4 — Users, Q&A, Misc

```sql
-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  program text,
  level text,
  index_number text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can upsert profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Page Views (visitor tracking)
CREATE TABLE IF NOT EXISTS page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page text,
  visited_at timestamptz DEFAULT now(),
  referrer text
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can insert page views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can read page views" ON page_views FOR SELECT USING (true);

-- Q&A Posts
CREATE TABLE IF NOT EXISTS questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name text,
  author_email text,
  course text,
  content text,
  images text,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read questions" ON questions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update questions" ON questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete questions" ON questions FOR DELETE USING (true);

-- Q&A Answers
CREATE TABLE IF NOT EXISTS answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  author_name text,
  author_email text,
  content text,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read answers" ON answers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update answers" ON answers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete answers" ON answers FOR DELETE USING (true);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  author_name text,
  author_email text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update comments" ON comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete comments" ON comments FOR DELETE USING (true);

-- Personality of the Week Nominations
CREATE TABLE IF NOT EXISTS potw_nominations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text,
  bio text,
  nominated_by text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE potw_nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read potw" ON potw_nominations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert potw" ON potw_nominations FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update potw" ON potw_nominations FOR UPDATE USING (true) WITH CHECK (true);

-- Software / Tools
CREATE TABLE IF NOT EXISTS software (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  download_url text,
  category text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE software ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read software" ON software FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert software" ON software FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete software" ON software FOR DELETE USING (true);

-- Reels (video posts)
CREATE TABLE IF NOT EXISTS reels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name text,
  author_email text,
  caption text,
  course text,
  video_url text,
  storage_path text,
  likes int DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read reels" ON reels FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can insert reels" ON reels FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can update reels" ON reels FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can delete reels" ON reels FOR DELETE USING (true);
```

---

## BLOCK 5 — Storage Bucket

In Supabase → Storage → Create bucket named **`gerama-materials`** (public).

Then run:
```sql
-- Allow public access to storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gerama-materials', 'gerama-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

---

## NOTES

- Run each BLOCK separately — don't paste all at once
- If you get "already exists" errors, that's fine — the `IF NOT EXISTS` handles it
- The `IF NOT EXISTS` on policies may fail on older Postgres — if so, just skip those lines
- After running all blocks, test login → the site should work fully
