"use client";

import { Fragment, useMemo, useState } from "react";
import { Chip, Drawer, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge, Bar } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  ACADEMIC_YEAR,
  behaviorFor,
  behaviorOf,
  methods,
  paymentRecords,
  planOf,
  settle,
  shortDate,
  stamp,
  yearSummaries,
  type FeeAccount,
  type FeeRecord,
  type Installment,
  type Payment,
} from "@/lib/fees";
import { sectionLabel } from "@/lib/students";
import { BehaviorBadge, FeeStatusBadge, InstallmentBadge, Legend, Timeline, behaviorTone, methodIcon } from "./parts";

export type LedgerTab = "payments" | "installments";

const tabs: [LedgerTab, string, string][] = [
  ["payments", "Payment Records", "M3 6h18v12H3z M3 10h18 M7 15h3"],
  ["installments", "Installment History", "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11"],
];

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

/** Every payment since enrollment, newest first, grouped by academic year. */
function PaymentRecords({ a, onReceipt }: { a: FeeAccount; onReceipt: (i: Installment, p: Payment) => void }) {
  const all = useMemo(() => paymentRecords(a), [a]);
  const [year, setYear] = useState("all");
  const shown = year === "all" ? all : all.filter((r) => r.i.year === year);
  const finals = all.filter((r) => r.p.kind === "final");
  const onTime = finals.filter((r) => r.late === 0).length;
  const byMethod = methods.map((m) => ({ m, n: all.filter((r) => r.p.method === m).length }));
  const years = [...a.years].reverse();

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
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Payments made" value={String(all.length)} note={`${all.length - finals.length} part payments`} />
        <Tile label="Cleared on time" value={`${finals.length ? Math.round((onTime / finals.length) * 100) : 100}%`} note={`${onTime} of ${finals.length} installments`} cls={rateText(finals.length ? (onTime / finals.length) * 100 : 100)} />
        <Tile label="First payment" value={shortDate(all.at(-1)!.p.at)} note={all.at(-1)!.i.label} />
        <Tile label="Last payment" value={shortDate(all[0].p.at)} note={all[0].i.label} />
      </dl>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[.8rem] text-ink/60">
        <strong className="text-ink">Payment methods:</strong>
        {byMethod
          .filter((b) => b.n)
          .map((b) => (
            <span key={b.m} className="inline-flex items-center gap-1.5">
              <Icon d={methodIcon[b.m]} className="size-4 text-primary" />
              {b.m} {b.n}
            </span>
          ))}
      </p>

      <div role="group" aria-label="Academic year" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <Chip type="radio" name="pay-year" checked={year === "all"} onChange={() => setYear("all")}>
          All years ({all.length})
        </Chip>
        {years.map((y) => (
          <Chip key={y} type="radio" name="pay-year" checked={year === y} onChange={() => setYear(y)}>
            {y} ({all.filter((r) => r.i.year === y).length})
          </Chip>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-2xl border border-ink/8">
        <table className="w-full min-w-[640px] text-left text-[.82rem]">
          <thead className="sticky top-0 z-10 bg-[#eef0f0] text-[.68rem] font-bold uppercase tracking-[.1em] text-ink/50">
            <tr>
              <th scope="col" className="px-4 py-3">Date & time</th>
              <th scope="col" className="px-3 py-3">For installment</th>
              <th scope="col" className="px-3 py-3">Method & reference</th>
              <th scope="col" className="px-3 py-3">Timing</th>
              <th scope="col" className="px-3 py-3 text-right">
                <span className="sr-only">Receipt</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(year === "all" ? years : [year]).map((y) => {
              const rows = shown.filter((r) => r.i.year === y);
              return (
                <Fragment key={y}>
                  <tr className="bg-primary/6">
                    <th scope="rowgroup" colSpan={5} className="px-4 py-2 text-left text-[.76rem] font-bold text-primary">
                      Academic year {y} · {planOf(a.plans[y]).label} · {rows.length} {rows.length === 1 ? "payment" : "payments"}
                    </th>
                  </tr>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-ink/50">
                        No payments in this year.
                      </td>
                    </tr>
                  )}
                  {rows.map(({ i, p, late }) => (
                    <tr key={p.receipt} className="border-t border-ink/8 align-middle">
                      <td className="px-4 py-3">
                        <span className="block whitespace-nowrap font-semibold">{stamp(p.at)}</span>
                        <span className="text-[.72rem] text-ink/50">{p.receipt}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-semibold">{i.label}</span>
                        <span className="text-[.72rem] text-ink/50">{p.kind === "final" ? "Full payment" : "Part payment"}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <Icon d={methodIcon[p.method]} className="size-4 text-primary" />
                          {p.method}
                        </span>
                        {p.ref && <span className="block text-[.72rem] text-ink/50">{p.ref}</span>}
                      </td>
                      <td className="px-3 py-3">
                        {late > 0 ? <Badge tone="serious">{late} days late</Badge> : <Badge tone="ok">On time</Badge>}
                        <span className="mt-1 block text-[.72rem] text-ink/50">due {shortDate(i.due)}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => onReceipt(i, p)} className={ghostSm} aria-label={`Download receipt ${p.receipt}`}>
                          <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-4" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Year-by-year behavior since enrollment, then one year in detail. */
function InstallmentHistory({ a, onReceipt }: { a: FeeAccount; onReceipt: (i: Installment, p: Payment) => void }) {
  const summaries = useMemo(() => yearSummaries(a), [a]);
  const [year, setYear] = useState(ACADEMIC_YEAR);
  const b = useMemo(() => behaviorFor(a, year), [a, year]);
  const rows = useMemo(() => a.installments.filter((i) => i.year === year).map((i) => ({ i, st: settle(i) })), [a, year]);

  return (
    <div className="grid gap-6">
      <section>
        <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Year by year since enrollment</h3>
        <div className="overflow-x-auto rounded-2xl border border-ink/8">
          <table className="w-full min-w-[620px] text-left text-[.82rem]">
            <thead className="bg-surface/70 text-[.68rem] font-bold uppercase tracking-[.1em] text-ink/50">
              <tr>
                <th scope="col" className="px-4 py-3">Academic year</th>
                <th scope="col" className="px-3 py-3">Plan</th>
                <th scope="col" className="px-3 py-3">On time</th>
                <th scope="col" className="px-3 py-3">Late</th>
                <th scope="col" className="px-3 py-3">In parts</th>
                <th scope="col" className="px-3 py-3">Unpaid</th>
                <th scope="col" className="px-3 py-3">Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {summaries.map((y) => (
                <tr key={y.year} className={`cursor-pointer transition-colors hover:bg-surface/60 ${year === y.year ? "bg-primary/6" : ""}`} onClick={() => setYear(y.year)}>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setYear(y.year)} aria-pressed={year === y.year} className="cursor-pointer font-bold hover:text-primary">
                      {y.year}
                    </button>
                    {y.year === ACADEMIC_YEAR && <span className="ml-1.5 text-[.7rem] font-semibold text-ink/45">current</span>}
                  </td>
                  <td className="px-3 py-3 text-ink/70">{planOf(y.plan).short}</td>
                  <td className="min-w-[120px] px-3 py-3">
                    <span className={`block font-bold ${rateText(y.b.rate)}`}>
                      {y.b.onTime}/{y.b.due} · {y.b.rate}%
                    </span>
                    <Bar value={y.b.rate} fill={y.b.rate >= 75 ? "bg-ok" : "bg-serious"} label={`${y.year}: ${y.b.rate}% on time`} />
                  </td>
                  <td className="px-3 py-3">{y.b.late ? `${y.b.late} (avg ${y.b.avgDelay}d)` : "0"}</td>
                  <td className="px-3 py-3">{y.b.partials}</td>
                  <td className={`px-3 py-3 font-bold ${y.b.unpaid ? "text-danger" : "text-ink/45"}`}>{y.b.unpaid}</td>
                  <td className="px-3 py-3">
                    <Badge tone={behaviorTone[y.b.key]}>{behaviorOf(y.b.key).label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-ink/8 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-[1rem] font-extrabold tracking-tight">Academic year {year}</h3>
          <p className="text-[.8rem] text-ink/55">{planOf(a.plans[year]).label}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="On-time rate" value={`${b.rate}%`} note={`${b.onTime} of ${b.due} installments`} cls={rateText(b.rate)} />
          <Tile label="Paid late" value={String(b.late)} note={b.late ? `avg ${b.avgDelay} days late` : "never late"} cls={b.late ? "text-[#a84f12]" : ""} />
          <Tile label="Paid in parts" value={String(b.partials)} note="installments split" cls={b.partials ? "text-[#9a6a0f]" : ""} />
          <Tile label="Unpaid" value={String(b.unpaid)} note={b.unpaid ? "past the due date" : "nothing overdue"} cls={b.unpaid ? "text-danger" : "text-ok"} />
        </dl>
        <Timeline b={b} labels />
        <Legend />
      </section>

      <ol className="grid gap-3">
        {rows.map(({ i, st }) => (
          <li key={i.id} className={`rounded-2xl border p-4 ${st.status === "overdue" ? "border-danger/25 bg-danger/3" : st.status === "upcoming" ? "border-ink/8 opacity-70" : "border-ink/8"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{i.label}</p>
                <p className="text-[.76rem] text-ink/55">
                  Due {shortDate(i.due)}
                  {st.clearedAt && ` · Cleared ${shortDate(st.clearedAt)}`}
                </p>
              </div>
              <InstallmentBadge status={st.status} delay={st.delay} />
            </div>
            {i.payments.length > 0 && (
              <ul className="mt-3 grid gap-1.5 border-t border-ink/8 pt-3">
                {i.payments.map((p) => (
                  <li key={p.receipt} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[.8rem]">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Icon d={methodIcon[p.method]} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong>{p.kind === "final" ? "Full payment" : "Part payment"}</strong> via {p.method}
                      <span className="block text-[.74rem] text-ink/50">
                        {stamp(p.at)} · {p.receipt}
                      </span>
                    </span>
                    <button type="button" onClick={() => onReceipt(i, p)} className={ghostSm} aria-label={`Download receipt ${p.receipt}`}>
                      <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-4" />
                      Receipt
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function FeeLedger({
  account: a,
  record,
  tab: initialTab = "payments",
  onHistory,
  onReceipt,
  onClose,
}: {
  account: FeeAccount;
  record: FeeRecord;
  tab?: LedgerTab;
  onHistory: () => void;
  onReceipt: (i: Installment, p: Payment) => void;
  onClose: () => void;
}) {
  const s = a.student;
  const [tab, setTab] = useState(initialTab);
  const life = useMemo(() => behaviorFor(a), [a]);

  return (
    <Drawer
      width="max-w-[900px]"
      title={tabs.find(([k]) => k === tab)![1]}
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

          <div role="tablist" aria-label="Fee record sections" className="flex rounded-xl border border-ink/10 p-1">
            {tabs.map(([k, label, ic]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[.84rem] font-semibold transition-colors ${tab === k ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
              >
                <Icon d={ic} className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === "payments" ? <PaymentRecords a={a} onReceipt={onReceipt} /> : <InstallmentHistory a={a} onReceipt={onReceipt} />}
        </div>
      )}
    </Drawer>
  );
}
