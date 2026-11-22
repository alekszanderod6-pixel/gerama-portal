-- ══════════════════════════════════════════════════════════════════
-- FIX CLASS STATUS AND ADD GERAMA ORIENTATION ANNOUNCEMENT
-- Fixes:
-- 1. Updates all past classes to 'ended' status
-- 2. Adds GERAMA Orientation meeting announcement with flyer
-- ══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. UPDATE PAST CLASSES TO 'ENDED' STATUS
-- ────────────────────────────────────────────────────────────────

-- Update all classes where scheduled_at is in the past and status is still 'upcoming'
UPDATE classes
SET status = 'ended',
    updated_at = NOW()
WHERE scheduled_at < NOW()
  AND status = 'upcoming';

-- Also check if there are any 'live' classes that should have ended
UPDATE classes
SET status = 'ended',
    updated_at = NOW()
WHERE scheduled_at < (NOW() - INTERVAL '3 hours')
  AND status = 'live';

-- ────────────────────────────────────────────────────────────────
-- 2. ADD GERAMA ORIENTATION ANNOUNCEMENT
-- ────────────────────────────────────────────────────────────────

-- Insert the GERAMA Orientation announcement with the flyer image
INSERT INTO announcements (
    title,
    message,
    priority,
    image_url,
    created_at,
    updated_at
) VALUES (
    'GERAMA Orientation Meeting - Welcome New Members! 🎉',
    'Join us TODAY, November 22nd, 2026 at 6:30 PM for the GERAMA Orientation Meeting! 

📅 DATE: 22nd Nov 2026
⏰ TIME: 6:30 PM
💻 VENUE: Google Meet (Virtual)

WHAT TO EXPECT:
• What GERAMA is all about
• What goes into TEAM GERAMA
• GERAMA mentorship opportunities
• A tour of the GERAMA platform
• Connect with GERAMA alumni
• Opportunities for members

All new members and interested students are welcome! Don''t miss this chance to learn everything about GERAMA and how to make the most of our platform.

For more details, call: +233 595 443 801

See you there! 🚀',
    'important',
    'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/orientation-flyer.jpg',
    NOW(),
    NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 3. CREATE AUTOMATIC STATUS UPDATE FUNCTION (OPTIONAL)
-- ────────────────────────────────────────────────────────────────

-- This function will automatically update class status based on time
-- You can call this periodically or trigger it on page load

CREATE OR REPLACE FUNCTION update_class_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- End classes that are past their scheduled time (with 30 min buffer)
    UPDATE classes
    SET status = 'ended',
        updated_at = NOW()
    WHERE scheduled_at < (NOW() - INTERVAL '30 minutes')
      AND status IN ('upcoming', 'live');
    
    -- Optional: Auto-start classes that are within 5 minutes of start time
    -- (Only enable this if you want automatic "live" status)
    -- UPDATE classes
    -- SET status = 'live',
    --     updated_at = NOW()
    -- WHERE scheduled_at BETWEEN (NOW() - INTERVAL '5 minutes') AND (NOW() + INTERVAL '5 minutes')
    --   AND status = 'upcoming';
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 4. VERIFICATION QUERIES
-- ────────────────────────────────────────────────────────────────

-- Check how many classes were updated
SELECT 
    status,
    COUNT(*) as count,
    MIN(scheduled_at) as earliest,
    MAX(scheduled_at) as latest
FROM classes
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'live' THEN 1
        WHEN 'upcoming' THEN 2
        WHEN 'ended' THEN 3
        ELSE 4
    END;

-- Verify the orientation announcement was added
SELECT 
    id,
    title,
    LEFT(message, 100) as message_preview,
    priority,
    image_url IS NOT NULL as has_image,
    created_at
FROM announcements
WHERE title LIKE '%Orientation%'
ORDER BY created_at DESC
LIMIT 1;

-- ────────────────────────────────────────────────────────────────
-- NOTES:
-- ────────────────────────────────────────────────────────────────
-- • Run this SQL in your Supabase SQL Editor
-- • The class status updates will happen immediately
-- • The orientation announcement will appear on the home page
-- • Consider setting up a cron job to run update_class_status() daily
-- • Update the image_url if you have a different path for the flyer
-- ══════════════════════════════════════════════════════════════════
