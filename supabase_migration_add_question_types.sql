-- Migration: expand daily_questions to support all 5 question types
-- Run this once in the Supabase SQL Editor.
--
-- The original schema only allowed ('bls', 'als').
-- Med / abbreviation / red-flag INSERTs were silently rejected, so every
-- user generated their own local question instead of sharing one.

-- Step 1: drop the old CHECK constraint
ALTER TABLE daily_questions
  DROP CONSTRAINT IF EXISTS daily_questions_question_type_check;

-- Step 2: add the expanded CHECK constraint
ALTER TABLE daily_questions
  ADD CONSTRAINT daily_questions_question_type_check
  CHECK (question_type IN ('bls', 'als', 'med_v3', 'abbr', 'red_flag'));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid = 'daily_questions'::regclass
AND    contype  = 'c';
