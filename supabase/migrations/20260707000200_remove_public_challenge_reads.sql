-- Challenge share/play lookups now run through TanStack Start server functions.
-- Public browser clients no longer need direct access to challenge rows.

REVOKE SELECT ON public.challenges FROM anon, authenticated;

DROP POLICY IF EXISTS "challenges readable for no-login links" ON public.challenges;

GRANT ALL ON public.challenges TO service_role;
