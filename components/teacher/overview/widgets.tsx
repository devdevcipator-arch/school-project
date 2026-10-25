import Link from "next/link";
import { Badge, Card } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { ClassOverview } from "@/lib/teacher";

const sectionLabel = "mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50";

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
