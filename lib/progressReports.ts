// Progress reports: a teacher picks a student, names the time frame and writes about their performance.
// Shared by the teacher Reports page (write + list) and the student Reports page (read-only).
// Front-end only: kept in this browser's storage; replace with the API in the backend phase.

import { useSyncExternalStore } from "react";
import { classRoster, studentRecord } from "./student";
import { teacher } from "./teacher";

export type ProgressReport = {
  id: string;
  studentId: string;
  studentName: string;
  section: string;
  timeFrame: string;
  description: string;
  author: string;
  createdAt: string;
};

const KEY = "progress-reports-v1";
const listeners = new Set<() => void>();
let cache: ProgressReport[] | null = null;

const other = classRoster.find((s) => s.id !== studentRecord.id) ?? studentRecord;

const SEED: ProgressReport[] = [
  {
    id: "seed-2",
    studentId: studentRecord.id,
    studentName: studentRecord.name,
    section: studentRecord.section,
    timeFrame: "October 2026",
    description:
      "Ayesha has kept up her strong start. Her Mathematics work is accurate and neatly presented, and she now explains her steps clearly when asked. She should spend a little more time on English essay structure before the mid-term.",
    author: teacher.name,
    createdAt: "2026-10-30T10:15:00.000Z",
  },
  {
    id: "seed-1",
    studentId: studentRecord.id,
    studentName: studentRecord.name,
    section: studentRecord.section,
    timeFrame: "August to September 2026",
    description:
      "A confident first month back. Ayesha participates actively, submits homework on time and helps classmates during group work. Science practicals need a bit more care with recording observations.",
    author: teacher.name,
    createdAt: "2026-09-30T09:00:00.000Z",
  },
  {
    id: "seed-0",
    studentId: other.id,
    studentName: other.name,
    section: other.section,
    timeFrame: "October 2026",
    description: "Steady progress this month. Attendance has improved and classwork is more complete. Regular revision of Physics formulas is recommended.",
    author: teacher.name,
    createdAt: "2026-10-28T11:40:00.000Z",
  },
];

const read = (): ProgressReport[] => {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ProgressReport[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
};

const write = (next: ProgressReport[]) => {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  // The other portal changed the list in another tab.
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

/** All reports, newest first. */
export const useProgressReports = () => useSyncExternalStore(subscribe, read, () => SEED);

export const addReport = (r: Omit<ProgressReport, "id" | "createdAt" | "author">) => {
  const report: ProgressReport = { ...r, id: `r-${Date.now()}`, author: teacher.name, createdAt: new Date().toISOString() };
  write([report, ...read()]);
  return report;
};

export const removeReport = (id: string) => write(read().filter((r) => r.id !== id));

export const restoreReports = (list: ProgressReport[]) => write(list);

export const getReports = () => read();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const reportDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
