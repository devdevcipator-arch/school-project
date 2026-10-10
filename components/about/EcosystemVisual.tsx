import { Icon, iconPaths } from "@/components/ui/Icon";

// Hero visual: one school hub connecting the three roles, with live AI + attendance activity.
const nodes = [
  { role: "Principal", status: "42/45 teachers checked in", icon: iconPaths.chart, pos: "left-[3%] top-[6%]" },
  { role: "Teacher", status: "AI quiz generated · 10 Qs", icon: iconPaths.quiz, pos: "right-[3%] top-[6%]" },
  { role: "Student", status: "Report card ready to download", icon: iconPaths.cap, pos: "bottom-[4%] left-1/2 -translate-x-1/2" },
];

const stats = [
  { value: "0", label: "Paper registers" },
  { value: "Seconds", label: "Per AI quiz" },
  { value: "Live", label: "Role sync" },
];

export default function EcosystemVisual() {
  return (
    <div
      data-reveal
      aria-label="Platform ecosystem preview"
      className="relative min-w-0 overflow-hidden rounded-[22px] border border-surface/30 bg-white text-ink shadow-[0_30px_70px_rgba(6,30,41,.35)]"
    >
      <div className="flex items-center gap-1.5 border-b border-ink/10 bg-surface px-3.5 py-3">
        <span className="size-2.5 shrink-0 rounded-full bg-accent" />
        <span className="size-2.5 shrink-0 rounded-full bg-accent/50" />
        <span className="size-2.5 shrink-0 rounded-full bg-accent/50" />
        <span className="ml-3 text-[.8rem] font-semibold text-ink/60">One school · One connected system</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 text-[.72rem] font-bold text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-ok" />
          Live
        </span>
      </div>

      <div className="relative h-[330px] sm:h-[360px]">
        {/* Connection lines with flowing dashes */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
          {[
            "M50 50 L20 20",
            "M50 50 L80 20",
            "M50 50 L50 84",
          ].map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" className="animate-dash" />
          ))}
        </svg>

        {/* Hub */}
        <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
          <span aria-hidden className="absolute size-28 animate-ping rounded-full bg-accent/20 [animation-duration:2.6s]" />
          <div className="relative grid size-24 place-items-center rounded-full bg-linear-135 from-ink to-primary text-surface shadow-[0_14px_34px_rgba(6,30,41,.35)] ring-8 ring-accent/15">
            <div className="grid place-items-center gap-0.5">
              <Icon d={iconPaths.school} className="size-7" />
              <span className="text-[.68rem] font-bold uppercase tracking-[.1em]">School</span>
            </div>
          </div>
        </div>

        {/* Role nodes */}
        {nodes.map((n) => (
          <div
            key={n.role}
            className={`absolute ${n.pos} flex w-[46%] max-w-[230px] items-center gap-2.5 rounded-[14px] border border-ink/10 bg-white p-2.5 shadow-[0_10px_30px_rgba(6,30,41,.1)] sm:p-3`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-linear-135 from-primary to-accent text-surface sm:size-10">
              <Icon d={n.icon} className="size-5" />
            </span>
            <span className="grid min-w-0 leading-tight">
              <strong className="text-[.85rem]">{n.role}</strong>
              <small className="text-[.72rem] text-ink/60">{n.status}</small>
            </span>
          </div>
        ))}

        {/* Floating AI chip */}
        <span className="absolute right-[6%] top-[46%] hidden animate-float items-center gap-1.5 rounded-full bg-linear-135 from-primary to-accent px-3 py-1.5 text-[.72rem] font-bold text-surface shadow-[0_8px_22px_rgba(29,84,109,.35)] sm:flex">
          <Icon d={iconPaths.spark} className="size-3.5" />
          AI assessment ready
        </span>
        <span className="absolute left-[6%] top-[52%] hidden animate-float items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[.72rem] font-bold text-primary shadow-[0_8px_22px_rgba(6,30,41,.1)] [animation-delay:1.2s] sm:flex">
          <Icon d={iconPaths.check} className="size-3.5" />
          Attendance synced
        </span>
      </div>

      <div className="grid grid-cols-3 border-t border-ink/10 bg-surface">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-3 py-3.5 text-center ${i > 0 ? "border-l border-ink/10" : ""}`}>
            <strong className="block bg-linear-135 from-primary to-accent bg-clip-text text-[1.1rem] font-extrabold text-transparent">{s.value}</strong>
            <span className="text-[.74rem] text-ink/60">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
