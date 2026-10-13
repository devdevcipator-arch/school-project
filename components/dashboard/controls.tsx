"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

// Shared form + feedback controls for portal pages (filters, toasts, slide-over drawers).

export const fieldClass =
  "rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-[.86rem] outline-none transition-colors hover:border-accent focus:border-primary";

export const ghostSm =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[.8rem] font-semibold text-ink/65 transition-colors hover:bg-primary/8 hover:text-primary";

export const ghostBtn =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-ink/12 bg-white px-[18px] py-[11px] text-[.92rem] font-semibold text-ink transition-[border-color,color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-primary";

export function Select({ label, value, onChange, children, className = "" }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={`relative ${className}`}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} w-full cursor-pointer appearance-none pr-9 font-semibold`}>
        {children}
      </select>
      <svg viewBox="0 0 20 20" aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary">
        <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </label>
  );
}

export type ToastData = { text: string; action?: { label: string; run: () => void } };

/** Bottom toast that dismisses itself after 5s; optional action (e.g. Undo). */
export function Toast({ text, action, onDone }: ToastData & { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex w-[min(460px,calc(100vw-32px))] -translate-x-1/2 animate-fade-in items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-[.88rem] text-surface shadow-[0_20px_50px_rgba(6,30,41,.35)]">
      <Icon d="M5 12l4 4 10-10" className="size-5 shrink-0 text-accent" />
      <span className="min-w-0 flex-1">{text}</span>
      {action && (
        <button type="button" onClick={action.run} className="cursor-pointer rounded-lg px-2.5 py-1 font-bold text-accent hover:bg-surface/10">
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Right-hand slide-over panel with the portal's dark gradient header.
 * Locks page scroll, closes on Escape/backdrop, and animates out before unmounting.
 * `children` receives a `close` function so forms can dismiss it after saving.
 */
export function Drawer({
  title,
  subtitle,
  onClose,
  footer,
  children,
  width = "max-w-[640px]",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  footer?: (close: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  width?: string;
}) {
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // Mount-only: the drawer unmounts after closing, so the first `close` stays valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden onClick={close} className={`absolute inset-0 bg-ink/55 backdrop-blur-[2px] transition-opacity duration-300 ${closing ? "opacity-0" : "animate-backdrop-in"}`} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-y-0 right-0 flex w-full ${width} flex-col bg-white shadow-[-24px_0_60px_rgba(6,30,41,.25)] outline-none transition-transform duration-300 ease-nav ${
          closing ? "translate-x-full" : "animate-drawer-in"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 bg-linear-135 from-ink to-primary px-5 py-5 text-surface sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[1.25rem] font-extrabold tracking-tight">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 text-[.84rem] text-surface/65">{subtitle}</div>}
          </div>
          <button type="button" aria-label="Close panel" onClick={close} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-surface/20 transition-colors hover:bg-surface/10">
            <Icon d="M6 6l12 12 M18 6 6 18" className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children(close)}</div>
        {footer && <footer className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-ink/10 bg-white px-5 py-4 sm:px-7">{footer(close)}</footer>}
      </div>
    </div>
  );
}

/** Small centered confirmation/info dialog. */
export function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-backdrop-in bg-ink/55 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={label} className="relative w-full max-w-[460px] animate-fade-in rounded-[22px] bg-white p-6 shadow-[0_30px_70px_rgba(6,30,41,.3)]">
        {children}
      </div>
    </div>
  );
}
/** Pill-shaped checkbox/radio used for audiences, grades, categories and channels. */
export function Chip({ type, name, checked, onChange, children }: { type: "radio" | "checkbox"; name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3.5 py-2 text-[.84rem] font-semibold text-ink/75 transition-[background-color,border-color,color] duration-200 hover:border-accent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-surface peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        {children}
      </span>
    </label>
  );
}
