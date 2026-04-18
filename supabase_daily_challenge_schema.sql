-- Daily Challenge Responses Table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS daily_challenge_responses (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    text        NOT NULL,
  category      text        NOT NULL CHECK (category IN ('bls', 'als')),
  challenge_date date       NOT NULL DEFAULT CURRENT_DATE,
  is_correct    boolean     NOT NULL,
  time_taken    integer     NOT NULL, -- seconds from question display to answer
  created_at    timestamptz DEFAULT now()
);

-- Index for fast daily stats queries
CREATE INDEX IF NOT EXISTS idx_dcr_date_category
  ON daily_challenge_responses (challenge_date, category);

-- RLS: allow anyone to insert (anonymous users via session_id)
ALTER TABLE daily_challenge_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert" ON daily_challenge_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_select" ON daily_challenge_responses
  FOR SELECT USING (true);
