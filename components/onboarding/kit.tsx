"use client";

import type { ComponentProps, ReactNode } from "react";

// Small building blocks shared by the onboarding steps.

export const inputClass = (error?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-[.92rem] text-ink outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-ink/40 focus:ring-4 ${
    error ? "border-danger/70 focus:border-danger focus:ring-danger/15" : "border-ink/15 hover:border-accent focus:border-primary focus:ring-accent/25"
  }`;

export function Block({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-ink/8 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[1.02rem] font-bold">{title}</h3>
          {hint && <p className="mt-0.5 text-[.85rem] text-ink/60">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[.84rem] font-semibold text-ink/80">
      {children}
    </label>
  );
}

export function ErrorText({ id, error }: { id: string; error?: string }) {
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-nav ${error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <p id={`${id}-error`} role={error ? "alert" : undefined} className="overflow-hidden pt-1.5 text-[.8rem] font-medium text-danger">
        {error}
      </p>
    </div>
  );
}

/** Labelled input with its error line. */
export function TextField({ id, label, error, note, ...props }: ComponentProps<"input"> & { id: string; label: string; error?: string; note?: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass(error)} {...props} />
      {note && !error && <p className="pt-1.5 text-[.8rem] text-ink/55">{note}</p>}
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function SelectField({ id, label, ariaLabel, value, onChange, children, className = "" }: { id: string; label?: string; ariaLabel?: string; value: string | number; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label ? undefined : ariaLabel} className={`${inputClass()} cursor-pointer appearance-none pr-9`}>
          {children}
        </select>
        <svg viewBox="0 0 20 20" aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary">
          <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function RemoveButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-ink/45 transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink/45"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-3 py-2 text-[.85rem] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {children}
    </button>
  );
}

/** Toggle chip backed by a real checkbox. */
export function ToggleChip({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 text-[.88rem] font-semibold transition-[background-color,border-color,color] duration-300 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/30 ${
        checked ? "border-primary bg-primary text-surface" : "border-ink/15 bg-white text-ink/70 hover:border-accent hover:text-primary"
      }`}
    >
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {checked && (
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l4 4 10-10" />
        </svg>
      )}
      {children}
    </label>
  );
}

export function Stepper({ id, label, value, min, max, onChange, disabled }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const btn = "grid size-9 cursor-pointer place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div role="group" aria-labelledby={id} className="inline-flex items-center gap-1 rounded-xl border border-ink/12 bg-white p-0.5">
      <span id={id} className="sr-only">{label}</span>
      <button type="button" className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer: ${label}`}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /></svg>
      </button>
      <span aria-live="polite" className="w-7 text-center text-[.95rem] font-bold tabular-nums">{value}</span>
      <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`More: ${label}`}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl bg-accent/12 px-4 py-3 text-[.86rem] text-ink/75">
      <svg viewBox="0 0 24 24" aria-hidden className="mt-0.5 size-[18px] shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 11v5 M12 7.5v.5" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
