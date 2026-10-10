import type { ReactNode } from "react";

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      data-reveal
      className={`mb-[18px] inline-block rounded-full px-3 py-1.5 text-[.78rem] font-bold uppercase tracking-[.14em] ${
        light ? "border border-surface/25 bg-surface/15 text-surface" : "bg-primary/10 text-primary"
      }`}
    >
      {children}
    </span>
  );
}

export function CheckIcon({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-[18px] shrink-0 place-items-center rounded-full ${dark ? "bg-accent text-ink" : "bg-primary/10 text-primary"}`}
    >
      <svg viewBox="0 0 20 20" className="size-3.5">
        <path d="m5 10 3.5 3.5L15 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
