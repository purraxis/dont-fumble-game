import { createServerFn } from "@tanstack/react-start";
import { customAlphabet } from "nanoid";
import { z } from "zod";

export const MIN_CHALLENGE_QUESTIONS = 2;
export const MAX_CHALLENGE_CODE_ATTEMPTS = 5;
export const CHALLENGE_CODE_LENGTH = 16;

const generateChallengeCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  CHALLENGE_CODE_LENGTH,
);

export const CreateChallengeInputSchema = z
  .object({
    packId: z.string().min(1),
    creatorName: z.string().optional(),
  })
  .strict()
  .transform((input) => ({
    packId: input.packId.trim(),
    creatorName: input.creatorName?.trim() || "Someone",
  }))
  .superRefine((input, ctx) => {
    if (!input.packId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packId"],
        message: "Choose a question pack first.",
      });
    }
    if (input.creatorName.length > 40) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creatorName"],
        message: "Keep the name under 40 characters.",
      });
    }
  });

type CreateChallengeInput = z.infer<typeof CreateChallengeInputSchema>;

export type CreatedChallenge = {
  code: string;
  shareUrl: string;
};

type ChallengeDeps = {
  findPack: (packId: string) => Promise<{ id: string } | null>;
  countQuestions: (packId: string) => Promise<number>;
  insertChallenge: (challenge: {
    code: string;
    sender_name: string;
    pack_id: string;
  }) => Promise<void>;
  generateCode?: () => string;
};

export function normalizeCreateChallengeInput(input: unknown): CreateChallengeInput {
  return CreateChallengeInputSchema.parse(input);
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function createChallengeWithDeps(
  input: CreateChallengeInput,
  deps: ChallengeDeps,
): Promise<CreatedChallenge> {
  const pack = await deps.findPack(input.packId);
  if (!pack) throw new Error("Question pack not found");

  const questionCount = await deps.countQuestions(input.packId);
  if (questionCount < MIN_CHALLENGE_QUESTIONS) {
    throw new Error("This pack does not have enough questions yet.");
  }

  const codeGenerator = deps.generateCode ?? generateChallengeCode;
  for (let attempt = 0; attempt < MAX_CHALLENGE_CODE_ATTEMPTS; attempt += 1) {
    const code = codeGenerator();
    try {
      await deps.insertChallenge({
        code,
        sender_name: input.creatorName,
        pack_id: input.packId,
      });
      return {
        code,
        shareUrl: `/share/${code}`,
      };
    } catch (error) {
      if (isUniqueViolation(error) && attempt + 1 < MAX_CHALLENGE_CODE_ATTEMPTS) continue;
      throw error;
    }
  }

  throw new Error("Could not create a unique challenge code. Try again.");
}

async function createE2eChallenge(input: CreateChallengeInput) {
  return createChallengeWithDeps(input, {
    async findPack(packId) {
      return packId === "pack-worm" ? { id: packId } : null;
    },
    async countQuestions() {
      return 2;
    },
    async insertChallenge() {
      return;
    },
  });
}

async function createRealChallenge(input: CreateChallengeInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  return createChallengeWithDeps(input, {
    async findPack(packId) {
      const { data, error } = await supabaseAdmin
        .from("question_packs")
        .select("id")
        .eq("id", packId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async countQuestions(packId) {
      const { count, error } = await supabaseAdmin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("pack_id", packId);
      if (error) throw error;
      return count ?? 0;
    },
    async insertChallenge(challenge) {
      const { error } = await supabaseAdmin.from("challenges").insert(challenge);
      if (error) throw error;
    },
  });
}

export const createChallenge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => normalizeCreateChallengeInput(input))
  .handler(async ({ data }): Promise<CreatedChallenge> => {
    if (process.env.E2E_FAKE_AI === "true") return createE2eChallenge(data);
    return createRealChallenge(data);
  });
