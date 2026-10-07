-- ══════════════════════════════════════════════════════════════════
-- CREATE STORAGE BUCKET FOR VACATION CLASS TIMETABLES
-- This creates a public bucket for storing timetable images
-- ══════════════════════════════════════════════════════════════════

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('timetables', 'timetables', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up storage policies to allow public read and authenticated upload
-- Allow anyone to view timetable images
CREATE POLICY "Public Access for Timetable Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'timetables');

-- Allow authenticated users to upload timetables
CREATE POLICY "Authenticated users can upload timetables"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'timetables' AND auth.role() = 'authenticated');

-- Allow authenticated users to update timetables
CREATE POLICY "Authenticated users can update timetables"
ON storage.objects FOR UPDATE
USING (bucket_id = 'timetables' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete timetables
CREATE POLICY "Authenticated users can delete timetables"
ON storage.objects FOR DELETE
USING (bucket_id = 'timetables' AND auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════════
-- DONE! Timetable storage bucket created successfully.
-- You can now upload timetable images via the admin panel.
-- ══════════════════════════════════════════════════════════════════
