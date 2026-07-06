import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-cream text-ink">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col border-x-2 border-ink/10 bg-brand-cream">
        <nav className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-ink bg-white p-4">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight leading-none">
            DON'T <span className="text-brand-purple">FUMBLE</span>
          </Link>
          <div className="grid size-10 place-items-center rounded-full border-2 border-ink bg-brand-yellow neubrutal-shadow-sm font-display text-lg font-bold">
            ?
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function BrutalCard({
  children,
  className = "",
  color = "bg-white",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`rounded-3xl border-2 border-ink neubrutal-shadow ${color} ${className}`}>
      {children}
    </div>
  );
}

export function BrutalButton({
  children,
  onClick,
  disabled,
  type = "button",
  color = "bg-brand-yellow text-ink",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  color?: string;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl border-2 border-ink px-6 py-4 font-display text-lg font-bold neubrutal-shadow transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${color} ${className}`}
    >
      {children}
    </button>
  );
}
