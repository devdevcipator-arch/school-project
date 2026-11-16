"use client";

import Link from "next/link";
import { initialsOf, usePrincipalName } from "@/lib/principalAccount";

/** Top-bar card with the principal's name; opens My Profile. */
export default function ProfileCard() {
  const name = usePrincipalName();
  return (
    <Link href="/principal/account" aria-label="Open my profile" className="flex shrink-0 items-center gap-3 rounded-2xl border border-ink/8 bg-white p-2 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-135 from-primary to-accent text-[.85rem] font-bold text-surface">
        {initialsOf(name)}
      </span>
      <span className="grid min-w-0 pr-3 max-sm:hidden">
        <strong className="truncate text-[.9rem]">{name}</strong>
        <span className="truncate text-[.78rem] text-ink/55">Principal</span>
      </span>
    </Link>
  );
}
