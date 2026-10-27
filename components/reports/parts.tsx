"use client";

import { StatCard } from "@/components/dashboard/ui";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { terms, totals, trendOf, type Report, type TermId, type Trend } from "@/lib/reports";

// Shared by the student Result Card page (output) and the teacher Result Card page (input),
// so both pages keep the same term tabs and summary cards.

export type Availability = "published" | "preparing" | "not-started";

export const availabilityOf = (r: Report): Availability => (r.sentAt ? "published" : r.marks.some((m) => m.obtained !== null) ? "preparing" : "not-started");

const availabilityMeta: Record<Availability, { label: string; dot: string }> = {
  published: { label: "Published", dot: "bg-ok" },
  preparing: { label: "In preparation", dot: "bg-warn" },
  "not-started": { label: "Not started", dot: "bg-ink/30" },
};

const trendText: Record<Trend, string> = {
  improving: "Improving",
  consistent: "Consistent",
  attention: "Needs attention",
};

/** Term pills with a status dot per term. */
export function TermTabs({ term, onTerm, statusOf }: { term: TermId; onTerm: (t: TermId) => void; statusOf: (t: TermId) => Availability }) {
  const { listRef, target, setHover } = useSlidingPill(terms.findIndex((t) => t.id === term));
  return (
    <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
      <ul ref={listRef} role="tablist" aria-label="Report terms" className="relative flex w-max gap-1 rounded-full bg-white p-1 shadow-[0_10px_30px_rgba(6,30,41,.05)]" onMouseLeave={() => setHover(null)}>
        <span data-pill aria-hidden className={pillClass} />
        {terms.map((x, i) => (
          <li key={x.id} role="presentation">
            <button
              data-pill-item
              type="button"
              role="tab"
              aria-selected={term === x.id}
              onClick={() => onTerm(x.id)}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className={`relative z-10 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[.86rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                i === target ? "text-surface" : "text-ink/65 hover:text-ink"
              }`}
            >
              <span aria-hidden className={`size-2 rounded-full ${availabilityMeta[statusOf(x.id)].dot}`} />
              {x.label}
              <span className="sr-only">({availabilityMeta[statusOf(x.id)].label})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Overall result, class rank, best subject and trend for one card. */
export function ResultStats({ report, rank, size, classLabel }: { report: Report; rank: number; size: number; classLabel: string }) {
  const t = totals(report);
  const trend = trendOf(report);
  const delta = Math.round((t.pct - report.previous) * 10) / 10;
  const best = report.marks.reduce((a, b) => ((b.obtained ?? -1) > (a.obtained ?? -1) ? b : a));
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
      <StatCard label="Overall Result" value={`${t.pct}%`} icon="M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6" note={`Grade ${t.grade} · GPA ${t.gpa.toFixed(1)} / 4.0`} />
      <StatCard label="Class Rank" value={`${rank} of ${size}`} icon="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" note={`Among ${classLabel}`} />
      <StatCard label="Best Subject" value={best.obtained === null ? "-" : `${best.obtained}%`} icon="M5 12l4 4 10-10" note={best.obtained === null ? "No marks yet" : best.subject} />
      <StatCard
        label={trendText[trend]}
        value={`${delta >= 0 ? "+" : ""}${delta} pts`}
        icon={trend === "attention" ? "M4 7l6 6 4-4 6 6 M14 15h6V9" : "M4 17l6-6 4 4 6-6 M14 9h6v6"}
        note={`Was ${report.previous}% last term`}
      />
    </div>
  );
}
