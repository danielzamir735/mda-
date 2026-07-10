-- ────────────────────────────────────────────────────────────────────────────
-- Schedule send-daily-push to run once per hour, every hour.
--
-- Unlike the midnight generate-daily-questions jobs (which each run once a
-- day, at a fixed UTC time approximating Israel midnight), this job must run
-- EVERY hour — the edge function itself computes the current Israel-local
-- hour (Asia/Jerusalem, DST-aware) and only sends to subscriptions whose
-- chosen_hour matches, so every user gets their push in the hour they picked.
--
-- BEFORE running: replace the two placeholders below with real values:
--   YOUR_PROJECT_REF  → found in Supabase Dashboard → Settings → General
--   YOUR_CRON_SECRET  → any random string; must match CRON_SECRET secret
--                       set on the edge function (see deployment instructions)
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-daily-push-hourly',   -- job name
  '0 * * * *',                -- every hour, on the hour
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify the cron job was created:
-- SELECT jobid, jobname, schedule, command FROM cron.job;

-- To remove the job if needed:
-- SELECT cron.unschedule('send-daily-push-hourly');
