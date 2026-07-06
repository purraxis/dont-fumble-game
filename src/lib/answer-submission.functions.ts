import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { recordE2eServerAnswer } from "@/lib/e2e-server-state";
import { FeedbackSchema, generateFeedbackForAnswer, type Feedback } from "@/lib/feedback.functions";
import { isValidPlaySessionToken } from "@/lib/play-session";

export const MAX_ANSWER_LENGTH = 1000;

export const SubmitAnswerInputSchema = z
  .object({
    challengeCode: z.string().min(1),
    questionId: z.string().min(1),
    answerText: z.string(),
    sessionToken: z.string(),
  })
  .strict()
  .transform((input) => ({
    challengeCode: input.challengeCode.trim().toUpperCase(),
    questionId: input.questionId.trim(),
    answerText: input.answerText.trim(),
    sessionToken: input.sessionToken.trim(),
  }))
  .superRefine((input, ctx) => {
    if (!input.challengeCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["challengeCode"],
        message: "Missing challenge code",
      });
    }
    if (!input.questionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionId"],
        message: "Missing question",
      });
    }
    if (!input.answerText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answerText"],
        message: "Type an answer first.",
      });
    }
    if (input.answerText.length > MAX_ANSWER_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answerText"],
        message: `Keep answers under ${MAX_ANSWER_LENGTH} characters.`,
      });
    }
    if (!isValidPlaySessionToken(input.sessionToken)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessionToken"],
        message: "Missing or invalid play session.",
      });
    }
  });

type SubmitAnswerInput = z.infer<typeof SubmitAnswerInputSchema>;

type ChallengeRow = {
  id: string;
  code: string;
  pack_id: string;
  question_packs?: { name?: string | null } | { name?: string | null }[] | null;
};

type QuestionRow = {
  id: string;
  text: string;
  pack_id: string;
};

type AnswerPayload = {
  challenge_id: string;
  question_id: string;
  session_token: string;
  question_text: string;
  answer_text: string;
  score: number;
  verdict: string;
  what_worked: string;
  what_fumbled: string;
  better_answer: string;
};

const e2eQuestions = new Map([
  ["question-worm", "Would you still love me if I was a worm?"],
  [
    "question-dance",
    "Would you still text me back if I lost the ability to text and could only communicate in interpretive dance?",
  ],
]);

function packNameFromChallenge(challenge: ChallengeRow) {
  const pack = Array.isArray(challenge.question_packs)
    ? challenge.question_packs[0]
    : challenge.question_packs;
  return pack?.name ?? "Don't Fumble";
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export function normalizeSubmitAnswerInput(input: unknown): SubmitAnswerInput {
  return SubmitAnswerInputSchema.parse(input);
}

export function validateAiFeedback(input: unknown): Feedback {
  return FeedbackSchema.parse(input);
}

async function saveAnswer(payload: AnswerPayload) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("answers")
    .update(payload)
    .eq("challenge_id", payload.challenge_id)
    .eq("question_id", payload.question_id)
    .eq("session_token", payload.session_token)
    .select("id");
  if (updateError) throw updateError;
  if (updated?.length) return;

  const { error: insertError } = await supabaseAdmin.from("answers").insert(payload);
  if (!insertError) return;
  if (!isUniqueViolation(insertError)) throw insertError;

  const { error: retryError } = await supabaseAdmin
    .from("answers")
    .update(payload)
    .eq("challenge_id", payload.challenge_id)
    .eq("question_id", payload.question_id)
    .eq("session_token", payload.session_token);
  if (retryError) throw retryError;
}

async function submitE2eAnswer(input: SubmitAnswerInput): Promise<Feedback> {
  const question = e2eQuestions.get(input.questionId);
  if (!question) throw new Error("Question not found");

  const feedback = await generateFeedbackForAnswer({
    question,
    answer: input.answerText,
    packName: "Worm Test",
  });

  recordE2eServerAnswer({
    challengeCode: input.challengeCode,
    questionId: input.questionId,
    sessionToken: input.sessionToken,
    questionText: question,
    answerText: input.answerText,
    feedback,
  });

  return feedback;
}

async function submitRealAnswer(input: SubmitAnswerInput): Promise<Feedback> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: challenge, error: challengeError } = await supabaseAdmin
    .from("challenges")
    .select("id, code, pack_id, question_packs(name)")
    .eq("code", input.challengeCode)
    .maybeSingle();
  if (challengeError) throw challengeError;
  if (!challenge) throw new Error("Challenge not found");

  const { data: question, error: questionError } = await supabaseAdmin
    .from("questions")
    .select("id, text, pack_id")
    .eq("id", input.questionId)
    .maybeSingle();
  if (questionError) throw questionError;
  if (!question) throw new Error("Question not found");
  if (question.pack_id !== challenge.pack_id) {
    throw new Error("Question is not part of this challenge");
  }

  const feedback = validateAiFeedback(
    await generateFeedbackForAnswer({
      question: question.text,
      answer: input.answerText,
      packName: packNameFromChallenge(challenge as ChallengeRow),
    }),
  );

  await saveAnswer({
    challenge_id: challenge.id,
    question_id: question.id,
    session_token: input.sessionToken,
    question_text: question.text,
    answer_text: input.answerText,
    score: feedback.score,
    verdict: feedback.verdict,
    what_worked: feedback.what_worked,
    what_fumbled: feedback.what_fumbled,
    better_answer: feedback.better_answer,
  });

  return feedback;
}

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => normalizeSubmitAnswerInput(input))
  .handler(async ({ data }): Promise<Feedback> => {
    if (process.env.E2E_FAKE_AI === "true") return submitE2eAnswer(data);
    return submitRealAnswer(data);
  });
