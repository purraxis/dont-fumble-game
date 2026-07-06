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
