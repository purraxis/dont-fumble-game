# MVP Stabilization Handoff

## Done

- Added idempotent Supabase seed data for 10 question packs and 100 MVP-safe questions.
- Added minimal Vitest and Playwright coverage for the launch-critical product loop.
- Added no-login play session tokens stored per challenge in browser localStorage.
- Added `answers.session_token` migration support and duplicate protection for one answer per challenge/question/session.
- Moved answer scoring and answer persistence behind the `submitAnswer` server function.
- Moved result aggregation behind the `loadResult` server function.
- Moved challenge creation behind the `createChallenge` server function.
- Moved share/play challenge lookups behind server functions.
- Added TanStack Start CSRF middleware for server function requests.
- Locked down browser writes to `challenges` and `answers` with a follow-up RLS migration.
- Removed public browser reads from `challenges` after moving share/play reads server-side.
- Kept Lovable AI as the scoring gateway and preserved E2E fake AI/Supabase support.
- Updated `/packs` to handle empty data and Supabase query errors gracefully.

## Not Done

- No auth, users, couples, streaks, reports, payments, leaderboard, voice notes, or native app features were added.
- The app remains TanStack Start/Vite and was not migrated to Next.js.

## RLS Access Model

Allowed to public browser clients:

- Read `question_packs`
- Read `questions`

Blocked from public browser clients:

- Select/insert/update/delete `challenges`
- Select/insert/update/delete `answers`
- Any direct browser write of scores or result data

Share/play challenge lookups use server functions with the service role key and return only the fields needed by the UI. Public clients still read packs/questions for discovery, but challenge rows and answer rows are no longer directly exposed to anonymous browser clients.

## Required Env Vars

Client-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-only:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`

Do not prefix `SUPABASE_SERVICE_ROLE_KEY` with `VITE_`; it must stay server-only.

## Manual Supabase Steps

1. Apply migrations, including `supabase/migrations/20260702000100_add_answer_session_tokens.sql`, `supabase/migrations/20260707000100_lock_down_browser_writes.sql`, and `supabase/migrations/20260707000200_remove_public_challenge_reads.sql`.
2. Seed the database with `supabase/seed.sql`.
3. Confirm the seed creates 10 packs and 100 questions.
4. Add `SUPABASE_SERVICE_ROLE_KEY` to the server runtime environment before testing real challenge creation, answer submission, and result aggregation.

## Next Task

Run production-like Supabase QA with the full migration chain, seeded data, real env vars, and the Lovable AI gateway before merging the stabilization branch.
