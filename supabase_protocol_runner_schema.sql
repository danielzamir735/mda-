-- טבלת הדירוג של המשחק "שעת הזהב" (protocol-runner).
-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run.
-- כל שחקן יכול לקרוא את הטבלה ולהוסיף שורה, אבל לא לשנות או למחוק.

create table if not exists public.protocol_runner_scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 24),
  city text not null default '' check (char_length(city) <= 24),
  level smallint not null check (level between 0 and 2),
  mode text not null check (char_length(mode) between 1 and 12),
  day date not null,
  decisions smallint not null check (decisions between 1 and 60),
  accuracy smallint not null check (accuracy between 0 and 100),
  pace real not null check (pace between 0.3 and 120),
  score integer not null check (score between 0 and 100000)
);

alter table public.protocol_runner_scores enable row level security;

drop policy if exists "protocol_runner_scores read" on public.protocol_runner_scores;
create policy "protocol_runner_scores read" on public.protocol_runner_scores
  for select to anon, authenticated using (true);

drop policy if exists "protocol_runner_scores insert" on public.protocol_runner_scores;
create policy "protocol_runner_scores insert" on public.protocol_runner_scores
  for insert to anon, authenticated with check (true);

grant select, insert on public.protocol_runner_scores to anon, authenticated;

create index if not exists protocol_runner_scores_rank
  on public.protocol_runner_scores (level, mode, day, accuracy desc, pace);
