import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, BrutalCard, BrutalButton } from "@/components/AppShell";
import { PACK_COLOR, generateChallengeCode } from "@/lib/game";

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
  const [sender, setSender] = useState<string>("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const s = sessionStorage.getItem("df_sender");
    if (!s) navigate({ to: "/create" });
    else setSender(s);
  }, [navigate]);

  const { data: packs, isLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_packs")
        .select("id, slug, name, emoji, description, bg_color")
        .order("sort_order");
      if (error) throw error;
      return data as Pack[];
    },
  });

  async function createChallenge() {
    if (!selected || !sender) return;
    setCreating(true);
    try {
      const code = generateChallengeCode();
      const { error } = await supabase.from("challenges").insert({
        code,
        sender_name: sender,
        pack_id: selected,
      });
      if (error) throw error;
      navigate({ to: "/share/$code", params: { code } });
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
        <h1 className="font-display text-4xl font-bold leading-tight">
          Choose your weapon
        </h1>
        <p className="text-sm text-ink/60">
          Every pack has 4–5 questions. Pick your poison.
        </p>

        {isLoading && <div className="text-center py-12 text-ink/40 font-medium">Loading packs...</div>}

        <div className="space-y-3">
          {packs?.map((pack) => {
            const c = PACK_COLOR[pack.bg_color] ?? PACK_COLOR["brand-yellow"];
            const isSelected = selected === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelected(pack.id)}
                className={`w-full text-left rounded-3xl border-2 border-ink ${c.bg} ${c.text} p-5 neubrutal-shadow-sm transition-all ${
                  isSelected ? "ring-4 ring-ink translate-x-[-2px] translate-y-[-2px] neubrutal-shadow" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-white/30 text-3xl">
                    {pack.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-bold">{pack.name}</div>
                    <div className="text-sm opacity-90 truncate">{pack.description}</div>
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
          onClick={createChallenge}
          disabled={!selected || creating}
        >
          {creating ? "Setting the trap..." : "CREATE CHALLENGE →"}
        </BrutalButton>
      </div>
    </AppShell>
  );
}