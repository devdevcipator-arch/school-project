import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { reportDate, type ProgressReport } from "@/lib/progressReports";
import { sectionLabel } from "@/lib/students";

/** One progress report as both portals show it. `showStudent` adds the student's name for the teacher's list. */
export default function ReportCard({ report, showStudent, action }: { report: ProgressReport; showStudent?: boolean; action?: ReactNode }) {
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {showStudent && (
            <h3 className="text-[.98rem] font-extrabold tracking-tight">
              {report.studentName} <span className="text-[.8rem] font-semibold text-ink/50">{sectionLabel(report.section)}</span>
            </h3>
          )}
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1 text-[.78rem] font-bold text-primary">
            <Icon d="M4 7h16v13H4z M4 11h16 M8 3v4 M16 3v4" className="size-3.5" />
            {report.timeFrame}
          </p>
        </div>
        {action}
      </div>
      <p className="mt-3 whitespace-pre-line text-[.9rem] leading-relaxed text-ink/80">{report.description}</p>
      <p className="mt-3 text-[.76rem] text-ink/50">
        By {report.author} on {reportDate(report.createdAt)}
      </p>
    </article>
  );
}
