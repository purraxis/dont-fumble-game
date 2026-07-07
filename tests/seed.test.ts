import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const seedSql = readFileSync(resolve("supabase/seed.sql"), "utf8");

describe("MVP seed data", () => {
  it("seeds enough launch-ready packs and questions idempotently", () => {
    const packRows = seedSql.match(/^ {4}\('[^']+', '[^']+',/gm) ?? [];
    const questionRows = seedSql.match(/^ {4}\('[^']+', \d+,/gm) ?? [];

    expect(packRows).toHaveLength(10);
    expect(questionRows).toHaveLength(100);
    expect(seedSql).toContain("ON CONFLICT (slug) DO UPDATE");
    expect(seedSql).toContain("WHERE NOT EXISTS");
  });
});

describe("answer session migration", () => {
  const migrationSql = readFileSync(
    resolve("supabase/migrations/20260702000100_add_answer_session_tokens.sql"),
    "utf8",
  );

  it("adds duplicate protection and score constraints for session answers", () => {
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS session_token text");
    expect(migrationSql).toContain("ON public.answers (challenge_id, question_id, session_token)");
    expect(migrationSql).toContain("WHERE session_token IS NOT NULL");
    expect(migrationSql).toContain("score >= 0 AND score <= 100");
    expect(migrationSql).toContain("GRANT UPDATE ON public.answers");
  });
});

describe("RLS lockdown migration", () => {
  const migrationSql = readFileSync(
    resolve("supabase/migrations/20260707000100_lock_down_browser_writes.sql"),
    "utf8",
  );

  it("keeps public challenge reads but blocks browser challenge writes", () => {
    expect(migrationSql).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.challenges FROM anon, authenticated",
    );
    expect(migrationSql).toContain('DROP POLICY IF EXISTS "anyone can create challenge"');
    expect(migrationSql).toContain('CREATE POLICY "challenges readable for no-login links"');
    expect(migrationSql).toContain("FOR SELECT");
    expect(migrationSql).toContain("GRANT SELECT ON public.challenges TO anon, authenticated");
  });

  it("blocks browser answer reads and writes while preserving service role access", () => {
    expect(migrationSql).toContain(
      "REVOKE SELECT, INSERT, UPDATE, DELETE ON public.answers FROM anon, authenticated",
    );
    expect(migrationSql).toContain('DROP POLICY IF EXISTS "answers readable by anyone"');
    expect(migrationSql).toContain('DROP POLICY IF EXISTS "anyone can create answer"');
    expect(migrationSql).toContain('DROP POLICY IF EXISTS "anyone can update session answers"');
    expect(migrationSql).toContain("GRANT ALL ON public.answers TO service_role");
  });
});
