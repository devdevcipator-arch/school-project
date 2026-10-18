import { Kpi, Ring, SplitBar, kpiBig as big, kpiSub as sub } from "@/components/dashboard/kpi";
import { Badge } from "@/components/dashboard/ui";
import type { AttendanceSummary } from "@/lib/teacherAttendance";

/** Four snapshot metrics: this month's rate, punctuality, late arrivals and leave balance. */
export default function KpiRow({
  month,
  monthName,
  streak,
  leave,
}: {
  month: AttendanceSummary;
  monthName: string;
  streak: number;
  leave: { allowed: number; used: number; pending: number };
}) {
  const attended = month.present + month.late;
  const punctual = attended ? Math.round((month.present / attended) * 100) : 100;
  const remaining = Math.max(0, leave.allowed - leave.used - leave.pending);

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Kpi label={`${monthName} Attendance`} icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11">
        <div className="flex items-center gap-4">
          <Ring percent={month.rate} label={`${month.rate}% attendance this month`} />
          <div className="min-w-0">
            <p className={big}>{month.rate}%</p>
            <p className="mt-1.5 text-[.82rem] text-ink/60">
              {attended} of {month.total} working days
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={month.absent ? "danger" : "ok"}>Absent {month.absent}</Badge>
          <Badge tone="neutral">Leave {month.leave}</Badge>
        </div>
      </Kpi>

      <Kpi label="Punctuality" icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2">
        <p className={big}>
          {punctual}% <span className={sub}>on-time check-ins</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge tone={streak >= 5 ? "ok" : "neutral"}>{streak}-day on-time streak</Badge>
        </div>
      </Kpi>

      <Kpi label="Late Arrivals" icon="M12 7v6 M12 17h.01 M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z">
        <p className={big}>
          {month.late} <span className={sub}>this month</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge tone={month.late === 0 ? "ok" : month.late < 3 ? "warn" : "danger"}>
            {month.late === 0 ? "No late arrivals" : `Avg ${month.avgLate} min late`}
          </Badge>
        </div>
      </Kpi>

      <Kpi label="Leave Balance" icon="M4 5h16v15H4z M4 10h16 M9 3v4 M15 3v4">
        <p className={big}>
          {remaining} <span className={sub}>of {leave.allowed} days left</span>
        </p>
        <SplitBar
          parts={[
            { label: "Used", value: leave.used, fill: "bg-primary" },
            { label: "Pending", value: leave.pending, fill: "bg-warn" },
            { label: "Left", value: remaining, fill: "bg-ink/15" },
          ]}
        />
      </Kpi>
    </div>
  );
}
