import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getE2eServerAnswers } from "@/lib/e2e-server-state";
import { isValidPlaySessionToken } from "@/lib/play-session";

export const LoadResultInputSchema = z
  .object({
    challengeCode: z.string().min(1),
    sessionToken: z.string(),
  })
  .strict()
  .transform((input) => ({
    challengeCode: input.challengeCode.trim().toUpperCase(),
    sessionToken: input.sessionToken.trim(),
  }))
  .superRefine((input, ctx) => {
    if (!input.challengeCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["challengeCode"],
        message: "Missing challenge code.",
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

type LoadResultInput = z.infer<typeof LoadResultInputSchema>;

export type ResultChallenge = {
  id: string;
  senderName: string;
  packName: string;
  packEmoji: string;
};

export type ResultQuestion = {
  id: string;
  text: string;
};

export type ResultAnswerRow = {
  question_id: string;
  session_token?: string | null;
  score: number;
  verdict: string;
  answer_text: string;
  what_fumbled: string;
  created_at?: string | null;
};

export type ResultReceipt = {
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  verdict: string;
  whatFumbled: string;
};

export type CompleteResult = {
  status: "complete";
  challenge: ResultChallenge;
  expectedCount: number;
  answeredCount: number;
  finalScore: number;
  label: string;
  answers: ResultReceipt[];
};

export type IncompleteResult = {
  status: "incomplete";
  challenge: ResultChallenge;
  expectedCount: number;
  answeredCount: number;
  missingCount: number;
  answers: ResultReceipt[];
};

export type SessionResult = CompleteResult | IncompleteResult;

type ChallengeRow = {
  id: string;
  sender_name: string;
  pack_id: string;
  question_packs?: { name?: string | null; emoji?: string | null } | null;
};

export function normalizeLoadResultInput(input: unknown): LoadResultInput {
  return LoadResultInputSchema.parse(input);
}

export function resultLabelForScore(score: number) {
  if (score >= 90) return "Certified Green Flag";
  if (score >= 80) return "Emotionally Trainable";
  if (score >= 70) return "Survived, Barely";
  if (score >= 60) return "Fumble Risk";
  if (score >= 40) return "Needs Bootcamp";
  return "Do Not Send Yet";
}

function assertValidStoredScore(score: number) {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("Invalid saved answer score");
  }
}

function packFromChallenge(challenge: ChallengeRow) {
  return {
    name: challenge.question_packs?.name ?? "Don't Fumble",
    emoji: challenge.question_packs?.emoji ?? "",
  };
}

export function buildSessionResult({
  challenge,
  expectedQuestions,
  answers,
  sessionToken,
}: {
  challenge: ResultChallenge;
  expectedQuestions: ResultQuestion[];
  answers: ResultAnswerRow[];
  sessionToken: string;
}): SessionResult {
  const answersByQuestion = new Map<string, ResultAnswerRow>();

  for (const answer of answers) {
    if (answer.session_token != null && answer.session_token !== sessionToken) continue;
    if (!expectedQuestions.some((question) => question.id === answer.question_id)) continue;
    if (answersByQuestion.has(answer.question_id)) continue;
    assertValidStoredScore(answer.score);
    answersByQuestion.set(answer.question_id, answer);
  }

  const receipts = expectedQuestions.flatMap((question) => {
    const answer = answersByQuestion.get(question.id);
    if (!answer) return [];
    return [
      {
        questionId: question.id,
        questionText: question.text,
        answerText: answer.answer_text,
        score: answer.score,
        verdict: answer.verdict,
        whatFumbled: answer.what_fumbled,
      },
    ];
  });

  const expectedCount = expectedQuestions.length;
  const answeredCount = receipts.length;

  if (expectedCount === 0 || answeredCount < expectedCount) {
    return {
      status: "incomplete",
      challenge,
      expectedCount,
      answeredCount,
      missingCount: Math.max(expectedCount - answeredCount, 0),
      answers: receipts,
    };
  }

  const finalScore = Math.round(
    receipts.reduce((total, answer) => total + answer.score, 0) / expectedCount,
  );

  return {
    status: "complete",
    challenge,
    expectedCount,
    answeredCount,
    finalScore,
    label: resultLabelForScore(finalScore),
    answers: receipts,
  };
}

async function loadE2eResult(input: LoadResultInput): Promise<SessionResult> {
  const expectedQuestions = [
    { id: "question-worm", text: "Would you still love me if I was a worm?" },
    {
      id: "question-dance",
      text: "Would you still text me back if I lost the ability to text and could only communicate in interpretive dance?",
    },
  ];
  const answers = getE2eServerAnswers(input.challengeCode, input.sessionToken).map((answer) => ({
    question_id: answer.questionId,
    session_token: answer.sessionToken,
    score: answer.feedback.score,
    verdict: answer.feedback.verdict,
    answer_text: answer.answerText,
    what_fumbled: answer.feedback.what_fumbled,
  }));

  if (!answers.length) throw new Error("Challenge not found");

  return buildSessionResult({
    challenge: {
      id: "challenge-1",
      senderName: "Bae",
      packName: "Worm Test",
      packEmoji: "🪱",
    },
    expectedQuestions,
    answers,
    sessionToken: input.sessionToken,
  });
}

async function loadRealResult(input: LoadResultInput): Promise<SessionResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: challenge, error: challengeError } = await supabaseAdmin
    .from("challenges")
    .select("id, sender_name, pack_id, question_packs(name, emoji)")
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

  const { data: answers, error: answersError } = await supabaseAdmin
    .from("answers")
    .select("question_id, session_token, score, verdict, answer_text, what_fumbled, created_at")
    .eq("challenge_id", challenge.id)
    .eq("session_token", input.sessionToken)
    .order("created_at");
  if (answersError) throw answersError;

  const pack = packFromChallenge(challenge as ChallengeRow);
  return buildSessionResult({
    challenge: {
      id: challenge.id,
      senderName: challenge.sender_name,
      packName: pack.name,
      packEmoji: pack.emoji,
    },
    expectedQuestions: (questions ?? []) as ResultQuestion[],
    answers: (answers ?? []) as ResultAnswerRow[],
    sessionToken: input.sessionToken,
  });
}

export const loadResult = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => normalizeLoadResultInput(input))
  .handler(async ({ data }): Promise<SessionResult> => {
    if (process.env.E2E_FAKE_AI === "true") return loadE2eResult(data);
    return loadRealResult(data);
  });
