"use client";

import { useMemo, useState } from "react";
import { Chip, Select, ghostSm } from "@/components/dashboard/controls";
import { Icon } from "@/components/ui/Icon";
import { AS_OF, attendanceLogs, isSchoolDay, tally, type DayStatus, type Student } from "@/lib/students";
import { StatusBadge, statusMeta } from "./parts";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Filter = "all" | Exclude<DayStatus, "present">;

const pad = (n: number) => String(n).padStart(2, "0");
const monthLabel = (ym: string) => `${monthNames[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();
const longDate = (iso: string) => `${Number(iso.slice(8))} ${monthNames[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}`;

/** Every "YYYY-MM" from enrollment to the snapshot month, newest first. */
function monthsBetween(from: string, to: string) {
  const out: string[] = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  while (`${y}-${pad(m)}` <= to.slice(0, 7)) {
    out.push(`${y}-${pad(m)}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out.reverse();
}

/** Monthly calendar heatmap + date-wise log for one student, from enrollment to today. */
export default function AttendanceLogs({ s }: { s: Student }) {
  const months = useMemo(() => monthsBetween(s.enrolled, AS_OF), [s.enrolled]);
  const [month, setMonth] = useState(months[0]);
  const [filter, setFilter] = useState<Filter>("all");
  const [picked, setPicked] = useState<string | null>(null);

  const logs = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = `${month}-01`;
    const last = `${month}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`;
    return attendanceLogs(s, first < s.enrolled ? s.enrolled : first, last < AS_OF ? last : AS_OF);
  }, [s, month]);
  const byDate = useMemo(() => new Map(logs.map((l) => [l.date, l])), [logs]);
  const stats = tally(logs);
  const rows = logs.filter((l) => filter === "all" || l.status === filter).reverse();
  const at = months.indexOf(month);
  const go = (ym: string) => {
    setMonth(ym);
    setPicked(null);
  };

  // Monday-first grid: blank cells before the 1st, then every date of the month.
  const [y, m] = month.split("-").map(Number);
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (weekday(`${month}-01`) + 6) % 7;
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${pad(i + 1)}`)];
  const pickedLog = picked ? byDate.get(picked) : undefined;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button type="button" disabled={at === months.length - 1} onClick={() => go(months[at + 1])} aria-label="Previous month" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M15 18l-6-6 6-6" className="size-4" />
          </button>
          <h3 className="min-w-[150px] text-center text-[1rem] font-extrabold tracking-tight" aria-live="polite">
            {monthLabel(month)}
          </h3>
          <button type="button" disabled={at === 0} onClick={() => go(months[at - 1])} aria-label="Next month" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M9 6l6 6-6 6" className="size-4" />
          </button>
        </div>
        <Select label="Jump to month" value={month} onChange={go} className="w-[190px]">
          {months.map((ym) => (
            <option key={ym} value={ym}>
              {monthLabel(ym)}
            </option>
          ))}
        </Select>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Attendance", value: stats.total ? `${stats.rate}%` : "-", cls: "text-ink" },
          { label: "Present", value: stats.present, cls: "text-ok" },
          { label: "Absent", value: stats.absent, cls: "text-danger" },
          { label: "Leave", value: stats.leave, cls: "text-[#9a6a0f]" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-ink/8 bg-surface/50 p-3.5">
            <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{t.label}</dt>
            <dd className={`mt-1 text-[1.35rem] font-extrabold tracking-tight ${t.cls}`}>{t.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-label={`${monthLabel(month)} calendar`} className="rounded-2xl border border-ink/8 p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">
          {weekdays.map((d) => (
            <span key={d} className="py-1.5">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <span key={`b${i}`} aria-hidden />;
            const log = byDate.get(date);
            const day = Number(date.slice(8));
            if (!log) {
              const why = date > AS_OF ? "upcoming" : date < s.enrolled ? "before enrollment" : isSchoolDay(date) ? "" : "no school";
              return (
                <span key={date} title={why} className="grid aspect-square place-items-center rounded-xl text-[.8rem] text-ink/30 sm:aspect-auto sm:h-12">
                  {day}
                </span>
              );
            }
            const meta = statusMeta[log.status];
            const sel = picked === date;
            return (
              <button
                key={date}
                type="button"
                onClick={() => setPicked(sel ? null : date)}
                aria-pressed={sel}
                aria-label={`${longDate(date)}: ${meta.label}`}
                className={`grid aspect-square cursor-pointer content-center justify-items-center gap-1 rounded-xl border text-[.82rem] font-bold transition-colors sm:aspect-auto sm:h-12 ${
                  sel ? "border-primary bg-primary text-surface" : `border-ink/8 hover:border-accent ${date === AS_OF ? "ring-2 ring-accent" : ""}`
                }`}
              >
                {day}
                <span aria-hidden className={`size-2 rounded-full ${meta.dot} ${sel ? "ring-2 ring-surface" : ""}`} />
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[.76rem] text-ink/60">
          {(Object.keys(statusMeta) as DayStatus[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={`size-2 rounded-full ${statusMeta[k].dot}`} />
              {k === "leave" ? "Leave" : statusMeta[k].label}
            </span>
          ))}
          <span className="text-ink/40">Faded dates: weekend, holiday or upcoming</span>
        </div>
      </section>

      {pickedLog && (
        <p className="flex animate-fade-in flex-wrap items-center gap-2 rounded-2xl bg-surface p-3.5 text-[.86rem]">
          <strong>
            {dayNames[weekday(pickedLog.date)]}, {longDate(pickedLog.date)}
          </strong>
          <StatusBadge status={pickedLog.status} />
          {pickedLog.remark && <span className="text-ink/65">{pickedLog.remark}</span>}
        </p>
      )}

      <div role="radiogroup" aria-label="Filter log" className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All days", stats.total],
            ["absent", "Absences", stats.absent],
            ["leave", "Leaves", stats.leave],
          ] as const
        ).map(([k, label, n]) => (
          <Chip key={k} type="radio" name={`log-filter-${s.id}`} checked={filter === k} onChange={() => setFilter(k)}>
            {label}
            <span className="rounded-full bg-current/12 px-1.5 text-[.72rem] font-bold">{n}</span>
          </Chip>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">
          {logs.length === 0 ? "No school days recorded this month." : `No ${filter === "absent" ? "absences" : "leaves"} in ${monthLabel(month)}.`}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/8">
          <table className="w-full min-w-[480px] border-collapse text-left text-[.82rem]">
            <thead className="bg-surface/70 text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/50">
              <tr>
                <th scope="col" className="px-3 py-2.5">Date</th>
                <th scope="col" className="px-3 py-2.5">Day</th>
                <th scope="col" className="px-3 py-2.5">Status</th>
                <th scope="col" className="px-3 py-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.date} className={`border-t border-ink/8 transition-colors ${picked === l.date ? "bg-accent/12" : ""}`}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    {longDate(l.date)}
                  </th>
                  <td className="px-3 py-2.5 text-ink/60">{dayNames[weekday(l.date)]}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-3 py-2.5 text-ink/65">{l.remark ?? <span className="text-ink/35">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
