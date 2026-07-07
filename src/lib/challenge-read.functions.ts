import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getE2eServerChallenge } from "@/lib/e2e-server-state";

export const LoadChallengeInputSchema = z
  .object({
    challengeCode: z.string().min(1),
  })
  .strict()
  .transform((input) => ({
    challengeCode: input.challengeCode.trim().toUpperCase(),
  }))
  .superRefine((input, ctx) => {
    if (!input.challengeCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["challengeCode"],
        message: "Missing challenge code.",
      });
    }
  });

type LoadChallengeInput = z.infer<typeof LoadChallengeInputSchema>;

export type ShareChallenge = {
  code: string;
  senderName: string;
  packName: string;
  packEmoji: string;
};

export type PlayChallenge = ShareChallenge & {
  questions: Array<{ id: string; text: string }>;
};

type ChallengeRow = {
  id: string;
  code: string;
  sender_name: string;
  pack_id: string;
  question_packs?: { name?: string | null; emoji?: string | null } | null;
};

const e2ePack = {
  id: "pack-worm",
  name: "Worm Test",
  emoji: "🪱",
};

const e2eQuestions = [
  {
    id: "question-worm",
    text: "Would you still love me if I was a worm?",
  },
  {
    id: "question-dance",
    text: "Would you still text me back if I lost the ability to text and could only communicate in interpretive dance?",
  },
];

export function normalizeLoadChallengeInput(input: unknown): LoadChallengeInput {
  return LoadChallengeInputSchema.parse(input);
}

function packFromChallenge(challenge: ChallengeRow) {
  return {
    name: challenge.question_packs?.name ?? "Don't Fumble",
    emoji: challenge.question_packs?.emoji ?? "",
  };
}

async function loadE2eChallenge(input: LoadChallengeInput): Promise<PlayChallenge> {
  const challenge = getE2eServerChallenge(input.challengeCode);
  if (!challenge || challenge.packId !== e2ePack.id) throw new Error("Challenge not found");

  return {
    code: challenge.code,
    senderName: challenge.senderName,
    packName: e2ePack.name,
    packEmoji: e2ePack.emoji,
    questions: e2eQuestions,
  };
}

async function loadRealChallenge(input: LoadChallengeInput): Promise<PlayChallenge> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: challenge, error: challengeError } = await supabaseAdmin
    .from("challenges")
    .select("id, code, sender_name, pack_id, question_packs(name, emoji)")
    .eq("code", input.challengeCode)
    .maybeSingle();
  if (challengeError) throw challengeError;
  if (!challenge) throw new Error("Challenge not found");

  const { data: questions, error: questionsError } = await supabaseAdmin
    .from("questions")
    .select("id, text")
    .eq("pack_id", challenge.pack_id)
    .order("sort_order");
  if (questionsError) throw questionsError;

  const pack = packFromChallenge(challenge as ChallengeRow);
  return {
    code: challenge.code,
    senderName: challenge.sender_name,
    packName: pack.name,
    packEmoji: pack.emoji,
    questions: questions ?? [],
  };
}

export const loadShareChallenge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => normalizeLoadChallengeInput(input))
  .handler(async ({ data }): Promise<ShareChallenge> => {
    const challenge =
      process.env.E2E_FAKE_AI === "true"
        ? await loadE2eChallenge(data)
        : await loadRealChallenge(data);

    return {
      code: challenge.code,
      senderName: challenge.senderName,
      packName: challenge.packName,
      packEmoji: challenge.packEmoji,
    };
  });

export const loadPlayChallenge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => normalizeLoadChallengeInput(input))
  .handler(async ({ data }): Promise<PlayChallenge> => {
    if (process.env.E2E_FAKE_AI === "true") return loadE2eChallenge(data);
    return loadRealChallenge(data);
  });
