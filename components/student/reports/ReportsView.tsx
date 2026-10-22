"use client";

import { useState } from "react";
import { ghostBtn } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/ui";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { printReport } from "@/components/reports/printReport";
import ReportSheet from "@/components/reports/ReportSheet";
import { Icon } from "@/components/ui/Icon";
import { terms, totals, trendOf, type TermId, type Trend } from "@/lib/reports";
import { shortDate, studentRecord, studentReport } from "@/lib/student";
import { TERM_LABEL, classTeacherOf } from "@/lib/students";

type Availability = "published" | "preparing" | "not-started";

const reportsByTerm = Object.fromEntries(terms.map((t) => [t.id, studentReport(t.id)])) as Record<TermId, ReturnType<typeof studentReport>>;

/** Students only see a report once the class teacher has dispatched it. */
const availabilityOf = (term: TermId): Availability => {
  const r = reportsByTerm[term].report;
  if (r.sentAt) return "published";
  return r.marks.some((m) => m.obtained !== null) ? "preparing" : "not-started";
};

const availabilityMeta: Record<Availability, { label: string; dot: string }> = {
  published: { label: "Published", dot: "bg-ok" },
  preparing: { label: "In preparation", dot: "bg-warn" },
  "not-started": { label: "Not started", dot: "bg-ink/30" },
};

const trendText: Record<Trend, string> = {
  improving: "Improving",
  consistent: "Consistent",
  attention: "Needs attention",
};

const firstPublished = terms.find((t) => availabilityOf(t.id) === "published")?.id ?? terms[0].id;

function Locked({ availability, label }: { availability: Availability; label: string }) {
  return (
    <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
        <Icon d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z M12 15v2" className="size-6" />
      </span>
      <h2 className="mt-4 text-[1.1rem] font-extrabold tracking-tight">{label} report is not published yet</h2>
      <p className="mt-1.5 max-w-[440px] text-[.88rem] text-ink/60">
        {availability === "preparing"
          ? `${classTeacherOf(studentRecord.section)} is still compiling marks and remarks. It will appear here as soon as it is sent to you.`
          : "Marks for this term have not been compiled yet. Check back at the end of the term."}
      </p>
    </div>
  );
}

/** Read-only view of the report cards the class teacher has dispatched to this student. */
export default function ReportsView() {
  const [term, setTerm] = useState<TermId>(firstPublished);
  const { term: info, report, rank, size } = reportsByTerm[term];
  const availability = availabilityOf(term);
  const index = terms.findIndex((t) => t.id === term);
  const { listRef, target, setHover } = useSlidingPill(index);

  const t = totals(report);
  const trend = trendOf(report);
  const delta = Math.round((t.pct - report.previous) * 10) / 10;
  const best = report.marks.reduce((a, b) => ((b.obtained ?? 0) > (a.obtained ?? 0) ? b : a));
  const print = () => printReport(studentRecord, report, info.label, rank, size);

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul ref={listRef} role="tablist" aria-label="Report terms" className="relative flex w-max gap-1 rounded-full bg-white p-1 shadow-[0_10px_30px_rgba(6,30,41,.05)]" onMouseLeave={() => setHover(null)}>
          <span data-pill aria-hidden className={pillClass} />
          {terms.map((x, i) => (
            <li key={x.id} role="presentation">
              <button
                data-pill-item
                type="button"
                role="tab"
                aria-selected={term === x.id}
                onClick={() => setTerm(x.id)}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={`relative z-10 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[.86rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                  i === target ? "text-surface" : "text-ink/65 hover:text-ink"
                }`}
              >
                <span aria-hidden className={`size-2 rounded-full ${availabilityMeta[availabilityOf(x.id)].dot}`} />
                {x.label}
                <span className="sr-only">({availabilityMeta[availabilityOf(x.id)].label})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {availability !== "published" ? (
        <Locked availability={availability} label={info.label} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
            <StatCard label="Overall Result" value={`${t.pct}%`} icon="M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6" note={`Grade ${t.grade} · GPA ${t.gpa.toFixed(1)} / 4.0`} />
            <StatCard label="Class Rank" value={`${rank} of ${size}`} icon="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" note="Among Grade 10-A" />
            <StatCard label="Best Subject" value={`${best.obtained}%`} icon="M5 12l4 4 10-10" note={best.subject} />
            <StatCard
              label={trendText[trend]}
              value={`${delta >= 0 ? "+" : ""}${delta} pts`}
              icon={trend === "attention" ? "M4 7l6 6 4-4 6 6 M14 15h6V9" : "M4 17l6-6 4 4 6-6 M14 9h6v6"}
              note={`Was ${report.previous}% last term`}
            />
          </div>

          <section className="min-w-0 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[.84rem] text-ink/60">
                <span className="grid size-8 place-items-center rounded-lg bg-ok/10 text-ok">
                  <Icon d="M4 12l16-8-6 16-2-6z" className="size-4" />
                </span>
                <span>
                  Sent by <strong className="text-ink">{classTeacherOf(studentRecord.section)}</strong> on{" "}
                  <strong className="text-ink">
                    {shortDate(report.sentAt!.slice(0, 10))} {report.sentAt!.slice(0, 4)}
                  </strong>
                </span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" onClick={print} className={`${ghostBtn} max-sm:flex-1`}>
                  <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
                  Download PDF
                </button>
                <button type="button" onClick={print} className={`${ghostBtn} max-sm:flex-1`}>
                  <Icon d="M6 9V3h12v6 M6 18H4v-7h16v7h-2 M8 14h8v7H8z" className="size-[18px]" />
                  Print
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-surface/60 p-3 sm:p-7">
              <ReportSheet
                s={studentRecord}
                report={report}
                termLabel={info.label}
                rankText={`${rank} of ${size}`}
                remarks={
                  <>
                    <h3 className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Class teacher remarks</h3>
                    <p className="rounded-xl border border-ink/8 bg-surface/50 px-4 py-3 text-[.9rem] leading-relaxed text-ink/80">{report.remark || "No remarks."}</p>
                  </>
                }
                note={`Dispatched to the student dashboard and parent portal. Attendance counted for the ${TERM_LABEL.toLowerCase()}.`}
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
