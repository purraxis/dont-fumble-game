import { describe, expect, it } from "vitest";
import {
  CHALLENGE_CODE_LENGTH,
  createChallengeWithDeps,
  MIN_CHALLENGE_QUESTIONS,
  normalizeCreateChallengeInput,
} from "../src/lib/challenge.functions";

const validInput = normalizeCreateChallengeInput({
  packId: "pack-worm",
  creatorName: " Bae ",
});

describe("server-side challenge creation", () => {
  it("creates a challenge for a valid pack", async () => {
    const inserted: Array<{ code: string; sender_name: string; pack_id: string }> = [];

    const challenge = await createChallengeWithDeps(validInput, {
      async findPack(packId) {
        return { id: packId };
      },
      async countQuestions() {
        return MIN_CHALLENGE_QUESTIONS;
      },
      async insertChallenge(row) {
        inserted.push(row);
      },
      generateCode: () => "ABCDEFGH23456789",
    });

    expect(challenge).toEqual({
      code: "ABCDEFGH23456789",
      shareUrl: "/share/ABCDEFGH23456789",
    });
    expect(challenge.code).toHaveLength(CHALLENGE_CODE_LENGTH);
    expect(inserted).toEqual([
      {
        code: "ABCDEFGH23456789",
        sender_name: "Bae",
        pack_id: "pack-worm",
      },
    ]);
  });

  it("rejects an invalid pack", async () => {
    await expect(
      createChallengeWithDeps(validInput, {
        async findPack() {
          return null;
        },
        async countQuestions() {
          return MIN_CHALLENGE_QUESTIONS;
        },
        async insertChallenge() {
          throw new Error("Should not insert");
        },
      }),
    ).rejects.toThrow("Question pack not found");
  });

  it("rejects packs without enough questions", async () => {
    await expect(
      createChallengeWithDeps(validInput, {
        async findPack(packId) {
          return { id: packId };
        },
        async countQuestions() {
          return MIN_CHALLENGE_QUESTIONS - 1;
        },
        async insertChallenge() {
          throw new Error("Should not insert");
        },
      }),
    ).rejects.toThrow("does not have enough questions");
  });

  it("retries on code collision", async () => {
    const attemptedCodes: string[] = [];
    const codes = ["COLLISIONCODE123", "ABCDEFGH23456789"];

    const challenge = await createChallengeWithDeps(validInput, {
      async findPack(packId) {
        return { id: packId };
      },
      async countQuestions() {
        return MIN_CHALLENGE_QUESTIONS;
      },
      async insertChallenge(row) {
        attemptedCodes.push(row.code);
        if (row.code === "COLLISIONCODE123") throw { code: "23505" };
      },
      generateCode: () => codes.shift() ?? "ABCDEFGH23456789",
    });

    expect(attemptedCodes).toEqual(["COLLISIONCODE123", "ABCDEFGH23456789"]);
    expect(challenge.code).toBe("ABCDEFGH23456789");
  });

  it("rejects fake client fields", () => {
    expect(() =>
      normalizeCreateChallengeInput({
        packId: "pack-worm",
        creatorName: "Bae",
        code: "PICKME",
        sender_name: "Hacker",
        pack_id: "other-pack",
      }),
    ).toThrow();
  });
});
