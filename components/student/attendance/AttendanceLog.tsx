"use client";

import { useMemo, useState } from "react";
import { Pagination, Select, fieldClass, ghostSm } from "@/components/dashboard/controls";
import { Icon } from "@/components/ui/Icon";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { attendanceByMonth, attendanceLog, attendanceTerm, shortDate, type AttendanceDay, type DayStatus } from "@/lib/student";
import { statusMeta, weekdayOf } from "./status";

type LogTab = "all" | "missed";

const PAGE_SIZE = 10;
const newestFirst = [...attendanceLog].reverse();
const isMissed = (d: AttendanceDay) => d.status === "A" || d.status === "L";
const fullDate = (iso: string) => `${shortDate(iso)} ${iso.slice(0, 4)}`;

function StatusChip({ status }: { status: DayStatus }) {
  const m = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-current/15 px-2.5 py-1 text-[.74rem] font-semibold ${m.soft}`}>
      <span aria-hidden className={`size-2 rounded-full ${m.fill}`} />
      {m.label}
    </span>
  );
}

function LogTable({ list }: { list: AttendanceDay[] }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[640px] text-left text-[.86rem]">
        <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
          <tr>
            <th scope="col" className="w-[300px] px-5 py-3.5">Date</th>
            <th scope="col" className="w-[130px] px-3 py-3.5">Day</th>
            <th scope="col" className="w-[180px] px-3 py-3.5">Status</th>
            <th scope="col" className="px-3 py-3.5">Remark</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((d) => {
            const [day, month] = shortDate(d.date).split(" ");
            const today = d.date === attendanceTerm.asOf;
            return (
              <tr key={d.date} className="align-middle transition-colors hover:bg-surface/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-11 shrink-0 place-content-center rounded-xl text-center leading-none ${statusMeta[d.status].soft}`}>
                      <span className="text-[.62rem] font-bold uppercase">{month}</span>
                      <span className="mt-1 text-[.92rem] font-extrabold">{day}</span>
                    </span>
                    <span className="whitespace-nowrap font-bold">{fullDate(d.date)}</span>
                    {today && <span className="rounded-full bg-ink px-2 py-0.5 text-[.68rem] font-bold text-surface">Today</span>}
                  </div>
                </td>
                <td className="px-3 py-3 text-ink/70">{weekdayOf(d.date)}</td>
                <td className="px-3 py-3">
                  <StatusChip status={d.status} />
                </td>
                <td className={`px-3 py-3 ${d.note ? "text-ink/75" : "text-ink/35"}`}>{d.note ?? "No remark"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Day-by-day attendance log: every school day or only the days missed, with search, month and status filters. */
export default function AttendanceLog() {
  const [tab, setTab] = useState<LogTab>("all");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const onMissed = tab === "missed";

  const missed = useMemo(() => newestFirst.filter(isMissed), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (onMissed ? missed : newestFirst)
      .filter((d) => !q || `${fullDate(d.date)} ${weekdayOf(d.date)} ${statusMeta[d.status].label} ${d.note ?? ""}`.toLowerCase().includes(q))
      .filter((d) => month === "all" || d.date.startsWith(month))
      .filter((d) => status === "all" || d.status === status);
  }, [onMissed, missed, query, month, status]);

  const tabs: { key: LogTab; label: string; count: number }[] = [
    { key: "all", label: "All School Days", count: attendanceLog.length },
    { key: "missed", label: "Days Missed", count: missed.length },
  ];
  const { listRef, target, setHover } = useSlidingPill(onMissed ? 1 : 0);

  const filter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };
  const switchTab = (t: LogTab) => {
    setTab(t);
    setStatus("all");
    setPage(1);
  };
  const statusOptions: DayStatus[] = onMissed ? ["A", "L"] : ["P", "A", "L", "H"];
  const filtersOn = query || month !== "all" || status !== "all";

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul ref={listRef} role="tablist" aria-label="Attendance lists" className="relative flex w-max gap-1 rounded-full bg-surface p-1" onMouseLeave={() => setHover(null)}>
          <span data-pill aria-hidden className={pillClass} />
          {tabs.map((t, i) => (
            <li key={t.key} role="presentation">
              <button
                data-pill-item
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => switchTab(t.key)}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={`relative z-10 inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[.86rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                  i === target ? "text-surface" : "text-ink/65 hover:text-ink"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-[.72rem] font-bold transition-colors ${i === target ? "bg-surface/20" : "bg-ink/8"}`}>{t.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search attendance</span>
          <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
          <input type="search" value={query} onChange={(e) => filter(setQuery)(e.target.value)} placeholder="Search by date, day or remark" className={`${fieldClass} w-full pl-10`} />
        </label>
        <div className="grid grid-cols-2 gap-2.5 lg:flex">
          <Select label="Month" value={month} onChange={filter(setMonth)} className="lg:w-[180px]">
            <option value="all">All months</option>
            {attendanceByMonth.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={filter(setStatus)} className="lg:w-[170px]">
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {statusMeta[s].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtersOn && (
        <div className="flex flex-wrap items-center gap-2 text-[.8rem]">
          <span className="text-ink/50" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "match" : "matches"}
          </span>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setMonth("all");
              setStatus("all");
              setPage(1);
            }}
            className={ghostSm}
          >
            <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
            Clear filters
          </button>
        </div>
      )}

      {visible.length > 0 ? (
        <LogTable list={visible} />
      ) : (
        <p className="rounded-[18px] border border-dashed border-ink/12 px-5 py-10 text-center text-[.88rem] text-ink/55">No school days match these filters.</p>
      )}

      <Pagination page={current} pages={pages} total={filtered.length} size={PAGE_SIZE} noun="school days" onPage={setPage} />
    </section>
  );
}
