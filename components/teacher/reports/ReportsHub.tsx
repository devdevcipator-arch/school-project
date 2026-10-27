"use client";

import { useCallback, useMemo, useState } from "react";
import { Select, Toast, fieldClass, ghostBtn, ghostSm, type ToastData } from "@/components/dashboard/controls";
import { printReport } from "@/components/reports/printReport";
import ReportSheet from "@/components/reports/ReportSheet";
import { ResultStats, TermTabs, availabilityOf } from "@/components/reports/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mySections, rosterOf } from "@/lib/classAttendance";
import { rankOf, saveReport, useClassReports } from "@/lib/reportStore";
import { statusOf, suggestFeedback, terms, totals, type Report, type TermId } from "@/lib/reports";
import { shortDate } from "@/lib/student";
import { TERM_LABEL, sectionLabel } from "@/lib/students";

const aiIcon = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";
const sendIcon = "M4 12l16-8-6 16-2-6z";

/**
 * Input page: the same layout and card as the student Result Card page (the output),
 * with marks and remarks as fields. Sending publishes the card to that student's page.
 */
export default function ReportsHub() {
  const [section, setSection] = useState(mySections[0].section);
  const roster = useMemo(() => rosterOf(section), [section]);
  const [studentId, setStudentId] = useState(roster[0].id);
  const index = Math.max(0, roster.findIndex((s) => s.id === studentId));
  const s = roster[index];
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const byTerm = {
    "first-2026": useClassReports(section, "first-2026", roster),
    "mid-2026": useClassReports(section, "mid-2026", roster),
    "final-2026": useClassReports(section, "final-2026", roster),
  } satisfies Record<TermId, unknown>;
  const [term, setTerm] = useState<TermId>("first-2026");

  const info = terms.find((t) => t.id === term)!;
  const report = byTerm[term][index];
  const rank = rankOf(byTerm[term], index);
  const size = roster.length;
  const sent = !!report.sentAt;
  const t = totals(report);
  const ready = statusOf(report) === "ready";

  const save = (r: Report) => saveReport(section, term, r);
  const print = () => printReport(s, report, info.label, rank, size);
  const send = () => {
    save({ ...report, sentAt: new Date().toISOString() });
    setToast({ text: `Result card sent to ${s.name}.`, action: { label: "Undo", run: () => (save(report), setToast(null)) } });
  };

  const missing = [t.missing ? `${t.missing} subject mark${t.missing > 1 ? "s" : ""}` : "", report.remark.trim() ? "" : "class teacher remarks"].filter(Boolean).join(" and ");

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <TermTabs term={term} onTerm={setTerm} statusOf={(x) => availabilityOf(byTerm[x][index])} />
        <div className="grid gap-2.5 sm:grid-cols-2 xl:w-[520px]">
          <Select
            label="Class and section"
            value={section}
            onChange={(v) => {
              setSection(v);
              setStudentId(rosterOf(v)[0].id);
            }}
          >
            {mySections.map((x) => (
              <option key={x.section} value={x.section}>
                {x.label}
              </option>
            ))}
          </Select>
          <Select label="Student" value={s.id} onChange={setStudentId}>
            {roster.map((x) => (
              <option key={x.id} value={x.id}>
                #{String(x.rollNo).padStart(2, "0")} {x.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ResultStats report={report} rank={rank} size={size} classLabel={sectionLabel(section)} />

      <section className="min-w-0 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[.84rem] text-ink/60">
            <span className={`grid size-8 place-items-center rounded-lg ${sent ? "bg-ok/10 text-ok" : "bg-warn/12 text-[#9a6a0f]"}`}>
              <Icon d={sent ? sendIcon : "M12 20h9 M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"} className="size-4" />
            </span>
            {sent ? (
              <span>
                Sent to <strong className="text-ink">{s.name}</strong> on{" "}
                <strong className="text-ink">
                  {shortDate(report.sentAt!.slice(0, 10))} {report.sentAt!.slice(0, 4)}
                </strong>
              </span>
            ) : (
              <span>{ready ? "Ready to send. Changes save as you type." : `Still needed: ${missing}. Changes save as you type.`}</span>
            )}
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
            {!sent && (
              <button type="button" onClick={send} disabled={!ready} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:w-full")}>
                <Icon d={sendIcon} className="size-[18px]" />
                Send to Student
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface/60 p-3 sm:p-7">
          <ReportSheet
            s={s}
            report={report}
            termLabel={info.label}
            rankText={`${rank} of ${size}`}
            onMark={sent ? undefined : (i, patch) => save({ ...report, marks: report.marks.map((m, j) => (j === i ? { ...m, ...patch } : m)) })}
            remarks={
              sent ? (
                <>
                  <h3 className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Class teacher remarks</h3>
                  <p className="rounded-xl border border-ink/8 bg-surface/50 px-4 py-3 text-[.9rem] leading-relaxed text-ink/80">{report.remark || "No remarks."}</p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Class teacher remarks</h3>
                    <button type="button" onClick={() => save({ ...report, remark: suggestFeedback(s, report) })} className={ghostSm}>
                      <Icon d={aiIcon} className="size-4" />
                      AI Suggest Feedback
                    </button>
                  </div>
                  <textarea
                    value={report.remark}
                    onChange={(e) => save({ ...report, remark: e.target.value })}
                    rows={3}
                    placeholder="Write a short, constructive remark for the student and parents."
                    aria-label="Class teacher remarks"
                    className={`${fieldClass} resize-y ${report.remark.trim() ? "" : "border-warn"}`}
                  />
                </>
              )
            }
            note={`${sent ? "Dispatched to the student dashboard and parent portal." : "The student sees exactly this card once you send it."} Attendance counted for the ${TERM_LABEL.toLowerCase()}.`}
          />
        </div>
      </section>

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
