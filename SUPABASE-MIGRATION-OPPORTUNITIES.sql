-- ══════════════════════════════════════════════════════════════════
-- GERAMA — Supabase Migration: Opportunities + Did You Know
-- Run these in your Supabase SQL Editor (one-time setup)
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. OPPORTUNITIES TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company             TEXT NOT NULL,
  location            TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('internship','nss','scholarship','job','other')),
  description         TEXT,
  apply_link          TEXT,
  mode_of_application TEXT,
  deadline            DATE,
  image_url           TEXT,
  submitted_by        TEXT DEFAULT 'Anonymous',
  submitted_by_email  TEXT DEFAULT '',
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  view_count          INTEGER DEFAULT 0,
  apply_count         INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Anyone can read approved opportunities; anyone can insert (pending review)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read approved opportunities"
  ON opportunities FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow insert opportunities"
  ON opportunities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin update opportunities"
  ON opportunities FOR UPDATE USING (true);

CREATE POLICY "Allow admin delete opportunities"
  ON opportunities FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 2. OPPORTUNITY COMMENTS TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_comments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id   UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  author_name      TEXT NOT NULL,
  author_email     TEXT DEFAULT '',
  comment          TEXT NOT NULL,
  action_type      TEXT DEFAULT 'comment' CHECK (action_type IN ('comment','applied','interested')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE opportunity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read opportunity comments"
  ON opportunity_comments FOR SELECT USING (true);

CREATE POLICY "Allow insert opportunity comments"
  ON opportunity_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete opportunity comments"
  ON opportunity_comments FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 3. OPPORTUNITY APPLICATIONS TABLE (for tracking)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id   UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_email       TEXT NOT NULL,
  user_name        TEXT DEFAULT 'Anonymous',
  status           TEXT DEFAULT 'applied',
  applied_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, user_email)
);

ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read opportunity applications"
  ON opportunity_applications FOR SELECT USING (true);

CREATE POLICY "Allow insert opportunity applications"
  ON opportunity_applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow upsert opportunity applications"
  ON opportunity_applications FOR UPDATE USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 4. DID YOU KNOW TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS did_you_know (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fact_text           TEXT NOT NULL,
  source              TEXT,
  submitted_by        TEXT DEFAULT 'Anonymous',
  submitted_by_email  TEXT DEFAULT '',
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE did_you_know ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read approved did_you_know"
  ON did_you_know FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow insert did_you_know"
  ON did_you_know FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin manage did_you_know"
  ON did_you_know FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 5. RPC FUNCTION: Increment opportunity view count
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_opp_views(opp_id UUID)
RETURNS void AS $$
  UPDATE opportunities
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = opp_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- 6. SEED: A few starter Did You Know facts (optional)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO did_you_know (fact_text, source, submitted_by, status) VALUES
  ('The Eiffel Tower can grow up to 15 cm taller during summer due to thermal expansion of iron.', 'Engineering Physics', 'Admin', 'approved'),
  ('Concrete gains strength over time. A 50-year-old structure is often stronger than when it was first built.', 'Civil Engineering Today', 'Admin', 'approved'),
  ('A single lightning bolt carries enough energy to power a 100-watt light bulb for about 3 months.', 'Physics Facts', 'Admin', 'approved'),
  ('Steel is the most recycled material on Earth — over 80 million tons are recycled annually.', 'World Steel Association', 'Admin', 'approved'),
  ('Engineers use GPS satellites that must account for Einstein''s theory of relativity — without the correction, GPS would drift by 10 km per day.', 'NASA', 'Admin', 'approved')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- DONE! After running this migration:
-- 1. Go to Admin Dashboard → Opportunities to post and manage
-- 2. Go to Admin Dashboard → Did You Know to manage facts
-- 3. Students see both in Classroom → Opportunities tab & Planner tab
-- ══════════════════════════════════════════════════════════════════
