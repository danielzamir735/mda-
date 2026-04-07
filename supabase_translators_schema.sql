-- Language Bridge: translators table
-- Run this in the Supabase SQL Editor

create table if not exists public.translators (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  full_name    text not null,
  phone_number text not null,
  languages    text[] not null default '{}',
  is_24_7      boolean not null default false,
  start_time   time,
  end_time     time,
  user_id      uuid references auth.users(id) on delete set null
);

-- Enable Row Level Security
alter table public.translators enable row level security;

-- Allow anyone (including unauthenticated) to read translators
create policy "translators_select_public"
  on public.translators
  for select
  using (true);

-- Allow anyone to insert (open registration)
create policy "translators_insert_public"
  on public.translators
  for insert
  with check (true);

-- Allow users to update/delete only their own row
create policy "translators_update_own"
  on public.translators
  for update
  using (auth.uid() = user_id);

create policy "translators_delete_own"
  on public.translators
  for delete
  using (auth.uid() = user_id);

-- Index for fast language filtering
create index if not exists translators_languages_gin
  on public.translators using gin(languages);
