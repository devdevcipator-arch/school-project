"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { notifications, principal } from "@/lib/principal";

// Date and greeting come from the viewer's clock, so they render on the client only.
const noop = () => () => {};
function useToday() {
  // Snapshot must be a primitive so React sees a stable value between renders.
  const snap = useSyncExternalStore(
    noop,
    () => {
      const now = new Date();
      const h = now.getHours();
      const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
      return `${greeting}|${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
    },
    () => "",
  );
  if (!snap) return null;
  const [greeting, date] = snap.split("|");
  return { greeting, date };
}

/** Small popover that closes on outside click or Escape. */
function Popover({ open, onClose, children, className = "" }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className={`absolute right-0 top-[calc(100%+10px)] z-20 origin-top-right rounded-2xl border border-ink/10 bg-white p-2 shadow-[0_24px_50px_rgba(6,30,41,.18)] transition-[opacity,scale,visibility] duration-200 ease-soft ${
        open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const toneDot = { danger: "bg-danger", warn: "bg-warn" };

export default function ExecHeader() {
  const today = useToday();
  const [menu, setMenu] = useState<"add" | "bell" | null>(null);
  const close = () => setMenu(null);

  return (
    <header data-reveal className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <p className="text-[.88rem] font-semibold text-ink/55" suppressHydrationWarning>
          {today?.date ?? " "}
        </p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-tight">
          {today?.greeting ?? "Welcome"}, {principal.name}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <ButtonLink href="/principal/announcements" className="max-sm:flex-1">
          <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l15-6v14L3 13z M7 13v5h3v-4" />
          </svg>
          Post Announcement
        </ButtonLink>

        <div className="relative max-sm:flex-1">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu === "add"}
            onClick={() => setMenu((m) => (m === "add" ? null : "add"))}
            className={buttonClass("dark", "md", "w-full cursor-pointer")}
          >
            <svg viewBox="0 0 20 20" aria-hidden className="size-4"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            Add Teacher / Student
          </button>
          <Popover open={menu === "add"} onClose={close} className="w-56">
            <div role="menu">
              {[
                { href: "/principal/teachers", label: "Add Teacher" },
                { href: "/principal/students", label: "Add Student" },
              ].map((l) => (
                <Link key={l.href} role="menuitem" href={l.href} onClick={close} className="block rounded-xl px-3.5 py-2.5 text-[.9rem] font-semibold text-ink transition-colors hover:bg-primary/8 hover:text-primary">
                  {l.label}
                </Link>
              ))}
            </div>
          </Popover>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications, ${notifications.length} new`}
            aria-expanded={menu === "bell"}
            onClick={() => setMenu((m) => (m === "bell" ? null : "bell"))}
            className="relative grid size-[46px] cursor-pointer place-items-center rounded-[10px] border border-ink/12 bg-white text-primary transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0" />
            </svg>
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-danger text-[.68rem] font-bold text-white ring-2 ring-surface">
              {notifications.length}
            </span>
          </button>
          <Popover open={menu === "bell"} onClose={close} className="w-[min(320px,calc(100vw-32px))]">
            <p className="px-3 pb-1 pt-2 text-[.72rem] font-bold uppercase tracking-[.12em] text-ink/50">System alerts</p>
            <ul>
              {notifications.map((n) => (
                <li key={n.text} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-surface">
                  <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${toneDot[n.tone]}`} />
                  <span className="grid">
                    <span className="text-[.88rem] font-semibold leading-snug">{n.text}</span>
                    <span className="text-[.76rem] text-ink/50">{n.when}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Popover>
        </div>
      </div>
    </header>
  );
}
