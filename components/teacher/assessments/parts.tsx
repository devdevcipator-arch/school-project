import { Badge, type Tone } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import { formatMeta, type Assessment, type AssessmentStatus, type Format, type Submission } from "@/lib/assessments";

export const statusMeta: Record<AssessmentStatus, { label: string; tone: Tone }> = {
  live: { label: "Active / Live", tone: "ok" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  closed: { label: "Closed", tone: "neutral" },
  draft: { label: "Draft", tone: "warn" },
};

export const aiIcon = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";

export function FormatBadge({ format }: { format: Format }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[.7rem] font-bold ${formatMeta[format].style}`}>
      {format === "ai-quiz" && <Icon d={aiIcon} className="size-3" />}
      {formatMeta[format].label}
    </span>
  );
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "Mon 19 Oct, 08:00 PM" in the viewer's local time. */
export function when(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}, ${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
}

function span(ms: number) {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${pad(m % 60)}m`;
  return `${Math.round(h / 24)} days`;
}

/** Pacing tag: starts in / closes in / overdue / closed. */
export function pacing(a: Assessment, now: number): { text: string; tone: Tone } {
  const start = new Date(a.start).getTime();
  const due = new Date(a.due).getTime();
  if (a.status === "draft") return { text: "Not published", tone: "warn" };
  if (a.status === "closed") return { text: `Closed ${when(a.due).split(",")[0]}`, tone: "neutral" };
  if (now < start) return { text: `Starts in ${span(start - now)}`, tone: "neutral" };
  if (now > due) return { text: `Overdue by ${span(now - due)}`, tone: "danger" };
  return { text: `Closes in ${span(due - now)}`, tone: due - now < 6 * 3_600_000 ? "warn" : "ok" };
}

export const isToday = (iso: string, now: number) => new Date(iso).toDateString() === new Date(now).toDateString();

export function counts(subs: Submission[] = []) {
  const submitted = subs.filter((s) => s.state !== "none").length;
  const late = subs.filter((s) => s.state === "late").length;
  const pending = subs.filter((s) => s.state !== "none" && s.score === null).length;
  return { total: subs.length, submitted, late, pending, missing: subs.length - submitted };
}

/** Auto-graded badge, or how many submissions still need marking. */
export function EvalBadge({ a, subs }: { a: Assessment; subs: Submission[] }) {
  const c = counts(subs);
  if (a.status === "draft" || a.status === "scheduled") return <span className="text-[.76rem] text-ink/45">No submissions yet</span>;
  if (a.autoGraded) return <Badge tone="ok">Auto-graded</Badge>;
  if (c.pending) return <Badge tone="warn">{c.pending} pending review</Badge>;
  return <Badge tone="ok">All marked</Badge>;
}
