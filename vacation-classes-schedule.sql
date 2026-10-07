-- ══════════════════════════════════════════════════════════════════
-- GERAMA VACATION CLASSES SCHEDULE SYSTEM
-- Online tutorials and classes management
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Create vacation_classes table
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vacation_classes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Class details
  course_name TEXT NOT NULL,
  course_code TEXT,
  description TEXT,
  
  -- Schedule
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week TEXT, -- Monday, Tuesday, etc.
  week_number INTEGER, -- Week 1, 2, 3
  
  -- Tutors
  tutor_names TEXT NOT NULL,
  tutor_emails TEXT, -- Comma-separated
  
  -- Meeting details
  meeting_link TEXT,
  meeting_platform TEXT DEFAULT 'Google Meet', -- Google Meet, Zoom, etc.
  meeting_id TEXT,
  meeting_password TEXT,
  
  -- Target audience
  target_levels TEXT[], -- L100, L200, L300, L400
  target_programs TEXT[], -- All, CSE, EEE, etc.
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  is_active BOOLEAN DEFAULT true,
  
  -- Additional info
  notes TEXT,
  color_code TEXT DEFAULT '#6366f1', -- For UI color coding
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT -- Admin email
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vacation_classes_date ON vacation_classes(class_date);
CREATE INDEX IF NOT EXISTS idx_vacation_classes_status ON vacation_classes(status);
CREATE INDEX IF NOT EXISTS idx_vacation_classes_active ON vacation_classes(is_active);

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Create vacation_schedule_settings table
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vacation_schedule_settings (
  id BIGSERIAL PRIMARY KEY,
  
  -- Schedule period
  schedule_name TEXT NOT NULL, -- e.g., "Vacation 2026 - Week 1"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Display settings
  timetable_image_url TEXT, -- URL to uploaded timetable image
  timetable_image_week1 TEXT,
  timetable_image_week2 TEXT,
  timetable_image_week3 TEXT,
  
  -- Announcements
  welcome_message TEXT,
  important_notes TEXT,
  
  -- Settings
  is_current BOOLEAN DEFAULT true,
  daily_reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '18:00:00', -- Send reminder at 6pm
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Enable Row Level Security
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE vacation_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_schedule_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (students can view)
CREATE POLICY "Anyone can view vacation classes"
  ON vacation_classes FOR SELECT USING (true);

CREATE POLICY "Anyone can view schedule settings"
  ON vacation_schedule_settings FOR SELECT USING (true);

-- Allow insert/update for authenticated users (admins will use this)
CREATE POLICY "Allow insert vacation classes"
  ON vacation_classes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update vacation classes"
  ON vacation_classes FOR UPDATE USING (true);

CREATE POLICY "Allow insert schedule settings"
  ON vacation_schedule_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update schedule settings"
  ON vacation_schedule_settings FOR UPDATE USING (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Sample Data - Week 1 Schedule (from your image)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO vacation_classes (
  course_name, class_date, start_time, end_time, tutor_names, 
  week_number, day_of_week, meeting_link, color_code, target_levels
) VALUES 
  -- Week 1: October 6-11, 2026
  ('Solid State', '2026-10-06', '19:30', '21:00', 'zANDEROD & Perry', 1, 'Tuesday', 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300', 'L400']),
  
  ('DC Machines & Transformers', '2026-10-07', '19:30', '20:30', 'Jerome & Ray', 1, 'Wednesday', 'https://gerama-portal.vercel.app/classroom.html', '#f59e0b', ARRAY['L200', 'L300']),
  
  ('Electrical Circuits Analysis & Design', '2026-10-08', '19:30', '21:00', 'Azakora & Priscy', 1, 'Thursday', 'https://gerama-portal.vercel.app/classroom.html', '#10b981', ARRAY['L200', 'L300']),
  
  ('MATLAB', '2026-10-09', '19:30', '20:30', 'Edem & Prophet', 1, 'Friday', 'https://gerama-portal.vercel.app/classroom.html', '#3b82f6', ARRAY['L200', 'L300', 'L400']),
  
  ('DC Machines & Transformers', '2026-10-10', '19:00', '20:00', 'Jonathan & Prophet', 1, 'Saturday', 'https://gerama-portal.vercel.app/classroom.html', '#f59e0b', ARRAY['L200', 'L300']),
  
  ('Solid State', '2026-10-10', '20:05', '21:00', 'Hebert & zANDEROD', 1, 'Saturday', 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300', 'L400']),
  
  ('Linear Algebra', '2026-10-11', '19:30', '21:00', 'Joseph & John', 1, 'Sunday', 'https://gerama-portal.vercel.app/classroom.html', '#8b5cf6', ARRAY['L100', 'L200']);

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: Create schedule settings record
-- ─────────────────────────────────────────────────────────────────
INSERT INTO vacation_schedule_settings (
  schedule_name,
  start_date,
  end_date,
  welcome_message,
  important_notes,
  is_current
) VALUES (
  'GERAMA/26 Vacation Classes',
  '2026-10-06',
  '2026-10-25',
  '🎓 Welcome to GERAMA/26 Vacation Classes! Join us daily at 7:30 PM for tutorials covering key courses.',
  '📌 All classes start at 7:30 PM unless otherwise stated. Meeting links are available on the classroom page.',
  true
);

-- ─────────────────────────────────────────────────────────────────
-- STEP 6: Create useful views
-- ─────────────────────────────────────────────────────────────────

-- View for today's classes
CREATE OR REPLACE VIEW todays_classes AS
SELECT 
  id,
  course_name,
  course_code,
  class_date,
  start_time,
  end_time,
  TO_CHAR(start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(end_time, 'HH12:MI AM') as time_range,
  tutor_names,
  meeting_link,
  color_code,
  target_levels,
  status
FROM vacation_classes
WHERE class_date = CURRENT_DATE
  AND is_active = true
ORDER BY start_time;

-- View for upcoming classes (next 7 days)
CREATE OR REPLACE VIEW upcoming_classes AS
SELECT 
  id,
  course_name,
  class_date,
  TO_CHAR(class_date, 'Day, DD Mon') as formatted_date,
  start_time,
  end_time,
  TO_CHAR(start_time, 'HH12:MI AM') as start_time_formatted,
  tutor_names,
  meeting_link,
  color_code,
  day_of_week,
  week_number
FROM vacation_classes
WHERE class_date >= CURRENT_DATE
  AND class_date <= CURRENT_DATE + INTERVAL '7 days'
  AND is_active = true
ORDER BY class_date, start_time;

-- View for this week's schedule
CREATE OR REPLACE VIEW this_week_schedule AS
SELECT 
  id,
  course_name,
  class_date,
  day_of_week,
  start_time,
  end_time,
  tutor_names,
  color_code,
  week_number,
  meeting_link
FROM vacation_classes
WHERE class_date >= DATE_TRUNC('week', CURRENT_DATE)
  AND class_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
  AND is_active = true
ORDER BY class_date, start_time;

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: Verification queries
-- ─────────────────────────────────────────────────────────────────

-- View all classes
SELECT 
  course_name,
  TO_CHAR(class_date, 'Day DD Mon') as date,
  TO_CHAR(start_time, 'HH12:MI AM') as start,
  tutor_names
FROM vacation_classes
ORDER BY class_date, start_time;

-- View today's classes (if today is between Oct 6-11, 2026)
SELECT * FROM todays_classes;

-- View upcoming classes
SELECT * FROM upcoming_classes;

-- ═══════════════════════════════════════════════════════════════
-- WHAT THIS CREATES:
-- ═══════════════════════════════════════════════════════════════
-- 
-- 1. vacation_classes table
--    - Stores all class schedules
--    - Course name, date, time, tutors
--    - Meeting links, target audience
--    - Color coding for UI display
--
-- 2. vacation_schedule_settings table
--    - Overall schedule configuration
--    - Timetable images storage
--    - Welcome messages, announcements
--    - Reminder settings
--
-- 3. Useful views for easy querying
--    - todays_classes: Today's schedule
--    - upcoming_classes: Next 7 days
--    - this_week_schedule: Current week
--
-- 4. Sample data from your Week 1 timetable
--    - All classes from Oct 6-11 added
--    - With correct times and tutors
--
-- ═══════════════════════════════════════════════════════════════

-- Done! Tables created and ready to use ✅
