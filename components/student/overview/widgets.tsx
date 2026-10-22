
import { Kpi, Ring, kpiBig as big, kpiSub as sub } from "@/components/dashboard/kpi";
import { Badge, Bar } from "@/components/dashboard/ui";
import { latestResult, pendingWork, studentAttendance } from "@/lib/student";

/* ---------- KPI row ---------- */

export function KpiRow() {
  const { present, absent, leave } = studentAttendance;
  const rate = Math.round((present / (present + absent + leave)) * 100);
  const closing = pendingWork.filter((p) => p.state === "Closes today").length;
  const quizzes = pendingWork.filter((p) => p.kind !== "Homework").length;
  const homework = pendingWork.length - quizzes;
  const r = latestResult;
  const pct = Math.round((r.score / r.total) * 100);
  const diff = pct - r.classAverage;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3 sm:max-xl:[&>:last-child]:col-span-2">
      <Kpi fill label="Term Attendance" icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11">
        <div className="flex items-center gap-4">
          <Ring percent={rate} label={`${rate}% attendance this term`} />
          <div className="min-w-0">
            <p className={big}>{rate}%</p>
            <p className="mt-1.5 text-[.82rem] text-ink/60">present this term</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">Present {present}</Badge>
          <Badge tone={absent > 0 ? "danger" : "ok"}>Absent {absent}</Badge>
          <Badge tone="neutral">Leave {leave}</Badge>
        </div>
      </Kpi>

      <Kpi fill label="Pending Quizzes & Homework" icon="M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3">
        <p className={big}>
          {quizzes} <span className={sub}>quizzes</span>
          <span className="mx-2 text-ink/25">/</span>
          {homework} <span className={sub}>homework</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {closing > 0 && <Badge tone="warn">{closing} closes today</Badge>}
          <Badge tone="neutral">{pendingWork.length} to do</Badge>
        </div>
      </Kpi>

      <Kpi fill label="Latest Result" icon="M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6">
        <p className={big}>
          {r.score}/{r.total} <span className={sub}>{pct}%</span>
        </p>
        <div className="grid gap-1.5">
          <span className="flex items-center justify-between gap-2 text-[.82rem]">
            <span className="truncate font-semibold text-ink/70">{r.title}</span>
            <span className="shrink-0 text-ink/50">{r.gradedOn}</span>
          </span>
          <Bar value={pct} label={`${r.title}: ${pct}%`} />
        </div>
        <p className="text-[.82rem] text-ink/60">
          Class average <strong className="text-ink">{r.classAverage}%</strong>
          <span className={`ml-2 font-bold ${diff >= 0 ? "text-ok" : "text-danger"}`}>
            {diff >= 0 ? "+" : ""}
            {diff} pts
          </span>
        </p>
      </Kpi>
    </div>
  );
}
