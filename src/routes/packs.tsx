import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { recordE2eChallengeForClient, supabase } from "@/integrations/supabase/client";
import { AppShell, BrutalCard, BrutalButton } from "@/components/AppShell";
import { createChallenge as createChallengeOnServer } from "@/lib/challenge.functions";
import { PACK_COLOR } from "@/lib/game";

export const Route = createFileRoute("/packs")({
  head: () => ({ meta: [{ title: "Choose your trap — Don't Fumble" }] }),
  component: PacksPage,
});

type Pack = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  bg_color: string;
};

function PacksPage() {
  const navigate = useNavigate();
  const runCreateChallenge = useServerFn(createChallengeOnServer);
  const [sender, setSender] = useState<string>("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem("df_sender");
    if (!s) navigate({ to: "/create" });
    else setSender(s);
  }, [navigate]);

  const {
    data: packs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["packs"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_packs")
        .select("id, slug, name, emoji, description, bg_color")
        .order("sort_order");
      if (error) throw error;
      return data as Pack[];
    },
  });

  const hasPacks = Boolean(packs?.length);

  async function handleCreateChallenge() {
    if (!selected || !sender || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const challenge = await runCreateChallenge({
        data: {
          packId: selected,
          creatorName: sender,
        },
      });

      recordE2eChallengeForClient({
        code: challenge.code,
        sender_name: sender,
        pack_id: selected,
      });
      navigate({ to: "/share/$code", params: { code: challenge.code } });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create challenge.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5 p-6 pb-32">
        <div className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Step 2 of 3 · {sender && <>Hi {sender} 👋</>}
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">Choose your weapon</h1>
        <p className="text-sm text-ink/60">
          Every pack has a batch of impossible questions. Pick your poison.
        </p>

        {isLoading && (
          <div className="text-center py-12 text-ink/40 font-medium">Loading packs...</div>
        )}

        {isError && (
          <BrutalCard color="bg-fumble-red/10" className="space-y-4 border-fumble-red p-5">
            <div>
              <h2 className="font-display text-xl font-bold text-fumble-red">
                The packs fumbled loading
              </h2>
              <p className="mt-2 text-sm font-medium text-ink/70">
                Refresh and try again. If this keeps happening, Supabase may not be connected yet.
              </p>
              <p className="mt-3 break-words rounded-lg bg-white/70 p-3 font-mono text-xs text-ink/50">
                {error instanceof Error ? error.message : "Unknown Supabase error"}
              </p>
            </div>
            <BrutalButton color="bg-white text-ink" onClick={() => void refetch()}>
              Try again
            </BrutalButton>
          </BrutalCard>
        )}

        {!isLoading && !isError && !hasPacks && (
          <BrutalCard color="bg-brand-yellow" className="space-y-3 p-5">
            <h2 className="font-display text-xl font-bold">No traps loaded yet</h2>
            <p className="text-sm font-medium text-ink/70">
              The app is ready, but the question packs have not been seeded. Run the Supabase seed,
              then come back and choose your weapon.
            </p>
          </BrutalCard>
        )}

        {createError && (
          <BrutalCard color="bg-fumble-red/10" className="border-fumble-red p-4">
            <h2 className="font-display text-lg font-bold text-fumble-red">Trap did not set</h2>
            <p className="mt-2 text-sm font-medium text-ink/70">{createError}</p>
          </BrutalCard>
        )}

        <div className="space-y-3">
          {packs?.map((pack) => {
            const c = PACK_COLOR[pack.bg_color] ?? PACK_COLOR["brand-yellow"];
            const isSelected = selected === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelected(pack.id)}
                className={`w-full text-left rounded-3xl border-2 border-ink ${c.bg} ${c.text} p-5 neubrutal-shadow-sm transition-all ${
                  isSelected
                    ? "ring-4 ring-ink translate-x-[-2px] translate-y-[-2px] neubrutal-shadow"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-white/30 text-3xl">
                    {pack.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="break-words font-display text-xl font-bold">{pack.name}</div>
                    <div className="mt-1 break-words text-sm leading-snug opacity-90">
                      {pack.description}
                    </div>
                  </div>
                  {isSelected && <div className="text-2xl">✓</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="sticky bottom-0 border-t-2 border-ink bg-brand-cream p-4">
        <BrutalButton
          color="bg-brand-purple text-white"
          onClick={handleCreateChallenge}
          disabled={!selected || creating || !hasPacks || isError}
        >
          {creating ? "Setting the trap..." : "CREATE CHALLENGE →"}
        </BrutalButton>
      </div>
    </AppShell>
  );
}
