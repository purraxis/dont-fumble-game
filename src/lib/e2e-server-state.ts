import type { Feedback } from "@/lib/feedback.functions";

export type E2eServerAnswer = {
  challengeCode: string;
  questionId: string;
  sessionToken: string;
  questionText: string;
  answerText: string;
  feedback: Feedback;
};

export type E2eServerChallenge = {
  code: string;
  senderName: string;
  packId: string;
};

type E2eServerState = {
  challenges: E2eServerChallenge[];
  answers: E2eServerAnswer[];
};

function getState() {
  const globalScope = globalThis as typeof globalThis & {
    __DF_E2E_SERVER_STATE__?: E2eServerState;
  };
  globalScope.__DF_E2E_SERVER_STATE__ ??= { challenges: [], answers: [] };
  return globalScope.__DF_E2E_SERVER_STATE__;
}

export function recordE2eServerChallenge(challenge: E2eServerChallenge) {
  const state = getState();
  const existing = state.challenges.find((item) => item.code === challenge.code);

  if (existing) {
    Object.assign(existing, challenge);
    return;
  }

  state.challenges.push(challenge);
}

export function getE2eServerChallenge(challengeCode: string) {
  return getState().challenges.find((challenge) => challenge.code === challengeCode) ?? null;
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
