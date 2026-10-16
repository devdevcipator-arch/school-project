"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { notifications } from "@/lib/principal";

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
  const [menu, setMenu] = useState<"bell" | null>(null);
  const close = () => setMenu(null);

  return (
    <header className="flex justify-end">
      {/* The page title lives in the portal top bar; this row keeps the notifications bell. */}
      <div className="flex flex-wrap items-center gap-2.5">
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
