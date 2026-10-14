"use client";

import { useMemo } from "react";
import { Drawer, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { accountSummary, planOf, rs, settle, shortDate, stamp, type FeeAccount, type FeeRecord, type Installment, type Payment } from "@/lib/fees";
import { sectionLabel } from "@/lib/students";
import { FeeStatusBadge, installmentMeta, methodIcon } from "./parts";

function Tile({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-2xl bg-surface/60 p-3.5">
      <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{label}</dt>
      <dd className={`mt-1 text-[1.15rem] font-extrabold tracking-tight ${cls}`}>{value}</dd>
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
  const sum = useMemo(() => accountSummary(a), [a]);
  const rows = useMemo(() => a.installments.map((i) => ({ i, st: settle(i) })), [a]);
  const outstanding = rows.filter((x) => x.st.balance > 0 && (x.st.late >= -31 || x.st.paid > 0)).map((x) => x.i);
  const monthlyTuition = a.installments[0].tuition / a.installments[0].months.length;

  return (
    <Drawer
      width="max-w-[820px]"
      title="Fee Ledger & Challans"
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" disabled={!outstanding.length} onClick={() => onChallan(outstanding)} className={`${ghostBtn} disabled:pointer-events-none disabled:opacity-45 max-sm:flex-1 sm:ml-auto`}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Download Challan
          </button>
          <button type="button" disabled={!outstanding.length} onClick={onPay} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:w-full")}>
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
                <Badge tone="neutral">{planOf(a.plan).label}</Badge>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Annual fee" value={rs(sum.annual)} />
            <Tile label="Paid to date" value={rs(sum.paid)} cls="text-ok" />
            <Tile label="Outstanding" value={rs(sum.outstanding)} cls={sum.outstanding ? "text-danger" : "text-ok"} />
            <Tile label="Late fines" value={rs(sum.fines)} cls={sum.fines ? "text-[#a84f12]" : ""} />
          </dl>

          <section>
            <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Fee structure, discounts & fines</h3>
            <div className="overflow-hidden rounded-2xl border border-ink/8">
              <table className="w-full text-[.86rem]">
                <tbody className="divide-y divide-ink/8">
                  <tr>
                    <td className="px-4 py-2.5">Monthly tuition ({sectionLabel(s.section)})</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{rs(monthlyTuition)}</td>
                  </tr>
                  {a.extras.map((l) => (
                    <tr key={l.label}>
                      <td className="px-4 py-2.5">{l.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">+ {rs(l.amount)}</td>
                    </tr>
                  ))}
                  {a.discounts.map((l) => (
                    <tr key={l.label} className="bg-ok/5">
                      <td className="px-4 py-2.5 text-ok">{l.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ok">- {rs(l.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface/70 font-extrabold">
                    <td className="px-4 py-2.5">Net monthly fee</td>
                    <td className="px-4 py-2.5 text-right">{rs(monthlyTuition + a.extras.reduce((n, l) => n + l.amount, 0) - a.discounts.reduce((n, l) => n + l.amount, 0))}</td>
                  </tr>
                  {a.plan === "annual" && (
                    <tr className="bg-ok/5">
                      <td className="px-4 py-2.5 text-ok">Advance annual payment discount (5%)</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ok">- {rs(a.installments[0].discounts.at(-1)!.amount)}</td>
                    </tr>
                  )}
                  <tr className={sum.fines ? "bg-serious/6" : ""}>
                    <td className="px-4 py-2.5">
                      Late payment fines this year
                      <span className="block text-[.74rem] text-ink/50">Rs 500 after the due date, plus Rs 500 per further 30 days (max Rs 2,000)</span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${sum.fines ? "text-[#a84f12]" : "text-ink/45"}`}>{sum.fines ? `+ ${rs(sum.fines)}` : "None"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[1rem] font-extrabold tracking-tight">Installment history</h3>
              <p className="text-[.8rem] text-ink/55">Academic year 2026-27</p>
            </div>
            <ol className="grid gap-3">
              {rows.map(({ i, st }) => {
                const meta = installmentMeta[st.status];
                const open = st.balance > 0 && st.status !== "upcoming";
                return (
                  <li key={i.challan} className={`rounded-2xl border p-4 ${st.status === "overdue" ? "border-danger/25 bg-danger/3" : st.status === "upcoming" ? "border-ink/8 opacity-70" : "border-ink/8"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold">{i.label}</p>
                        <p className="text-[.76rem] text-ink/55">
                          {i.challan} · Due {shortDate(i.due)}
                          {st.late > 0 && st.balance > 0 && <span className="font-bold text-danger"> · {st.late} days late</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {open && (
                          <button type="button" onClick={() => onChallan([i])} className={ghostSm} aria-label={`Download challan for ${i.label}`}>
                            <Icon d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" className="size-4" />
                            Challan
                          </button>
                        )}
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[.8rem] sm:grid-cols-4">
                      <div>
                        <dt className="text-ink/50">Fee</dt>
                        <dd className="font-bold">{rs(st.net)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink/50">Late fine</dt>
                        <dd className={`font-bold ${st.fine ? "text-[#a84f12]" : ""}`}>{rs(st.fine)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink/50">Paid</dt>
                        <dd className="font-bold text-ok">{rs(st.paid)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink/50">Balance</dt>
                        <dd className={`font-bold ${st.balance && st.status !== "upcoming" ? "text-danger" : ""}`}>{rs(st.balance)}</dd>
                      </div>
                    </dl>
                    {i.payments.length > 0 && (
                      <ul className="mt-3 grid gap-1.5 border-t border-ink/8 pt-3">
                        {i.payments.map((p) => (
                          <li key={p.receipt} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[.8rem]">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                              <Icon d={methodIcon[p.method]} className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong>{rs(p.amount)}</strong> via {p.method}
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
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}
