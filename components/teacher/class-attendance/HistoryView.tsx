"use client";

import { useMemo, useState } from "react";
import { ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { printDocument } from "@/components/dashboard/print";
import { Badge, Card, toneText, type Tone } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { schoolDaysBetween, type Marks } from "@/lib/classAttendance";
import { TERM_LABEL, TERM_START, type DayStatus, type Student } from "@/lib/students";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthLabel = (ym: string) => `${monthNames[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
const letter: Record<DayStatus, string> = { present: "P", absent: "A", leave: "L" };

const dayTone = (rate: number): Tone => (rate >= 95 ? "ok" : rate >= 85 ? "warn" : "danger");
const dayCell: Record<Tone, string> = {
  ok: "border-ok/25 bg-ok/8",
  warn: "border-warn/35 bg-warn/10",
  danger: "border-danger/30 bg-danger/8",
  serious: "",
  neutral: "",
};

type Day = { date: string; marks: Marks | null; present: number; absent: number; leave: number; rate: number };

/** Term calendar for the class, month summary, most-absent list and monthly export. */
export default function HistoryView({
  sectionName,
  roster,
  todayIso,
  registerFor,
  onOpenDay,
}: {
  sectionName: string;
  roster: Student[];
  todayIso: string;
  /** Submitted marks for a day, or null when the day is not submitted yet. */
  registerFor: (date: string) => Marks | null;
  onOpenDay: (date: string) => void;
}) {
  const days: Day[] = useMemo(
    () =>
      schoolDaysBetween(TERM_START, todayIso).map((date) => {
        const marks = registerFor(date);
        const t = { present: 0, absent: 0, leave: 0 };
        if (marks) for (const s of roster) t[marks[s.id]?.status ?? "present"]++;
        return { date, marks, ...t, rate: marks ? Math.round((t.present / roster.length) * 1000) / 10 : 0 };
      }),
    [registerFor, roster, todayIso],
  );
  const months = useMemo(() => [...new Set(days.map((d) => d.date.slice(0, 7)))], [days]);
  const [idx, setIdx] = useState(months.length - 1);
  const ym = months[Math.min(idx, months.length - 1)];
  const monthDays = days.filter((d) => d.date.startsWith(ym));
  const done = monthDays.filter((d) => d.marks);

  const avg = done.length ? Math.round((done.reduce((s, d) => s + d.rate, 0) / done.length) * 10) / 10 : 0;
  const absences = done.reduce((s, d) => s + d.absent, 0);
  const leaves = done.reduce((s, d) => s + d.leave, 0);

  const perStudent = roster.map((s) => {
    const t = { present: 0, absent: 0, leave: 0 };
    for (const d of done) t[d.marks![s.id]?.status ?? "present"]++;
    return { s, ...t, rate: done.length ? Math.round((t.present / done.length) * 1000) / 10 : 0 };
  });
  const mostAbsent = perStudent.filter((p) => p.absent + p.leave > 0).sort((a, b) => b.absent - a.absent || b.leave - a.leave).slice(0, 5);

  // Calendar grid, Mon to Fri, padded so the first school day sits under its weekday.
  const firstWd = monthDays.length ? new Date(`${monthDays[0].date}T00:00:00Z`).getUTCDay() : 1;
  const cells: (Day | null)[] = [...Array(Math.max(0, firstWd - 1)).fill(null), ...monthDays];

  const exportCsv = () => {
    const head = ["Roll No", "Name", "System ID", ...done.map((d) => d.date.slice(8)), "Present", "Absent", "Leave", "Attendance %"];
    const lines = perStudent.map((p) => [p.s.rollNo, p.s.name, p.s.regId, ...done.map((d) => letter[d.marks![p.s.id]?.status ?? "present"]), p.present, p.absent, p.leave, p.rate]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `attendance-${sectionName}-${ym}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () =>
    printDocument(`Attendance ${sectionName} ${monthLabel(ym)}`, (e) => {
      const th = done.map((d) => `<th>${Number(d.date.slice(8))}</th>`).join("");
      const rows = perStudent
        .map(
          (p) =>
            `<tr><td>${p.s.rollNo}</td><td>${e(p.s.name)}</td>${done.map((d) => `<td>${letter[d.marks![p.s.id]?.status ?? "present"]}</td>`).join("")}<td>${p.present}</td><td>${p.absent}</td><td>${p.leave}</td><td>${p.rate}%</td></tr>`,
        )
        .join("");
      return `<div class="bar"></div><div class="page"><h1>Class ${e(sectionName)} attendance</h1>
<p class="muted">${e(monthLabel(ym))} · ${e(TERM_LABEL)} · ${done.length} school days · class average ${avg}%</p>
<table style="font-size:10px"><thead><tr><th>Roll</th><th>Name</th>${th}<th>P</th><th>A</th><th>L</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>
<p class="muted" style="margin-top:16px">P = Present, A = Absent, L = Leave</p></div>`;
    });

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="grid xl:col-span-2">
        <Card
          title="Monthly Attendance Calendar"
          subtitle={`Class ${sectionName} · ${TERM_LABEL}`}
          action={
            <div className="flex items-center gap-1 rounded-xl border border-ink/10 p-1">
              <button type="button" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Previous month" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
                <Icon d="M15 18l-6-6 6-6" className="size-4" />
              </button>
              <span aria-live="polite" className="min-w-[128px] text-center text-[.86rem] font-bold">
                {monthLabel(ym)}
              </span>
              <button type="button" onClick={() => setIdx(Math.min(months.length - 1, idx + 1))} disabled={idx >= months.length - 1} aria-label="Next month" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
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
            {cells.map((d, i) => {
              if (!d) return <span key={`pad${i}`} />;
              const tone = dayTone(d.rate);
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => onOpenDay(d.date)}
                  aria-label={d.marks ? `${d.date}: ${d.rate}% present, ${d.absent} absent, ${d.leave} on leave. Open register` : `${d.date}: not submitted yet. Open register`}
                  className={`flex min-h-[64px] cursor-pointer flex-col items-start justify-between rounded-xl border p-1.5 text-left transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(6,30,41,.08)] sm:min-h-[78px] sm:p-2.5 ${
                    d.marks ? dayCell[tone] : "border-dashed border-warn/60 bg-white"
                  } ${d.date === todayIso ? "ring-2 ring-accent" : ""}`}
                >
                  <span className="text-[.86rem] font-extrabold leading-none">{Number(d.date.slice(8))}</span>
                  {d.marks ? (
                    <>
                      <span className={`text-[.74rem] font-extrabold tabular-nums sm:text-[.84rem] ${toneText[tone]}`}>{d.rate}%</span>
                      <span className="hidden text-[.66rem] font-semibold text-ink/55 md:block">
                        {d.absent}A · {d.leave}L
                      </span>
                    </>
                  ) : (
                    <span className="text-[.66rem] font-bold text-[#9a6a0f] sm:text-[.72rem]">Pending</span>
                  )}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[.78rem] text-ink/65">
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-ok" />
              95% or more present
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-warn" />
              85 to 95%
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-danger" />
              Below 85%
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full border border-dashed border-warn" />
              Not submitted
            </li>
            <li className="text-ink/50">Click a day to open its register.</li>
          </ul>
        </Card>
      </div>

      <Card title="Month Summary" subtitle={monthLabel(ym)}>
        <dl className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Class average", value: `${avg}%`, cls: toneText[dayTone(avg)] },
            { label: "School days", value: done.length, cls: "text-ink" },
            { label: "Absences", value: absences, cls: "text-danger" },
            { label: "Leaves", value: leaves, cls: "text-[#9a6a0f]" },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl border border-ink/8 bg-surface/50 p-3">
              <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{t.label}</dt>
              <dd className={`mt-1 text-[1.35rem] font-extrabold tracking-tight ${t.cls}`}>{t.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Most days missed</h3>
        {mostAbsent.length === 0 ? (
          <p className="rounded-xl bg-ok/8 px-3 py-2.5 text-[.86rem] font-semibold text-ok">Full attendance this month.</p>
        ) : (
          <ul className="divide-y divide-ink/6">
            {mostAbsent.map((p) => (
              <li key={p.s.id} className="flex items-center gap-3 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[.72rem] font-extrabold text-surface">{String(p.s.rollNo).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate text-[.88rem] font-semibold">{p.s.name}</span>
                {p.absent > 0 && <Badge tone="danger">{p.absent} A</Badge>}
                {p.leave > 0 && <Badge tone="warn">{p.leave} L</Badge>}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
          <button type="button" onClick={exportPdf} disabled={!done.length} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50")}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Export PDF
          </button>
          <button type="button" onClick={exportCsv} disabled={!done.length} className={`${ghostBtn} disabled:pointer-events-none disabled:opacity-50`}>
            <Icon d="M7 3h7l5 5v13H7z M14 3v5h5" className="size-[18px]" />
            Export CSV
          </button>
        </div>
      </Card>
    </div>
  );
}
