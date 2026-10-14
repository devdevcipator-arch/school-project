"use client";

import { useMemo, useState } from "react";
import { Drawer, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  ACADEMIC_YEAR,
  behaviorFor,
  behaviorOf,
  challanFor,
  methods,
  paymentRecords,
  planOf,
  settle,
  shortDate,
  stamp,
  type FeeAccount,
  type FeeRecord,
  type Installment,
  type Payment,
} from "@/lib/fees";
import { sectionLabel } from "@/lib/students";
import { BehaviorBadge, FeeStatusBadge, InstallmentBadge, Legend, Timeline, methodIcon } from "./parts";

export type LedgerTab = "payments" | "installments";

const tabs: [LedgerTab, string, string][] = [
  ["payments", "Payment Records", "M3 6h18v12H3z M3 10h18 M7 15h3"],
  ["installments", "Installment Record", "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11"],
];

function Tile({ label, value, note, cls = "" }: { label: string; value: string; note?: string; cls?: string }) {
  return (
    <div className="rounded-2xl bg-surface/60 p-3.5">
      <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{label}</dt>
      <dd className={`mt-1 text-[1.25rem] font-extrabold tracking-tight ${cls}`}>{value}</dd>
      {note && <dd className="text-[.72rem] text-ink/50">{note}</dd>}
    </div>
  );
}

/** Every payment the student made, newest first. */
function PaymentRecords({ a, onReceipt }: { a: FeeAccount; onReceipt: (i: Installment, p: Payment) => void }) {
  const records = useMemo(() => paymentRecords(a), [a]);
  const byMethod = methods.map((m) => ({ m, n: records.filter((r) => r.p.method === m).length }));
  const onTime = records.filter((r) => r.p.kind === "final" && r.late === 0).length;
  const finals = records.filter((r) => r.p.kind === "final").length;

  if (!records.length)
    return (
      <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-danger/8 text-danger">
          <Icon d="M12 4l9 16H3z M12 10v4 M12 17h.01" className="size-7" />
        </span>
        <p className="font-bold">No payments recorded this year</p>
        <p className="max-w-[360px] text-[.86rem] text-ink/55">This student has not made any fee payment in academic year {ACADEMIC_YEAR}.</p>
      </div>
    );

  return (
    <div className="grid gap-5">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Payments made" value={String(records.length)} note={`${records.length - finals} were part payments`} />
        <Tile label="Cleared on time" value={`${onTime}/${finals}`} note="full payments by the due date" cls={onTime === finals ? "text-ok" : "text-[#a84f12]"} />
        <Tile label="Last payment" value={shortDate(records[0].p.at)} note={records[0].i.label} />
        <Tile label="Usual method" value={[...byMethod].sort((x, y) => y.n - x.n)[0].m.replace("Online Gateway", "Online")} note={byMethod.filter((b) => b.n).map((b) => `${b.m.split(" ")[0]} ${b.n}`).join(" · ")} />
      </dl>

      <div className="overflow-x-auto rounded-2xl border border-ink/8">
        <table className="w-full min-w-[640px] text-left text-[.82rem]">
          <thead className="bg-surface/70 text-[.68rem] font-bold uppercase tracking-[.1em] text-ink/50">
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
          <tbody className="divide-y divide-ink/8">
            {records.map(({ i, p, late }) => (
              <tr key={p.receipt} className="align-middle">
                <td className="px-4 py-3">
                  <span className="block whitespace-nowrap font-semibold">{stamp(p.at)}</span>
                  <span className="text-[.72rem] text-ink/50">{p.receipt}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="block font-semibold">{i.label}</span>
                  <span className="text-[.72rem] text-ink/50">
                    {p.kind === "final" ? "Full payment" : "Part payment"} · {i.challan}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Icon d={methodIcon[p.method]} className="size-4 text-primary" />
                    {p.method}
                  </span>
                  {p.ref && <span className="block text-[.72rem] text-ink/50">{p.ref}</span>}
                  {p.note && <span className="block text-[.72rem] text-ink/50">{p.note}</span>}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Behavior summary plus every installment with its status. */
function InstallmentRecord({ a, onChallan, onReceipt }: { a: FeeAccount; onChallan: (items: Installment[]) => void; onReceipt: (i: Installment, p: Payment) => void }) {
  const b = useMemo(() => behaviorFor(a), [a]);
  const rows = useMemo(() => a.installments.map((i) => ({ i, st: settle(i) })), [a]);
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-2xl border border-ink/8 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="On-time rate" value={`${b.rate}%`} note={`${b.onTime} of ${b.due} installments`} cls={b.rate >= 75 ? "text-ok" : "text-[#a84f12]"} />
          <Tile label="Paid late" value={String(b.late)} note={b.late ? `avg ${b.avgDelay} days late` : "never late"} cls={b.late ? "text-[#a84f12]" : ""} />
          <Tile label="Paid in parts" value={String(b.partials)} note="installments split" cls={b.partials ? "text-[#9a6a0f]" : ""} />
          <Tile label="Unpaid now" value={String(b.unpaid)} note={b.months ? `${b.months} months overdue` : "nothing overdue"} cls={b.unpaid ? "text-danger" : "text-ok"} />
        </dl>
        <Timeline b={b} labels />
        <Legend />
        <p className="rounded-xl bg-surface/70 px-4 py-3 text-[.84rem] text-ink/75">
          <strong className="text-ink">{behaviorOf(b.key).label}:</strong> {behaviorOf(b.key).hint.toLowerCase()}.
          {b.streak > 1 && ` Current streak of ${b.streak} installments cleared on time.`}
          {b.maxDelay > 0 && ` Longest delay this year: ${b.maxDelay} days.`}
        </p>
      </section>

      <ol className="grid gap-3">
        {rows.map(({ i, st }) => (
          <li key={i.challan} className={`rounded-2xl border p-4 ${st.status === "overdue" ? "border-danger/25 bg-danger/3" : st.status === "upcoming" ? "border-ink/8 opacity-70" : "border-ink/8"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{i.label}</p>
                <p className="text-[.76rem] text-ink/55">
                  {i.challan} · Due {shortDate(i.due)}
                  {i.originalDue && <span className="font-semibold text-primary"> (extended from {shortDate(i.originalDue)})</span>}
                  {st.clearedAt && ` · Cleared ${shortDate(st.clearedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <InstallmentBadge status={st.status} delay={st.delay} />
                {st.open && (
                  <button type="button" onClick={() => onChallan([i])} className={ghostSm} aria-label={`Download challan for ${i.label}`}>
                    <Icon d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" className="size-4" />
                    Challan
                  </button>
                )}
              </div>
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
  onEditChallan,
  onChallan,
  onReceipt,
  onClose,
}: {
  account: FeeAccount;
  record: FeeRecord;
  tab?: LedgerTab;
  onEditChallan: () => void;
  onChallan: (items?: Installment[]) => void;
  onReceipt: (i: Installment, p: Payment) => void;
  onClose: () => void;
}) {
  const s = a.student;
  const [tab, setTab] = useState(initialTab);
  const b = useMemo(() => behaviorFor(a), [a]);
  const onChallanList = challanFor(a).include.length > 0;

  return (
    <Drawer
      width="max-w-[860px]"
      title={tabs.find(([k]) => k === tab)![1]}
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" disabled={!onChallanList} onClick={() => onChallan()} className={`${ghostBtn} disabled:pointer-events-none disabled:opacity-45 max-sm:flex-1 sm:ml-auto`}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Download Challan
          </button>
          <button type="button" onClick={onEditChallan} className={buttonClass("primary", "md", "cursor-pointer max-sm:w-full")}>
            <Icon d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" className="size-[18px]" />
            Edit Challan
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
                {s.regId} · Guardian {s.guardian} ·{" "}
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                  {s.phone}
                </a>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <FeeStatusBadge r={record} />
                <BehaviorBadge k={b.key} />
                <Badge tone="neutral">{planOf(a.plan).label}</Badge>
                {a.challan?.editedAt && <Badge tone="neutral">Challan customised</Badge>}
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

          {tab === "payments" ? <PaymentRecords a={a} onReceipt={onReceipt} /> : <InstallmentRecord a={a} onChallan={onChallan} onReceipt={onReceipt} />}
        </div>
      )}
    </Drawer>
  );
}
