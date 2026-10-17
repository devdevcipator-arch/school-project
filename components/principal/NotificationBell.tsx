"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { notifications as principalNotifications } from "@/lib/principal";

type Notice = { text: string; tone: "danger" | "warn"; when: string };

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

/** Notifications bell for the portal top bar, sized to sit beside the profile card. */
export default function NotificationBell({ notifications = principalNotifications }: { notifications?: Notice[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`Notifications, ${notifications.length} new`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-14 cursor-pointer place-items-center rounded-2xl border border-ink/8 bg-white text-primary shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0" />
        </svg>
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-danger text-[.68rem] font-bold text-white ring-2 ring-surface">
          {notifications.length}
        </span>
      </button>
      <Popover open={open} onClose={close} className="w-[min(440px,calc(100vw-32px))]">
        <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-3 pb-3 pt-1.5">
          <p className="text-[1rem] font-extrabold tracking-tight">System alerts</p>
          <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[.74rem] font-bold text-danger">{notifications.length} new</span>
        </div>
        {/* The list scrolls once it outgrows the popup; a very long message scrolls inside its own row. */}
        <ul className="mt-2 grid max-h-[min(65vh,520px)] gap-1 overflow-y-auto overscroll-contain pr-1">
          {notifications.map((n) => (
            <li key={n.text} className="flex gap-3.5 rounded-xl px-3 py-3.5 hover:bg-surface">
              <span aria-hidden className={`mt-2 size-2.5 shrink-0 rounded-full ${toneDot[n.tone]}`} />
              <span className="grid min-w-0 gap-1">
                <span className="max-h-32 overflow-y-auto overscroll-contain break-words pr-1 text-[.95rem] font-semibold leading-snug">{n.text}</span>
                <span className="text-[.8rem] text-ink/50">{n.when}</span>
              </span>
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  );
}
