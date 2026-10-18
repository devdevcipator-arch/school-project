// Teacher portal, My Attendance: the signed-in teacher's own record + leave data.
// Built on the same mock history the principal sees; replace with the real log in the backend phase.

import { attendanceHistory, type DayRecord } from "./teacherAttendance";
import { teachers, type Teacher } from "./teachers";

const roster = teachers.find((t) => t.name === "Ali Raza")!;

/** The signed-in teacher. Today's check-in mirrors the Overview chip (07:50 AM). */
export const me: Teacher = { ...roster, checkIn: { state: "present", time: "07:50" } };

export const SHIFT = { start: "08:00", end: "14:30" };
/** Academic session start; leave balances reset on this date. */
export const SESSION_START = "2026-08-01";

export const myHistory = (today = new Date()) => attendanceHistory(me, today);

/** Yearly leave entitlement per type (days). Used days are counted from the history. */
export const leavePolicy = [
  { type: "Casual leave", allowed: 10 },
  { type: "Sick leave", allowed: 8 },
  { type: "Annual leave", allowed: 12 },
  { type: "Family emergency", allowed: 3 },
];

export type LeaveStatus = "Approved" | "Pending" | "Rejected";

export type LeaveRequest = {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  submitted: string;
};

export const leaveRequests: LeaveRequest[] = [
  { id: "lr4", type: "Casual leave", from: "2026-10-29", to: "2026-10-30", days: 2, reason: "Sister's wedding", status: "Pending", submitted: "2026-10-16" },
  { id: "lr3", type: "Sick leave", from: "2026-09-22", to: "2026-09-22", days: 1, reason: "Fever, doctor's note attached", status: "Approved", submitted: "2026-09-22" },
  { id: "lr2", type: "Annual leave", from: "2026-09-04", to: "2026-09-04", days: 1, reason: "Personal work", status: "Rejected", submitted: "2026-09-01" },
  { id: "lr1", type: "Casual leave", from: "2026-08-18", to: "2026-08-18", days: 1, reason: "Bank and NADRA visit", status: "Approved", submitted: "2026-08-14" },
];

/** Leave days taken this session per type, from the attendance log. */
export function leaveUsed(records: DayRecord[]) {
  const used: Record<string, number> = {};
  for (const r of records) if (r.state === "leave" && r.date >= SESSION_START && r.note) used[r.note] = (used[r.note] ?? 0) + 1;
  return used;
}

/** Consecutive on-time working days, counting back from the latest record. */
export function onTimeStreak(records: DayRecord[]) {
  let n = 0;
  for (const r of records) {
    if (r.state !== "present") break;
    n++;
  }
  return n;
}
