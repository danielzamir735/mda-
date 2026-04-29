-- ── daily_questions ─────────────────────────────────────────────────────────
-- One shared question per day per category. All users read the same row.

CREATE TABLE IF NOT EXISTS daily_questions (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_date date        NOT NULL,
  question_type text        NOT NULL CHECK (question_type IN ('bls', 'als', 'med_v3', 'abbr', 'red_flag')),
  content       jsonb       NOT NULL,
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT unique_daily_question UNIQUE (question_date, question_type)
);

ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_select_all" ON daily_questions FOR SELECT USING (true);
CREATE POLICY "dq_insert_all" ON daily_questions FOR INSERT WITH CHECK (true);

-- ── daily_responses ──────────────────────────────────────────────────────────
-- One row per session per day per category. Unique constraint prevents duplicates.

CREATE TABLE IF NOT EXISTS daily_responses (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    text        NOT NULL,
  question_type text        NOT NULL CHECK (question_type IN ('bls', 'als')),
  question_date date        NOT NULL DEFAULT CURRENT_DATE,
  is_correct    boolean     NOT NULL,
  time_taken    integer     NOT NULL,
  answer_index  integer     NOT NULL CHECK (answer_index BETWEEN 0 AND 3),
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT unique_session_response UNIQUE (session_id, question_type, question_date)
);

CREATE INDEX IF NOT EXISTS idx_dr_date_type
  ON daily_responses (question_date, question_type);

-- Migration safety — add columns if a legacy deployment pre-dates them.
-- Each statement is idempotent; safe to re-run.
ALTER TABLE daily_responses ADD COLUMN IF NOT EXISTS is_correct    boolean;
ALTER TABLE daily_responses ADD COLUMN IF NOT EXISTS time_taken    integer;
ALTER TABLE daily_responses ADD COLUMN IF NOT EXISTS answer_index  integer;

-- RLS: anonymous users can INSERT their own response and SELECT ALL responses
-- (SELECT all is required for cross-browser global stats to work)
ALTER TABLE daily_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dr_insert_all" ON daily_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "dr_select_all" ON daily_responses FOR SELECT USING (true);

-- ── daily_leaderboard ────────────────────────────────────────────────────────
-- Top-10 fastest correct answers per day per category.

CREATE TABLE IF NOT EXISTS daily_leaderboard (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_date date        NOT NULL DEFAULT CURRENT_DATE,
  question_type text        NOT NULL CHECK (question_type IN ('bls', 'als')),
  display_name  text        NOT NULL,
  time_taken    integer     NOT NULL,
  session_id    text        NOT NULL,
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT unique_leaderboard_entry UNIQUE (session_id, question_type, question_date)
);

CREATE INDEX IF NOT EXISTS idx_dl_date_type_time
  ON daily_leaderboard (question_date, question_type, time_taken);

ALTER TABLE daily_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dl_insert_all" ON daily_leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "dl_select_all" ON daily_leaderboard FOR SELECT USING (true);
