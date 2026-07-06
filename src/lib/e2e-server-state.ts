import type { Feedback } from "@/lib/feedback.functions";

export type E2eServerAnswer = {
  challengeCode: string;
  questionId: string;
  sessionToken: string;
  questionText: string;
  answerText: string;
  feedback: Feedback;
};

type E2eServerState = {
  answers: E2eServerAnswer[];
};

function getState() {
  const globalScope = globalThis as typeof globalThis & {
    __DF_E2E_SERVER_STATE__?: E2eServerState;
  };
  globalScope.__DF_E2E_SERVER_STATE__ ??= { answers: [] };
  return globalScope.__DF_E2E_SERVER_STATE__;
}

export function recordE2eServerAnswer(answer: E2eServerAnswer) {
  const state = getState();
  const existing = state.answers.find(
    (item) =>
      item.challengeCode === answer.challengeCode &&
      item.questionId === answer.questionId &&
      item.sessionToken === answer.sessionToken,
  );

  if (existing) {
    Object.assign(existing, answer);
    return;
  }

  state.answers.push(answer);
}

export function getE2eServerAnswers(challengeCode: string, sessionToken: string) {
  return getState().answers.filter(
    (answer) => answer.challengeCode === challengeCode && answer.sessionToken === sessionToken,
  );
}
