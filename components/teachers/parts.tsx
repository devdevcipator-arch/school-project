import { Icon } from "@/components/ui/Icon";
import { clock, initials, type CheckIn, type Teacher, type TeacherStatus } from "@/lib/teachers";

export function Avatar({ name, size = "md", muted = false }: { name: string; size?: "md" | "lg"; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-bold text-surface ${muted ? "bg-ink/30" : "bg-linear-135 from-primary to-accent"} ${
        size === "lg" ? "size-16 text-[1.2rem] ring-4 ring-surface/20" : "size-11 text-[.88rem]"
      }`}
    >
      {initials(name)}
    </span>
  );
}

const statusMeta: Record<TeacherStatus, { label: string; cls: string; icon: string }> = {
  active: { label: "Active", cls: "bg-ok/10 text-ok", icon: "M5 12l4 4 10-10" },
  inactive: { label: "Inactive", cls: "bg-ink/8 text-ink/55", icon: "M6 12h12" },
};

export function StatusBadge({ status }: { status: TeacherStatus }) {
  const m = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[.72rem] font-bold ${m.cls}`}>
      <Icon d={m.icon} className="size-3" />
      {m.label}
    </span>
  );
}

const checkMeta: Record<CheckIn["state"], { label: string; short?: string; cls: string; dot: string }> = {
  present: { label: "Present today", short: "Present", cls: "border-ok/25 bg-ok/8 text-ok", dot: "bg-ok" },
  late: { label: "Late today", short: "Late", cls: "border-warn/30 bg-warn/10 text-[#9a6a0f]", dot: "bg-warn" },
  absent: { label: "Absent", cls: "border-danger/25 bg-danger/8 text-danger", dot: "bg-danger" },
  none: { label: "Not on roster", cls: "border-ink/10 bg-white text-ink/45", dot: "bg-ink/20" },
};

/** Daily check-in snapshot, e.g. "Present today · 07:55 AM". */
export function CheckInChip({ checkIn, short = false }: { checkIn: CheckIn; short?: boolean }) {
  const m = checkMeta[checkIn.state];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[.74rem] font-semibold ${m.cls}`}>
      <span aria-hidden className={`size-2 rounded-full ${m.dot}`} />
      {(short && m.short) || m.label}
      {checkIn.time && <span className="font-bold">· {clock(checkIn.time)}</span>}
    </span>
  );
}

/** Class-teacher badge plus the grades taught. */
export function ScopeBadges({ t }: { t: Teacher }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {t.classTeacher && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[.72rem] font-bold text-surface">
          <Icon d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" className="size-3" />
          Class Teacher: {t.classTeacher}
        </span>
      )}
      {t.classes.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[.72rem] font-bold text-primary">
          Classes: {t.classes.map((g) => g.replace("Grade ", "")).join(", ")}
        </span>
      )}
    </div>
  );
}

export function SubjectPills({ subjects }: { subjects: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.map((s) => (
        <span key={s} className="whitespace-nowrap rounded-full border border-accent/40 bg-accent/8 px-2.5 py-1 text-[.72rem] font-bold text-[#3d6e71]">
          {s}
        </span>
      ))}
    </div>
  );
}
