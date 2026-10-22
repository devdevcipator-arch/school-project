"use client";

import { useState } from "react";
import { attendanceByWeek, studentAttendance, type AttendanceGroup } from "@/lib/student";
import { statusMeta, stackOrder } from "./status";

const DAYS_PER_WEEK = 5;
const ticks = [0, 1, 2, 3, 4, 5];
const countOf = (w: AttendanceGroup, s: (typeof stackOrder)[number]) => (s === "P" ? w.present : s === "A" ? w.absent : w.leave);
const termCount = { P: studentAttendance.present, A: studentAttendance.absent, L: studentAttendance.leave };

/** Stacked weekly columns: school days present, on leave and absent, with a hover/focus tooltip per week. */
export default function WeeklyChart() {
  const [active, setActive] = useState<number | null>(null);
  const last = attendanceByWeek.length - 1;

  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[.8rem] text-ink/65">
        {stackOrder.map((s) => (
          <li key={s} className="inline-flex items-center gap-2">
            <span aria-hidden className={`size-2.5 rounded-[3px] ${statusMeta[s].fill}`} />
            {statusMeta[s].label} <strong className="text-ink">{termCount[s]}</strong>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex">
        {/* y axis labels */}
        <div aria-hidden className="relative mr-2 h-[220px] w-4 shrink-0 text-right text-[.72rem] tabular-nums text-ink/45">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / DAYS_PER_WEEK) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-[220px]" onMouseLeave={() => setActive(null)}>
            {ticks.map((t) => (
              <span
                key={t}
                aria-hidden
                className={`absolute inset-x-0 border-t ${t === 0 ? "border-ink/20" : "border-dashed border-ink/8"}`}
                style={{ bottom: `${(t / DAYS_PER_WEEK) * 100}%` }}
              />
            ))}

            <ul className="absolute inset-0 flex items-end gap-1.5 sm:gap-3">
              {attendanceByWeek.map((w, i) => {
                const schoolDays = w.present + w.absent + w.leave;
                const on = active === i;
                const align = i < 2 ? "left-0" : i > last - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
                return (
                  <li
                    key={w.key}
                    tabIndex={0}
                    aria-label={`Week of ${w.label}: ${w.present} present, ${w.leave} on leave, ${w.absent} absent${w.holidays ? `, ${w.holidays} holiday` : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className={`relative flex h-full flex-1 cursor-default flex-col justify-end rounded-t-lg outline-offset-2 transition-colors ${on ? "bg-ink/4" : ""}`}
                  >
                    <span
                      className="mx-auto flex w-full max-w-9 flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]"
                      style={{ height: `${(schoolDays / DAYS_PER_WEEK) * 100}%` }}
                    >
                      {stackOrder.map((s) =>
                        countOf(w, s) > 0 ? <span key={s} className={statusMeta[s].fill} style={{ flex: `${countOf(w, s)} 1 0` }} /> : null,
                      )}
                    </span>

                    {on && (
                      <span role="tooltip" className={`absolute bottom-full z-10 mb-2 w-max min-w-[150px] rounded-xl bg-ink px-3.5 py-2.5 text-[.78rem] text-surface shadow-[0_14px_30px_rgba(6,30,41,.25)] ${align}`}>
                        <strong className="block text-[.82rem]">Week of {w.label}</strong>
                        {stackOrder.map((s) => (
                          <span key={s} className="mt-1 flex items-center gap-2">
                            <span aria-hidden className={`size-2 rounded-[2px] ${statusMeta[s].fill}`} />
                            <span className="flex-1 text-surface/75">{statusMeta[s].label}</span>
                            <strong className="tabular-nums">{countOf(w, s)}</strong>
                          </span>
                        ))}
                        {w.holidays > 0 && <span className="mt-1 block text-surface/60">{w.holidays} school holiday</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* x axis labels: every week on wide screens, every other on phones */}
          <div aria-hidden className="mt-2 flex gap-1.5 text-center text-[.7rem] text-ink/50 sm:gap-3">
            {attendanceByWeek.map((w, i) => (
              <span key={w.key} className={`flex-1 whitespace-nowrap ${i % 2 ? "max-sm:invisible" : ""}`}>
                {w.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>School days per week</caption>
        <thead>
          <tr>
            <th>Week of</th>
            <th>Present</th>
            <th>On leave</th>
            <th>Absent</th>
          </tr>
        </thead>
        <tbody>
          {attendanceByWeek.map((w) => (
            <tr key={w.key}>
              <td>{w.label}</td>
              <td>{w.present}</td>
              <td>{w.leave}</td>
              <td>{w.absent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
