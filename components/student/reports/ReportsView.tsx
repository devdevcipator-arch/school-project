"use client";

import { useState } from "react";
import { ghostBtn } from "@/components/dashboard/controls";
import { printReport } from "@/components/reports/printReport";
import ReportSheet from "@/components/reports/ReportSheet";
import { ResultStats, TermTabs, availabilityOf, type Availability } from "@/components/reports/parts";
import { Icon } from "@/components/ui/Icon";
import { rankOf, useClassReports } from "@/lib/reportStore";
import { terms, type TermId } from "@/lib/reports";
import { STUDENT_SECTION, classRoster, shortDate, studentRecord } from "@/lib/student";
import { TERM_LABEL, classTeacherOf, sectionLabel } from "@/lib/students";

const myIndex = classRoster.indexOf(studentRecord);

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

/** Output page: the result cards the class teacher has sent, read-only. The teacher's Result Card page is its input form. */
export default function ReportsView() {
  const byTerm = {
    "first-2026": useClassReports(STUDENT_SECTION, "first-2026", classRoster),
    "mid-2026": useClassReports(STUDENT_SECTION, "mid-2026", classRoster),
    "final-2026": useClassReports(STUDENT_SECTION, "final-2026", classRoster),
  } satisfies Record<TermId, unknown>;
  const statusOf = (t: TermId) => availabilityOf(byTerm[t][myIndex]);
  const [term, setTerm] = useState<TermId>(() => terms.find((t) => statusOf(t.id) === "published")?.id ?? terms[0].id);

  const info = terms.find((t) => t.id === term)!;
  const report = byTerm[term][myIndex];
  const rank = rankOf(byTerm[term], myIndex);
  const size = classRoster.length;
  const availability = statusOf(term);
  const print = () => printReport(studentRecord, report, info.label, rank, size);

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <TermTabs term={term} onTerm={setTerm} statusOf={statusOf} />

      {availability !== "published" ? (
        <Locked availability={availability} label={info.label} />
      ) : (
        <>
          <ResultStats report={report} rank={rank} size={size} classLabel={sectionLabel(STUDENT_SECTION)} />

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
