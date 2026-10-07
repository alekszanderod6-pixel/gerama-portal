-- ══════════════════════════════════════════════════════════════════
-- GERAMA/26 VACATION CLASSES — COMPLETE DATA (All 3 Weeks)
-- Run this in Supabase SQL Editor
-- Dates: Week 1 = Oct 6–11 | Week 2 = Oct 13–18 | Week 3 = Oct 19–25
-- ══════════════════════════════════════════════════════════════════

-- Step 1: Make sure the tables exist (safe to re-run)
CREATE TABLE IF NOT EXISTS vacation_classes (
  id BIGSERIAL PRIMARY KEY,
  course_name TEXT NOT NULL,
  course_code TEXT,
  description TEXT,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week TEXT,
  week_number INTEGER,
  tutor_names TEXT NOT NULL,
  tutor_emails TEXT,
  meeting_link TEXT,
  meeting_platform TEXT DEFAULT 'Google Meet',
  meeting_id TEXT,
  meeting_password TEXT,
  target_levels TEXT[],
  target_programs TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  color_code TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS vacation_schedule_settings (
  id BIGSERIAL PRIMARY KEY,
  schedule_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timetable_image_url TEXT,
  timetable_image_week1 TEXT,
  timetable_image_week2 TEXT,
  timetable_image_week3 TEXT,
  welcome_message TEXT,
  important_notes TEXT,
  is_current BOOLEAN DEFAULT true,
  daily_reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '18:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS with public read
ALTER TABLE vacation_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_schedule_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vacation_classes' AND policyname='Anyone can view vacation classes') THEN
    CREATE POLICY "Anyone can view vacation classes" ON vacation_classes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vacation_classes' AND policyname='Allow insert vacation classes') THEN
    CREATE POLICY "Allow insert vacation classes" ON vacation_classes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vacation_classes' AND policyname='Allow update vacation classes') THEN
    CREATE POLICY "Allow update vacation classes" ON vacation_classes FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vacation_schedule_settings' AND policyname='Anyone can view schedule settings') THEN
    CREATE POLICY "Anyone can view schedule settings" ON vacation_schedule_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vacation_schedule_settings' AND policyname='Allow insert schedule settings') THEN
    CREATE POLICY "Allow insert schedule settings" ON vacation_schedule_settings FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vacation_schedule_settings' AND policyname='Allow update schedule settings') THEN
    CREATE POLICY "Allow update schedule settings" ON vacation_schedule_settings FOR UPDATE USING (true);
  END IF;
END $$;

-- Step 3: Wipe old data and re-insert fresh
TRUNCATE vacation_classes RESTART IDENTITY CASCADE;
TRUNCATE vacation_schedule_settings RESTART IDENTITY CASCADE;

-- ──────────────────────────────────────────────────────────────────
-- WEEK 1 — Oct 6–11, 2026
-- Source: Week 1 daily schedule image (tutors assigned)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO vacation_classes (course_name, class_date, start_time, end_time, tutor_names, week_number, day_of_week, meeting_link, color_code, target_levels) VALUES

-- Tue Oct 6: Solid State  7:30–9:00 PM  | zANDEROD & Perry
('Solid State', '2026-10-06', '19:30', '21:00', 'zANDEROD & Perry', 1, 'Tuesday',
 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300','L400']),

-- Wed Oct 7: DC Machines & Transformers  7:30–8:30 PM  | Jerome & Ray
('DC Machines & Transformers', '2026-10-07', '19:30', '20:30', 'Jerome & Ray', 1, 'Wednesday',
 'https://gerama-portal.vercel.app/classroom.html', '#f59e0b', ARRAY['L200','L300']),

-- Thu Oct 8: Electrical Circuits Analysis & Design  7:30–9:00 PM  | Azakora & Priscy
('Electrical Circuits Analysis & Design', '2026-10-08', '19:30', '21:00', 'Azakora & Priscy', 1, 'Thursday',
 'https://gerama-portal.vercel.app/classroom.html', '#10b981', ARRAY['L200','L300']),

-- Fri Oct 9: MATLAB  7:30–8:30 PM  | Edem & Prophet
('MATLAB', '2026-10-09', '19:30', '20:30', 'Edem & Prophet', 1, 'Friday',
 'https://gerama-portal.vercel.app/classroom.html', '#3b82f6', ARRAY['L200','L300','L400']),

-- Sat Oct 10: DC Machines & Transformers  7:00–8:00 PM  | Jonathan & Prophet
('DC Machines & Transformers', '2026-10-10', '19:00', '20:00', 'Jonathan & Prophet', 1, 'Saturday',
 'https://gerama-portal.vercel.app/classroom.html', '#f59e0b', ARRAY['L200','L300']),

-- Sat Oct 10: Solid State  8:05–9:00 PM  | Hebert & zANDEROD
('Solid State', '2026-10-10', '20:05', '21:00', 'Hebert & zANDEROD', 1, 'Saturday',
 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300','L400']),

-- Sun Oct 11: Linear Algebra  7:30–9:00 PM  | Joseph & John
('Linear Algebra', '2026-10-11', '19:30', '21:00', 'Joseph & John', 1, 'Sunday',
 'https://gerama-portal.vercel.app/classroom.html', '#8b5cf6', ARRAY['L100','L200']);

-- ──────────────────────────────────────────────────────────────────
-- WEEK 2 — Oct 13–19, 2026
-- Source: Full 3-week timetable image
-- ──────────────────────────────────────────────────────────────────
INSERT INTO vacation_classes (course_name, class_date, start_time, end_time, tutor_names, week_number, day_of_week, meeting_link, color_code, target_levels) VALUES

-- Mon Oct 13: Solid State  7:30–9:00 PM
('Solid State', '2026-10-13', '19:30', '21:00', 'TBA', 2, 'Monday',
 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300','L400']),

-- Tue Oct 14: DC Machines & Transformers  7:30–9:00 PM
('DC Machines & Transformers', '2026-10-14', '19:30', '21:00', 'TBA', 2, 'Tuesday',
 'https://gerama-portal.vercel.app/classroom.html', '#f59e0b', ARRAY['L200','L300']),

-- Wed Oct 15: Electrical Circuits Analysis & Design  7:30–8:30 PM
('Electrical Circuits Analysis & Design', '2026-10-15', '19:30', '20:30', 'TBA', 2, 'Wednesday',
 'https://gerama-portal.vercel.app/classroom.html', '#10b981', ARRAY['L200','L300']),

-- Thu Oct 16: Electrical Measurement & Instrumentation  7:30–8:30 PM
('Electrical Measurement & Instrumentation', '2026-10-16', '19:30', '20:30', 'TBA', 2, 'Thursday',
 'https://gerama-portal.vercel.app/classroom.html', '#f97316', ARRAY['L300','L400']),

-- Thu Oct 16: Solid State Live Quiz  9:00–10:30 PM
('Solid State Live Quiz', '2026-10-16', '21:00', '22:30', 'TBA', 2, 'Thursday',
 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300','L400']),

-- Fri Oct 17: MATLAB  7:30–8:30 PM
('MATLAB', '2026-10-17', '19:30', '20:30', 'TBA', 2, 'Friday',
 'https://gerama-portal.vercel.app/classroom.html', '#3b82f6', ARRAY['L200','L300','L400']),

-- Sat Oct 18: Linear Algebra  7:00–8:30 PM
('Linear Algebra', '2026-10-18', '19:00', '20:30', 'TBA', 2, 'Saturday',
 'https://gerama-portal.vercel.app/classroom.html', '#8b5cf6', ARRAY['L100','L200']),

-- Sat Oct 18: Electric Circuit Design  8:30–9:30 PM
('Electric Circuit Design', '2026-10-18', '20:30', '21:30', 'TBA', 2, 'Saturday',
 'https://gerama-portal.vercel.app/classroom.html', '#10b981', ARRAY['L200','L300']),

-- Sun Oct 19: Electrical Measurement & Instrumentation  7:30–9:00 PM
('Electrical Measurement & Instrumentation', '2026-10-19', '19:30', '21:00', 'TBA', 2, 'Sunday',
 'https://gerama-portal.vercel.app/classroom.html', '#f97316', ARRAY['L300','L400']);

-- ──────────────────────────────────────────────────────────────────
-- WEEK 3 — Oct 20–25, 2026
-- Source: Full 3-week timetable image
-- ──────────────────────────────────────────────────────────────────
INSERT INTO vacation_classes (course_name, class_date, start_time, end_time, tutor_names, week_number, day_of_week, meeting_link, color_code, target_levels) VALUES

-- Mon Oct 20: DC Machines & Transformers  7:30–9:00 PM
('DC Machines & Transformers', '2026-10-20', '19:30', '21:00', 'TBA', 3, 'Monday',
 'https://gerama-portal.vercel.app/classroom.html', '#f59e0b', ARRAY['L200','L300']),

-- Tue Oct 21: Electrical Circuits Analysis & Design  7:30–9:00 PM
('Electrical Circuits Analysis & Design', '2026-10-21', '19:30', '21:00', 'TBA', 3, 'Tuesday',
 'https://gerama-portal.vercel.app/classroom.html', '#10b981', ARRAY['L200','L300']),

-- Wed Oct 22: MATLAB  7:30–9:00 PM
('MATLAB', '2026-10-22', '19:30', '21:00', 'TBA', 3, 'Wednesday',
 'https://gerama-portal.vercel.app/classroom.html', '#3b82f6', ARRAY['L200','L300','L400']),

-- Thu Oct 23: Solid State Live Quiz  7:30–9:30 PM
('Solid State Live Quiz', '2026-10-23', '19:30', '21:30', 'TBA', 3, 'Thursday',
 'https://gerama-portal.vercel.app/classroom.html', '#ef4444', ARRAY['L300','L400']),

-- Fri Oct 24 (23rd in timetable label): General Recap and Quizzes  7:30–9:00 PM
('General Recap & Quizzes', '2026-10-24', '19:30', '21:00', 'TBA', 3, 'Friday',
 'https://gerama-portal.vercel.app/classroom.html', '#6366f1', ARRAY['L100','L200','L300','L400']),

-- Sat Oct 25 (24th in timetable label): General Recap and Quizzes  7:30–9:00 PM
('General Recap & Quizzes', '2026-10-25', '19:30', '21:00', 'TBA', 3, 'Saturday',
 'https://gerama-portal.vercel.app/classroom.html', '#6366f1', ARRAY['L100','L200','L300','L400']),

-- Sun Oct 26 (25th in timetable label): General Recap and Quizzes  7:30–9:00 PM
('General Recap & Quizzes', '2026-10-26', '19:30', '21:00', 'TBA', 3, 'Sunday',
 'https://gerama-portal.vercel.app/classroom.html', '#6366f1', ARRAY['L100','L200','L300','L400']);

-- ──────────────────────────────────────────────────────────────────
-- Schedule settings (with Mon Week 1 class not on the week schedule)
-- ──────────────────────────────────────────────────────────────────
-- Note: Week 1 Mon = Linear Algebra per full timetable (no Mon class on Oct 6 since that's the start Tue)
-- Insert the Mon Week 1 Linear Algebra as well (Oct 6 is Tue, so Mon Oct 5 would be before start — skip)
-- Week 1 Mon is listed in full timetable — nearest Mon is Oct 6 which is Tue. Week 1 starts Oct 6 (Tue).
-- Full timetable Mon row applies from Week 1 onward starting Mon Oct 13 for Week 2 (Week 1 Mon = skip).

INSERT INTO vacation_schedule_settings (
  schedule_name, start_date, end_date,
  welcome_message, important_notes, is_current,
  timetable_image_week1,
  timetable_image_week2,
  timetable_image_week3
) VALUES (
  'GERAMA/26 Vacation Classes',
  '2026-10-06',
  '2026-10-26',
  '🎓 Welcome to GERAMA/26 Vacation Classes! Join us daily at 7:30 PM for online tutorials covering key engineering courses.',
  '📌 All classes start at 7:30 PM unless otherwise stated. Meeting links are on the classroom page.',
  true,
  'images/temp/5924510087932221633_121.jpg',
  'images/temp/5924510087932221634_121.jpg',
  'images/temp/5924510087932221634_121.jpg'
);

-- ──────────────────────────────────────────────────────────────────
-- Quick verify
-- ──────────────────────────────────────────────────────────────────
SELECT week_number, count(*) as classes, string_agg(course_name, ' | ' ORDER BY class_date, start_time) as schedule
FROM vacation_classes
GROUP BY week_number
ORDER BY week_number;
