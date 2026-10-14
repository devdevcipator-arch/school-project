"use client";

import { useState, type ReactNode } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ACADEMIC_YEAR, DEFAULT_INSTRUCTIONS, challanFor, planOf, settle, shortDate, unclearedInstallments, type ChallanSettings, type FeeAccount } from "@/lib/fees";
import { principal } from "@/lib/principal";
import { AS_OF, sectionLabel } from "@/lib/students";
import { InstallmentBadge } from "./parts";

export type ChallanEdits = Record<string, { label: string; due: string }>;
type Errors = Partial<Record<"include" | "validUntil" | "instructions", string>> & { rows?: Record<string, string> };

const input = (bad?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-[.88rem] outline-none transition-colors hover:border-accent focus:border-primary ${bad ? "border-danger" : "border-ink/12"}`;

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

export default function ChallanEditor({
  account: a,
  onSave,
  onClose,
}: {
  account: FeeAccount;
  onSave: (settings: ChallanSettings, edits: ChallanEdits, print: boolean) => void;
  onClose: () => void;
}) {
  const s = a.student;
  const start = challanFor(a);
  const candidates = unclearedInstallments(a);
  const [include, setInclude] = useState<string[]>(start.include.filter((c) => candidates.some((i) => i.challan === c)));
  const [edits, setEdits] = useState<ChallanEdits>(() => Object.fromEntries(candidates.map((i) => [i.challan, { label: i.label, due: i.due }])));
  const [issued, setIssued] = useState(start.issued);
  const [validUntil, setValidUntil] = useState(start.validUntil);
  const [instructions, setInstructions] = useState(start.instructions);
  const [note, setNote] = useState(start.note);
  const [errors, setErrors] = useState<Errors>({});

  const edit = (c: string, patch: Partial<{ label: string; due: string }>) => setEdits((e) => ({ ...e, [c]: { ...e[c], ...patch } }));
  const toggle = (c: string) => setInclude((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  const chosen = candidates.filter((i) => include.includes(i.challan));

  const submit = (close: () => void, print: boolean) => {
    const next: Errors = {};
    const rows: Record<string, string> = {};
    if (!include.length) next.include = "Choose at least one installment for this challan.";
    for (const c of include) {
      if (!edits[c].label.trim()) rows[c] = "Give this installment a name.";
      else if (!edits[c].due) rows[c] = "Choose a due date.";
    }
    if (Object.keys(rows).length) next.rows = rows;
    if (!issued || !validUntil || validUntil < issued) next.validUntil = "Valid-until date must be on or after the issue date.";
    if (!instructions.trim()) next.instructions = "Add payment instructions for the guardian.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const clean = Object.fromEntries(include.map((c) => [c, { label: edits[c].label.trim(), due: edits[c].due }]));
    onSave({ include, issued, validUntil, instructions: instructions.trim(), note: note.trim(), editedAt: `${AS_OF}T12:00` }, clean, print);
    close();
  };

  return (
    <Drawer
      width="max-w-[1040px]"
      title="Edit Fee Challan"
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={() => submit(close, true)} className={`${ghostBtn} max-sm:flex-1 sm:ml-auto`}>
            <Icon d="M6 9V3h12v6 M6 18H4v-7h16v7h-2 M7 14h10v7H7z" className="size-[18px]" />
            Save & Print
          </button>
          <button type="button" onClick={() => submit(close, false)} className={buttonClass("primary", "md", "cursor-pointer max-sm:w-full")}>
            <Icon d="M5 12l4 4 10-10" className="size-[18px]" />
            Save Challan
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1.1fr_1fr]">
          <div className="grid content-start gap-6">
            <fieldset aria-describedby={errors.include ? "challan-include-error" : undefined}>
              <legend className="mb-1 text-[.84rem] font-bold">Installments on this challan</legend>
              <p className="mb-3 text-[.78rem] text-ink/55">Tick the installments to include. Rename a fee period or move its due date to grant an extension.</p>
              {candidates.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-5 text-center text-[.84rem] text-ink/55">Every installment is cleared. There is nothing to put on a challan.</p>
              ) : (
                <ul className="grid gap-2.5">
                  {candidates.map((i) => {
                    const on = include.includes(i.challan);
                    const e = edits[i.challan];
                    const original = i.originalDue ?? i.due;
                    const st = settle(i);
                    const rowErr = errors.rows?.[i.challan];
                    return (
                      <li key={i.challan} className={`rounded-2xl border p-3.5 transition-colors ${on ? "border-primary bg-primary/4" : "border-ink/10"}`}>
                        <label className="flex cursor-pointer items-center gap-3">
                          <input type="checkbox" checked={on} onChange={() => toggle(i.challan)} className="size-4 accent-[#1D546D]" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[.9rem] font-bold">{i.label}</span>
                            <span className="text-[.74rem] text-ink/55">
                              {i.challan} · originally due {shortDate(original)}
                            </span>
                          </span>
                          <InstallmentBadge status={st.status} delay={st.delay} />
                        </label>
                        {on && (
                          <div className="mt-3 grid gap-2.5 sm:grid-cols-[1.4fr_1fr]">
                            <div>
                              <label htmlFor={`label-${i.challan}`} className="mb-1 block text-[.74rem] font-bold text-ink/60">
                                Fee period name
                              </label>
                              <input id={`label-${i.challan}`} value={e.label} onChange={(ev) => edit(i.challan, { label: ev.target.value })} className={input(rowErr && !e.label.trim() ? rowErr : undefined)} />
                            </div>
                            <div>
                              <label htmlFor={`due-${i.challan}`} className="mb-1 block text-[.74rem] font-bold text-ink/60">
                                Due date
                              </label>
                              <input id={`due-${i.challan}`} type="date" value={e.due} onChange={(ev) => edit(i.challan, { due: ev.target.value })} className={input(rowErr && !e.due ? rowErr : undefined)} />
                            </div>
                            {e.due && e.due !== original && (
                              <p className="text-[.76rem] font-semibold text-primary sm:col-span-2">
                                {e.due > original ? `Extension of ${Math.round((Date.parse(e.due) - Date.parse(original)) / 86_400_000)} days` : "Due date brought forward"} from {shortDate(original)}.{" "}
                                <button type="button" onClick={() => edit(i.challan, { due: original })} className="cursor-pointer font-bold underline hover:text-accent">
                                  Undo
                                </button>
                              </p>
                            )}
                            {rowErr && <p className="text-[.78rem] font-semibold text-danger sm:col-span-2">{rowErr}</p>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {errors.include && (
                <p id="challan-include-error" className="mt-1.5 text-[.8rem] font-semibold text-danger">
                  {errors.include}
                </p>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="challan-issued" label="Issue date">
                <input id="challan-issued" type="date" value={issued} onChange={(e) => setIssued(e.target.value)} className={input()} />
              </Field>
              <Field id="challan-valid" label="Valid until" error={errors.validUntil}>
                <input
                  id="challan-valid"
                  type="date"
                  value={validUntil}
                  min={issued}
                  onChange={(e) => setValidUntil(e.target.value)}
                  aria-invalid={!!errors.validUntil}
                  aria-describedby={errors.validUntil ? "challan-valid-error" : undefined}
                  className={input(errors.validUntil)}
                />
              </Field>
            </div>

            <Field id="challan-instructions" label="Payment instructions" error={errors.instructions}>
              <textarea
                id="challan-instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                aria-invalid={!!errors.instructions}
                aria-describedby={errors.instructions ? "challan-instructions-error" : undefined}
                className={`${input(errors.instructions)} resize-y`}
              />
              {instructions !== DEFAULT_INSTRUCTIONS && (
                <button type="button" onClick={() => setInstructions(DEFAULT_INSTRUCTIONS)} className="mt-1 cursor-pointer text-[.78rem] font-bold text-primary hover:text-accent">
                  Restore standard instructions
                </button>
              )}
            </Field>

            <Field id="challan-note" label="Note to the guardian" hint="(optional, printed on the challan)">
              <textarea id="challan-note" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Extension granted on request. Please clear by the new due date." className={`${input()} resize-y`} />
            </Field>
          </div>

          {/* Live preview of the parent copy */}
          <aside aria-label="Challan preview" className="lg:sticky lg:top-0 lg:self-start">
            <p className="mb-2 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Live preview · parent copy</p>
            <div className="overflow-hidden rounded-2xl border border-dashed border-accent bg-white shadow-[0_10px_30px_rgba(6,30,41,.06)]">
              <div className="h-1.5 bg-linear-135 from-ink via-primary to-accent" />
              <div className="grid gap-3 p-5 text-[.8rem]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[.66rem] font-bold uppercase tracking-[.16em] text-ink/50">{principal.school}</p>
                    <p className="text-[1.05rem] font-extrabold tracking-tight">Fee Challan</p>
                    <p className="text-[.72rem] text-ink/50">
                      Academic year {ACADEMIC_YEAR} · {planOf(a.plan).label}
                    </p>
                  </div>
                  <span className="rounded-md border-2 border-danger px-2 py-0.5 text-[.66rem] font-extrabold tracking-[.1em] text-danger">PAYABLE</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ["Student", s.name],
                    ["Class / Roll", `${sectionLabel(s.section)} · ${s.rollNo}`],
                    ["Guardian", s.guardian],
                    ["Phone", s.phone],
                    ["Issued", issued ? shortDate(issued) : "-"],
                    ["Valid until", validUntil ? shortDate(validUntil) : "-"],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[.66rem] text-ink/45">{k}</dt>
                      <dd className="truncate font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <table className="w-full text-left text-[.74rem]">
                  <thead className="bg-surface text-[.64rem] uppercase tracking-[.08em] text-ink/50">
                    <tr>
                      <th className="px-2 py-1.5">Challan No.</th>
                      <th className="px-2 py-1.5">Fee period</th>
                      <th className="px-2 py-1.5">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/8">
                    {chosen.length ? (
                      chosen.map((i) => (
                        <tr key={i.challan}>
                          <td className="px-2 py-1.5 text-ink/60">{i.challan}</td>
                          <td className="px-2 py-1.5 font-semibold">{edits[i.challan].label || "Untitled"}</td>
                          <td className="whitespace-nowrap px-2 py-1.5">
                            {edits[i.challan].due ? shortDate(edits[i.challan].due) : "-"}
                            {edits[i.challan].due !== (i.originalDue ?? i.due) && <span className="block text-[.64rem] font-semibold text-primary">extended</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-2 py-3 text-center text-ink/45">
                          No installments selected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {note.trim() && (
                  <p className="rounded-lg bg-primary/6 px-3 py-2 text-ink/80">
                    <strong>Note from the principal:</strong> {note}
                  </p>
                )}
                <p className="text-[.72rem] leading-relaxed text-ink/55">{instructions}</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Drawer>
  );
}
