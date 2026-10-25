"use client";

import { ghostSm } from "@/components/dashboard/controls";
import { Icon } from "@/components/ui/Icon";
import { dueDateOf } from "@/lib/classFees";
import { monthLabel } from "@/lib/fees";
import { teacher } from "@/lib/teacher";

export type Tally = { total: number; paid: number; unpaid: number };

function Pill({ label, value, dot }: { label: string; value: number | string; dot?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-surface/15 bg-surface/8 px-4 py-2.5">
      {dot && <span aria-hidden className={`size-2.5 rounded-full ${dot}`} />}
      <span className="grid">
        <span className="text-[.7rem] font-bold uppercase tracking-[.1em] text-surface/60">{label}</span>
        <strong className="text-[1.35rem] font-extrabold leading-tight tabular-nums">{value}</strong>
      </span>
    </div>
  );
}

const arrowBtn =
  "grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-surface/20 text-surface transition-colors hover:bg-surface/10 disabled:pointer-events-none disabled:opacity-35";

/** Class + fee month context, the live paid counter and batch actions. */
export default function ContextBar({
  month,
  months,
  currentMonth,
  onMonth,
  onPrev,
  onNext,
  canPrev,
  canNext,
  tally,
  showTally,
  locked,
  onAllPaid,
  onAllUnpaid,
}: {
  month: string;
  months: string[];
  currentMonth: string;
  onMonth: (m: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  tally: Tally;
  showTally: boolean;
  locked: boolean;
  onAllPaid: () => void;
  onAllUnpaid: () => void;
}) {
  const rate = tally.total ? Math.round((tally.paid / tally.total) * 100) : 0;
  return (
    <section className="relative overflow-hidden rounded-[20px] bg-linear-135 from-ink via-[#0b2a38] to-primary p-5 text-surface shadow-[0_18px_40px_rgba(6,30,41,.18)] sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <span className="text-[.74rem] font-bold uppercase tracking-[.12em] text-surface/60">
              {month === currentMonth ? "This month" : "Reviewing"} · Due {dueDateOf(month)} · {teacher.session}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="Previous month" className={arrowBtn}>
                <Icon d="M15 18l-6-6 6-6" className="size-5" />
              </button>
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Pick a fee month</span>
                <span className="flex h-11 items-center gap-2 rounded-xl border border-surface/20 bg-surface/10 px-3.5 text-[.9rem] font-bold">
                  <Icon d="M8 3v3 M16 3v3 M4 7h16v13H4z M4 11h16" className="size-[18px] shrink-0 text-accent" />
                  <span className="truncate">{monthLabel(month)}</span>
                </span>
                {/* Native select sits on top, invisible, so the whole field opens it */}
                <select value={month} onChange={(e) => onMonth(e.target.value)} className="absolute inset-0 cursor-pointer text-ink opacity-0">
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={onNext} disabled={!canNext} aria-label="Next month" className={arrowBtn}>
                <Icon d="M9 6l6 6-6 6" className="size-5" />
              </button>
              {month !== currentMonth && (
                <button type="button" onClick={() => onMonth(currentMonth)} className="h-11 shrink-0 cursor-pointer rounded-xl border border-surface/20 px-3 text-[.82rem] font-bold transition-colors hover:bg-surface/10">
                  This month
                </button>
              )}
            </div>
          </div>
        </div>

        {showTally && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onAllPaid} disabled={locked} className={`${ghostSm} border border-surface/20 !py-2 !text-surface hover:!bg-surface/10 disabled:pointer-events-none disabled:opacity-40`}>
              <Icon d="M5 12l4 4 10-10" className="size-4 text-ok" />
              Mark All Paid
            </button>
            <button type="button" onClick={onAllUnpaid} disabled={locked} className={`${ghostSm} border border-surface/20 !py-2 !text-surface hover:!bg-surface/10 disabled:pointer-events-none disabled:opacity-40`}>
              <Icon d="M7 7l10 10 M17 7 7 17" className="size-4 text-[#e8796d]" />
              Mark All Unpaid
            </button>
          </div>
        )}
      </div>

      {showTally && (
        <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4" aria-live="polite">
          <Pill label="Total students" value={tally.total} />
          <Pill label="Paid" value={tally.paid} dot="bg-ok" />
          <Pill label="Unpaid" value={tally.unpaid} dot="bg-danger" />
          <Pill label="Cleared" value={`${rate}%`} dot="bg-accent" />
        </div>
      )}
    </section>
  );
}
