import { SplitBar } from "@/components/dashboard/kpi";
import { Badge, Card, StatCard } from "@/components/dashboard/ui";
import { attendanceByMonth, attendanceLog, shortDate, studentAttendance } from "@/lib/student";
import MonthCalendar from "./MonthCalendar";
import { longDate, statusMeta, weekdayOf } from "./status";
import WeeklyChart from "./WeeklyChart";

const rateOf = (present: number, missed: number) => Math.round((present / (present + missed)) * 100);

/** Student attendance record: term totals, weekly chart, monthly split, calendar and days missed. */
export default function AttendanceView() {
  const { present, absent, leave, streak } = studentAttendance;
  const schoolDays = present + absent + leave;
  const missed = attendanceLog.filter((d) => d.status === "A" || d.status === "L").reverse();
  const lastAbsent = missed.find((d) => d.status === "A");

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        <StatCard label="Attendance Rate" value={`${rateOf(present, absent + leave)}%`} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 3a9 9 0 0 1 9 9" note={`${present} of ${schoolDays} school days`} />
        <StatCard label="Days Present" value={present} icon={statusMeta.P.icon} note={`${streak}-day streak right now`} />
        <StatCard label="Days Absent" value={absent} icon={statusMeta.A.icon} note={lastAbsent ? `Last absent ${longDate(lastAbsent.date)}` : "No absences this term"} />
        <StatCard label="Days on Leave" value={leave} icon={statusMeta.L.icon} note="Approved leave days" />
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <Card title="Weekly Attendance" subtitle="School days each week, Monday to Friday. Hover a week for details." className="lg:col-span-8">
          <WeeklyChart />
        </Card>

        <Card title="Month by Month" subtitle="How each month of the term went" className="lg:col-span-4">
          <ul className="grid gap-6">
            {attendanceByMonth.map((m) => (
              <li key={m.key}>
                <p className="mb-2.5 flex items-baseline justify-between gap-3">
                  <span className="text-[.92rem] font-bold">{m.label}</span>
                  <span className="text-[.82rem] text-ink/55">
                    <strong className="text-ink">{rateOf(m.present, m.absent + m.leave)}%</strong> present
                  </span>
                </p>
                <SplitBar
                  parts={[
                    { label: "Present", value: m.present, fill: statusMeta.P.fill },
                    { label: "Leave", value: m.leave, fill: statusMeta.L.fill },
                    { label: "Absent", value: m.absent, fill: statusMeta.A.fill },
                  ].filter((p) => p.value > 0)}
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <Card title="Attendance Calendar" subtitle="Every school day of the month and how it was marked" className="lg:col-span-8">
          <MonthCalendar />
        </Card>

        <Card title="Days Missed" subtitle={`${missed.length} days absent or on leave this term`} className="lg:col-span-4">
          <ul className="grid gap-3">
            {missed.map((d) => {
              const [day, month] = shortDate(d.date).split(" ");
              return (
                <li key={d.date} className="flex items-center gap-3 rounded-2xl border border-ink/6 bg-surface/50 p-3">
                  <span className={`grid size-12 shrink-0 place-content-center rounded-xl text-center leading-none ${statusMeta[d.status].soft}`}>
                    <span className="text-[.66rem] font-bold uppercase">{month}</span>
                    <span className="mt-1 text-[.95rem] font-extrabold">{day}</span>
                  </span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-[.9rem] font-semibold">{d.note}</span>
                    <span className="text-[.78rem] text-ink/55">{weekdayOf(d.date)}</span>
                  </span>
                  <Badge tone={d.status === "A" ? "danger" : "warn"}>{statusMeta[d.status].label}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </main>
  );
}
