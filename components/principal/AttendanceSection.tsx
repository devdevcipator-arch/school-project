import { Badge, Card, CardLink, toneText, type Tone } from "@/components/dashboard/ui";
import { LOW_ATTENDANCE, classAttendance, teacherCheckins } from "@/lib/principal";

const statusTiles: { label: string; key: "present" | "late" | "absent" | "onLeave"; tone: Tone }[] = [
  { label: "On time", key: "present", tone: "ok" },
  { label: "Late", key: "late", tone: "warn" },
  { label: "Absent", key: "absent", tone: "danger" },
  { label: "On leave", key: "onLeave", tone: "neutral" },
];

function TeacherAttendance() {
  const t = teacherCheckins;
  const present = t.present + t.late;
  return (
    <Card
      title="Teacher Attendance"
      subtitle="Live check-ins for today"
      action={<Badge tone="ok">{present}/{t.total} Present</Badge>}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {statusTiles.map((s) => (
          <div key={s.key} className="rounded-2xl border border-ink/8 bg-surface/60 p-3">
            <p className={`text-[1.5rem] font-extrabold leading-none ${toneText[s.tone]}`}>{t[s.key]}</p>
            <p className="mt-1.5 text-[.78rem] font-semibold text-ink/60">{s.label}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Recent check-ins</h3>
      <ul className="divide-y divide-ink/6">
        {t.feed.map((f) => (
          <li key={f.name} className="flex items-center gap-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[.78rem] font-bold text-primary">
              {f.name.split(" ").map((w) => w[0]).join("")}
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="truncate text-[.9rem] font-semibold">{f.name}</span>
              <span className="truncate text-[.78rem] text-ink/55">{f.subject}</span>
            </span>
            <span className="text-right">
              <span className="block text-[.82rem] font-semibold tabular-nums">{f.time}</span>
              <Badge tone={f.status === "Late" ? "warn" : "ok"} className="mt-0.5">{f.status}</Badge>
            </span>
          </li>
        ))}
      </ul>
      <CardLink href="/principal/teacher-attendance">View Full Teacher Attendance Logs</CardLink>
    </Card>
  );
}

function StudentAttendance() {
  const flagged = classAttendance.filter((c) => c.percent < LOW_ATTENDANCE);
  return (
    <Card
      title="Student Attendance"
      subtitle="Class-wise attendance today"
      action={flagged.length > 0 && <Badge tone="danger">{flagged.length} classes below {LOW_ATTENDANCE}%</Badge>}
    >
      <ul className="grid gap-3">
        {classAttendance.map((c) => {
          const low = c.percent < LOW_ATTENDANCE;
          return (
            <li key={c.grade} className="group relative grid grid-cols-[72px_1fr_44px] items-center gap-3">
              <span className={`text-[.84rem] font-semibold ${low ? "text-danger" : "text-ink/70"}`}>{c.grade}</span>
              <span className="relative h-3 rounded-r-full bg-ink/6">
                <span
                  className={`absolute inset-y-0 left-0 rounded-r-full transition-[filter] group-hover:brightness-110 ${low ? "bg-danger" : "bg-primary"}`}
                  style={{ width: `${c.percent}%` }}
                />
                {/* 80% threshold marker */}
                <span aria-hidden className="absolute -inset-y-1 w-px bg-ink/25" style={{ left: `${LOW_ATTENDANCE}%` }} />
                {/* Hover tooltip */}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+8px)] z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[.76rem] font-semibold text-surface opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                  style={{ left: `${c.percent / 2}%` }}
                >
                  {c.grade}: {c.percent}% present{low ? " (flagged)" : ""}
                </span>
              </span>
              <span className={`text-right text-[.84rem] font-bold tabular-nums ${low ? "text-danger" : "text-ink"}`}>{c.percent}%</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-[.78rem] text-ink/55">
        <span aria-hidden className="h-3 w-px bg-ink/40" />
        Line marks the {LOW_ATTENDANCE}% threshold. Classes below it are flagged in red.
      </p>
      <CardLink href="/principal/student-attendance">View Class-Wise Attendance</CardLink>
    </Card>
  );
}

export default function AttendanceSection() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <TeacherAttendance />
      <StudentAttendance />
    </div>
  );
}
