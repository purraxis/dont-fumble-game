-- Public reads stay available where the no-login MVP needs them:
-- - question_packs and questions are still readable via their existing policies.
-- - challenges stay readable so share/play routes can look up a challenge by code.
--
-- Trusted writes now go through server functions using the service role key.

REVOKE INSERT, UPDATE, DELETE ON public.challenges FROM anon, authenticated;

DROP POLICY IF EXISTS "anyone can create challenge" ON public.challenges;
DROP POLICY IF EXISTS "challenges readable by anyone" ON public.challenges;

CREATE POLICY "challenges readable for no-login links"
ON public.challenges
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.answers FROM anon, authenticated;

DROP POLICY IF EXISTS "answers readable by anyone" ON public.answers;
DROP POLICY IF EXISTS "anyone can create answer" ON public.answers;
DROP POLICY IF EXISTS "anyone can update session answers" ON public.answers;

GRANT ALL ON public.answers TO service_role;
