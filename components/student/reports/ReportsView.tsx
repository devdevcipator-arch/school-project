"use client";

import ReportCard from "@/components/reports/ReportCard";
import { Icon } from "@/components/ui/Icon";
import { useProgressReports } from "@/lib/progressReports";
import { studentRecord } from "@/lib/student";

/** Read-only list of the progress reports teachers have written for this student. */
export default function ReportsView() {
  const mine = useProgressReports().filter((r) => r.studentId === studentRecord.id);

  return (
    <main className="mx-auto grid max-w-[1000px] gap-4 px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
      {mine.length === 0 ? (
        <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Icon d="M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5" className="size-6" />
          </span>
          <h2 className="mt-4 text-[1.1rem] font-extrabold tracking-tight">No reports yet</h2>
          <p className="mt-1.5 max-w-[440px] text-[.88rem] text-ink/60">Reports your teachers write about your performance will appear here.</p>
        </div>
      ) : (
        mine.map((r) => <ReportCard key={r.id} report={r} />)
      )}
    </main>
  );
}
