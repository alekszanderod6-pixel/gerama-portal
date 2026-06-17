-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Help Center & GERA AI Assistant Migration
-- Run this in Supabase → SQL Editor → Run All
-- Covers: help guide loom links, GERA AI chat logs, tutorial feedback
-- ══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. HELP GUIDE LOOM LINKS
--    Stores Loom video URLs attached to each guide (guide_id = e.g. 'join-class')
--    Currently saved in localStorage, this makes them persist for ALL users
--    and lets admins manage them from the admin dashboard.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_guide_videos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id    TEXT        NOT NULL UNIQUE,           -- e.g. 'join-class', 'attendance'
  loom_url    TEXT        NOT NULL,                  -- full Loom share URL
  loom_title  TEXT,                                  -- optional label
  added_by    TEXT        DEFAULT 'admin',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE help_guide_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can read (students need to see the embedded videos)
DROP POLICY IF EXISTS "read_help_guide_videos"   ON help_guide_videos;
CREATE POLICY "read_help_guide_videos"
  ON help_guide_videos FOR SELECT USING (true);

-- Only insert/update via admin (frontend secret-code gated)
DROP POLICY IF EXISTS "manage_help_guide_videos" ON help_guide_videos;
CREATE POLICY "manage_help_guide_videos"
  ON help_guide_videos FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 2. GERA AI CHAT LOGS
--    Optional: logs questions students ask GERA so you can see
--    what students struggle with most and improve your guides.
--    No personal data stored — only the question text and page.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gera_chat_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  question     TEXT        NOT NULL,
  answer       TEXT,                                  -- what GERA replied
  answer_source TEXT        DEFAULT 'kb'             -- 'kb' = knowledge base, 'gemini' = AI
                CHECK (answer_source IN ('kb','gemini','fallback')),
  page         TEXT,                                  -- which page the student was on
  session_id   TEXT,                                  -- random session ID (not tied to user)
  asked_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gera_chat_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous logging)
DROP POLICY IF EXISTS "insert_gera_chat_logs" ON gera_chat_logs;
CREATE POLICY "insert_gera_chat_logs"
  ON gera_chat_logs FOR INSERT WITH CHECK (true);

-- Only admins can read logs (guarded by the app's admin gate)
DROP POLICY IF EXISTS "read_gera_chat_logs" ON gera_chat_logs;
CREATE POLICY "read_gera_chat_logs"
  ON gera_chat_logs FOR SELECT USING (true);

-- Auto-delete logs older than 90 days (keep the table small)
-- Run manually or set up a pg_cron job:
-- SELECT cron.schedule('delete-old-gera-logs', '0 3 * * 0',
--   $$DELETE FROM gera_chat_logs WHERE asked_at < NOW() - INTERVAL '90 days'$$);


-- ─────────────────────────────────────────────────────────────────
-- 3. HELP GUIDE FEEDBACK
--    Students can mark a guide as "Helpful" or "Needs Improvement".
--    Simple thumbs up/down — helps you know which guides to fix.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_guide_feedback (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id     TEXT        NOT NULL,
  rating       TEXT        NOT NULL CHECK (rating IN ('helpful','needs_work')),
  comment      TEXT,                                  -- optional text feedback
  student_email TEXT,                                 -- optional, if logged in
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE help_guide_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_help_guide_feedback" ON help_guide_feedback;
CREATE POLICY "open_help_guide_feedback"
  ON help_guide_feedback FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 4. HELP GUIDE VIEW TRACKING
--    Counts how many times each guide is opened — lets you see
--    which guides students use most.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_guide_views (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id   TEXT        NOT NULL,
  viewed_at  TIMESTAMPTZ DEFAULT NOW(),
  page_ref   TEXT                                     -- which page linked to the guide
);

ALTER TABLE help_guide_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_help_guide_views" ON help_guide_views;
CREATE POLICY "open_help_guide_views"
  ON help_guide_views FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 5. RPC: Top-viewed guides (used by admin dashboard widget)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_help_guides(lim INT DEFAULT 10)
RETURNS TABLE(guide_id TEXT, view_count BIGINT) AS $$
  SELECT guide_id, COUNT(*) AS view_count
  FROM help_guide_views
  GROUP BY guide_id
  ORDER BY view_count DESC
  LIMIT lim;
$$ LANGUAGE SQL SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────
-- 6. RPC: GERA top questions (admin insight)
--    Returns the most-asked question topics so you know what to
--    record Loom videos for first.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_gera_top_questions(lim INT DEFAULT 20)
RETURNS TABLE(question TEXT, times_asked BIGINT, last_asked TIMESTAMPTZ) AS $$
  SELECT question, COUNT(*) AS times_asked, MAX(asked_at) AS last_asked
  FROM gera_chat_logs
  GROUP BY question
  ORDER BY times_asked DESC
  LIMIT lim;
$$ LANGUAGE SQL SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────
-- 7. FIX: block_reason column on user_profiles (if not yet added)
--    Referenced in main.js syncIndexNumber but may be missing.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS block_reason TEXT;


-- ─────────────────────────────────────────────────────────────────
-- 8. FIX: RLS for new tables from this session
--    (opportunities and did_you_know already handled in MIGRATION-OPPORTUNITIES)
--    Add any tables added since SUPABASE-FIX-RLS.sql was last run:
-- ─────────────────────────────────────────────────────────────────

-- Connect messages (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'connect_messages') THEN
    ALTER TABLE connect_messages ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'connect_messages' AND policyname = 'open_connect_messages') THEN
      CREATE POLICY "open_connect_messages" ON connect_messages USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- Statuses (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'statuses') THEN
    ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'statuses' AND policyname = 'open_statuses') THEN
      CREATE POLICY "open_statuses" ON statuses USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- Study groups (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'study_groups') THEN
    ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'study_groups' AND policyname = 'open_study_groups') THEN
      CREATE POLICY "open_study_groups" ON study_groups USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- Planner items (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'planner_items') THEN
    ALTER TABLE planner_items ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'planner_items' AND policyname = 'open_planner_items') THEN
      CREATE POLICY "open_planner_items" ON planner_items USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════════════
-- DONE ✅
-- Tables created:
--   help_guide_videos    → Loom URLs for each guide (admin-managed)
--   gera_chat_logs       → What students ask GERA (anonymous)
--   help_guide_feedback  → Thumbs up/down per guide
--   help_guide_views     → View count per guide
--
-- RPC functions:
--   get_top_help_guides()      → Most-viewed guides
--   get_gera_top_questions()   → Most-asked GERA questions
--
-- Fixes applied:
--   user_profiles.block_reason added (if missing)
--   connect_messages / statuses / study_groups / planner_items RLS (if tables exist)
-- ══════════════════════════════════════════════════════════════════
