"use client";

import { useMemo } from "react";
import { Drawer, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ACADEMIC_YEAR, behaviorFor, behaviorOf, openInstallments, planOf, settle, shortDate, stamp, type FeeAccount, type FeeRecord, type Installment, type Payment } from "@/lib/fees";
import { sectionLabel } from "@/lib/students";
import { BehaviorBadge, FeeStatusBadge, InstallmentBadge, Legend, Timeline, methodIcon } from "./parts";

function Tile({ label, value, note, cls = "" }: { label: string; value: string; note?: string; cls?: string }) {
  return (
    <div className="rounded-2xl bg-surface/60 p-3.5">
      <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{label}</dt>
      <dd className={`mt-1 text-[1.25rem] font-extrabold tracking-tight ${cls}`}>{value}</dd>
      {note && <dd className="text-[.72rem] text-ink/50">{note}</dd>}
    </div>
  );
}

export default function FeeLedger({
  account: a,
  record,
  onPay,
  onChallan,
  onReceipt,
  onClose,
}: {
  account: FeeAccount;
  record: FeeRecord;
  onPay: () => void;
  onChallan: (items: Installment[]) => void;
  onReceipt: (i: Installment, p: Payment) => void;
  onClose: () => void;
}) {
  const s = a.student;
  const b = useMemo(() => behaviorFor(a), [a]);
  const rows = useMemo(() => a.installments.map((i) => ({ i, st: settle(i) })), [a]);
  const open = openInstallments(a);

  return (
    <Drawer
      width="max-w-[820px]"
      title="Fee Ledger & Installment Record"
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" disabled={!open.length} onClick={() => onChallan(open)} className={`${ghostBtn} disabled:pointer-events-none disabled:opacity-45 max-sm:flex-1 sm:ml-auto`}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Download Challan
          </button>
          <button type="button" disabled={!open.length} onClick={onPay} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:w-full")}>
            <Icon d="M12 5v14 M5 12h14" className="size-[18px]" />
            Log Manual Payment
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
              </div>
            </div>
          </div>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[1rem] font-extrabold tracking-tight">Installment behavior record</h3>
              <p className="text-[.8rem] text-ink/55">Academic year {ACADEMIC_YEAR}</p>
            </div>
            <div className="grid gap-4 rounded-2xl border border-ink/8 p-4 sm:p-5">
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
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Month-by-month installments</h3>
            <ol className="grid gap-3">
              {rows.map(({ i, st }) => (
                <li
                  key={i.challan}
                  className={`rounded-2xl border p-4 ${st.status === "overdue" ? "border-danger/25 bg-danger/3" : st.status === "upcoming" ? "border-ink/8 opacity-70" : "border-ink/8"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{i.label}</p>
                      <p className="text-[.76rem] text-ink/55">
                        {i.challan} · Due {shortDate(i.due)}
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
                            {p.ref && <span className="text-ink/50"> · {p.ref}</span>}
                            <span className="block text-[.74rem] text-ink/50">
                              {stamp(p.at)} · {p.receipt}
                              {p.note && ` · ${p.note}`}
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
          </section>
        </div>
      )}
    </Drawer>
  );
}
