import { Kpi, Ring, SplitBar, kpiBig as big, kpiSub as sub } from "@/components/dashboard/kpi";
import { kpis } from "@/lib/principal";

export default function KpiCards() {
  const { teachers, students, attendance, fees } = kpis;
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Kpi
        label="Total Active Teachers"
        icon="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M16 3.5a4 4 0 0 1 0 7.5 M18 14c2.4.8 4 3.2 4 7"      >
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
        icon="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5"      >
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
        icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11"      >
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
        icon="M3 6h18v12H3z M3 10h18 M7 15h3"      >
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
