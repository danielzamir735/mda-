-- Migration: add spot_error and med_bag question types
-- Run this once in the Supabase SQL Editor.
--
-- The previous migration only added: bls, als, med_v3, abbr, red_flag
-- spot_error and radio_challenge were never added (causing 400 errors).
-- We now add spot_error + med_bag (replaces radio_challenge).

-- Step 1: drop the old CHECK constraint
ALTER TABLE daily_questions
  DROP CONSTRAINT IF EXISTS daily_questions_question_type_check;

-- Also drop on daily_responses if it has one
ALTER TABLE daily_responses
  DROP CONSTRAINT IF EXISTS daily_responses_question_type_check;

-- Step 2: add expanded CHECK constraint on daily_questions
ALTER TABLE daily_questions
  ADD CONSTRAINT daily_questions_question_type_check
  CHECK (question_type IN ('bls', 'als', 'med_v3', 'med_v4', 'abbr', 'red_flag', 'spot_error', 'med_bag'));

-- Step 3: add expanded CHECK constraint on daily_responses
ALTER TABLE daily_responses
  ADD CONSTRAINT daily_responses_question_type_check
  CHECK (question_type IN ('bls', 'als', 'med_v3', 'med_v4', 'abbr', 'red_flag', 'spot_error', 'med_bag'));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid IN ('daily_questions'::regclass, 'daily_responses'::regclass)
AND    contype  = 'c';
