"use client";

import { useMemo } from "react";
import { ghostBtn } from "@/components/dashboard/controls";
import { printDocument } from "@/components/dashboard/print";
import { Badge, Card, toneText, type Tone } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { FeeMarks } from "@/lib/classFees";
import { ACADEMIC_YEAR, DEFAULTER_MONTHS, MONTHS, monthLabel, monthShort } from "@/lib/fees";
import type { Student } from "@/lib/students";

const monthTone = (rate: number): Tone => (rate >= 90 ? "ok" : rate >= 75 ? "warn" : "danger");
const monthCell: Record<Tone, string> = {
  ok: "border-ok/25 bg-ok/8",
  warn: "border-warn/35 bg-warn/10",
  danger: "border-danger/30 bg-danger/8",
  serious: "",
  neutral: "",
};

type Month = { month: string; marks: FeeMarks | null; paid: number; unpaid: number; rate: number };

/** Academic-year month grid for the class, year summary, most-unpaid list and export. */
export default function HistoryView({
  sectionName,
  roster,
  months,
  currentMonth,
  registerFor,
  onOpenMonth,
}: {
  sectionName: string;
  roster: Student[];
  /** Months open for marking, up to the current one. */
  months: string[];
  currentMonth: string;
  /** Submitted marks for a month, or null when the month is not submitted yet. */
  registerFor: (month: string) => FeeMarks | null;
  onOpenMonth: (month: string) => void;
}) {
  const rows: Month[] = useMemo(
    () =>
      months.map((month) => {
        const marks = registerFor(month);
        const t = { paid: 0, unpaid: 0 };
        if (marks) for (const s of roster) t[marks[s.id]?.status ?? "paid"]++;
        return { month, marks, ...t, rate: marks ? Math.round((t.paid / roster.length) * 100) : 0 };
      }),
    [registerFor, roster, months],
  );
  const done = rows.filter((m) => m.marks);

  const avg = done.length ? Math.round(done.reduce((s, m) => s + m.rate, 0) / done.length) : 0;
  const unpaidEntries = done.reduce((s, m) => s + m.unpaid, 0);

  const perStudent = roster.map((s) => {
    const unpaid = done.filter((m) => m.marks![s.id]?.status === "unpaid").length;
    return { s, unpaid, paid: done.length - unpaid };
  });
  const defaulters = perStudent.filter((p) => p.unpaid >= DEFAULTER_MONTHS).length;
  const mostUnpaid = perStudent.filter((p) => p.unpaid > 0).sort((a, b) => b.unpaid - a.unpaid || a.s.rollNo - b.s.rollNo).slice(0, 5);

  const letter = (m: Month, id: string) => (m.marks![id]?.status === "unpaid" ? "U" : "P");

  const exportCsv = () => {
    const head = ["Roll No", "Name", "System ID", ...done.map((m) => monthShort(m.month)), "Months paid", "Months unpaid"];
    const lines = perStudent.map((p) => [p.s.rollNo, p.s.name, p.s.regId, ...done.map((m) => letter(m, p.s.id)), p.paid, p.unpaid]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `fees-${sectionName}-${ACADEMIC_YEAR}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () =>
    printDocument(`Fee register ${sectionName} ${ACADEMIC_YEAR}`, (e) => {
      const th = done.map((m) => `<th>${monthShort(m.month)}</th>`).join("");
      const body = perStudent
        .map((p) => `<tr><td>${p.s.rollNo}</td><td>${e(p.s.name)}</td>${done.map((m) => `<td>${letter(m, p.s.id)}</td>`).join("")}<td>${p.paid}</td><td>${p.unpaid}</td></tr>`)
        .join("");
      return `<div class="bar"></div><div class="page"><h1>Class ${e(sectionName)} fee register</h1>
<p class="muted">Session ${e(ACADEMIC_YEAR)} · ${done.length} months recorded · average ${avg}% cleared</p>
<table style="font-size:11px"><thead><tr><th>Roll</th><th>Name</th>${th}<th>Paid</th><th>Unpaid</th></tr></thead><tbody>${body}</tbody></table>
<p class="muted" style="margin-top:16px">P = Paid, U = Unpaid</p></div>`;
    });

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="grid xl:col-span-2">
        <Card title="Monthly Fee Calendar" subtitle={`Class ${sectionName} · Session ${ACADEMIC_YEAR}`}>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2">
            {MONTHS.map((month) => {
              const m = rows.find((r) => r.month === month);
              if (!m) {
                return (
                  <span key={month} className="flex min-h-[78px] flex-col justify-between rounded-xl border border-ink/8 bg-surface/50 p-2.5 text-ink/40">
                    <span className="text-[.86rem] font-extrabold leading-none">{monthShort(month)}</span>
                    <span className="text-[.72rem] font-semibold">Upcoming</span>
                  </span>
                );
              }
              const tone = monthTone(m.rate);
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => onOpenMonth(month)}
                  aria-label={m.marks ? `${monthLabel(month)}: ${m.rate}% paid, ${m.unpaid} unpaid. Open register` : `${monthLabel(month)}: not submitted yet. Open register`}
                  className={`flex min-h-[78px] cursor-pointer flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(6,30,41,.08)] ${
                    m.marks ? monthCell[tone] : "border-dashed border-warn/60 bg-white"
                  } ${month === currentMonth ? "ring-2 ring-accent" : ""}`}
                >
                  <span className="text-[.86rem] font-extrabold leading-none">
                    {monthShort(month)} <span className="font-semibold text-ink/45">{month.slice(2, 4)}</span>
                  </span>
                  {m.marks ? (
                    <>
                      <span className={`text-[.84rem] font-extrabold tabular-nums ${toneText[tone]}`}>{m.rate}% paid</span>
                      <span className="text-[.68rem] font-semibold text-ink/55">{m.unpaid} unpaid</span>
                    </>
                  ) : (
                    <span className="text-[.72rem] font-bold text-[#9a6a0f]">Pending</span>
                  )}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[.78rem] text-ink/65">
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-ok" />
              90% or more paid
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-warn" />
              75 to 90%
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-danger" />
              Below 75%
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full border border-dashed border-warn" />
              Not submitted
            </li>
            <li className="text-ink/50">Click a month to open its register.</li>
          </ul>
        </Card>
      </div>

      <Card title="Year Summary" subtitle={`Session ${ACADEMIC_YEAR}`}>
        <dl className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Avg. cleared", value: `${avg}%`, cls: toneText[monthTone(avg)] },
            { label: "Months recorded", value: done.length, cls: "text-ink" },
            { label: "Unpaid entries", value: unpaidEntries, cls: "text-danger" },
            { label: "Defaulters", value: defaulters, cls: "text-[#9a6a0f]" },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl border border-ink/8 bg-surface/50 p-3">
              <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{t.label}</dt>
              <dd className={`mt-1 text-[1.35rem] font-extrabold tracking-tight ${t.cls}`}>{t.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Most months unpaid</h3>
        {mostUnpaid.length === 0 ? (
          <p className="rounded-xl bg-ok/8 px-3 py-2.5 text-[.86rem] font-semibold text-ok">Every student is clear this session.</p>
        ) : (
          <ul className="divide-y divide-ink/6">
            {mostUnpaid.map((p) => (
              <li key={p.s.id} className="flex items-center gap-3 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[.72rem] font-extrabold text-surface">{String(p.s.rollNo).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate text-[.88rem] font-semibold">{p.s.name}</span>
                <Badge tone={p.unpaid >= DEFAULTER_MONTHS ? "danger" : "warn"}>
                  {p.unpaid} {p.unpaid === 1 ? "month" : "months"}
                </Badge>
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
