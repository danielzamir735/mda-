-- Migration: replace 'abbr' with 'improvised' question type
-- Run this once in the Supabase SQL Editor.
--
-- Previous types: bls, als, med_v3, med_v4, abbr, red_flag, spot_error, med_bag
-- New types: bls, als, med_v3, med_v4, improvised, red_flag, spot_error, med_bag

-- Step 1: drop existing CHECK constraints
ALTER TABLE daily_questions
  DROP CONSTRAINT IF EXISTS daily_questions_question_type_check;

ALTER TABLE daily_responses
  DROP CONSTRAINT IF EXISTS daily_responses_question_type_check;

-- Step 2: add expanded CHECK constraint on daily_questions (includes improvised, keeps abbr for backward compat)
ALTER TABLE daily_questions
  ADD CONSTRAINT daily_questions_question_type_check
  CHECK (question_type IN ('bls', 'als', 'med_v3', 'med_v4', 'abbr', 'improvised', 'red_flag', 'spot_error', 'med_bag'));

-- Step 3: add expanded CHECK constraint on daily_responses (includes improvised, keeps abbr for backward compat)
ALTER TABLE daily_responses
  ADD CONSTRAINT daily_responses_question_type_check
  CHECK (question_type IN ('bls', 'als', 'med_v3', 'med_v4', 'abbr', 'improvised', 'red_flag', 'spot_error', 'med_bag'));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid IN ('daily_questions'::regclass, 'daily_responses'::regclass)
AND    contype  = 'c';
