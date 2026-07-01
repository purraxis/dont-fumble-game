import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, BrutalCard, BrutalButton } from "@/components/AppShell";
import { overallBadge, verdictForScore } from "@/lib/game";

export const Route = createFileRoute("/result/$code")({
  head: ({ params }) => ({
    meta: [{ title: `Final verdict for #${params.code} — Don't Fumble` }],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { code } = Route.useParams();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const { data } = useQuery({
    queryKey: ["result", code],
    queryFn: async () => {
      const { data: ch, error } = await supabase
        .from("challenges")
        .select("id, sender_name, question_packs(name, emoji), answers(score, verdict, question_text, answer_text, what_fumbled)")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      return ch;
    },
  });

  const answers = (data?.answers ?? []) as Array<{
    score: number;
    verdict: string;
    question_text: string;
    answer_text: string;
    what_fumbled: string;
  }>;

  const avg = answers.length
    ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length)
    : 0;
  const badge = overallBadge(avg);
  const v = verdictForScore(avg);

  async function share() {
    const url = `${origin}/play/${code}`;
    const text = `I got ${avg}/100 — ${badge.title} — on Don't Fumble 💀 try it: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Don't Fumble", text, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6 pb-24">
        <div className="text-xs font-bold uppercase tracking-widest text-ink/50 text-center">
          Final verdict
        </div>

        <BrutalCard color="bg-ink" className="relative overflow-hidden p-8 text-center text-white">
          <div className={`mx-auto mb-4 grid size-32 place-items-center rounded-full border-4 border-white ${v.color} neubrutal-shadow-lg`}>
            <div className="text-6xl">{v.emoji}</div>
          </div>
          <div className="font-display text-3xl font-bold leading-tight">{badge.title}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">
            {badge.tag}
          </div>
          <div className="mt-6 font-display text-7xl font-black leading-none">{avg}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/60">
            Overall Relationship IQ
          </div>
          {data && (
            <div className="mt-4 text-xs text-white/50">
              Challenge from <span className="text-brand-yellow font-bold">{data.sender_name}</span> · {(data.question_packs as any)?.emoji} {(data.question_packs as any)?.name}
            </div>
          )}
        </BrutalCard>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold">The receipts</h2>
          <div className="space-y-2">
            {answers.map((a, i) => {
              const av = verdictForScore(a.score);
              return (
                <BrutalCard key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink ${av.color} font-display text-lg font-black text-white`}>
                      {a.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold uppercase tracking-widest text-ink/50">
                        {av.label}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-sm font-medium">
                        {a.question_text}
                      </div>
                    </div>
                  </div>
                </BrutalCard>
              );
            })}
          </div>
        </div>

        <BrutalButton color="bg-brand-yellow text-ink" onClick={share}>
          {copied ? "COPIED ✓" : "SHARE THE DAMAGE 📱"}
        </BrutalButton>

        <Link to="/">
          <BrutalButton color="bg-white text-ink">Start a new challenge</BrutalButton>
        </Link>
      </div>
    </AppShell>
  );
}