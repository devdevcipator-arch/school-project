// Teacher attendance history: deterministic mock records from the joining date to today.
// Replace with the real check-in/check-out log in the backend phase.

import type { Teacher } from "./teachers";

export type DayState = "present" | "late" | "absent" | "leave";

export type DayRecord = {
  /** ISO date, e.g. "2026-10-13". */
  date: string;
  state: DayState;
  checkIn?: string;
  checkOut?: string;
  /** Minutes after the school start time (late days only). */
  minutesLate?: number;
  /** Leave type or absence note. */
  note?: string;
};

/** Teachers are marked late after this check-in time. */
export const SCHOOL_START = "08:00";

const leaveTypes = ["Sick leave", "Casual leave", "Annual leave", "Family emergency"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const hm = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/** Small seeded PRNG so every teacher always gets the same history. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Summer (Jun-Jul) and winter (22-31 Dec) breaks are not working days. */
function isVacation(d: Date) {
  const m = d.getUTCMonth();
  return m === 5 || m === 6 || (m === 11 && d.getUTCDate() >= 22);
}

/** Every working day since the teacher joined, newest first. Today's row mirrors the live check-in. */
export function attendanceHistory(t: Teacher, today = new Date()): DayRecord[] {
  const seed = Number(t.id.replace(/\D/g, "")) || t.name.length;
  const rand = rng(seed * 7919);
  // Some teachers are habitually later than others.
  const lateRate = 0.03 + (seed % 5) * 0.012;
  const absentRate = 0.012 + (seed % 3) * 0.006;

  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const todayIso = iso(end);
  // Inactive teachers stopped checking in about a month ago.
  if (t.status === "inactive") end.setUTCDate(end.getUTCDate() - 30);

  const out: DayRecord[] = [];
  let leaveLeft = 0;
  let leaveType = "";
  for (const d = new Date(`${t.joined}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6 || isVacation(d)) continue;
    const date = iso(d);
    const r = rand();

    if (date === todayIso) {
      const c = t.checkIn;
      if (c.state === "none") continue;
      if (c.state === "leave") out.push({ date, state: "leave", note: "Approved leave" });
      else if (c.state === "absent") out.push({ date, state: "absent", note: "No check-in" });
      else {
        const [h, m] = (c.time ?? "07:45").split(":").map(Number);
        out.push({ date, state: c.state, checkIn: c.time, minutesLate: c.state === "late" ? h * 60 + m - 8 * 60 : undefined });
      }
      continue;
    }

    if (leaveLeft > 0) {
      leaveLeft--;
      out.push({ date, state: "leave", note: leaveType });
    } else if (r < 0.014) {
      leaveType = leaveTypes[Math.floor(rand() * leaveTypes.length)];
      leaveLeft = Math.floor(rand() * 3); // 1-3 day leave
      out.push({ date, state: "leave", note: leaveType });
    } else if (r < 0.014 + absentRate) {
      out.push({ date, state: "absent", note: "No check-in, no leave request" });
    } else {
      const late = r < 0.014 + absentRate + lateRate;
      const minutesLate = late ? 3 + Math.floor(rand() * 40) : 0;
      const inMins = late ? 8 * 60 + minutesLate : 7 * 60 + 28 + Math.floor(rand() * 31);
      const outMins = 14 * 60 + Math.floor(rand() * 35);
      out.push({ date, state: late ? "late" : "present", checkIn: hm(inMins), checkOut: hm(outMins), minutesLate: late ? minutesLate : undefined });
    }
  }
  return out.reverse();
}

export type AttendanceSummary = Record<DayState, number> & { total: number; rate: number; avgLate: number };

export function summarize(records: DayRecord[]): AttendanceSummary {
  const s = { present: 0, late: 0, absent: 0, leave: 0 };
  let lateMins = 0;
  for (const r of records) {
    s[r.state]++;
    if (r.minutesLate) lateMins += r.minutesLate;
  }
  const total = records.length;
  return {
    ...s,
    total,
    // Attended = on time + late, out of all working days.
    rate: total ? Math.round(((s.present + s.late) / total) * 1000) / 10 : 0,
    avgLate: s.late ? Math.round(lateMins / s.late) : 0,
  };
}
