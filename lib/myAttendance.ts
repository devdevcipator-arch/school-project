// Teacher portal, My Attendance: the signed-in teacher's own record.
// Built on the same mock history the principal sees; replace with the real log in the backend phase.

import { attendanceHistory, type DayRecord } from "./teacherAttendance";
import { teachers, type Teacher } from "./teachers";

const roster = teachers.find((t) => t.name === "Ali Raza")!;

/** The signed-in teacher. Today's check-in mirrors the Overview chip (07:50 AM). */
export const me: Teacher = { ...roster, checkIn: { state: "present", time: "07:50" } };

export const SHIFT = { start: "08:00", end: "14:30" };
/** Academic session start. */
export const SESSION_START = "2026-08-01";

export const myHistory = (today = new Date()) => attendanceHistory(me, today);

/** Consecutive on-time working days, counting back from the latest record. */
export function onTimeStreak(records: DayRecord[]) {
  let n = 0;
  for (const r of records) {
    if (r.state !== "present") break;
    n++;
  }
  return n;
}
