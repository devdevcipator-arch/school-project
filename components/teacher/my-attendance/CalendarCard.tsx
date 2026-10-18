"use client";

import { useMemo, useState } from "react";
import { ghostSm } from "@/components/dashboard/controls";
import { Badge, Card } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import { summarize, type DayRecord } from "@/lib/teacherAttendance";
import { clock } from "@/lib/teachers";
import { detailOf, monthLabel, shortDay, stateMeta } from "./shared";

type Cell = { date: string; day: number; record?: DayRecord; kind: "record" | "pending" | "upcoming" | "off" };

/** Every month from the first record to the current month, oldest first. */
function monthRange(first: string, last: string) {
  const out: string[] = [];
  let [y, m] = first.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

function monthCells(key: string, byDate: Map<string, DayRecord>, todayIso: string, pending: Set<string>) {
  const [y, m] = key.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (Cell | null)[] = [];
  for (let day = 1; day <= last; day++) {
    const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
    if (wd === 0 || wd === 6) continue;
    // Pad the first week so day columns line up Mon to Fri.
    if (!cells.length) for (let i = 1; i < wd; i++) cells.push(null);
    const date = `${key}-${String(day).padStart(2, "0")}`;
    const record = byDate.get(date);
    const kind = record ? "record" : date > todayIso ? (pending.has(date) ? "pending" : "upcoming") : "off";
    cells.push({ date, day, record, kind });
  }
  return cells;
}

/** Month view of own attendance, Mon to Fri, with a detail strip for the selected day. */
export default function CalendarCard({ records, todayIso, pendingLeave }: { records: DayRecord[]; todayIso: string; pendingLeave: Set<string> }) {
  const byDate = useMemo(() => new Map(records.map((r) => [r.date, r])), [records]);
  const months = useMemo(() => monthRange((records.at(-1)?.date ?? todayIso).slice(0, 7), todayIso.slice(0, 7)), [records, todayIso]);
  const [idx, setIdx] = useState(months.length - 1);
  const [selected, setSelected] = useState<string | null>(null);
  const key = months[idx];

  const cells = monthCells(key, byDate, todayIso, pendingLeave);
  const stats = summarize(records.filter((r) => r.date.startsWith(key)));
  const sel = cells.find((c) => c?.date === selected) ?? null;

  const go = (d: number) => {
    setIdx((i) => Math.min(months.length - 1, Math.max(0, i + d)));
    setSelected(null);
  };

  return (
    <Card
      title="Attendance Calendar"
      subtitle={stats.total ? `${stats.rate}% attendance in ${monthLabel(key)}` : `No working days recorded in ${monthLabel(key)}`}
      action={
        <div className="flex items-center gap-1 rounded-xl border border-ink/10 p-1">
          <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous month" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M15 18l-6-6 6-6" className="size-4" />
          </button>
          <span aria-live="polite" className="min-w-[128px] text-center text-[.86rem] font-bold">
            {monthLabel(key)}
          </span>
          <button type="button" onClick={() => go(1)} disabled={idx === months.length - 1} aria-label="Next month" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M9 6l6 6-6 6" className="size-4" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <span key={d} className="pb-1 text-center text-[.7rem] font-bold uppercase tracking-[.1em] text-ink/45">
            {d}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={`pad${i}`} />;
          const meta = c.record && stateMeta[c.record.state];
          const label = meta
            ? c.record!.state === "late"
              ? `Late ${c.record!.minutesLate}m`
              : meta.label
            : c.kind === "pending"
              ? "Leave req."
              : c.kind === "upcoming"
                ? ""
                : "Off";
          const style = meta
            ? meta.cell
            : c.kind === "pending"
              ? "border-dashed border-warn/60 bg-white text-[#9a6a0f]"
              : c.kind === "upcoming"
                ? "border-dashed border-ink/12 bg-white text-ink/40"
                : "border-ink/6 bg-ink/3 text-ink/35";
          const isToday = c.date === todayIso;
          return (
            <button
              key={c.date}
              type="button"
              onClick={() => setSelected(c.date === selected ? null : c.date)}
              aria-pressed={c.date === selected}
              aria-label={`${shortDay(c.date)}: ${label || "upcoming"}`}
              className={`flex min-h-[58px] cursor-pointer flex-col items-start justify-between rounded-xl border p-1.5 text-left transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(6,30,41,.08)] sm:min-h-[72px] sm:p-2.5 ${style} ${
                c.date === selected ? "ring-2 ring-primary ring-offset-1" : isToday ? "ring-2 ring-accent" : ""
              }`}
            >
              <span className={`text-[.86rem] font-extrabold leading-none ${meta ? "text-ink" : ""}`}>{c.day}</span>
              <span className="w-full truncate text-[.64rem] font-bold sm:text-[.72rem]">{label}</span>
              {c.record?.checkIn && <span className="hidden text-[.66rem] font-semibold text-ink/50 md:block">{clock(c.record.checkIn)}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 min-h-[52px] rounded-2xl border border-ink/8 bg-surface/60 px-4 py-3" aria-live="polite">
        {sel ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="grid">
              <strong className="text-[.9rem]">{shortDay(sel.date)}</strong>
              <span className="text-[.8rem] text-ink/60">
                {sel.record
                  ? detailOf(sel.record, clock) || "No times recorded"
                  : sel.kind === "pending"
                    ? "Leave request waiting for principal approval"
                    : sel.kind === "upcoming"
                      ? "Upcoming working day"
                      : "School holiday or break, no attendance needed"}
              </span>
            </span>
            {sel.record && <Badge tone={stateMeta[sel.record.state].tone}>{stateMeta[sel.record.state].label}</Badge>}
            {sel.kind === "pending" && <Badge tone="warn">Pending</Badge>}
          </div>
        ) : (
          <p className="text-[.82rem] text-ink/55">Select a day to see check-in, check-out and notes.</p>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[.78rem] text-ink/65">
        {(["present", "late", "absent", "leave"] as const).map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${stateMeta[s].fill}`} />
            {stateMeta[s].label} <strong className="text-ink">{stats[s]}</strong>
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full border border-dashed border-warn" />
          Leave requested
        </li>
      </ul>
    </Card>
  );
}
