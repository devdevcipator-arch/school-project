"use client";

import { Dialog, ghostBtn } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Student } from "@/lib/students";
import type { Tally } from "./ContextBar";

export type RegisterState = "open" | "draft" | "submitted";

const sep = <span aria-hidden className="text-surface/30">|</span>;

/** Sticky tally + Save as Draft / Submit & Lock. Once submitted, offers Edit Record instead. */
export function SubmitBar({
  sectionName,
  tally,
  state,
  savedAt,
  correction,
  onDraft,
  onSubmit,
  onEdit,
}: {
  sectionName: string;
  tally: Tally;
  state: RegisterState;
  savedAt?: string;
  correction: boolean;
  onDraft: () => void;
  onSubmit: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-ink/95 p-3 pl-5 text-surface shadow-[0_20px_50px_rgba(6,30,41,.35)] backdrop-blur sm:bottom-5">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[.86rem]" aria-live="polite">
        <strong>Class {sectionName}</strong>
        <span aria-hidden className="text-surface/30">•</span>
        <span>
          Total <strong className="tabular-nums">{tally.total}</strong>
        </span>
        {sep}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-ok" />
          Paid <strong className="tabular-nums">{tally.paid}</strong>
        </span>
        {sep}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-danger" />
          Unpaid <strong className="tabular-nums">{tally.unpaid}</strong>
        </span>
      </p>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {state === "submitted" ? (
          <>
            <span className="inline-flex items-center gap-2 px-2 text-[.82rem] font-semibold text-surface/75">
              <Icon d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z" className="size-4 text-accent" />
              Submitted & locked{savedAt && ` on ${savedAt}`}
            </span>
            <button type="button" onClick={onEdit} className={`${ghostBtn} !border-surface/25 !bg-transparent !text-surface hover:!bg-surface/10 max-sm:flex-1`}>
              <Icon d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4" className="size-4" />
              Edit Record
            </button>
          </>
        ) : (
          <>
            {state === "draft" && savedAt && <span className="px-2 text-[.78rem] text-surface/60">Draft saved {savedAt}</span>}
            <button type="button" onClick={onDraft} className={`${ghostBtn} !border-surface/25 !bg-transparent !text-surface hover:!bg-surface/10 max-sm:flex-1`}>
              Save as Draft
            </button>
            <button type="button" onClick={onSubmit} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1")}>
              <Icon d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z" className="size-[18px]" />
              {correction ? "Submit Correction" : "Submit & Lock"}
              <span className="max-md:hidden">Fee Register</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Final check before locking: lists unpaid students so the teacher can catch mistakes. */
export function ConfirmDialog({ monthName, unpaid, onConfirm, onClose }: { monthName: string; unpaid: Student[]; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog label="Confirm fee register" onClose={onClose}>
      <span className="grid size-12 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
        <Icon d="M3 7h18v12H3z M3 11h18 M7 15h3 M16 4H6" className="size-6" />
      </span>
      <h2 className="mt-4 text-[1.2rem] font-extrabold tracking-tight">Confirm {monthName} Fee Register</h2>
      <p className="mt-1.5 text-[.9rem] text-ink/65">
        {unpaid.length === 0 ? (
          "Every student is marked Paid. "
        ) : (
          <>
            <strong className="text-danger">
              {unpaid.length} {unpaid.length === 1 ? "student has" : "students have"} not paid
            </strong>
            .{" "}
          </>
        )}
        Would you like to submit and notify administration?
      </p>
      {unpaid.length > 0 && (
        <div className="mt-4 grid max-h-[40vh] gap-2 overflow-y-auto">
          <Badge tone="danger" className="justify-self-start">
            Unpaid {unpaid.length}
          </Badge>
          <ul className="flex flex-wrap gap-1.5">
            {unpaid.map((s) => (
              <li key={s.id} className="rounded-full bg-surface px-2.5 py-1 text-[.8rem] font-semibold">
                Roll #{String(s.rollNo).padStart(2, "0")} {s.name.split(" ")[0]}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 rounded-xl bg-primary/6 px-3.5 py-2.5 text-[.8rem] text-ink/65">The principal&apos;s fee dashboard updates instantly and parents of unpaid students get a reminder.</p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" onClick={onConfirm} className={buttonClass("primary", "md", "flex-1 cursor-pointer")}>
          Confirm & Submit
        </button>
        <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>
          Review Again
        </button>
      </div>
    </Dialog>
  );
}
