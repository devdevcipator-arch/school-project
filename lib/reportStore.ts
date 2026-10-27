// Result cards shared by the teacher Result Card page (input) and the student Result Card page (output).
// Front-end only: teacher edits are kept in this browser's storage so both portals show the same card.
// Replace with the API in the backend phase.

import { useMemo, useSyncExternalStore } from "react";
import { seedReports, totals, type Report, type TermId } from "./reports";
import type { Student } from "./students";

type Saved = Record<string, Report>;

const KEY = "report-cards-v1";
const EMPTY: Saved = {};
const listeners = new Set<() => void>();
let cache: Saved | null = null;

const keyOf = (section: string, term: TermId, studentId: string) => `${section}|${term}|${studentId}`;

const read = (): Saved => {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Saved) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
};

const write = (next: Saved) => {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  // The other portal saved or sent a card in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

/** One class's cards for a term: the seeded cards with any teacher edits on top, in roster order. */
export function useClassReports(section: string, term: TermId, roster: Student[]): Report[] {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY);
  return useMemo(() => seedReports(roster, section, term).map((r) => saved[keyOf(section, term, r.studentId)] ?? r), [saved, roster, section, term]);
}

export const saveReport = (section: string, term: TermId, r: Report) => write({ ...read(), [keyOf(section, term, r.studentId)]: r });

/** Class rank by percentage; ties keep roll order. */
export function rankOf(reports: Report[], index: number) {
  const pcts = reports.map((r) => totals(r).pct);
  const order = reports.map((_, i) => i).sort((a, b) => pcts[b] - pcts[a]);
  return order.indexOf(index) + 1;
}
