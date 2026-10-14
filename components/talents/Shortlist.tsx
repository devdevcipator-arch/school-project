"use client";

import { useState } from "react";
import { Chip, Dialog, Drawer, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionLabel } from "@/lib/students";
import { categoryIcon, competitionFor, competitions, shortDate, type Talent } from "@/lib/talents";
import { LevelBadge, PrimaryTalent, categoryTone } from "./parts";

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

/** Slide-over listing every shortlisted candidate grouped by competition. */
export function PoolDrawer({
  pool,
  onView,
  onRemove,
  onExport,
  onClose,
}: {
  pool: { t: Talent; event: string }[];
  onView: (t: Talent) => void;
  onRemove: (t: Talent) => void;
  onExport: (event?: string) => void;
  onClose: () => void;
}) {
  const [event, setEvent] = useState("all");
  const shown = pool.filter((p) => event === "all" || p.event === event);

  return (
    <Drawer
      width="max-w-[720px]"
      title="Upcoming Competition Pool"
      subtitle={`${pool.length} shortlisted candidates across ${new Set(pool.map((p) => p.event)).size} events`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" disabled={!shown.length} onClick={() => onExport(event === "all" ? undefined : event)} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:flex-1 sm:ml-auto")}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Export Team List (PDF)
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-5 px-5 py-6 sm:px-7">
          <div role="group" aria-label="Competition" className="flex flex-wrap gap-2">
            <Chip type="radio" name="pool-event" checked={event === "all"} onChange={() => setEvent("all")}>
              All events ({pool.length})
            </Chip>
            {competitions.map((c) => (
              <Chip key={c.id} type="radio" name="pool-event" checked={event === c.id} onChange={() => setEvent(c.id)}>
                {c.title} ({pool.filter((p) => p.event === c.id).length})
              </Chip>
            ))}
          </div>

          {competitions
            .filter((c) => event === "all" || c.id === event)
            .map((c) => {
              const rows = shown.filter((p) => p.event === c.id);
              return (
                <section key={c.id}>
                  <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
                    <h3 className="text-[1rem] font-extrabold tracking-tight">{c.title}</h3>
                    <p className="text-[.8rem] text-ink/55">
                      {shortDate(c.date)} · {rows.length} {rows.length === 1 ? "candidate" : "candidates"}
                    </p>
                  </div>
                  {rows.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-5 text-center text-[.84rem] text-ink/50">No candidates shortlisted yet.</p>
                  ) : (
                    <ul className="divide-y divide-ink/8 rounded-2xl border border-ink/8">
                      {rows.map(({ t }) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <Avatar name={t.student.name} />
                          <div className="min-w-0 flex-1">
                            <button type="button" onClick={() => onView(t)} className="block max-w-full cursor-pointer truncate text-left font-bold hover:text-primary">
                              {t.student.name}
                            </button>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[.76rem] text-ink/50">{sectionLabel(t.student.section)}</span>
                              <PrimaryTalent {...t.primary} />
                              <LevelBadge level={t.level} short />
                            </div>
                          </div>
                          <button type="button" onClick={() => onRemove(t)} aria-label={`Remove ${t.student.name} from shortlist`} className={ghostSm}>
                            <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
        </div>
      )}
    </Drawer>
  );
}
