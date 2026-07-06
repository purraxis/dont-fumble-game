ALTER TABLE public.answers
ADD COLUMN IF NOT EXISTS session_token text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'answers_score_range_check'
  ) THEN
    ALTER TABLE public.answers
      ADD CONSTRAINT answers_score_range_check CHECK (score >= 0 AND score <= 100) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS answers_one_per_session_question
ON public.answers (challenge_id, question_id, session_token)
WHERE session_token IS NOT NULL;

GRANT UPDATE ON public.answers TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'answers'
      AND policyname = 'anyone can update session answers'
  ) THEN
    CREATE POLICY "anyone can update session answers"
    ON public.answers
    FOR UPDATE
    USING (session_token IS NOT NULL)
    WITH CHECK (session_token IS NOT NULL);
  END IF;
END $$;
