-- ── push_subscriptions ──────────────────────────────────────────────────────
-- One row per browser/device push subscription. No real auth in this app —
-- session_id follows the same anonymous localStorage-generated pattern used
-- by daily_responses/daily_competition (crypto.randomUUID(), key "medic_session_id").

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint       text        NOT NULL UNIQUE,
  p256dh         text        NOT NULL,
  auth           text        NOT NULL,
  session_id     text        NOT NULL,
  medication     boolean     NOT NULL DEFAULT true,
  disease        boolean     NOT NULL DEFAULT true,
  concept        boolean     NOT NULL DEFAULT true,
  chosen_hour    integer     NOT NULL DEFAULT 8 CHECK (chosen_hour BETWEEN 0 AND 23),
  enabled        boolean     NOT NULL DEFAULT true,
  last_sent_date date,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_hour_enabled
  ON push_subscriptions (chosen_hour) WHERE enabled = true;

-- RLS: no real auth — anonymous clients manage their own subscription row
-- keyed by endpoint (unique per browser install), same permissive style as
-- dr_insert_all/dr_select_all in supabase_daily_challenge_schema.sql.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_insert_all" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "ps_select_all" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "ps_update_all" ON push_subscriptions FOR UPDATE USING (true) WITH CHECK (true);
