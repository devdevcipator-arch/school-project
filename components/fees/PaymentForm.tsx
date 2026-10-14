"use client";

import { useState, type ReactNode } from "react";
import { Chip, Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { methods, openInstallments, settle, shortDate, type FeeAccount, type Payment, type PaymentMethod } from "@/lib/fees";
import { AS_OF, sectionLabel } from "@/lib/students";
import { InstallmentBadge, methodIcon } from "./parts";

export type ManualPayment = { challans: string[]; kind: Payment["kind"]; method: PaymentMethod; ref: string; date: string; note: string };
type Errors = Partial<Record<"challans" | "ref" | "date", string>>;

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[.84rem] font-bold">
        {label} {hint && <span className="font-normal text-ink/50">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[.8rem] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const input = (bad?: string) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-[.92rem] outline-none transition-colors hover:border-accent focus:border-primary ${bad ? "border-danger" : "border-ink/12"}`;
const aria = (id: string, bad?: string) => ({ id, "aria-invalid": !!bad, "aria-describedby": bad ? `${id}-error` : undefined });

export default function PaymentForm({ account: a, onSave, onClose }: { account: FeeAccount; onSave: (p: ManualPayment) => void; onClose: () => void }) {
  const open = openInstallments(a).map((i) => ({ i, st: settle(i) }));
  // Pre-select everything already overdue or part-paid; otherwise the current cycle.
  const urgent = open.filter((x) => x.st.late > 0 || x.i.payments.length > 0);
  const [challans, setChallans] = useState<string[]>((urgent.length ? urgent : open.slice(0, 1)).map((x) => x.i.challan));
  const [kind, setKind] = useState<Payment["kind"]>("final");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(AS_OF);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const toggle = (c: string) => setChallans((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));

  const submit = (close: () => void) => {
    const next: Errors = {};
    if (!challans.length) next.challans = "Choose at least one installment this payment covers.";
    if (method === "Bank Slip" && !ref.trim()) next.ref = "Enter the bank slip number to verify the deposit.";
    if (!date || date > AS_OF) next.date = "Payment date cannot be in the future.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ challans, kind, method, ref: ref.trim(), date, note: note.trim() });
    close();
  };

  return (
    <Drawer
      width="max-w-[560px]"
      title="Log Manual Payment"
      subtitle="Record a cash or bank slip payment after verification."
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={() => submit(close)} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d="M5 12l4 4 10-10" className="size-[18px]" />
            Verify & Record
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <div className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface/50 p-3.5">
            <Avatar name={a.student.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{a.student.name}</p>
              <p className="text-[.78rem] text-ink/55">
                {sectionLabel(a.student.section)} · Roll {a.student.rollNo} · {a.student.regId}
              </p>
            </div>
          </div>

          <fieldset aria-describedby={errors.challans ? "pay-challans-error" : undefined}>
            <legend className="mb-2 text-[.84rem] font-bold">Installments covered</legend>
            <ul className="grid gap-2">
              {open.map(({ i, st }) => (
                <li key={i.challan}>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${challans.includes(i.challan) ? "border-primary bg-primary/6" : "border-ink/10 hover:border-accent"}`}>
                    <input type="checkbox" checked={challans.includes(i.challan)} onChange={() => toggle(i.challan)} className="size-4 accent-[#1D546D]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[.9rem] font-bold">{i.label}</span>
                      <span className="text-[.76rem] text-ink/55">
                        {i.challan} · Due {shortDate(i.due)}
                      </span>
                    </span>
                    <InstallmentBadge status={st.status} delay={st.delay} />
                  </label>
                </li>
              ))}
            </ul>
            {errors.challans && (
              <p id="pay-challans-error" className="mt-1.5 text-[.8rem] font-semibold text-danger">
                {errors.challans}
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[.84rem] font-bold">Payment type</legend>
            <div className="flex flex-wrap gap-2">
              <Chip type="radio" name="pay-kind" checked={kind === "final"} onChange={() => setKind("final")}>
                Full payment (clears installment)
              </Chip>
              <Chip type="radio" name="pay-kind" checked={kind === "part"} onChange={() => setKind("part")}>
                Part payment (balance pending)
              </Chip>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[.84rem] font-bold">Payment method</legend>
            <div className="flex flex-wrap gap-2">
              {methods.map((m) => (
                <Chip key={m} type="radio" name="pay-method" checked={method === m} onChange={() => setMethod(m)}>
                  <Icon d={methodIcon[m]} className="size-4" />
                  {m}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="pay-ref" label={method === "Bank Slip" ? "Bank slip number" : "Reference"} hint={method === "Bank Slip" ? undefined : "(optional)"} error={errors.ref}>
              <input {...aria("pay-ref", errors.ref)} value={ref} onChange={(e) => setRef(e.target.value)} placeholder={method === "Bank Slip" ? "e.g. HBL-482913" : method === "Cash" ? "Cash book entry no." : "Transaction ID"} className={input(errors.ref)} />
            </Field>
            <Field id="pay-date" label="Payment date" error={errors.date}>
              <input {...aria("pay-date", errors.date)} type="date" max={AS_OF} value={date} onChange={(e) => setDate(e.target.value)} className={input(errors.date)} />
            </Field>
          </div>

          <Field id="pay-note" label="Note" hint="(optional)">
            <input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid by father at the accounts office" className={input()} />
          </Field>
        </div>
      )}
    </Drawer>
  );
}
