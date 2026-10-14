"use client";

import { useState } from "react";
import { Dialog, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionLabel } from "@/lib/students";
import { categoryIcon, competitionFor, competitions, shortDate, type Talent } from "@/lib/talents";
import { categoryTone } from "./parts";

/** Pick the competition a student is being shortlisted for. */
export function ShortlistDialog({ t, onPick, onClose }: { t: Talent; onPick: (event: string) => void; onClose: () => void }) {
  const [event, setEvent] = useState(competitionFor(t.primary.category).id);
  return (
    <Dialog label={`Shortlist ${t.student.name}`} onClose={onClose}>
      <h2 className="text-[1.15rem] font-extrabold tracking-tight">Shortlist for event</h2>
      <p className="mt-1 text-[.86rem] text-ink/60">
        Add <strong className="text-ink">{t.student.name}</strong> ({sectionLabel(t.student.section)}) to an active competition roster.
      </p>
      <fieldset className="mt-4 grid gap-2">
        <legend className="sr-only">Competition</legend>
        {competitions.map((c) => (
          <label
            key={c.id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${event === c.id ? "border-primary bg-primary/6" : "border-ink/10 hover:border-accent"}`}
          >
            <input type="radio" name="shortlist-event" checked={event === c.id} onChange={() => setEvent(c.id)} className="size-4 accent-[#1D546D]" />
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${categoryTone(c.category).soft}`}>
              <Icon d={categoryIcon(c.category)} className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[.9rem] font-bold">{c.title}</span>
              <span className="text-[.76rem] text-ink/55">{shortDate(c.date)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <button type="button" onClick={onClose} className={ghostBtn}>
          Cancel
        </button>
        <button type="button" onClick={() => onPick(event)} className={buttonClass("primary", "md", "cursor-pointer")}>
          <Icon d="M12 5v14 M5 12h14" className="size-[18px]" />
          Add to Shortlist
        </button>
      </div>
    </Dialog>
  );
}
