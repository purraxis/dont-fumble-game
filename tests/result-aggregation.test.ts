import { describe, expect, it } from "vitest";
import {
  buildSessionResult,
  normalizeLoadResultInput,
  resultLabelForScore,
  type ResultAnswerRow,
  type ResultChallenge,
  type ResultQuestion,
} from "../src/lib/result.functions";

const sessionToken = "dfps_1234567890abcdefghijklmn";
const otherSessionToken = "dfps_abcdefghijklmn1234567890";
const challenge: ResultChallenge = {
  id: "challenge-1",
  senderName: "Bae",
  packName: "Worm Test",
  packEmoji: "🪱",
};
const expectedQuestions: ResultQuestion[] = [
  { id: "question-worm", text: "Would you still love me if I was a worm?" },
  { id: "question-dance", text: "Would you still answer in dance?" },
];

function answer(questionId: string, score: number, token = sessionToken): ResultAnswerRow {
  return {
    question_id: questionId,
    session_token: token,
    score,
    verdict: "Test verdict",
    answer_text: "Test answer",
    what_fumbled: "Nothing important.",
  };
}

describe("server-side result aggregation", () => {
  it("returns the correct average score and label for a completed session", () => {
    const result = buildSessionResult({
      challenge,
      expectedQuestions,
      answers: [answer("question-worm", 90), answer("question-dance", 78)],
      sessionToken,
    });

    expect(result.status).toBe("complete");
    if (result.status !== "complete") throw new Error("Expected complete result");
    expect(result.finalScore).toBe(84);
    expect(result.label).toBe("Emotionally Trainable");
    expect(result.answers).toHaveLength(2);
  });

  it("does not return a final score for incomplete sessions", () => {
    const result = buildSessionResult({
      challenge,
      expectedQuestions,
      answers: [answer("question-worm", 90)],
      sessionToken,
    });

    expect(result.status).toBe("incomplete");
    expect("finalScore" in result).toBe(false);
    if (result.status !== "incomplete") throw new Error("Expected incomplete result");
    expect(result.answeredCount).toBe(1);
    expect(result.missingCount).toBe(1);
  });

  it("ignores answers from other sessions", () => {
    const result = buildSessionResult({
      challenge,
      expectedQuestions,
      answers: [
        answer("question-worm", 10, otherSessionToken),
        answer("question-dance", 10, otherSessionToken),
        answer("question-worm", 100),
        answer("question-dance", 80),
      ],
      sessionToken,
    });

    expect(result.status).toBe("complete");
    if (result.status !== "complete") throw new Error("Expected complete result");
    expect(result.finalScore).toBe(90);
    expect(result.label).toBe("Certified Green Flag");
  });

  it("keeps duplicate answers deterministic by using the first expected answer", () => {
    const result = buildSessionResult({
      challenge,
      expectedQuestions,
      answers: [
        answer("question-worm", 80),
        answer("question-worm", 0),
        answer("question-dance", 80),
      ],
      sessionToken,
    });

    expect(result.status).toBe("complete");
    if (result.status !== "complete") throw new Error("Expected complete result");
    expect(result.finalScore).toBe(80);
  });

  it("rejects missing or malformed session tokens", () => {
    expect(() => normalizeLoadResultInput({ challengeCode: "abc123", sessionToken: "" })).toThrow();
    expect(() =>
      normalizeLoadResultInput({ challengeCode: "abc123", sessionToken: "not-valid" }),
    ).toThrow();
  });

  it("rejects fake client totals and labels", () => {
    expect(() =>
      normalizeLoadResultInput({
        challengeCode: "abc123",
        sessionToken,
        finalScore: 100,
        label: "Certified Green Flag",
      }),
    ).toThrow();
  });

  it("uses the required score labels", () => {
    expect(resultLabelForScore(95)).toBe("Certified Green Flag");
    expect(resultLabelForScore(84)).toBe("Emotionally Trainable");
    expect(resultLabelForScore(74)).toBe("Survived, Barely");
    expect(resultLabelForScore(64)).toBe("Fumble Risk");
    expect(resultLabelForScore(44)).toBe("Needs Bootcamp");
    expect(resultLabelForScore(20)).toBe("Do Not Send Yet");
  });
});
