import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell, BrutalCard, BrutalButton } from "@/components/AppShell";
import { loadResult, type SessionResult } from "@/lib/result.functions";
import { verdictForScore } from "@/lib/game";
import { playSessionStorageKey } from "@/lib/play-session";

export const Route = createFileRoute("/result/$code")({
  head: ({ params }) => ({
    meta: [{ title: `Final verdict for #${params.code} — Don't Fumble` }],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { code } = Route.useParams();
  const runLoadResult = useServerFn(loadResult);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>();

  useEffect(() => {
    setOrigin(window.location.origin);
    setSessionToken(window.localStorage.getItem(playSessionStorageKey(code)));
  }, [code]);

  const { data, error, isLoading } = useQuery<SessionResult>({
    queryKey: ["result", code, sessionToken],
    enabled: sessionToken !== undefined,
    retry: false,
    queryFn: async () =>
      runLoadResult({
        data: {
          challengeCode: code,
          sessionToken: sessionToken ?? "",
        },
      }),
  });

  async function share(result: Extract<SessionResult, { status: "complete" }>) {
    const url = `${origin}/play/${code}`;
    const text = `I got ${result.finalScore}/100 — ${result.label} — on Don't Fumble 💀 try it: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Don't Fumble", text, url });
        return;
      } catch {
        // Fall through to clipboard copy.
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading || sessionToken === undefined) {
    return (
      <AppShell>
        <div className="p-12 text-center font-medium text-ink/50">Loading result...</div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="space-y-5 p-6 pt-20 text-center">
          <div className="text-6xl">🫠</div>
          <h1 className="font-display text-2xl font-bold">Result not ready</h1>
          <p className="text-ink/60">
            This result link needs the same browser session that answered the challenge. Open the
            play link again or ask them to resend it.
          </p>
          <Link to="/play/$code" params={{ code }}>
            <BrutalButton color="bg-brand-yellow text-ink">Back to challenge</BrutalButton>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (data.status === "incomplete") {
    return (
      <AppShell>
        <div className="space-y-6 p-6 pb-24">
          <div className="text-xs font-bold uppercase tracking-widest text-ink/50 text-center">
            Final verdict
          </div>

          <BrutalCard color="bg-white" className="p-8 text-center">
            <div className="mx-auto mb-4 grid size-24 place-items-center rounded-full border-4 border-ink bg-brand-yellow text-5xl neubrutal-shadow-lg">
              ⏳
            </div>
            <div className="font-display text-3xl font-bold leading-tight">Not finished yet</div>
            <p className="mt-3 text-sm text-ink/60">
              {data.answeredCount} of {data.expectedCount} answers saved. Finish the challenge
              before the final score appears.
            </p>
            <div className="mt-4 text-xs text-ink/50">
              Challenge from{" "}
              <span className="font-bold text-brand-purple">{data.challenge.senderName}</span> ·{" "}
              {data.challenge.packEmoji} {data.challenge.packName}
            </div>
          </BrutalCard>

          {data.answers.length > 0 && <Receipts answers={data.answers} />}

          <Link to="/play/$code" params={{ code }}>
            <BrutalButton color="bg-brand-yellow text-ink">Finish challenge</BrutalButton>
          </Link>
        </div>
      </AppShell>
    );
  }

  const v = verdictForScore(data.finalScore);

  return (
    <AppShell>
      <div className="space-y-6 p-6 pb-24">
        <div className="text-xs font-bold uppercase tracking-widest text-ink/50 text-center">
          Final verdict
        </div>

        <BrutalCard color="bg-ink" className="relative overflow-hidden p-8 text-center text-white">
          <div
            className={`mx-auto mb-4 grid size-32 place-items-center rounded-full border-4 border-white ${v.color} neubrutal-shadow-lg`}
          >
            <div className="text-6xl">{v.emoji}</div>
          </div>
          <div className="font-display text-3xl font-bold leading-tight">{data.label}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">
            {data.answeredCount} of {data.expectedCount} traps survived
          </div>
          <div className="mt-6 font-display text-7xl font-black leading-none">
            {data.finalScore}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/60">
            Overall Relationship IQ
          </div>
          <div className="mt-4 text-xs text-white/50">
            Challenge from{" "}
            <span className="font-bold text-brand-yellow">{data.challenge.senderName}</span> ·{" "}
            {data.challenge.packEmoji} {data.challenge.packName}
          </div>
        </BrutalCard>

        <Receipts answers={data.answers} />

        <BrutalButton color="bg-brand-yellow text-ink" onClick={() => share(data)}>
          {copied ? "COPIED ✓" : "SHARE THE DAMAGE 📱"}
        </BrutalButton>

        <Link to="/">
          <BrutalButton color="bg-white text-ink">Start a new challenge</BrutalButton>
        </Link>
      </div>
    </AppShell>
  );
}

function Receipts({ answers }: { answers: SessionResult["answers"] }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-bold">The receipts</h2>
      <div className="space-y-2">
        {answers.map((answer) => {
          const av = verdictForScore(answer.score);
          return (
            <BrutalCard key={answer.questionId} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink ${av.color} font-display text-lg font-black text-white`}
                >
                  {answer.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold uppercase tracking-widest text-ink/50">
                    {av.label}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-sm font-medium">
                    {answer.questionText}
                  </div>
                </div>
              </div>
            </BrutalCard>
          );
        })}
      </div>
    </div>
  );
}
