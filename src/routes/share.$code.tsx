import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell, BrutalCard, BrutalButton } from "@/components/AppShell";
import { loadShareChallenge, type ShareChallenge } from "@/lib/challenge-read.functions";

export const Route = createFileRoute("/share/$code")({
  head: ({ params }) => ({
    meta: [{ title: `Share your challenge #${params.code} — Don't Fumble` }],
  }),
  component: SharePage,
});

function SharePage() {
  const { code } = Route.useParams();
  const runLoadShareChallenge = useServerFn(loadShareChallenge);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { data, error, isLoading } = useQuery<ShareChallenge>({
    queryKey: ["challenge", code],
    retry: false,
    queryFn: async () =>
      runLoadShareChallenge({
        data: { challengeCode: code },
      }),
  });

  const url = origin ? `${origin}/play/${code}` : "";

  async function share() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Don't Fumble challenge",
          text: `${data?.senderName ?? "Someone"} sent you a Don't Fumble challenge. Don't fumble the bag.`,
          url,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6 pb-24">
        <div className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Step 3 of 3 · Trap set 🎯
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Send it. See if they survive.
        </h1>

        <BrutalCard color="bg-brand-yellow" className="p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-ink/60">
            Your challenge code
          </div>
          <div className="my-2 font-display text-6xl font-bold tracking-widest">{code}</div>
          <div className="text-sm font-medium">
            {isLoading && "Loading pack..."}
            {error && "Challenge details unavailable"}
            {data && (
              <>
                Pack: {data.packEmoji} {data.packName}
              </>
            )}
          </div>
        </BrutalCard>

        <BrutalCard className="p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/60">
            Share link
          </div>
          <div className="mb-4 break-all rounded-lg bg-ink/5 p-3 font-mono text-sm">
            {url || "..."}
          </div>
          <BrutalButton color="bg-brand-purple text-white" onClick={share}>
            {copied ? "COPIED ✓" : "SHARE / COPY LINK 🔗"}
          </BrutalButton>
        </BrutalCard>

        <Link to="/play/$code" params={{ code }}>
          <BrutalButton color="bg-white text-ink">Preview as partner →</BrutalButton>
        </Link>

        <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/40">
          Tip: send it in the group chat. Watch chaos unfold.
        </p>
      </div>
    </AppShell>
  );
}
