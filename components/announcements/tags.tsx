import { Icon } from "@/components/ui/Icon";
import { audiences, type AudienceKey, type Priority } from "@/lib/announcements";

// Audience tags: distinct palette treatments + an icon each, so identity never relies on color alone.
const audienceStyle: Record<AudienceKey, { cls: string; icon: string }> = {
  school: { cls: "bg-ink text-surface", icon: "M3 21h18 M5 21V10l7-5 7 5v11 M10 21v-5h4v5" },
  staff: { cls: "bg-primary/10 text-primary", icon: "M6 11V8a6 6 0 0 1 12 0v3 M5 11h14v10H5z M12 15v2" },
  students: { cls: "bg-accent/15 text-[#3d6e71]", icon: "M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" },
  classes: { cls: "border border-accent/50 bg-white text-[#3d6e71]", icon: "M4 6h16 M4 12h16 M4 18h10" },
  department: { cls: "border border-primary/35 bg-white text-primary", icon: "M4 20V8l8-4 8 4v12 M9 20v-6h6v6" },
};

export function AudienceTag({ audience, targets = [] }: { audience: AudienceKey; targets?: string[] }) {
  const s = audienceStyle[audience];
  const label = targets.length ? targets.join(", ") : audiences.find((a) => a.key === audience)!.short;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[.72rem] font-bold ${s.cls}`}>
      <Icon d={s.icon} className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export const priorityMeta: Record<Priority, { label: string; dot: string; badge: string }> = {
  urgent: { label: "Urgent", dot: "bg-danger", badge: "bg-danger/10 text-danger" },
  important: { label: "Important", dot: "bg-warn", badge: "bg-warn/12 text-[#9a6a0f]" },
  normal: { label: "Normal", dot: "bg-ink/30", badge: "bg-ink/6 text-ink/60" },
};

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span className="relative inline-flex size-2.5 shrink-0" aria-hidden>
      {priority === "urgent" && <span className="absolute inset-0 animate-ping rounded-full bg-danger/60" />}
      <span className={`relative size-2.5 rounded-full ${priorityMeta[priority].dot}`} />
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = priorityMeta[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[.72rem] font-bold ${m.badge}`}>
      <PriorityDot priority={priority} />
      {m.label}
    </span>
  );
}
