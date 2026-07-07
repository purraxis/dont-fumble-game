import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { recordE2eAnswerForResult } from "@/integrations/supabase/client";
import { AppShell, BrutalCard, BrutalButton } from "@/components/AppShell";
import { submitAnswer } from "@/lib/answer-submission.functions";
import { loadPlayChallenge, type PlayChallenge } from "@/lib/challenge-read.functions";
import type { Feedback } from "@/lib/feedback.functions";
import { verdictForScore } from "@/lib/game";
import { getOrCreatePlaySessionToken } from "@/lib/play-session";

export const Route = createFileRoute("/play/$code")({
  head: ({ params }) => ({
    meta: [{ title: `Challenge #${params.code} — Don't Fumble` }],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const runSubmitAnswer = useServerFn(submitAnswer);
  const runLoadPlayChallenge = useServerFn(loadPlayChallenge);

  const { data, isLoading, error } = useQuery<PlayChallenge>({
    queryKey: ["play", code],
    retry: false,
    queryFn: async () =>
      runLoadPlayChallenge({
        data: { challengeCode: code },
      }),
  });

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"answer" | "loading" | "feedback">("answer");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getOrCreatePlaySessionToken(code, window.localStorage);
  }, [code]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-12 text-center font-medium text-ink/50">Loading challenge...</div>
      </AppShell>
    );
  }
  if (error || !data) {
    return (
      <AppShell>
        <div className="p-6 pt-20 text-center space-y-4">
          <div className="text-6xl">💀</div>
          <h1 className="font-display text-2xl font-bold">Challenge not found</h1>
          <p className="text-ink/60">That code doesn't exist. Ask them to resend.</p>
        </div>
      </AppShell>
    );
  }

  const q = data.questions[index];
  const total = data.questions.length;

  async function submit() {
    if (!answer.trim() || !q || isSubmitting) return;
    const sessionToken = getOrCreatePlaySessionToken(code, window.localStorage);
    setIsSubmitting(true);
    setPhase("loading");
    setErr(null);
    try {
      const fb = await runSubmitAnswer({
        data: {
          challengeCode: code,
          questionId: q.id,
          answerText: answer,
          sessionToken,
        },
      });

      recordE2eAnswerForResult({
        challenge_id: data!.code,
        question_id: q.id,
        session_token: sessionToken,
        question_text: q.text,
        answer_text: answer.trim(),
        score: fb.score,
        verdict: fb.verdict,
        what_fumbled: fb.what_fumbled,
      });
      setFeedback(fb);
      setPhase("feedback");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something broke. Try again.");
      setPhase("answer");
    } finally {
      setIsSubmitting(false);
    }
  }

  function next() {
    if (index + 1 >= total) {
      navigate({ to: "/result/$code", params: { code } });
      return;
    }
    setIndex(index + 1);
    setAnswer("");
    setFeedback(null);
    setPhase("answer");
  }

  function retry() {
    setFeedback(null);
    setPhase("answer");
  }

  return (
    <AppShell>
      <div className="p-6 pb-24">
        {/* Header strip */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-ink/50">
            Q {index + 1} / {total}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-ink/50">
            {data.packEmoji} {data.packName}
          </span>
        </div>
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
          <div
            className="h-full bg-brand-purple transition-all"
            style={{ width: `${((phase === "feedback" ? index + 1 : index) / total) * 100}%` }}
          />
        </div>

        {phase !== "feedback" ? (
          <>
            <p className="mb-2 text-sm font-bold text-brand-purple">{data.senderName} asks:</p>
            <h1 className="mb-6 break-words font-display text-3xl font-bold leading-tight text-balance">
              "{q?.text}"
            </h1>

            <BrutalCard className="p-5">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={phase === "loading"}
                placeholder="Type your survival response..."
                className="h-40 w-full resize-none rounded-xl border-2 border-ink/15 bg-white p-4 text-lg outline-none transition-colors focus:border-brand-purple placeholder:text-ink/30"
              />
              {err && (
                <div className="mt-3 rounded-lg border-2 border-fumble-red bg-fumble-red/10 p-3 text-sm font-medium text-fumble-red">
                  {err}
                </div>
              )}
              <div className="mt-4">
                <BrutalButton
                  color="bg-brand-green text-white"
                  onClick={submit}
                  disabled={!answer.trim() || phase === "loading" || isSubmitting}
                >
                  {phase === "loading" ? "AI is judging you..." : "SUBMIT ANSWER"}
                </BrutalButton>
              </div>
            </BrutalCard>
          </>
        ) : feedback ? (
          <FeedbackView
            feedback={feedback}
            onRetry={retry}
            onNext={next}
            isLast={index + 1 >= total}
            question={q?.text ?? ""}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function FeedbackView({
  feedback,
  onRetry,
  onNext,
  isLast,
  question,
}: {
  feedback: Feedback;
  onRetry: () => void;
  onNext: () => void;
  isLast: boolean;
  question: string;
}) {
  const v = verdictForScore(feedback.score);
  return (
    <div className="space-y-5">
      <BrutalCard className="relative p-6">
        <div
          className={`absolute -right-2 -top-4 rotate-6 rounded-full border-2 border-ink px-4 py-1 font-display text-sm font-bold text-white neubrutal-shadow-sm ${v.color}`}
        >
          {v.emoji} {v.label}
        </div>
        <div className="flex items-center gap-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-full border-4 border-ink bg-white">
            <div className="text-center">
              <div className="font-display text-4xl font-black leading-none">{feedback.score}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                /100
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-bold leading-tight">{feedback.verdict}</div>
            <div className="mt-1 text-xs text-ink/50">{v.sub}</div>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-ink/5 p-3 text-xs italic text-ink/70">Q: {question}</p>
      </BrutalCard>

      <BrutalCard color="bg-brand-green/10" className="border-brand-green p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-brand-green">
          What worked
        </div>
        <p className="mt-1 text-sm font-medium">{feedback.what_worked}</p>
      </BrutalCard>

      <BrutalCard color="bg-fumble-red/10" className="border-fumble-red p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-fumble-red">
          What fumbled
        </div>
        <p className="mt-1 text-sm font-medium">{feedback.what_fumbled}</p>
      </BrutalCard>

      <BrutalCard color="bg-brand-yellow" className="p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-ink/70">
          The better answer™
        </div>
        <p className="mt-1 text-sm font-medium italic">"{feedback.better_answer}"</p>
      </BrutalCard>

      <div className="grid grid-cols-2 gap-3">
        <BrutalButton color="bg-white text-ink" onClick={onRetry}>
          Retry
        </BrutalButton>
        <BrutalButton color="bg-brand-purple text-white" onClick={onNext}>
          {isLast ? "See Result →" : "Next →"}
        </BrutalButton>
      </div>
    </div>
  );
}
