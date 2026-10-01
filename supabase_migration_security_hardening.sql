-- Security hardening: close anonymous writes on translators and daily_questions.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run).
-- Safe to re-run.

-- ── 1. daily_questions: only the generate-daily-questions edge function writes ──
-- The edge function uses the service role key, which bypasses RLS, so no INSERT
-- policy is needed. Without this, anyone could pre-insert tomorrow's question.

DROP POLICY IF EXISTS "dq_insert_all" ON daily_questions;

-- ── 2. translators: edit/delete only with the secret token issued at registration ──

-- Token hashes live in their own table with RLS on and no policies, so they are
-- never readable through the API — only the security-definer functions below use them.
create table if not exists public.translator_edit_tokens (
  translator_id uuid primary key references public.translators(id) on delete cascade,
  token_hash    text not null
);

alter table public.translator_edit_tokens enable row level security;
revoke all on public.translator_edit_tokens from anon, authenticated;

create or replace function public.register_translator(
  p_full_name              text,
  p_phone_number           text,
  p_languages              text[],
  p_availability           jsonb,
  p_is_24_7                boolean,
  p_start_time             time,
  p_end_time               time,
  p_time_slots             jsonb,
  p_emergency_only_contact boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if length(btrim(coalesce(p_full_name, ''))) not between 1 and 80
     or length(btrim(coalesce(p_phone_number, ''))) not between 9 and 20
     or coalesce(array_length(p_languages, 1), 0) not between 1 and 50 then
    raise exception 'invalid translator details';
  end if;

  insert into translators (
    full_name, phone_number, languages, availability,
    is_24_7, start_time, end_time, time_slots, emergency_only_contact
  ) values (
    btrim(p_full_name), btrim(p_phone_number), p_languages, p_availability,
    coalesce(p_is_24_7, false), p_start_time, p_end_time,
    coalesce(p_time_slots, '[]'::jsonb), coalesce(p_emergency_only_contact, false)
  )
  returning id into v_id;

  insert into translator_edit_tokens (translator_id, token_hash)
  values (v_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'));

  -- The token is returned exactly once; only its hash is stored.
  return jsonb_build_object('id', v_id, 'edit_token', v_token);
end;
$$;

create or replace function public.update_translator(
  p_id                     uuid,
  p_edit_token             text,
  p_full_name              text,
  p_languages              text[],
  p_availability           jsonb,
  p_is_24_7                boolean,
  p_start_time             time,
  p_end_time               time,
  p_time_slots             jsonb,
  p_emergency_only_contact boolean
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(btrim(coalesce(p_full_name, ''))) not between 1 and 80
     or coalesce(array_length(p_languages, 1), 0) not between 1 and 50 then
    raise exception 'invalid translator details';
  end if;

  update translators t set
    full_name              = btrim(p_full_name),
    languages              = p_languages,
    availability           = p_availability,
    is_24_7                = coalesce(p_is_24_7, false),
    start_time             = p_start_time,
    end_time               = p_end_time,
    time_slots             = coalesce(p_time_slots, '[]'::jsonb),
    emergency_only_contact = coalesce(p_emergency_only_contact, false)
  where t.id = p_id
    and exists (
      select 1 from translator_edit_tokens k
      where k.translator_id = t.id
        and k.token_hash = encode(sha256(convert_to(coalesce(p_edit_token, ''), 'UTF8')), 'hex')
    );
  return found;
end;
$$;

create or replace function public.delete_translator(
  p_id         uuid,
  p_edit_token text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from translators t
  where t.id = p_id
    and exists (
      select 1 from translator_edit_tokens k
      where k.translator_id = t.id
        and k.token_hash = encode(sha256(convert_to(coalesce(p_edit_token, ''), 'UTF8')), 'hex')
    );
  return found;
end;
$$;

grant execute on function public.register_translator(text, text, text[], jsonb, boolean, time, time, jsonb, boolean) to anon, authenticated;
grant execute on function public.update_translator(uuid, text, text, text[], jsonb, boolean, time, time, jsonb, boolean) to anon, authenticated;
grant execute on function public.delete_translator(uuid, text) to anon, authenticated;

-- With the functions in place, nobody updates the table directly any more.
drop policy if exists "translators_update_public" on public.translators;

-- Note: rows registered before this migration have no edit token, so they can no
-- longer be edited or removed from the app — manage them from the Supabase dashboard.
