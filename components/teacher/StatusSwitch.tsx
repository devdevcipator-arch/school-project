"use client";

import { useSyncExternalStore } from "react";

export type TeacherStatus = "in" | "break" | "leave";

const statuses: { key: TeacherStatus; label: string }[] = [
  { key: "in", label: "Checked in" },
  { key: "break", label: "Break" },
  { key: "leave", label: "Leave" },
];

// One status for the whole teacher portal, so Overview and My Attendance always agree.
// Kept for the browser session; front-end only until the backend lands.
const KEY = "teacher-status";
const listeners = new Set<() => void>();
let current: TeacherStatus | null = null;

const read = (): TeacherStatus => {
  if (current) return current;
  try {
    const v = sessionStorage.getItem(KEY);
    current = v === "break" || v === "leave" ? v : "in";
  } catch {
    current = "in";
  }
  return current;
};

export const setTeacherStatus = (s: TeacherStatus) => {
  current = s;
  try {
    sessionStorage.setItem(KEY, s);
  } catch {}
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useTeacherStatus = () => useSyncExternalStore(subscribe, read, () => "in" as TeacherStatus);

/** Checked in / Break / Leave segmented switch for the dark hero bars. */
export default function StatusSwitch({ className = "" }: { className?: string }) {
  const status = useTeacherStatus();
  return (
    <div role="radiogroup" aria-label="Today's status" className={`grid w-full grid-cols-3 gap-1 rounded-xl border border-surface/20 bg-surface/10 p-1 sm:w-[340px] ${className}`}>
      {statuses.map((x) => (
        <button
          key={x.key}
          type="button"
          role="radio"
          aria-checked={status === x.key}
          onClick={() => setTeacherStatus(x.key)}
          className={`cursor-pointer rounded-lg px-3 py-2 text-[.86rem] font-bold transition-colors ${status === x.key ? "bg-surface text-ink" : "text-surface/75 hover:bg-surface/10 hover:text-surface"}`}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}
