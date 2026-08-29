-- ── er_load_reports ─────────────────────────────────────────────────────────
-- Crowd-sourced ER load reports. Anonymous, same session_id pattern as
-- push_subscriptions / daily_responses (crypto.randomUUID(), localStorage key
-- "medic_session_id"). Deliberately no free-text field — only a fixed load
-- level — to keep this low-risk (no libel/inappropriate-content surface) and
-- low-friction (one tap to report).

CREATE TABLE IF NOT EXISTS er_load_reports (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_name  text        NOT NULL,
  department     text        NOT NULL CHECK (department IN ('general','pediatric')),
  load_level     smallint    NOT NULL CHECK (load_level BETWEEN 1 AND 3), -- 1=light 2=medium 3=heavy
  session_id     text        NOT NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_er_load_reports_lookup
  ON er_load_reports (hospital_name, department, created_at DESC);

-- RLS: no real auth — anonymous clients read all reports and insert their own,
-- same permissive style as ps_insert_all/ps_select_all in
-- supabase_push_subscriptions_schema.sql.
ALTER TABLE er_load_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elr_insert_all" ON er_load_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "elr_select_all" ON er_load_reports FOR SELECT USING (true);
