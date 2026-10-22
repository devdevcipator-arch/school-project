import { shortDate, utcMs, type DayStatus } from "@/lib/student";

/** Look of each day status. Present is the brand teal so it never sits beside red as a red/green pair. */
export const statusMeta: Record<DayStatus, { label: string; fill: string; soft: string; icon: string }> = {
  P: { label: "Present", fill: "bg-primary", soft: "bg-primary/7 text-primary", icon: "M5 12l4 4 10-10" },
  A: { label: "Absent", fill: "bg-danger", soft: "bg-danger/10 text-danger", icon: "M7 7l10 10 M17 7 7 17" },
  L: { label: "On leave", fill: "bg-warn", soft: "bg-warn/14 text-[#9a6a0f]", icon: "M8 3v3 M16 3v3 M4 7h16v13H4z M9 14h6" },
  H: { label: "Holiday", fill: "bg-ink/15", soft: "bg-ink/4 text-ink/45", icon: "M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const weekdayOf = (iso: string) => WEEKDAYS[new Date(utcMs(iso)).getUTCDay()];
/** "Tue 6 Oct" */
export const longDate = (iso: string) => `${weekdayOf(iso)} ${shortDate(iso)}`;
