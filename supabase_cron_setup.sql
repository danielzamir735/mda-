-- ────────────────────────────────────────────────────────────────────────────
-- Step 1: Add med_v4 to the CHECK constraint (the client code uses med_v4)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE daily_questions
  DROP CONSTRAINT IF EXISTS daily_questions_question_type_check;

ALTER TABLE daily_questions
  ADD CONSTRAINT daily_questions_question_type_check
  CHECK (question_type IN ('bls', 'als', 'med_v3', 'med_v4', 'abbr', 'red_flag'));

-- ────────────────────────────────────────────────────────────────────────────
-- Step 2: Enable required extensions
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 3: Schedule automatic question generation at midnight Israel time
--
-- Israel is UTC+3 in summer (IDT) and UTC+2 in winter (IST).
-- Running at both 21:00 and 22:00 UTC covers both seasons.
-- The edge function is idempotent — if questions already exist it skips them.
--
-- BEFORE running: replace the two placeholders below with real values:
--   YOUR_PROJECT_REF  → found in Supabase Dashboard → Settings → General
--   YOUR_CRON_SECRET  → any random string; must match CRON_SECRET secret
--                       set on the edge function (see deployment instructions)
-- ────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'generate-daily-questions-21utc',   -- job name
  '0 21 * * *',                       -- 21:00 UTC = midnight Israel summer (IDT UTC+3)
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-questions',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'generate-daily-questions-22utc',   -- job name
  '0 22 * * *',                       -- 22:00 UTC = midnight Israel winter (IST UTC+2)
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-questions',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify cron jobs were created:
-- SELECT jobid, jobname, schedule, command FROM cron.job;

-- To remove a job if needed:
-- SELECT cron.unschedule('generate-daily-questions-21utc');
-- SELECT cron.unschedule('generate-daily-questions-22utc');
