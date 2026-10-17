import { Kpi, Ring, SplitBar, kpiBig as big, kpiSub as sub } from "@/components/dashboard/kpi";
import { Badge } from "@/components/dashboard/ui";
import type { ClassOverview } from "@/lib/teacher";

/** The four snapshot metrics for the selected class. */
export default function KpiRow({ c }: { c: ClassOverview }) {
  const { present, absent, leave } = c.attendance;
  const total = present + absent + leave;
  const rate = ((present / total) * 100).toFixed(1);
  const resources = c.resources.books + c.resources.guides + c.resources.materials;
  const active = c.assessments.filter((a) => a.state === "Active").length;
  const dueToday = c.assessments.filter((a) => a.state === "Due today").length;
  const scheduled = c.assessments.filter((a) => a.state === "Scheduled").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Kpi label="Class Overall Progress" icon="M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6">
        <div className="flex items-center gap-4">
          <Ring percent={c.curriculum} label={`${c.curriculum}% of curriculum covered`} />
          <div className="min-w-0">
            <p className={big}>{c.curriculum}%</p>
            <p className="mt-1.5 text-[.82rem] text-ink/60">curriculum covered</p>
          </div>
        </div>
        <p className="text-[.82rem] text-ink/60">
          Performance index <strong className="text-ink">{c.performanceIndex}/100</strong>
        </p>
      </Kpi>

      <Kpi label="Today's Class Attendance" icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11">
        <p className={big}>
          {present}/{total} <span className={sub}>present ({rate}%)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge tone={absent > 0 ? "danger" : "ok"}>Absent {absent}</Badge>
          <Badge tone="neutral">On leave {leave}</Badge>
        </div>
      </Kpi>

      <Kpi label="Total Class Resources" icon="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z M11 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7 M14 8h3 M14 12h3">
        <p className={big}>
          {resources} <span className={sub}>resources active</span>
        </p>
        <SplitBar
          parts={[
            { label: "Books", value: c.resources.books, fill: "bg-primary" },
            { label: "Guides", value: c.resources.guides, fill: "bg-accent" },
            { label: "Material", value: c.resources.materials, fill: "bg-ink/30" },
          ]}
        />
      </Kpi>

      <Kpi label="Active & Upcoming Assessments" icon="M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3">
        <p className={big}>
          {active} <span className={sub}>active</span>
          <span className="mx-2 text-ink/25">/</span>
          {dueToday} <span className={sub}>due today</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {dueToday > 0 && <Badge tone="warn">{dueToday} due today</Badge>}
          <Badge tone="neutral">{scheduled} scheduled</Badge>
        </div>
      </Kpi>
    </div>
  );
}
