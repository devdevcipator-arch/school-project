"use client";

import { useMemo, useState } from "react";
import { Chip, Select, ghostBtn } from "@/components/dashboard/controls";
import { Badge, type Tone } from "@/components/dashboard/ui";
import { attendanceHistory, SCHOOL_START, summarize, type DayState } from "@/lib/teacherAttendance";
import { clock, type Teacher } from "@/lib/teachers";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAGE = 25;

const stateMeta: Record<DayState, { label: string; tone: Tone; value: string }> = {
  present: { label: "On time", tone: "ok", value: "text-ok" },
  late: { label: "Late", tone: "warn", value: "text-[#9a6a0f]" },
  absent: { label: "Absent", tone: "danger", value: "text-danger" },
};

type Filter = "all" | Exclude<DayState, "present">;
const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All days" },
  { key: "absent", label: "Absences" },
  { key: "late", label: "Late arrivals" },
];

function dateParts(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { label: `${d} ${months[m - 1]} ${y}`, day: weekdays[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] };
}

/** Full attendance log since the teacher joined, with period + type filters. */
export default function AttendanceHistory({ t }: { t: Teacher }) {
  const all = useMemo(() => attendanceHistory(t), [t]);
  const years = useMemo(() => [...new Set(all.map((r) => r.date.slice(0, 4)))], [all]);
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);

  const period = useMemo(
    () => all.filter((r) => (year === "all" || r.date.startsWith(year)) && (month === "all" || r.date.slice(5, 7) === month)),
    [all, year, month],
  );
  const stats = useMemo(() => summarize(period), [period]);
  const rows = filter === "all" ? period : period.filter((r) => r.state === filter);
  const counts: Record<Filter, number> = { all: stats.total, absent: stats.absent, late: stats.late };
  const periodLabel = year === "all" && month === "all" ? "since joining" : [month !== "all" && months[Number(month) - 1], year !== "all" && year].filter(Boolean).join(" ");

  // Any filter change starts the list from the top again.
  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setShown(PAGE);
  };

  if (!all.length) {
    return <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">No attendance has been recorded for {t.name} yet.</p>;
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[1rem] font-extrabold tracking-tight">Attendance records</h3>
          <p className="text-[.8rem] text-ink/55">
            Showing {periodLabel}. Check-in after {clock(SCHOOL_START)} counts as late.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select label="Year" value={year} onChange={change(setYear)} className="w-[130px]">
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select label="Month" value={month} onChange={change(setMonth)} className="w-[140px]">
            <option value="all">All months</option>
            {months.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div role="radiogroup" aria-label="Filter records" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Chip key={f.key} type="radio" name={`att-filter-${t.id}`} checked={filter === f.key} onChange={() => change(setFilter)(f.key)}>
            {f.label}
            <span className="rounded-full bg-current/12 px-1.5 text-[.72rem] font-bold">{counts[f.key]}</span>
          </Chip>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">
          No {filters.find((f) => f.key === filter)!.label.toLowerCase()} {periodLabel}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/8">
          <table className="w-full min-w-[560px] border-collapse text-left text-[.82rem]">
            <thead className="bg-surface/70 text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/50">
              <tr>
                <th scope="col" className="px-3 py-2.5">Date</th>
                <th scope="col" className="px-3 py-2.5">Status</th>
                <th scope="col" className="px-3 py-2.5">Check-in</th>
                <th scope="col" className="px-3 py-2.5">Check-out</th>
                <th scope="col" className="px-3 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map((r) => {
                const { label, day } = dateParts(r.date);
                const m = stateMeta[r.state];
                return (
                  <tr key={r.date} className="border-t border-ink/8">
                    <th scope="row" className="whitespace-nowrap px-3 py-2.5 font-semibold">
                      {label}
                      <span className="ml-1.5 font-normal text-ink/45">{day}</span>
                    </th>
                    <td className="px-3 py-2.5">
                      <Badge tone={m.tone}>{m.label}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{r.checkIn ? clock(r.checkIn) : <span className="text-ink/35">-</span>}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{r.checkOut ? clock(r.checkOut) : <span className="text-ink/35">-</span>}</td>
                    <td className="px-3 py-2.5 text-ink/65">
                      {r.state === "late" ? <span className="font-semibold text-[#9a6a0f]">{r.minutesLate} min late</span> : r.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[.8rem] text-ink/55">
          <span aria-live="polite">
            Showing {Math.min(shown, rows.length)} of {rows.length} records
          </span>
          {shown < rows.length && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className={ghostBtn}>
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
