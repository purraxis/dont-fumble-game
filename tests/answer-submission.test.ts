import { describe, expect, it } from "vitest";
import {
  MAX_ANSWER_LENGTH,
  normalizeSubmitAnswerInput,
  validateAiFeedback,
} from "../src/lib/answer-submission.functions";

const validInput = {
  challengeCode: "abc123",
  questionId: "question-worm",
  answerText: " Yes, I would build you a luxury terrarium. ",
  sessionToken: "dfps_1234567890abcdefghijklmn",
};

describe("answer submission validation", () => {
  it("accepts and normalizes a valid answer payload", () => {
    expect(normalizeSubmitAnswerInput(validInput)).toEqual({
      challengeCode: "ABC123",
      questionId: "question-worm",
      answerText: "Yes, I would build you a luxury terrarium.",
      sessionToken: validInput.sessionToken,
    });
  });

  it("rejects blank answers after trimming", () => {
    expect(() => normalizeSubmitAnswerInput({ ...validInput, answerText: "    " })).toThrow();
  });

  it("rejects overly long answers", () => {
    expect(() =>
      normalizeSubmitAnswerInput({
        ...validInput,
        answerText: "x".repeat(MAX_ANSWER_LENGTH + 1),
      }),
    ).toThrow();
  });

  it("rejects missing or malformed session tokens", () => {
    expect(() => normalizeSubmitAnswerInput({ ...validInput, sessionToken: "" })).toThrow();
    expect(() =>
      normalizeSubmitAnswerInput({ ...validInput, sessionToken: "not-valid" }),
    ).toThrow();
  });

  it("rejects invalid question ids", () => {
    expect(() => normalizeSubmitAnswerInput({ ...validInput, questionId: "   " })).toThrow();
  });

  it("rejects fake client scores and feedback fields", () => {
    expect(() =>
      normalizeSubmitAnswerInput({
        ...validInput,
        score: 100,
        feedback_json: { hacked: true },
        verdict: "Trust me bro",
      }),
    ).toThrow();
  });
});

describe("AI feedback validation", () => {
  const feedback = {
    score: 84,
    verdict: "The Terrarium Upgrade Plan",
    what_worked: "Specific and sweet.",
    what_fumbled: "A little light on dramatic flair.",
    better_answer: "I would choose you in every form.",
  };

  it("accepts valid AI feedback", () => {
    expect(validateAiFeedback(feedback)).toEqual(feedback);
  });

  it("rejects invalid AI feedback shapes", () => {
    expect(() => validateAiFeedback({ ...feedback, what_worked: undefined })).toThrow();
  });

  it("rejects scores outside 0 to 100", () => {
    expect(() => validateAiFeedback({ ...feedback, score: -1 })).toThrow();
    expect(() => validateAiFeedback({ ...feedback, score: 101 })).toThrow();
  });
});
