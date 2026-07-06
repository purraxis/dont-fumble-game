import { customAlphabet } from "nanoid";

export const generateChallengeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export const PACK_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  "brand-yellow": { bg: "bg-brand-yellow", text: "text-ink", ring: "ring-brand-yellow/30" },
  "brand-purple": { bg: "bg-brand-purple", text: "text-white", ring: "ring-brand-purple/30" },
  "brand-pink": { bg: "bg-brand-pink", text: "text-white", ring: "ring-brand-pink/30" },
  "brand-green": { bg: "bg-brand-green", text: "text-white", ring: "ring-brand-green/30" },
  "fumble-red": { bg: "bg-fumble-red", text: "text-white", ring: "ring-fumble-red/30" },
};

export type Verdict = {
  emoji: string;
  label: string;
  color: string; // tailwind class for badge bg
  sub: string;
};

export function verdictForScore(score: number): Verdict {
  if (score >= 90)
    return {
      emoji: "💍",
      label: "MARRY THEM",
      color: "bg-brand-green",
      sub: "Elite rizz. Certified keeper.",
    };
  if (score >= 75)
    return {
      emoji: "😍",
      label: "GREEN FLAG",
      color: "bg-brand-green",
      sub: "You cooked, and not in the bad way.",
    };
  if (score >= 55)
    return {
      emoji: "😬",
      label: "MID SAVE",
      color: "bg-brand-yellow",
      sub: "Survived by vibes alone.",
    };
  if (score >= 35)
    return {
      emoji: "⚠️",
      label: "SHAKY GROUND",
      color: "bg-brand-pink",
      sub: "Sleep on the couch tonight.",
    };
  if (score >= 15)
    return {
      emoji: "🚩",
      label: "BIG FUMBLE",
      color: "bg-fumble-red",
      sub: "Roses will not fix this.",
    };
  return {
    emoji: "💀",
    label: "CRITICAL FUMBLE",
    color: "bg-fumble-red",
    sub: "Single by midnight.",
  };
}

export function overallBadge(avg: number) {
  if (avg >= 85)
    return { title: "ULTIMATE PARTNER", tag: "Certified Rizzler", ring: "ring-brand-green" };
  if (avg >= 65)
    return { title: "GREEN FLAG ENERGY", tag: "Passed the vibe check", ring: "ring-brand-green" };
  if (avg >= 45)
    return { title: "MID BOYFRIEND", tag: "Room for growth", ring: "ring-brand-yellow" };
  if (avg >= 25)
    return { title: "RED FLAG ENERGY", tag: "Explaining yourself is due", ring: "ring-fumble-red" };
  return {
    title: "SINGLE BY MIDNIGHT",
    tag: "Certified fumble professional",
    ring: "ring-fumble-red",
  };
}
