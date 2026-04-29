-- Translation Assistance (סיוע בתרגום): translators table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run)

create table if not exists public.translators (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  full_name    text not null,
  phone_number text not null unique,          -- unique: enables upsert by phone
  languages    text[] not null default '{}',
  is_24_7                boolean not null default false,
  start_time             time,
  end_time               time,
  time_slots             jsonb not null default '[]'::jsonb,
  emergency_only_contact boolean not null default false,
  availability           jsonb,              -- { type: '24_7'|'no_saturday'|'custom', schedule: [{day,start,end}] }
  user_id                uuid references auth.users(id) on delete set null
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

-- Allow anyone to update (needed for upsert on phone_number conflict)
create policy "translators_update_public"
  on public.translators
  for update
  using (true)
  with check (true);

-- Allow users to delete only their own row
create policy "translators_delete_own"
  on public.translators
  for delete
  using (auth.uid() = user_id);

-- GIN index for fast language array filtering
create index if not exists translators_languages_gin
  on public.translators using gin(languages);

-- Migration: run this if the table already exists (adds new columns)
alter table public.translators
  add column if not exists time_slots             jsonb not null default '[]'::jsonb,
  add column if not exists emergency_only_contact boolean not null default false,
  add column if not exists availability           jsonb;
