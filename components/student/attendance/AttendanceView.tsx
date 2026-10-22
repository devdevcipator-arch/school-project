import { StatCard } from "@/components/dashboard/ui";
import { attendanceLog, studentAttendance } from "@/lib/student";
import AttendanceLog from "./AttendanceLog";
import { longDate, statusMeta } from "./status";

/** Student attendance record: term totals, then the day-by-day log. */
export default function AttendanceView() {
  const { present, absent, leave, streak } = studentAttendance;
  const schoolDays = present + absent + leave;
  const lastAbsent = attendanceLog.findLast((d) => d.status === "A");

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        <StatCard label="Attendance Rate" value={`${Math.round((present / schoolDays) * 100)}%`} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 3a9 9 0 0 1 9 9" note={`${present} of ${schoolDays} school days`} />
        <StatCard label="Days Present" value={present} icon={statusMeta.P.icon} note={`${streak}-day streak right now`} />
        <StatCard label="Days Absent" value={absent} icon={statusMeta.A.icon} note={lastAbsent ? `Last absent ${longDate(lastAbsent.date)}` : "No absences this term"} />
        <StatCard label="Days on Leave" value={leave} icon={statusMeta.L.icon} note="Approved leave days" />
      </div>

      <AttendanceLog />
    </main>
  );
}
