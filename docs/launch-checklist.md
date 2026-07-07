# Launch Checklist

## Production-Like Supabase QA

Last local QA attempt: 2026-07-07 on `codex/mvp-stabilization`.

### Current Status

- Blocked for full production-like app-flow QA because the local runtime does not have `SUPABASE_SERVICE_ROLE_KEY` or `LOVABLE_API_KEY`.
- Blocked for local migration application because the Supabase CLI is not installed in this workspace environment.
- The configured Supabase project reachable through the publishable key does not appear to have the full MVP stabilization migration and seed chain applied yet.

### Required Environment Variables

Client-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-only:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`

Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `LOVABLE_API_KEY` with `VITE_`.

### Supabase Setup

1. Install or make available the Supabase CLI.
2. Link the project if needed:

   ```bash
   supabase link --project-ref yinfdtueximonyzlnldq
   ```

3. Apply the full migration chain:

   ```bash
   supabase db push
   ```

4. Seed curated MVP data:

   ```bash
   supabase db seed
   ```

5. Confirm seeded data:

   - `question_packs`: 10 rows
   - `questions`: 100 rows
   - `answers.session_token` exists
   - `answers` has the unique index for `challenge_id + question_id + session_token`

### RLS Checks

Using only the publishable key, verify:

- Public browser can read `question_packs`.
- Public browser can read `questions`.
- Public browser cannot directly read `challenges`.
- Public browser cannot directly insert `challenges`.
- Public browser cannot directly read `answers`.
- Public browser cannot directly insert or update `answers`.
- Server functions using `SUPABASE_SERVICE_ROLE_KEY` can still create challenges, save answers, and load results.

### Real App Flow

Run against the real Supabase project and Lovable AI gateway:

1. Landing page loads.
2. Packs page loads seeded packs.
3. Challenge creation succeeds through the server function.
4. Share page loads by challenge code through the server function.
5. Play page loads by challenge code through the server function.
6. Answer submission calls Lovable AI and persists the scored answer through the server function.
7. Result page calculates the final result server-side.
8. Result page refresh keeps the same session result.
9. Invalid challenge code shows a friendly error.
10. Incomplete result does not show a fake `0` score.

### Latest Probe Results

The latest publishable-key probe reached the configured Supabase project, but showed the production database is not yet on the full stabilization state:

- `question_packs` read: passed, but only 5 rows were present.
- `questions` read: passed, but only 21 rows were present.
- Direct `challenges` read: failed QA because it was still allowed.
- Direct `answers` read: failed QA because it was still allowed.
- Direct `challenges` insert: blocked, but by a foreign-key error rather than the final read/write lockdown proof.
- Direct `answers` insert: blocked because `answers.session_token` was missing from the schema cache, which indicates the session-token migration has not been applied.

Do not merge to `main` until the full migration chain, seed, RLS checks, and real Lovable AI app flow all pass against the production Supabase project.
