"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";

export const roles = ["Admin", "Teacher", "Student"] as const;
export type Role = (typeof roles)[number];

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fieldBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-[.95rem] text-ink outline-none placeholder:text-ink/40 transition-[border-color,box-shadow,translate] duration-300 ease-soft hover:-translate-y-0.5 focus:-translate-y-0.5 focus:ring-4";

export function fieldClass(error?: string) {
  return `${fieldBase} ${
    error
      ? "border-danger/70 focus:border-danger focus:ring-danger/15"
      : "border-ink/15 hover:border-accent focus:border-primary focus:ring-accent/25"
  }`;
}

export function fieldAria(id: string, error?: string) {
  return { "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
}

export function Field({ id, label, error, aside, children }: { id: string; label: string; error?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-[.85rem] font-semibold text-ink/80">{label}</label>
        {aside}
      </div>
      {children}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-nav ${error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <p id={`${id}-error`} role={error ? "alert" : undefined} className="overflow-hidden pt-1.5 text-[.8rem] font-medium text-danger">
          {error}
        </p>
      </div>
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ error, className = "", ...props }: ComponentProps<"input"> & { error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${fieldClass(error)} pr-12 ${className}`} {...fieldAria(props.id ?? "", error)} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-ink/50 transition-colors hover:text-primary"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          {show && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  );
}

/** Role switcher using the platform sliding pill. */
export function RoleTabs({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const { listRef, target, setHover } = useSlidingPill(roles.indexOf(value));
  return (
    <div role="radiogroup" aria-label="I am a" ref={listRef} onMouseLeave={() => setHover(null)} className="relative grid grid-cols-3 rounded-full bg-ink/5 p-1">
      <span data-pill aria-hidden className={pillClass} />
      {roles.map((r, i) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={r === value}
          data-pill-item
          onClick={() => onChange(r)}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          className={`relative z-10 cursor-pointer rounded-full py-2.5 text-[.9rem] font-semibold transition-colors duration-[350ms] ease-nav ${
            i === target ? "text-surface" : "text-ink/70 hover:text-ink"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function Spinner() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-surface/40 border-t-surface" />;
}
