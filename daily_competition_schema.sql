-- Daily Competition table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS daily_competition (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_date DATE NOT NULL,
  session_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  city TEXT NOT NULL,
  correct_answers INTEGER DEFAULT 0 NOT NULL,
  total_time_seconds INTEGER DEFAULT 0 NOT NULL,
  answers_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_competition_date UNIQUE (session_id, competition_date)
);

-- Index for fast leaderboard queries (most correct first, then fastest time)
CREATE INDEX IF NOT EXISTS idx_daily_competition_leaderboard
  ON daily_competition (competition_date, correct_answers DESC, total_time_seconds ASC);

-- Enable Row Level Security
ALTER TABLE daily_competition ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public leaderboard)
CREATE POLICY "Allow public read on daily_competition"
  ON daily_competition FOR SELECT
  USING (true);

-- Allow anyone to insert their own entry
CREATE POLICY "Allow public insert on daily_competition"
  ON daily_competition FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their own entry (upsert)
CREATE POLICY "Allow public update on daily_competition"
  ON daily_competition FOR UPDATE
  USING (true);
