// Teacher portal, Class Attendance: assigned sections, rosters and past registers.
// Past days come from the same generator as the principal's student logs; replace with the real API later.

import { attendanceLogs, isSchoolDay, students, type DayStatus, type Student } from "./students";

/** Sections this teacher takes roll call for (same order as the Overview class picker). */
export const mySections = [
  { section: "10-A", label: "Grade 10 - Section A" },
  { section: "9-B", label: "Grade 9 - Section B" },
  { section: "8-A", label: "Grade 8 - Section A" },
];

export const rosterOf = (section: string): Student[] => students.filter((s) => s.section === section).sort((a, b) => a.rollNo - b.rollNo);

export type Mark = { status: DayStatus; remark: string };
export type Marks = Record<string, Mark>;

/** Exception-based default: everyone starts Present. */
export const allPresent = (roster: Student[]): Marks => Object.fromEntries(roster.map((s) => [s.id, { status: "present", remark: "" }]));

/** The register that was submitted for a past school day. */
export function pastRegister(roster: Student[], date: string): Marks {
  return Object.fromEntries(
    roster.map((s) => {
      const log = attendanceLogs(s, date, date)[0];
      return [s.id, { status: log?.status ?? "present", remark: log?.remark ?? "" }];
    }),
  );
}

/** Mock submission time for past registers, e.g. "08:12". */
export const pastSubmitTime = (date: string) => `08:${String(5 + (Number(date.slice(8)) % 20)).padStart(2, "0")}`;

export const remarkPresets: Record<Exclude<DayStatus, "present">, string[]> = {
  absent: ["Informed via parent call", "No information from parents", "Sick, guardian informed"],
  leave: ["Medical certificate submitted", "Approved leave application", "Family event"],
};

const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Nearest school day before (dir -1) or after (dir 1) a date. */
export function nextSchoolDay(iso: string, dir: 1 | -1) {
  let d = shift(iso, dir);
  for (let i = 0; i < 90 && !isSchoolDay(d); i++) d = shift(d, dir);
  return d;
}

/** School days from `from` to `to`, inclusive. */
export function schoolDaysBetween(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to; d = shift(d, 1)) if (isSchoolDay(d)) out.push(d);
  return out;
}
