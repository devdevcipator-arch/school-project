import { Badge, toneText, type Tone } from "@/components/dashboard/ui";
import { behaviorOf, daysBetween, installmentLabel, monthLabel, monthShort, shortDate, type Behavior, type BehaviorKey, type FeeRecord, type FeeStatus, type InstallmentStatus, type MonthState } from "@/lib/fees";
import { AS_OF } from "@/lib/students";

/** Fee color hierarchy: green paid, amber partial, orange delayed, red defaulter. */
export const statusTone: Record<FeeStatus, Tone> = {
  paid: "ok",
  partial: "warn",
  delayed: "serious",
  defaulter: "danger",
  pending: "neutral",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Status pill with its context: days overdue or unpaid months. */
export function FeeStatusBadge({ r }: { r: FeeRecord }) {
  const text =
    r.status === "paid"
      ? "Paid"
      : r.status === "partial"
        ? "Partial · balance pending"
        : r.status === "delayed"
          ? `Delayed · ${plural(r.overdueDays, "day")}`
          : r.status === "defaulter"
            ? `Defaulter · ${r.months} Months Unpaid`
            : "Not yet due";
  return (
    <Badge tone={statusTone[r.status]} className={r.status === "defaulter" ? "ring-1 ring-danger/30" : ""}>
      {text}
    </Badge>
  );
}

/** "Delayed by 14 days", "Due in 3 days", "Paid on 5 Oct 2026". */
export function Aging({ r }: { r: FeeRecord }) {
  if (r.status === "paid") return <span className="text-[.78rem] font-semibold text-ok">{r.paidOn ? `Paid on ${shortDate(r.paidOn)}` : "Cleared"}</span>;
  if (r.overdueDays > 0) {
    const tone = r.status === "defaulter" ? "danger" : r.status === "partial" ? "warn" : "serious";
    return <span className={`text-[.78rem] font-bold ${toneText[tone]}`}>Delayed by {plural(r.overdueDays, "day")}</span>;
  }
  if (!r.nextDue) return null;
  const days = daysBetween(AS_OF, r.nextDue);
  return <span className="text-[.78rem] font-semibold text-primary">{days === 0 ? "Due today" : days > 0 ? `Due in ${plural(days, "day")}` : "Due"}</span>;
}

export const installmentTone: Record<InstallmentStatus, Tone> = {
  ontime: "ok",
  late: "serious",
  partial: "warn",
  overdue: "danger",
  due: "neutral",
  upcoming: "neutral",
};

/** Installment status with its delay, e.g. "Paid late · 12 days". */
export function InstallmentBadge({ status, delay }: { status: InstallmentStatus; delay: number }) {
  const extra = (status === "late" || status === "overdue") && delay > 0 ? ` · ${plural(delay, "day")}` : "";
  return <Badge tone={installmentTone[status]}>{installmentLabel[status] + extra}</Badge>;
}

export const behaviorTone: Record<BehaviorKey, Tone> = {
  punctual: "ok",
  mostly: "neutral",
  late: "serious",
  parts: "warn",
  defaulter: "danger",
};

export function BehaviorBadge({ k }: { k: BehaviorKey }) {
  return <Badge tone={behaviorTone[k]}>{behaviorOf(k).label}</Badge>;
}

const cell: Record<MonthState, string> = {
  ontime: "bg-ok",
  covered: "bg-ok/45",
  late: "bg-serious",
  partial: "bg-warn",
  overdue: "bg-danger",
  due: "border-2 border-primary bg-white",
  upcoming: "bg-ink/10",
};

const cellText = (state: MonthState, delay: number) =>
  state === "covered" ? "Covered by an upfront installment" : `${installmentLabel[state]}${(state === "late" || state === "overdue") && delay ? `, ${plural(delay, "day")}` : ""}`;

/** Twelve-month installment behavior strip: one block per month of the academic year. */
export function Timeline({ b, labels = false }: { b: Behavior; labels?: boolean }) {
  return (
    <ol aria-label="Monthly installment record" className={`grid grid-cols-12 ${labels ? "gap-1.5" : "gap-[3px]"}`}>
      {b.timeline.map((t) => (
        <li key={t.month} title={`${monthLabel(t.month)}: ${cellText(t.state, t.delay)}`} className="grid justify-items-center gap-1">
          <span className={`block w-full rounded-[4px] ${labels ? "h-7" : "h-3.5"} ${cell[t.state]}`}>
            <span className="sr-only">
              {monthLabel(t.month)}: {cellText(t.state, t.delay)}
            </span>
          </span>
          {labels && <span className="text-[.66rem] font-semibold text-ink/50">{monthShort(t.month)}</span>}
        </li>
      ))}
    </ol>
  );
}

export const legend: { state: MonthState; label: string }[] = [
  { state: "ontime", label: "On time" },
  { state: "late", label: "Late" },
  { state: "partial", label: "Partial" },
  { state: "overdue", label: "Overdue" },
  { state: "due", label: "Due now" },
  { state: "upcoming", label: "Upcoming" },
];

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[.74rem] text-ink/60">
      {legend.map((l) => (
        <li key={l.state} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`size-3 rounded-[3px] ${cell[l.state]}`} />
          {l.label}
        </li>
      ))}
    </ul>
  );
}

export const methodIcon = {
  "Online Gateway": "M3 6h18v12H3z M3 10h18 M7 15h3",
  "Bank Slip": "M3 21h18 M5 21V10l7-5 7 5v11 M9 21v-6 M15 21v-6",
  Cash: "M3 7h18v10H3z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z M6 12h.01 M18 12h.01",
} as const;
