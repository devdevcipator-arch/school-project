"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { attendanceByMonth, attendanceTerm, utcMs, type AttendanceDay } from "@/lib/student";
import { longDate, statusMeta } from "./status";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Every weekday of a month, with leading blanks so the 1st lands under its weekday. */
function monthCells(key: string, days: AttendanceDay[]) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const [y, m] = key.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: ({ date: string; day: number; entry?: AttendanceDay } | null)[] = [];
  for (let d = 1; d <= total; d++) {
    const date = `${key}-${String(d).padStart(2, "0")}`;
    const weekday = new Date(utcMs(date)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if (cells.length === 0) for (let k = 1; k < weekday; k++) cells.push(null);
    cells.push({ date, day: d, entry: byDate.get(date) });
  }
  return cells;
}

/** Month-by-month calendar: one cell per school day, marked present, absent, on leave or holiday. */
export default function MonthCalendar() {
  const [index, setIndex] = useState(attendanceByMonth.length - 1);
  const month = attendanceByMonth[index];
  const cells = monthCells(month.key, month.days);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Month" className="flex gap-1 rounded-full bg-surface p-1">
          {attendanceByMonth.map((m, i) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-[.82rem] font-bold transition-colors ${
                i === index ? "bg-white text-primary shadow-[0_4px_12px_rgba(6,30,41,.08)]" : "text-ink/55 hover:text-primary"
              }`}
            >
              {m.label.split(" ")[0].slice(0, 3)}
            </button>
          ))}
        </div>
        <p className="text-[.82rem] text-ink/55">
          {month.label}: <strong className="text-ink">{month.present}</strong> present, <strong className="text-ink">{month.absent}</strong> absent,{" "}
          <strong className="text-ink">{month.leave}</strong> leave
        </p>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-2">
        {weekdays.map((d) => (
          <span key={d} className="pb-1 text-center text-[.72rem] font-bold uppercase tracking-[.08em] text-ink/45">
            {d}
          </span>
        ))}

        {cells.map((c, i) => {
          if (!c) return <span key={`blank-${i}`} aria-hidden />;
          const meta = c.entry ? statusMeta[c.entry.status] : null;
          const today = c.date === attendanceTerm.asOf;
          const label = `${longDate(c.date)}: ${meta ? meta.label : c.date < attendanceTerm.start ? "Before term" : "Upcoming"}${c.entry?.note ? `, ${c.entry.note}` : ""}`;
          return (
            <div
              key={c.date}
              title={label}
              aria-label={label}
              className={`flex min-h-[58px] flex-col justify-between rounded-xl p-1.5 sm:min-h-[68px] sm:p-2.5 ${
                meta ? meta.soft : "border border-dashed border-ink/10 text-ink/30"
              } ${today ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              <span className="text-[.82rem] font-extrabold tabular-nums">{c.day}</span>
              {meta && (
                <span className="flex items-center gap-1 text-[.72rem] font-bold">
                  <Icon d={meta.icon} className="size-3.5 shrink-0" />
                  <span className="truncate max-md:hidden">{meta.label}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[.78rem] text-ink/50">Weekends are not shown. The outlined day is today; dashed days are outside the term so far.</p>
    </div>
  );
}
