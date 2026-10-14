"use client";

import { Fragment, useMemo, useState } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { academicYearOf, behaviorFor, monthLabel, paidIn, paymentRecords, shortDate, stamp, type FeeAccount, type FeeRecord } from "@/lib/fees";
import { sectionLabel } from "@/lib/students";
import { BehaviorBadge, FeeStatusBadge } from "./parts";
import PeriodSelects from "./PeriodSelects";

const rateText = (rate: number) => (rate >= 90 ? "text-ok" : rate >= 75 ? "text-primary" : "text-[#a84f12]");

function Tile({ label, value, note, cls = "" }: { label: string; value: string; note?: string; cls?: string }) {
  return (
    <div className="rounded-2xl bg-surface/60 p-3.5">
      <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{label}</dt>
      <dd className={`mt-1 text-[1.2rem] font-extrabold tracking-tight ${cls}`}>{value}</dd>
      {note && <dd className="text-[.72rem] text-ink/50">{note}</dd>}
    </div>
  );
}

/** Every payment since enrollment, newest first, filtered by the year and month it was paid. */
function PaymentRecords({ a }: { a: FeeAccount }) {
  const all = useMemo(() => paymentRecords(a), [a]);
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const years = useMemo(() => [...new Set(all.map((r) => academicYearOf(r.p.at)))].sort().reverse(), [all]);
  const shown = all.filter((r) => paidIn(r.p.at, year, month));
  const finals = shown.filter((r) => r.p.kind === "final");
  const onTime = finals.filter((r) => r.late === 0).length;
  const rate = finals.length ? Math.round((onTime / finals.length) * 100) : 100;
  const scope = year === "all" && month === "all" ? "since enrollment" : month !== "all" && month.length > 2 ? `in ${monthLabel(month)}` : year !== "all" ? `in ${year}` : "in the selected month";

  if (!all.length)
    return (
      <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-danger/8 text-danger">
          <Icon d="M12 4l9 16H3z M12 10v4 M12 17h.01" className="size-7" />
        </span>
        <p className="font-bold">No payments recorded yet</p>
        <p className="max-w-[360px] text-[.86rem] text-ink/55">This student has not made a fee payment since enrolling on {shortDate(a.student.enrolled)}.</p>
      </div>
    );

  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <PeriodSelects years={years} year={year} month={month} onYear={setYear} onMonth={setMonth} />
        <button
          type="button"
          disabled={year === "all" && month === "all"}
          onClick={() => (setYear("all"), setMonth("all"))}
          className={`${ghostBtn} disabled:pointer-events-none disabled:opacity-45`}
        >
          Show all
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Payments" value={String(shown.length)} note={scope} />
        <Tile label="Cleared on time" value={`${rate}%`} note={`${onTime} of ${finals.length} full payments`} cls={rateText(rate)} />
        <Tile label="Paid late" value={String(finals.length - onTime)} note="after the due date" cls={finals.length - onTime ? "text-[#a84f12]" : ""} />
        <Tile label="Part payments" value={String(shown.length - finals.length)} note="installments split" cls={shown.length - finals.length ? "text-[#9a6a0f]" : ""} />
      </dl>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center text-[.86rem] text-ink/55">No payments were made in this period.</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto rounded-2xl border border-ink/8">
          <table className="w-full min-w-[600px] text-left text-[.82rem]">
            <thead className="sticky top-0 z-10 bg-[#eef0f0] text-[.68rem] font-bold uppercase tracking-[.1em] text-ink/50">
              <tr>
                <th scope="col" className="px-4 py-3">Paid on</th>
                <th scope="col" className="px-3 py-3">For installment</th>
                <th scope="col" className="px-3 py-3">Type</th>
                <th scope="col" className="px-3 py-3">Timing</th>
              </tr>
            </thead>
            <tbody>
              {years
                .filter((y) => year === "all" || y === year)
                .map((y) => {
                  const rows = shown.filter((r) => academicYearOf(r.p.at) === y);
                  if (!rows.length) return null;
                  return (
                    <Fragment key={y}>
                      <tr className="bg-primary/6">
                        <th scope="rowgroup" colSpan={4} className="px-4 py-2 text-left text-[.76rem] font-bold text-primary">
                          Academic year {y} · {rows.length} {rows.length === 1 ? "payment" : "payments"}
                        </th>
                      </tr>
                      {rows.map(({ i, p, late }) => (
                        <tr key={p.id} className="border-t border-ink/8 align-middle">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold">{stamp(p.at)}</td>
                          <td className="px-3 py-3">
                            <span className="block font-semibold">{i.label}</span>
                            <span className="text-[.72rem] text-ink/50">due {shortDate(i.due)}</span>
                          </td>
                          <td className="px-3 py-3">{p.kind === "final" ? "Full payment" : "Part payment"}</td>
                          <td className="px-3 py-3">{late > 0 ? <Badge tone="serious">{late} days late</Badge> : <Badge tone="ok">On time</Badge>}</td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FeeLedger({ account: a, record, onHistory, onClose }: { account: FeeAccount; record: FeeRecord; onHistory: () => void; onClose: () => void }) {
  const s = a.student;
  const life = useMemo(() => behaviorFor(a), [a]);

  return (
    <Drawer
      width="max-w-[860px]"
      title="Payment Records"
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" onClick={onHistory} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Download Full History
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={s.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[1.25rem] font-extrabold tracking-tight">{s.name}</p>
              <p className="text-[.84rem] text-ink/55">
                {s.regId} · Enrolled {shortDate(s.enrolled)} · {a.years.length} {a.years.length === 1 ? "academic year" : "academic years"} on record
              </p>
              <p className="text-[.84rem] text-ink/55">
                Guardian {s.guardian} ·{" "}
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                  {s.phone}
                </a>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <FeeStatusBadge r={record} />
                <BehaviorBadge k={life.key} />
                <Badge tone="neutral">{life.rate}% on time since enrollment</Badge>
              </div>
            </div>
          </div>

          <PaymentRecords a={a} />
        </div>
      )}
    </Drawer>
  );
}
