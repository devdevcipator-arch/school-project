import Link from "next/link";
import { Badge, Bar, Card, CardLink } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { assessmentStateTone, type AssessmentFormat, type ClassOverview } from "@/lib/teacher";

const sectionLabel = "mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50";
const plus = "M12 5v14 M5 12h14";

/* ---------- 3. Class attendance ---------- */

/** Donut with a small gap between segments; legend carries the numbers. */
function Donut({ parts }: { parts: { label: string; value: number; stroke: string }[] }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.value, 0);
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 3 : 0;
  const lens = parts.map((p) => (p.value / total) * c);
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((s, l) => s + l, 0));
  return (
    <svg viewBox="0 0 110 110" className="size-[132px] shrink-0 -rotate-90" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
      <circle cx="55" cy="55" r={r} fill="none" strokeWidth="13" className="stroke-ink/6" />
      {parts.map((p, i) => {
        const dash = Math.max(0, lens[i] - gap);
        return (
          <circle key={p.label} cx="55" cy="55" r={r} fill="none" strokeWidth="13" className={p.stroke} strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-starts[i]}>
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

export function AttendanceWidget({ c }: { c: ClassOverview }) {
  const { present, absent, leave, updatedAt } = c.attendance;
  const total = present + absent + leave;
  const parts = [
    { label: "Present", value: present, stroke: "stroke-ok", fill: "bg-ok" },
    { label: "Absent", value: absent, stroke: "stroke-danger", fill: "bg-danger" },
    { label: "On leave", value: leave, stroke: "stroke-accent", fill: "bg-accent" },
  ];
  return (
    <Card title="Class Attendance" subtitle={`Today's breakdown · updated ${updatedAt}`}>
      {/* Full-width row: breakdown and action on the left, today's absentees on the right. */}
      <div className="grid gap-x-10 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <Donut parts={parts} />
              <span className="absolute inset-0 grid place-content-center text-center">
                <span className="text-[1.5rem] font-extrabold leading-none">{Math.round((present / total) * 100)}%</span>
                <span className="mt-1 text-[.7rem] font-semibold text-ink/50">present</span>
              </span>
            </div>
            <ul className="grid flex-1 gap-2.5">
              {parts.map((p) => (
                <li key={p.label} className="flex items-center justify-between gap-3 rounded-xl bg-surface/70 px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-[.86rem] font-semibold text-ink/70">
                    <span aria-hidden className={`size-2.5 rounded-full ${p.fill}`} />
                    {p.label}
                  </span>
                  <strong className="tabular-nums">{p.value}</strong>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/teacher/class-attendance" className={buttonClass("primary", "md", "mt-5 w-full")}>
            <Icon d="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11" className="size-[18px]" />
            Mark / Update Class Attendance
          </Link>
        </div>

        <div>
          <h3 className={`${sectionLabel} lg:mt-0`}>Absent or on leave today</h3>
          {c.absentees.length === 0 ? (
            <p className="rounded-xl bg-ok/8 px-3 py-2.5 text-[.86rem] font-semibold text-ok">Everyone is in class today.</p>
          ) : (
            <ul className="divide-y divide-ink/6">
              {c.absentees.map((s) => (
                <li key={s.name} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[.78rem] font-bold text-primary">
                    {s.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-[.9rem] font-semibold">{s.name}</span>
                    <span className="truncate text-[.78rem] text-ink/55">{s.roll}</span>
                  </span>
                  <Badge tone={s.tone}>{s.note}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ---------- 5. Assessments ---------- */

const formatStyle: Record<AssessmentFormat, string> = {
  "MCQ Test": "bg-primary/10 text-primary",
  "Subjective / Task": "bg-accent/15 text-[#3d6e71]",
  "AI-Generated Quiz": "bg-ink text-surface",
};

export function AssessmentsWidget({ c }: { c: ClassOverview }) {
  return (
    <Card
      title="Assessments & Tasks"
      subtitle="Ongoing and scheduled for this class"
      action={
        <Link href="/teacher/assessments?new=1" className={buttonClass("primary", "md", "!px-4 !py-2 text-[.84rem]")}>
          <Icon d={plus} className="size-4" />
          Create New Assessment
        </Link>
      }
    >
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {c.assessments.map((a) => {
          const pct = Math.round((a.submitted / a.total) * 100);
          return (
            <li
              key={a.title}
              className={`rounded-2xl border p-3.5 transition-[border-color,background-color] duration-300 ${
                a.state === "Due today" ? "border-warn/40 bg-warn/5" : "border-ink/8 hover:border-accent/60 hover:bg-surface/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid min-w-0">
                  <span className="text-[.92rem] font-bold">{a.title}</span>
                  <span className="text-[.78rem] text-ink/55">{a.subject}</span>
                </span>
                <Badge tone={assessmentStateTone[a.state]}>{a.state}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[.7rem] font-bold ${formatStyle[a.format]}`}>
                  {a.format === "AI-Generated Quiz" && <Icon d="M12 3v4 M12 17v4 M3 12h4 M17 12h4" className="size-3" />}
                  {a.format}
                </span>
                <span className="text-[.76rem] text-ink/55">{a.deadline}</span>
              </div>
              {a.state !== "Scheduled" && (
                <div className="mt-2.5 grid grid-cols-[1fr_auto] items-center gap-3">
                  <Bar value={a.submitted} max={a.total} fill={pct >= 75 ? "bg-ok" : "bg-warn"} label={`${a.title}: ${a.submitted} of ${a.total} submitted`} />
                  <span className="text-[.76rem] font-semibold tabular-nums text-ink/65">
                    {a.submitted}/{a.total} submitted
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <CardLink href="/teacher/assessments">Open Assessments & AI Test Maker</CardLink>
    </Card>
  );
}
