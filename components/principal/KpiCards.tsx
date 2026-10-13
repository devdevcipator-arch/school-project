import type { ReactNode } from "react";
import { Badge, Trend } from "@/components/dashboard/ui";
import { kpis } from "@/lib/principal";

/** KPI card: header, body, and a footer pinned to the bottom so cards in a row line up. */
function Kpi({ label, icon, footer, children }: { label: string; icon: string; footer: ReactNode; children: ReactNode }) {
  return (
    <section
      data-reveal
      className="flex min-w-0 flex-col rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(6,30,41,.1)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[.86rem] font-bold text-ink/60">{label}</h2>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </span>
      </div>
      <div className="mb-5 mt-4 grid gap-4">{children}</div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3.5">{footer}</div>
    </section>
  );
}

/** Stacked bar with a 2px surface gap, plus a legend (identity never by color alone). */
function SplitBar({ parts }: { parts: { label: string; value: number; fill: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-2.5 gap-0.5" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {parts.map((p, i) => (
          <span
            key={p.label}
            title={`${p.label}: ${p.value}`}
            className={`h-full ${p.fill} ${i === 0 ? "rounded-l-[3px]" : ""} ${i === parts.length - 1 ? "rounded-r-full" : ""}`}
            style={{ width: `${(p.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[.78rem] text-ink/65">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${p.fill}`} />
            {p.label} <strong className="text-ink">{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 76 76" className="size-[68px] shrink-0 -rotate-90" role="img" aria-label={`${percent}% present`}>
      <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-ink/8" />
      <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${(percent / 100) * c} ${c}`} />
    </svg>
  );
}

const big = "text-[1.9rem] font-extrabold leading-none tracking-tight";
const sub = "text-[.82rem] font-semibold tracking-normal text-ink/50";

export default function KpiCards() {
  const { teachers, students, attendance, fees } = kpis;
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Kpi
        label="Total Active Teachers"
        icon="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M16 3.5a4 4 0 0 1 0 7.5 M18 14c2.4.8 4 3.2 4 7"
        footer={<Trend value={teachers.trend} />}
      >
        <p className={big}>
          {teachers.total} <span className={sub}>on staff</span>
        </p>
        <SplitBar
          parts={[
            { label: "On duty", value: teachers.onDuty, fill: "bg-primary" },
            { label: "On leave", value: teachers.onLeave, fill: "bg-accent" },
          ]}
        />
      </Kpi>

      <Kpi
        label="Total Enrolled Students"
        icon="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5"
        footer={<Trend value={students.trend} />}
      >
        <p className={big}>
          {students.total} <span className={sub}>in Grades 1 to {students.grades}</span>
        </p>
        <SplitBar
          parts={[
            { label: "Boys", value: students.boys, fill: "bg-primary" },
            { label: "Girls", value: students.girls, fill: "bg-accent" },
          ]}
        />
      </Kpi>

      <Kpi
        label="Today's Overall Attendance"
        icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11"
        footer={<Trend value={attendance.trend} label="vs last week" />}
      >
        <div className="flex items-center gap-4">
          <Ring percent={attendance.percent} />
          <div className="min-w-0">
            <p className={big}>{attendance.percent}%</p>
            <p className="mt-1.5 text-[.82rem] text-ink/60">
              {attendance.present} of {attendance.total} present
            </p>
          </div>
        </div>
      </Kpi>

      <Kpi
        label="Fee Status"
        icon="M3 6h18v12H3z M3 10h18 M7 15h3"
        footer={
          <>
            <Trend value={fees.trend} />
            <Badge tone="danger">{fees.overdue} overdue</Badge>
          </>
        }
      >
        <p className={big}>
          {fees.paid} <span className={sub}>of {fees.total} students paid</span>
        </p>
        <SplitBar
          parts={[
            { label: "Paid", value: fees.paid, fill: "bg-primary" },
            { label: "Not paid", value: fees.pending, fill: "bg-accent" },
            { label: "Overdue", value: fees.overdue, fill: "bg-danger" },
          ]}
        />
      </Kpi>
    </div>
  );
}
