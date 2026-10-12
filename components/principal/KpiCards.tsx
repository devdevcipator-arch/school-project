import type { ReactNode } from "react";
import { Badge, Trend } from "@/components/dashboard/ui";
import { formatRs, kpis } from "@/lib/principal";

function Kpi({ label, icon, children }: { label: string; icon: string; children: ReactNode }) {
  return (
    <section
      data-reveal
      className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(6,30,41,.1)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[.86rem] font-bold text-ink/60">{label}</h2>
        <span className="grid size-10 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </span>
      </div>
      {children}
    </section>
  );
}

/** Two-part stacked bar with a 2px surface gap, plus a legend (identity never by color alone). */
function SplitBar({ parts, format = String }: { parts: { label: string; value: number; fill: string }[]; format?: (n: number) => string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-2.5 gap-0.5" role="img" aria-label={parts.map((p) => `${p.label} ${format(p.value)}`).join(", ")}>
        {parts.map((p, i) => (
          <span
            key={p.label}
            title={`${p.label}: ${format(p.value)}`}
            className={`h-full ${p.fill} ${i === 0 ? "rounded-l-[3px]" : ""} ${i === parts.length - 1 ? "rounded-r-full" : ""}`}
            style={{ width: `${(p.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[.78rem] text-ink/65">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${p.fill}`} />
            {p.label} <strong className="text-ink">{format(p.value)}</strong>
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
    <svg viewBox="0 0 76 76" className="size-[76px] shrink-0 -rotate-90" role="img" aria-label={`${percent}% present`}>
      <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-ink/8" />
      <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${(percent / 100) * c} ${c}`} />
    </svg>
  );
}

const big = "text-[1.9rem] font-extrabold leading-none tracking-tight";

export default function KpiCards() {
  const { teachers, students, attendance, fees } = kpis;
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Kpi label="Total Active Teachers" icon="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M16 3.5a4 4 0 0 1 0 7.5 M18 14c2.4.8 4 3.2 4 7">
        <p className={big}>{teachers.total}</p>
        <SplitBar
          parts={[
            { label: "On duty", value: teachers.onDuty, fill: "bg-primary" },
            { label: "On leave", value: teachers.onLeave, fill: "bg-accent" },
          ]}
        />
        <Trend value={teachers.trend} />
      </Kpi>

      <Kpi label="Total Enrolled Students" icon="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5">
        <p className={big}>
          {students.total} <span className="text-[.82rem] font-semibold tracking-normal text-ink/50">in Grades 1 to {students.grades}</span>
        </p>
        <SplitBar
          parts={[
            { label: "Boys", value: students.boys, fill: "bg-primary" },
            { label: "Girls", value: students.girls, fill: "bg-accent" },
          ]}
        />
        <Trend value={students.trend} />
      </Kpi>

      <Kpi label="Today's Overall Attendance" icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11">
        <div className="flex items-center gap-4">
          <Ring percent={attendance.percent} />
          <div>
            <p className={big}>{attendance.percent}%</p>
            <p className="mt-1 text-[.82rem] text-ink/60">
              {attendance.present} of {attendance.total} present today
            </p>
          </div>
        </div>
        <Trend value={attendance.trend} label="vs last week" />
      </Kpi>

      <Kpi label="Fee Collection Status" icon="M3 6h18v12H3z M3 10h18 M7 15h3">
        <p className={big}>
          {formatRs(fees.collected)} <span className="text-[.82rem] font-semibold tracking-normal text-ink/50">of {formatRs(fees.expected)}</span>
        </p>
        <SplitBar
          parts={[
            { label: "Collected", value: fees.collected, fill: "bg-primary" },
            { label: "Pending", value: fees.expected - fees.collected - fees.overdue, fill: "bg-accent" },
            { label: "Overdue", value: fees.overdue, fill: "bg-danger" },
          ]}
          format={formatRs}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Trend value={fees.trend} />
          <Badge tone="danger">{formatRs(fees.overdue)} overdue</Badge>
        </div>
      </Kpi>
    </div>
  );
}
