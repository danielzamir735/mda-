-- ────────────────────────────────────────────────────────────────────────────
-- Schedule send-daily-push to run every minute.
--
-- Users pick an exact hour AND minute, so the job must run EVERY minute —
-- the edge function itself computes the current Israel-local time (Asia/Jerusalem,
-- DST-aware) and sends to every subscription whose chosen time-of-day has already
-- arrived today and that hasn't been sent yet today (guarded by last_sent_date,
-- so it's one push per day). This is self-healing: if a given minute's tick is
-- delayed, dropped, or the http_post lands a second late, the next minute's run
-- still delivers — the user is not silently skipped for the whole day.
--
-- BEFORE running: replace the two placeholders below with real values:
--   YOUR_PROJECT_REF  → found in Supabase Dashboard → Settings → General
--   YOUR_CRON_SECRET  → any random string; must match CRON_SECRET secret
--                       set on the edge function (see deployment instructions)
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-daily-push-minutely',   -- job name
  '* * * * *',                  -- every minute
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
-- SELECT cron.unschedule('send-daily-push-minutely');
-- If upgrading from the old hourly job, also unschedule it:
-- SELECT cron.unschedule('send-daily-push-hourly');
