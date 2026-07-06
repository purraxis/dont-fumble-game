# Don't Fumble

Mobile-first relationship challenge MVP built with TanStack Start, Vite, TypeScript, Tailwind, Supabase, and the Lovable AI gateway.

## Local Setup

Install dependencies:

```sh
npm install
```

Run the app:

```sh
npm run dev
```

## Supabase Seed Data

Fresh Supabase databases need curated question packs before the MVP loop works. The seed file creates 10 packs and 100 questions using the product spec's MVP-safe question bank.

Run migrations first, then seed:

```sh
supabase db reset
```

If your database is already migrated and you only want to apply seed data:

```sh
supabase db seed
```

Or run the seed SQL directly in the Supabase SQL editor:

```sh
supabase/seed.sql
```

The seed is idempotent:

- packs upsert by `question_packs.slug`
- questions are inserted only when the same text does not already exist in that pack

Expected seeded data:

- 10 question packs
- 100 questions

## Manual QA

Use manual QA as a supplement to the automated smoke checks:

1. Run the Supabase migration and seed.
2. Open `/create`, enter a name, and continue to `/packs`.
3. Confirm packs render with readable descriptions.
4. Create a challenge and confirm `/share/:code` loads.
5. Open `/play/:code` and confirm long questions wrap within the mobile layout.
6. Temporarily empty `question_packs` in a local database and confirm `/packs` shows a friendly empty state.
7. Break Supabase env locally and confirm `/packs` shows a friendly error state.

## Verification

Run:

```sh
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```
