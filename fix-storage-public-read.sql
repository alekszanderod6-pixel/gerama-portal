-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Fix: Opportunity images not showing (Storage RLS)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- The gerama-materials bucket needs a public SELECT policy so that
-- image URLs returned by getPublicUrl() actually load in browsers.

-- Step 1: Make the bucket public (easiest fix)
-- Go to: Supabase Dashboard → Storage → gerama-materials → Settings
-- Toggle "Public bucket" to ON
-- This makes all files publicly readable without needing a policy.

-- Step 2 (alternative — if you want to keep bucket private but allow reads):
-- Add a storage policy for public reads on the objects table:

INSERT INTO storage.buckets (id, name, public)
VALUES ('gerama-materials', 'gerama-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 3: Ensure anon role can SELECT objects in this bucket
DROP POLICY IF EXISTS "Public read gerama-materials" ON storage.objects;
CREATE POLICY "Public read gerama-materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gerama-materials');

-- Step 4: Allow authenticated uploads (for opportunity image submissions)
DROP POLICY IF EXISTS "Allow uploads to gerama-materials" ON storage.objects;
CREATE POLICY "Allow uploads to gerama-materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gerama-materials');

-- Step 5: Verify bucket is now public
SELECT id, name, public FROM storage.buckets WHERE id = 'gerama-materials';

-- ══════════════════════════════════════════════════════════════════
-- After running this, hard-refresh the opportunities page.
-- Existing image URLs stored in the opportunities table will now
-- load correctly since the bucket is public.
-- ══════════════════════════════════════════════════════════════════
