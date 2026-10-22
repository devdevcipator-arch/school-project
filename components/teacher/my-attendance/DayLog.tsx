"use client";

import { useMemo, useState } from "react";
import { Chip, Pagination, Select, fieldClass } from "@/components/dashboard/controls";
import { Card } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import { summarize, type DayRecord, type DayState } from "@/lib/teacherAttendance";
import { clock } from "@/lib/teachers";
import { monthLabel, monthNames, stateMeta, weekdayNames } from "./shared";

type Filter = "all" | DayState;
type Sort = "newest" | "oldest";

const PAGE_SIZE = 15;

// Same look as the class roster's P / A / L toggle, but read-only: the record comes from check-in.
const segments: { state: DayState; key: string; short: string; on: string }[] = [
  { state: "present", key: "P", short: "On time", on: "border-ok bg-ok text-white shadow-[0_6px_14px_rgba(46,139,87,.3)]" },
  { state: "late", key: "L", short: "Late", on: "border-warn bg-warn text-white shadow-[0_6px_14px_rgba(201,138,22,.3)]" },
  { state: "absent", key: "A", short: "Absent", on: "border-danger bg-danger text-white shadow-[0_6px_14px_rgba(192,57,43,.3)]" },
  { state: "leave", key: "Lv", short: "Leave", on: "border-primary bg-primary text-white shadow-[0_6px_14px_rgba(29,84,109,.3)]" },
];

const rowTint: Record<DayState, string> = {
  present: "border-ink/8 bg-white",
  late: "border-warn/40 bg-warn/5",
  absent: "border-danger/30 bg-danger/4",
  leave: "border-primary/25 bg-primary/4",
};

const parts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return { day: d.getUTCDate(), weekday: weekdayNames[d.getUTCDay()], label: `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
};

function StatusBar({ state, date }: { state: DayState; date: string }) {
  return (
    <div role="img" aria-label={`${date}: ${stateMeta[state].label}`} className="grid grid-cols-4 gap-1 rounded-xl border border-ink/10 bg-surface/70 p-1">
      {segments.map((s) => (
        <span
          key={s.state}
          aria-hidden
          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-[.8rem] font-extrabold ${s.state === state ? s.on : "border-transparent text-ink/40"}`}
        >
          {s.key}
          <span className="font-semibold max-[380px]:sr-only lg:max-xl:sr-only">{s.short}</span>
        </span>
      ))}
    </div>
  );
}

/** Teacher's own day-by-day attendance in the class-roster layout: search, month, sort and status filters. */
export default function DayLog({ records, todayIso }: { records: DayRecord[]; todayIso: string }) {
  const months = useMemo(() => [...new Set(records.map((r) => r.date.slice(0, 7)))], [records]);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(todayIso.slice(0, 7));
  const [sort, setSort] = useState<Sort>("newest");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const inMonth = useMemo(() => (month === "all" ? records : records.filter((r) => r.date.startsWith(month))), [records, month]);
  const stats = summarize(inMonth);
  const counts: Record<Filter, number> = { all: stats.total, present: stats.present, late: stats.late, absent: stats.absent, leave: stats.leave };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = inMonth
      .filter((r) => filter === "all" || r.state === filter)
      .filter((r) => {
        if (!q) return true;
        const p = parts(r.date);
        return `${p.label} ${p.weekday} ${stateMeta[r.state].label} ${r.note ?? ""}`.toLowerCase().includes(q);
      });
    return sort === "oldest" ? [...list].reverse() : list;
  }, [inMonth, filter, query, sort]);

  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All Days" },
    { key: "present", label: "On Time" },
    { key: "late", label: "Late" },
    { key: "absent", label: "Absent" },
    { key: "leave", label: "Leave" },
  ];

  return (
    <Card className="!p-0">
      <div className="grid gap-3 border-b border-ink/8 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[1.05rem] font-extrabold tracking-tight">Daily Attendance</h2>
            <p className="mt-0.5 text-[.84rem] text-ink/55">
              {stats.total ? `${stats.rate}% attendance in ${month === "all" ? "this session" : monthLabel(month)}` : "No working days recorded yet"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search by date, day or note</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-ink/40" />
            <input type="search" value={query} onChange={(e) => change(setQuery)(e.target.value)} placeholder="Search date, day or note" className={`${fieldClass} w-full pl-10`} />
          </label>
          <Select label="Month" value={month} onChange={change(setMonth)} className="w-full sm:w-[190px]">
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
          <Select label="Sort days" value={sort} onChange={(v) => change(setSort)(v as Sort)} className="w-full sm:w-[190px]">
            <option value="newest">Date (newest first)</option>
            <option value="oldest">Date (oldest first)</option>
          </Select>
        </div>
        <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Chip key={t.key} type="radio" name="day-log-filter" checked={filter === t.key} onChange={() => change(setFilter)(t.key)}>
              {t.key !== "all" && <span aria-hidden className={`size-2 rounded-full ${stateMeta[t.key].fill}`} />}
              {t.label}
              <span className="rounded-full bg-current/12 px-1.5 text-[.72rem] font-bold">{counts[t.key]}</span>
            </Chip>
          ))}
        </div>
      </div>

      {/* Column header (desktop table layout) */}
      <div className="hidden grid-cols-[72px_minmax(200px,1fr)_220px_minmax(300px,420px)] gap-4 bg-surface/70 px-5 py-2.5 text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/50 lg:grid">
        <span>Date</span>
        <span>Day</span>
        <span>Check-in / out</span>
        <span>Status</span>
      </div>

      {visible.length === 0 ? (
        <p className="m-5 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">No days match this search or filter.</p>
      ) : (
        <ul className="grid gap-2.5 p-3 sm:p-4 lg:gap-0 lg:p-0" aria-label="Daily attendance">
          {visible.map((r) => {
            const p = parts(r.date);
            const today = r.date === todayIso;
            return (
              <li
                key={r.date}
                className={`grid gap-3 rounded-2xl border p-3.5 lg:grid-cols-[72px_minmax(200px,1fr)_220px_minmax(300px,420px)] lg:items-center lg:gap-x-4 lg:rounded-none lg:border-0 lg:border-t lg:px-5 lg:py-3 ${rowTint[r.state]}`}
              >
                <div className="flex items-center gap-3 lg:contents">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-[.86rem] font-extrabold tabular-nums text-surface">{String(p.day).padStart(2, "0")}</span>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 text-[.74rem] font-bold text-primary">{p.weekday}</span>
                    <span className="grid min-w-0">
                      <span className="flex items-center gap-2 truncate text-[.94rem] font-bold">
                        {p.label}
                        {today && <span className="rounded-full bg-ink px-2 py-px text-[.66rem] font-bold text-surface">Today</span>}
                      </span>
                      <span className="truncate text-[.74rem] text-ink/55">{r.note ?? (r.state === "late" ? `${r.minutesLate} min after the 08:00 AM start` : "Regular working day")}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  {r.checkIn ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/10 bg-white px-2.5 py-1 text-[.76rem] font-bold tabular-nums text-ink/75">
                      <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" className="size-3.5 text-primary" />
                      {clock(r.checkIn)}
                      {r.checkOut ? ` to ${clock(r.checkOut)}` : today ? " · on campus" : ""}
                    </span>
                  ) : (
                    <span className="text-[.8rem] text-ink/45">No check-in</span>
                  )}
                </div>

                <StatusBar state={r.state} date={p.label} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-ink/8 px-4 py-3 sm:px-5">
        <Pagination page={current} pages={pages} total={rows.length} size={PAGE_SIZE} noun="days" onPage={setPage} />
      </div>
    </Card>
  );
}
