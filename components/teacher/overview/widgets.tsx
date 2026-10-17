import Link from "next/link";
import { Badge, Bar, Card, CardLink, toneFill } from "@/components/dashboard/ui";
import { ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PASS_MARK, assessmentStateTone, type AssessmentFormat, type ClassOverview, type ResourceKind } from "@/lib/teacher";

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

      <h3 className={sectionLabel}>Absent or on leave today</h3>
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
    </Card>
  );
}

/* ---------- 4. Academic progress & syllabus ---------- */

/** Half-circle gauge for the class average score. */
function Gauge({ value }: { value: number }) {
  const r = 70;
  const half = Math.PI * r;
  return (
    <svg viewBox="0 0 170 96" className="w-full max-w-[220px]" role="img" aria-label={`Class average ${value}%`}>
      <path d="M15 85a70 70 0 0 1 140 0" fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-ink/6" />
      <path d="M15 85a70 70 0 0 1 140 0" fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${(value / 100) * half} ${half}`} />
      <text x="85" y="72" textAnchor="middle" className="fill-ink text-[28px] font-extrabold">
        {value}%
      </text>
      <text x="85" y="91" textAnchor="middle" className="fill-ink/50 text-[10px] font-semibold">
        class average
      </text>
    </svg>
  );
}

export function ProgressWidget({ c }: { c: ClassOverview }) {
  return (
    <Card title="Academic Progress" subtitle="Syllabus completion and class performance">
      <ul className="grid gap-3.5">
        {c.subjects.map((s) => (
          <li key={s.name} className="grid gap-1.5">
            <span className="flex items-center justify-between text-[.86rem]">
              <span className="font-semibold text-ink/75">{s.name}</span>
              <strong className="tabular-nums">{s.percent}%</strong>
            </span>
            <Bar value={s.percent} fill={s.percent >= 75 ? "bg-primary" : "bg-accent"} label={`${s.name} syllabus ${s.percent}% complete`} />
          </li>
        ))}
      </ul>

      <h3 className={sectionLabel}>Overall class performance</h3>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-4">
        <Gauge value={c.avgScore} />
        <ul className="grid min-w-[150px] flex-1 gap-2 text-[.82rem]">
          {c.lastScores.map((s) => (
            <li key={s.title} className="flex items-center justify-between gap-2">
              <span className="truncate text-ink/65">{s.title}</span>
              <strong className={`tabular-nums ${s.percent < PASS_MARK ? "text-danger" : ""}`}>{s.percent}%</strong>
            </li>
          ))}
        </ul>
      </div>
      <CardLink href="/teacher/talents">View Detailed Class Progress & Talents</CardLink>
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
      <ul className="grid gap-2.5">
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

/* ---------- 6. Helping books & resources ---------- */

const kindIcon: Record<ResourceKind, string> = {
  Textbook: "M4 5a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2z M4 20a2 2 0 0 0 2 1h12v-3",
  "Reference PDF": "M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6",
  "Syllabus guide": "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3",
};

export function ResourcesWidget({ c }: { c: ClassOverview }) {
  const { books, guides, materials, top } = c.resources;
  return (
    <Card
      title="Helping Books & Class Resources"
      subtitle={`${books + guides + materials} items uploaded for ${c.label}`}
      action={
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher/resources" className={`${ghostBtn} !px-4 !py-2 text-[.84rem]`}>
            Browse All Resources
          </Link>
          <Link href="/teacher/resources?add=1" className={buttonClass("primary", "md", "!px-4 !py-2 text-[.84rem]")}>
            <Icon d={plus} className="size-4" />
            Add New Helping Book
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Helping books", value: books },
          { label: "Syllabus guides", value: guides },
          { label: "Study material", value: materials },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/8 bg-surface/60 p-3">
            <p className="text-[1.5rem] font-extrabold leading-none text-primary">{s.value}</p>
            <p className="mt-1.5 text-[.78rem] font-semibold text-ink/60">{s.label}</p>
          </div>
        ))}
      </div>

      <h3 className={sectionLabel}>Most used this month</h3>
      <ul className="grid gap-3 md:grid-cols-3">
        {top.map((r) => (
          <li key={r.title} className="group flex flex-col rounded-2xl border border-ink/8 p-4 transition-[border-color,translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_14px_30px_rgba(6,30,41,.08)]">
            <div className="flex items-start gap-3">
              <span className="grid h-14 w-11 shrink-0 place-items-center rounded-lg bg-linear-to-b from-primary to-ink text-surface shadow-[inset_-3px_0_0_rgba(243,244,244,.25)]">
                <Icon d={kindIcon[r.kind]} className="size-5" />
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="line-clamp-2 text-[.88rem] font-bold leading-snug">{r.title}</span>
                <span className="text-[.74rem] text-ink/55">{r.kind} · {r.meta}</span>
              </span>
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <span className="text-[.74rem] text-ink/50">Opened {r.opens} times</span>
              <Link href="/teacher/resources" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[.78rem] font-bold text-primary transition-colors hover:bg-primary hover:text-surface">
                Open / View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- 7. Reports ---------- */

export function ReportsWidget({ c }: { c: ClassOverview }) {
  const { generated, pending, attention } = c.reports;
  const total = generated + pending;
  return (
    <Card title="Reports & Performance" subtitle="Monthly progress report status">
      <div className="rounded-2xl bg-linear-135 from-ink to-primary p-5 text-surface">
        <p className="text-[.78rem] font-bold uppercase tracking-[.12em] text-surface/60">Monthly progress reports</p>
        <p className="mt-1 text-[1.6rem] font-extrabold leading-none">
          {generated} <span className="text-[.85rem] font-semibold text-surface/65">of {total} generated</span>
        </p>
        <div role="meter" aria-label="Reports generated" aria-valuemin={0} aria-valuemax={total} aria-valuenow={generated} className="mt-4 h-3 overflow-hidden rounded-r-full bg-surface/15">
          <div className="h-full rounded-r-full bg-linear-to-r from-accent to-surface" style={{ width: `${(generated / total) * 100}%` }} />
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-[.82rem] text-surface/80">
          <span aria-hidden className={`size-2 rounded-full ${toneFill.warn}`} />
          {pending} pending your review
        </p>
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Needs academic attention</h3>
        <Badge tone={attention.length > 0 ? "danger" : "ok"}>{attention.length} students</Badge>
      </div>
      <ul className="grid gap-2">
        {attention.map((s) => (
          <li key={s.name} className="flex items-center gap-3 rounded-xl border border-danger/15 bg-danger/5 px-3 py-2.5">
            <Icon d="M12 7v6 M12 17h.01 M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z" className="size-[18px] shrink-0 text-danger" />
            <span className="grid min-w-0">
              <span className="truncate text-[.88rem] font-semibold">{s.name}</span>
              <span className="truncate text-[.78rem] text-ink/60">{s.note}</span>
            </span>
          </li>
        ))}
      </ul>

      <Link href="/teacher/reports" className={buttonClass("dark", "md", "mt-auto w-full")}>
        <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
        Review & Send Reports to Students
      </Link>
    </Card>
  );
}
