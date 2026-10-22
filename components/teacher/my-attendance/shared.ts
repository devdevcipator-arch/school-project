import type { Tone } from "@/components/dashboard/ui";
import type { DayState } from "@/lib/teacherAttendance";

export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const stateMeta: Record<DayState, { label: string; tone: Tone; cell: string; fill: string }> = {
  present: { label: "On time", tone: "ok", cell: "border-ok/25 bg-ok/8 text-ok", fill: "bg-ok" },
  late: { label: "Late", tone: "warn", cell: "border-warn/35 bg-warn/10 text-[#9a6a0f]", fill: "bg-warn" },
  absent: { label: "Absent", tone: "danger", cell: "border-danger/30 bg-danger/8 text-danger", fill: "bg-danger" },
  leave: { label: "Leave", tone: "neutral", cell: "border-primary/25 bg-primary/8 text-primary", fill: "bg-primary" },
};

const pad = (n: number) => String(n).padStart(2, "0");
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const utc = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

/** "2026-10-14" to "Wed, 14 Oct". */
export function shortDay(isoDate: string) {
  const d = utc(isoDate);
  return `${weekdayNames[d.getUTCDay()]}, ${d.getUTCDate()} ${monthNames[d.getUTCMonth()].slice(0, 3)}`;
}

/** "2026-10" to "October 2026". */
export const monthLabel = (key: string) => `${monthNames[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
