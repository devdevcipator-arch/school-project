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

/** Page numbers to show: first, last and a window around the current page, with gaps as null. */
function pageWindow(page: number, pages: number): (number | null)[] {
  const keep = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  return keep.flatMap((p, i) => (i > 0 && p - keep[i - 1] > 1 ? [null, p] : [p]));
}

/** "Showing 1 to 12 of 30 teachers" plus page buttons. */
export function Pagination({ page, pages, total, size, noun, onPage }: { page: number; pages: number; total: number; size: number; noun: string; onPage: (p: number) => void }) {
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(total, page * size);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[.8rem] text-ink/55">
        Showing <strong className="text-ink">{from}</strong> to <strong className="text-ink">{to}</strong> of <strong className="text-ink">{total}</strong> {noun}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M15 18l-6-6 6-6" className="size-4" />
          </button>
          {pageWindow(page, pages).map((p, i) =>
            p === null ? (
              <span key={`gap${i}`} aria-hidden className="px-1 text-ink/40">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={`grid size-9 cursor-pointer place-items-center rounded-lg text-[.84rem] font-bold transition-colors ${p === page ? "bg-primary text-surface" : "text-ink/65 hover:bg-primary/8 hover:text-primary"}`}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label="Next page" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M9 6l6 6-6 6" className="size-4" />
          </button>
        </div>
      )}
    </nav>
  );
}

export type DirectoryView = "table" | "cards";

/** Table / Cards switch for directory pages (desktop only; smaller screens always get cards). */
export function ViewToggle({ view, onChange }: { view: DirectoryView; onChange: (v: DirectoryView) => void }) {
  return (
    <div role="group" aria-label="Layout" className="hidden rounded-xl border border-ink/10 p-1 lg:flex">
      {(
        [
          ["table", "Table", "M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14"],
          ["cards", "Cards", "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z"],
        ] as const
      ).map(([v, l, ic]) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => onChange(v)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[.82rem] font-semibold transition-colors ${view === v ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
        >
          <Icon d={ic} className="size-4" />
          {l}
        </button>
      ))}
    </div>
  );
}

/** Checkbox dropdown for multi-value filters; closes on outside click or Escape. */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  className = "",
}: {
  label: string;
  options: { value: string; label: string; hint?: ReactNode }[];
  value: string[];
  onChange: (v: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const summary = value.length === 0 ? label : value.length === 1 ? (options.find((o) => o.value === value[0])?.label ?? label) : `${label} (${value.length})`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${value.length ? `${value.length} selected` : "any"}`}
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex w-full cursor-pointer items-center justify-between gap-2 pr-3 text-left font-semibold ${value.length ? "border-primary text-primary" : ""}`}
      >
        <span className="truncate">{summary}</span>
        <svg viewBox="0 0 20 20" aria-hidden className={`size-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div id={listId} className="absolute left-0 top-[calc(100%+6px)] z-30 w-full min-w-[230px] animate-fade-in rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_20px_50px_rgba(6,30,41,.16)]">
          <div className="max-h-[280px] overflow-y-auto">
            {options.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[.86rem] font-semibold transition-colors hover:bg-primary/6">
                <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} className="size-4 accent-[#1D546D]" />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint}
              </label>
            ))}
          </div>
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full cursor-pointer rounded-xl border-t border-ink/8 px-3 py-2 text-left text-[.8rem] font-bold text-primary hover:bg-primary/6">
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
