import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, BrutalButton, BrutalCard } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <AppShell>
      <div className="space-y-6 p-6 pb-24">
        <BrutalCard color="bg-brand-purple" className="p-8 text-white">
          <div className="mb-3 inline-block rotate-[-3deg] rounded-full border-2 border-ink bg-brand-yellow px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink neubrutal-shadow-sm">
            The Couple Trap 💘
          </div>
          <h1 className="mb-4 font-display text-5xl font-bold leading-[0.95]">
            Will they pass the vibe check?
          </h1>
          <p className="mb-6 text-purple-100 font-medium">
            Send your partner impossible questions. Let a very judgmental AI decide if they cooked or fumbled the bag.
          </p>
          <Link to="/create">
            <BrutalButton color="bg-brand-yellow text-ink">START A CHALLENGE →</BrutalButton>
          </Link>
        </BrutalCard>

        <div className="grid grid-cols-2 gap-4">
          <BrutalCard color="bg-brand-pink" className="p-4 text-white">
            <div className="text-3xl">🪱</div>
            <div className="mt-2 font-display font-bold">Worm Test</div>
            <div className="text-xs opacity-90">The classic trap.</div>
          </BrutalCard>
          <BrutalCard color="bg-brand-green" className="p-4 text-white">
            <div className="text-3xl">🍜</div>
            <div className="mt-2 font-display font-bold">Food & Attention</div>
            <div className="text-xs opacity-90">Do you even remember?</div>
          </BrutalCard>
          <BrutalCard color="bg-brand-yellow" className="p-4">
            <div className="text-3xl">👯</div>
            <div className="mt-2 font-display font-bold">Look-Alike Traps</div>
            <div className="text-xs opacity-80">Risky business.</div>
          </BrutalCard>
          <BrutalCard color="bg-fumble-red" className="p-4 text-white">
            <div className="text-3xl">👊</div>
            <div className="mt-2 font-display font-bold">Boss Fight</div>
            <div className="text-xs opacity-90">Final round.</div>
          </BrutalCard>
        </div>

        <BrutalCard className="p-5">
          <h2 className="font-display text-xl font-bold">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm font-medium">
            <li>1. Pick a question pack 🎯</li>
            <li>2. Send the share link to your partner 🔗</li>
            <li>3. They answer, we judge, you both laugh (or cry) 💀</li>
          </ol>
        </BrutalCard>

        <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/40">
          No login. No mercy.
        </p>
      </div>
    </AppShell>
  );
}
