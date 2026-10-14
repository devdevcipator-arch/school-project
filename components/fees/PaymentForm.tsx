"use client";

import { useState, type ReactNode } from "react";
import { Chip, Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { methods, payableNow, rs, settle, shortDate, type FeeAccount, type PaymentMethod } from "@/lib/fees";
import { AS_OF, sectionLabel } from "@/lib/students";
import { methodIcon } from "./parts";

export type ManualPayment = { amount: number; method: PaymentMethod; ref: string; date: string; note: string };
type Errors = Partial<Record<"amount" | "ref" | "date", string>>;

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
  const payable = payableNow(a);
  const open = a.installments.map((i) => ({ i, st: settle(i) })).filter((x) => x.st.balance > 0 && (x.st.late >= -31 || x.st.paid > 0));
  const [amount, setAmount] = useState(String(payable));
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(AS_OF);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (close: () => void) => {
    const n = Number(amount.replace(/[,\s]/g, ""));
    const next: Errors = {};
    if (!Number.isFinite(n) || n <= 0) next.amount = "Enter the amount received.";
    else if (n > payable) next.amount = `Amount cannot exceed the payable balance of ${rs(payable)}.`;
    if (method === "Bank Slip" && !ref.trim()) next.ref = "Enter the bank slip number to verify the deposit.";
    if (!date || date > AS_OF) next.date = "Payment date cannot be in the future.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ amount: Math.round(n), method, ref: ref.trim(), date, note: note.trim() });
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
                {sectionLabel(a.student.section)} · Roll {a.student.rollNo}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">Payable now</p>
              <p className="text-[1.15rem] font-extrabold text-danger">{rs(payable)}</p>
            </div>
          </div>

          <section>
            <h3 className="mb-2 text-[.84rem] font-bold">Applied to (oldest first)</h3>
            <ul className="divide-y divide-ink/8 rounded-2xl border border-ink/8 text-[.84rem]">
              {open.map(({ i, st }) => (
                <li key={i.challan} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>
                    <strong>{i.label}</strong>
                    <span className="block text-[.74rem] text-ink/50">
                      Due {shortDate(i.due)}
                      {st.fine > 0 && ` · includes ${rs(st.fine)} fine`}
                    </span>
                  </span>
                  <span className="font-bold">{rs(st.balance)}</span>
                </li>
              ))}
            </ul>
          </section>

          <Field id="pay-amount" label="Amount received (Rs)" error={errors.amount}>
            <input {...aria("pay-amount", errors.amount)} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className={input(errors.amount)} />
          </Field>

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
