import { Badge, toneText, type Tone } from "@/components/dashboard/ui";
import { daysBetween, rs, shortDate, type FeeRecord, type FeeStatus, type InstallmentStatus } from "@/lib/fees";
import { AS_OF } from "@/lib/students";

/** Finance color hierarchy: green paid, amber partial, orange delayed, red defaulter. */
export const statusTone: Record<FeeStatus, Tone> = {
  paid: "ok",
  partial: "warn",
  delayed: "serious",
  defaulter: "danger",
  pending: "neutral",
};

/** Status pill with its context: remaining balance, days overdue or unpaid months. */
export function FeeStatusBadge({ r }: { r: FeeRecord }) {
  const tone = statusTone[r.status];
  const text =
    r.status === "paid"
      ? "Paid"
      : r.status === "partial"
        ? `Partial · ${rs(r.balance)} left`
        : r.status === "delayed"
          ? `Delayed · ${r.overdueDays} ${r.overdueDays === 1 ? "day" : "days"}`
          : r.status === "defaulter"
            ? `Defaulter · ${r.months} Months Unpaid`
            : "Not yet due";
  return (
    <Badge tone={tone} className={r.status === "defaulter" ? "ring-1 ring-danger/30" : ""}>
      {text}
    </Badge>
  );
}

/** "Delayed by 14 days", "Due in 3 days", "Paid on 5 Oct 2026". */
export function Aging({ r }: { r: FeeRecord }) {
  if (r.status === "paid") return <span className="text-[.78rem] font-semibold text-ok">{r.paidOn ? `Paid on ${shortDate(r.paidOn)}` : "Cleared"}</span>;
  if (r.overdueDays > 0) {
    const tone = r.status === "defaulter" ? "danger" : r.status === "partial" ? "warn" : "serious";
    return (
      <span className={`text-[.78rem] font-bold ${toneText[tone]}`}>
        Delayed by {r.overdueDays} {r.overdueDays === 1 ? "day" : "days"}
      </span>
    );
  }
  if (!r.nextDue) return null;
  const days = daysBetween(AS_OF, r.nextDue);
  return <span className="text-[.78rem] font-semibold text-primary">{days === 0 ? "Due today" : days > 0 ? `Due in ${days} ${days === 1 ? "day" : "days"}` : "Due"}</span>;
}

export const installmentMeta: Record<InstallmentStatus, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "ok" },
  partial: { label: "Partial", tone: "warn" },
  overdue: { label: "Overdue", tone: "danger" },
  due: { label: "Due", tone: "neutral" },
  upcoming: { label: "Upcoming", tone: "neutral" },
};

export const methodIcon = {
  "Online Gateway": "M3 6h18v12H3z M3 10h18 M7 15h3",
  "Bank Slip": "M3 21h18 M5 21V10l7-5 7 5v11 M9 21v-6 M15 21v-6",
  Cash: "M3 7h18v10H3z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z M6 12h.01 M18 12h.01",
} as const;
