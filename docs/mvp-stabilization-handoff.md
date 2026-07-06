# MVP Stabilization Handoff

## Done

- Added idempotent Supabase seed data for 10 question packs and 100 MVP-safe questions.
- Added minimal Vitest and Playwright coverage for the launch-critical product loop.
- Added no-login play session tokens stored per challenge in browser localStorage.
- Added `answers.session_token` migration support and duplicate protection for one answer per challenge/question/session.
- Moved answer scoring and answer persistence behind the `submitAnswer` server function.
- Moved result aggregation behind the `loadResult` server function.
- Kept Lovable AI as the scoring gateway and preserved E2E fake AI/Supabase support.
- Updated `/packs` to handle empty data and Supabase query errors gracefully.

## Not Done

- RLS lockdown is still pending.
- Server-side challenge creation is still pending.
- No auth, users, couples, streaks, reports, payments, leaderboard, voice notes, or native app features were added.
- The app remains TanStack Start/Vite and was not migrated to Next.js.

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

1. Apply migrations, including `supabase/migrations/20260702000100_add_answer_session_tokens.sql`.
2. Seed the database with `supabase/seed.sql`.
3. Confirm the seed creates 10 packs and 100 questions.
4. Add `SUPABASE_SERVICE_ROLE_KEY` to the server runtime environment before testing real answer submission.

## Next Task

Move challenge creation server-side, then lock down RLS once all launch-critical writes use trusted server functions.
