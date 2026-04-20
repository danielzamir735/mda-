-- ── daily_questions ─────────────────────────────────────────────────────────
-- One shared question per day per category. All users read the same row.

CREATE TABLE IF NOT EXISTS daily_questions (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_date date        NOT NULL,
  question_type text        NOT NULL CHECK (question_type IN ('bls', 'als')),
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

-- RLS: anonymous users can INSERT their own response and SELECT ALL responses
-- (SELECT all is required for cross-browser global stats to work)
ALTER TABLE daily_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dr_insert_all" ON daily_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "dr_select_all" ON daily_responses FOR SELECT USING (true);
