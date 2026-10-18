import { Badge, Bar, Card } from "@/components/dashboard/ui";
import { summarize, type DayRecord, type DayState } from "@/lib/teacherAttendance";
import { clock } from "@/lib/teachers";
import { detailOf, monthNames, shortDay, stateMeta, weekdayNames, weekdayOf } from "./shared";

const order: DayState[] = ["present", "late", "absent", "leave"];

/* ---------- Last 6 months: stacked working days by status ---------- */

export function TrendCard({ records }: { records: DayRecord[] }) {
  const byMonth = new Map<string, DayRecord[]>();
  for (const r of records) {
    const k = r.date.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k)!.push(r);
  }
  // Newest six months that had working days (summer break months are skipped), shown oldest first.
  const months = [...byMonth.entries()].slice(0, 6).reverse().map(([k, rs]) => ({ key: k, s: summarize(rs) }));
  const max = Math.max(...months.map((m) => m.s.total), 1);

  return (
    <Card title="Monthly Trend" subtitle="Working days by status, last 6 school months">
      <div className="grid h-[190px] grid-cols-6 items-end gap-3" role="img" aria-label={months.map((m) => `${monthNames[Number(m.key.slice(5)) - 1]} ${m.s.rate}%`).join(", ")}>
        {months.map((m) => (
          <div key={m.key} className="group relative flex h-full flex-col justify-end">
            <span className="mb-1.5 text-center text-[.72rem] font-bold tabular-nums text-ink/70">{m.s.rate}%</span>
            <div className="mx-auto flex w-full max-w-[38px] flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]" style={{ height: `${(m.s.total / max) * 78}%` }}>
              {order.map((s) =>
                m.s[s] ? (
                  <span
                    key={s}
                    className={`${stateMeta[s].fill} min-h-[3px]`}
                    style={{ flexGrow: m.s[s], flexBasis: 0 }}
                  />
                ) : null,
              )}
            </div>
            {/* Hover tooltip: the full breakdown for the month */}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-[.72rem] text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <strong className="block">{monthNames[Number(m.key.slice(5)) - 1]} {m.key.slice(0, 4)}</strong>
              {order.map((s) => (
                <span key={s} className="block">
                  {stateMeta[s].label}: {m.s[s]}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-3 border-t border-ink/10 pt-2">
        {months.map((m) => (
          <span key={m.key} className="text-center text-[.74rem] font-semibold text-ink/55">
            {monthNames[Number(m.key.slice(5)) - 1].slice(0, 3)}
          </span>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[.78rem] text-ink/65">
        {order.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${stateMeta[s].fill}`} />
            {stateMeta[s].label}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Weekday pattern: average check-in and late count per weekday ---------- */

export function WeekdayCard({ records }: { records: DayRecord[] }) {
  // About ten school months: enough to show a habit without old data dominating.
  const recent = records.slice(0, 200);
  const rows = [1, 2, 3, 4, 5].map((wd) => {
    const rs = recent.filter((r) => weekdayOf(r.date) === wd);
    const ins = rs.filter((r) => r.checkIn).map((r) => {
      const [h, m] = r.checkIn!.split(":").map(Number);
      return h * 60 + m;
    });
    const avg = ins.length ? Math.round(ins.reduce((s, x) => s + x, 0) / ins.length) : 0;
    return { wd, late: rs.filter((r) => r.state === "late").length, avg: `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}` };
  });
  const maxLate = Math.max(...rows.map((r) => r.late), 1);
  const worst = rows.reduce((a, b) => (b.late > a.late ? b : a));

  return (
    <Card title="Weekday Pattern" subtitle="Average check-in and late arrivals, last 200 school days">
      <ul className="grid gap-3">
        {rows.map((r) => (
          <li key={r.wd} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 text-[.84rem]">
            <span className="font-bold text-ink/70">{weekdayNames[r.wd]}</span>
            <Bar value={r.late} max={maxLate} fill={r.late && r === worst ? "bg-warn" : "bg-accent"} label={`${weekdayNames[r.wd]}: ${r.late} late arrivals`} />
            <span className="w-[108px] text-right text-[.78rem] text-ink/60">
              <strong className="tabular-nums text-ink">{r.late}</strong> late · {clock(r.avg)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-5 text-[.82rem] text-ink/65">
        {worst.late ? (
          <>
            Most late arrivals fall on <strong className="text-ink">{weekdayNames[worst.wd]}</strong>. Leaving a little earlier that day keeps your record clean.
          </>
        ) : (
          "No late arrivals in this period. Keep it up."
        )}
      </p>
    </Card>
  );
}

/* ---------- Recent exceptions with correction requests ---------- */

/** Corrections are accepted for the last 30 days only. */
export function ExceptionsCard({ records, todayIso, corrected, onCorrect }: { records: DayRecord[]; todayIso: string; corrected: Set<string>; onCorrect: (r: DayRecord) => void }) {
  const items = records.filter((r) => r.state !== "present").slice(0, 5);
  const cutoff = new Date(`${todayIso}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const since = cutoff.toISOString().slice(0, 10);
  return (
    <Card title="Recent Exceptions" subtitle="Late, absent and leave days">
      {items.length === 0 ? (
        <p className="rounded-xl bg-ok/8 px-3 py-2.5 text-[.86rem] font-semibold text-ok">Every recent day was on time.</p>
      ) : (
        <ul className="divide-y divide-ink/6">
          {items.map((r) => {
            const m = stateMeta[r.state];
            const canCorrect = (r.state === "late" || r.state === "absent") && r.date >= since;
            return (
              <li key={r.date} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                <span className="grid min-w-0 flex-1">
                  <span className="text-[.9rem] font-semibold">{shortDay(r.date)}</span>
                  <span className="text-[.78rem] text-ink/55">{detailOf(r, clock)}</span>
                </span>
                <Badge tone={m.tone}>{m.label}</Badge>
                {canCorrect &&
                  (corrected.has(r.date) ? (
                    <span className="text-[.74rem] font-semibold text-ink/50">Correction sent</span>
                  ) : (
                    <button type="button" onClick={() => onCorrect(r)} className="cursor-pointer rounded-full bg-primary/10 px-3 py-1 text-[.74rem] font-bold text-primary transition-colors hover:bg-primary hover:text-surface">
                      Request correction
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-auto pt-4 text-[.76rem] text-ink/50">Wrong entry in the last 30 days? A correction request goes to the principal with the day&apos;s log.</p>
    </Card>
  );
}
