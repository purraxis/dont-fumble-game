import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, BrutalButton, BrutalCard } from "@/components/AppShell";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create a challenge — Don't Fumble" }] }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    sessionStorage.setItem("df_sender", name.trim());
    navigate({ to: "/packs" });
  }

  return (
    <AppShell>
      <form onSubmit={onSubmit} className="space-y-6 p-6 pb-24">
        <div className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Step 1 of 3
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Who's setting the trap? 😈
        </h1>
        <BrutalCard className="p-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-ink/60">
            Your name (or nickname)
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bae, Babe, Boss..."
            maxLength={40}
            className="w-full rounded-xl border-2 border-ink/20 bg-white p-4 text-lg font-medium outline-none transition-colors focus:border-brand-purple"
          />
          <p className="mt-3 text-xs text-ink/50">
            Your partner sees this on the challenge screen.
          </p>
        </BrutalCard>
        <BrutalButton type="submit" color="bg-brand-purple text-white" disabled={!name.trim()}>
          PICK A QUESTION PACK →
        </BrutalButton>
      </form>
    </AppShell>
  );
}