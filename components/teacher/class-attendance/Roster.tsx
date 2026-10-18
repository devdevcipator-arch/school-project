"use client";

import { useRef } from "react";
import { Chip, Select, fieldClass } from "@/components/dashboard/controls";
import { Card, toneText } from "@/components/dashboard/ui";
import { rateTone, statusMeta } from "@/components/students/parts";
import { Icon } from "@/components/ui/Icon";
import { remarkPresets, type Mark, type Marks } from "@/lib/classAttendance";
import { DEFAULTER_BELOW, type DayStatus, type Student } from "@/lib/students";

export type StatusFilter = "all" | DayStatus;
export type SortKey = "roll-asc" | "roll-desc" | "name";

const keys: { status: DayStatus; key: string; short: string; on: string }[] = [
  { status: "present", key: "P", short: "Present", on: "border-ok bg-ok text-white shadow-[0_6px_14px_rgba(46,139,87,.3)]" },
  { status: "absent", key: "A", short: "Absent", on: "border-danger bg-danger text-white shadow-[0_6px_14px_rgba(192,57,43,.3)]" },
  { status: "leave", key: "L", short: "Leave", on: "border-warn bg-warn text-white shadow-[0_6px_14px_rgba(201,138,22,.3)]" },
];

const rowTint: Record<DayStatus, string> = {
  present: "border-ink/8 bg-white",
  absent: "border-danger/30 bg-danger/4",
  leave: "border-warn/40 bg-warn/5",
};

const pad = (n: number) => `#${String(n).padStart(2, "0")}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

/** 3-way P / A / L segmented control. */
function StatusToggle({ name, value, locked, onChange }: { name: string; value: DayStatus; locked: boolean; onChange: (s: DayStatus) => void }) {
  return (
    <div role="radiogroup" aria-label={`Attendance for ${name}`} className="grid grid-cols-3 gap-1 rounded-xl border border-ink/10 bg-surface/70 p-1">
      {keys.map((k) => {
        const on = value === k.status;
        return (
          <button
            key={k.status}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={-1}
            disabled={locked && !on}
            onClick={() => onChange(k.status)}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-[.84rem] font-extrabold transition-[background-color,color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
              on ? k.on : "border-transparent text-ink/55 hover:bg-white hover:text-ink"
            } ${locked ? "pointer-events-none" : ""}`}
          >
            {k.key}
            <span className="font-semibold max-sm:sr-only">{k.short}</span>
          </button>
        );
      })}
    </div>
  );
}

function RemarkField({ name, mark, locked, onChange }: { name: string; mark: Mark; locked: boolean; onChange: (r: string) => void }) {
  if (mark.status === "present") return null;
  if (locked) {
    return mark.remark ? (
      <p className="text-[.8rem] text-ink/60">
        <span className="font-bold text-ink/70">Remarks: </span>
        {mark.remark}
      </p>
    ) : null;
  }
  return (
    <div className="grid animate-fade-in gap-2">
      <input
        type="text"
        value={mark.remark}
        onChange={(e) => onChange(e.target.value)}
        placeholder={mark.status === "leave" ? "Leave reason, e.g. Medical certificate submitted" : "Remarks, e.g. Informed via parent call"}
        aria-label={`Remarks for ${name}`}
        className={`${fieldClass} w-full !py-2`}
      />
      <div className="flex flex-wrap gap-1.5">
        {remarkPresets[mark.status].map((p) => (
          <button
            key={p}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(p)}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-[.72rem] font-semibold transition-colors ${
              mark.remark === p ? "border-primary bg-primary text-surface" : "border-ink/12 bg-white text-ink/60 hover:border-accent hover:text-primary"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Search, filters and the roster. Arrow keys move between students; P, A and L set the status. */
export default function Roster({
  roster,
  marks,
  locked,
  query,
  onQuery,
  filter,
  onFilter,
  sort,
  onSort,
  onStatus,
  onRemark,
}: {
  roster: Student[];
  marks: Marks;
  locked: boolean;
  query: string;
  onQuery: (q: string) => void;
  filter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onStatus: (id: string, s: DayStatus) => void;
  onRemark: (id: string, r: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const counts = { all: roster.length, present: 0, absent: 0, leave: 0 };
  for (const s of roster) counts[marks[s.id].status]++;

  const q = query.trim().toLowerCase();
  const rows = roster
    .filter((s) => (filter === "all" || marks[s.id].status === filter) && (!q || s.name.toLowerCase().includes(q) || String(s.rollNo) === q.replace(/^#?0*/, "") || s.regId.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "roll-desc" ? b.rollNo - a.rollNo : a.rollNo - b.rollNo));

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
    const row = t.closest<HTMLElement>("[data-row]");
    if (!row) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const all = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])];
      all[all.indexOf(row) + (e.key === "ArrowDown" ? 1 : -1)]?.focus();
      return;
    }
    const k = keys.find((x) => x.key === e.key.toUpperCase());
    if (k && !locked && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onStatus(row.dataset.row!, k.status);
    }
  };

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All Students" },
    { key: "present", label: "Present Only" },
    { key: "absent", label: "Absent Only" },
    { key: "leave", label: "On Leave" },
  ];

  return (
    <Card className="!p-0">
      <div className="grid gap-3 border-b border-ink/8 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search by name, roll number or ID</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-ink/40" />
            <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search name, roll no. or ID" className={`${fieldClass} w-full pl-10`} />
          </label>
          <Select label="Sort roster" value={sort} onChange={(v) => onSort(v as SortKey)} className="w-full sm:w-[210px]">
            <option value="roll-asc">Roll no. (ascending)</option>
            <option value="roll-desc">Roll no. (descending)</option>
            <option value="name">Name (A to Z)</option>
          </Select>
        </div>
        <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Chip key={t.key} type="radio" name="roster-filter" checked={filter === t.key} onChange={() => onFilter(t.key)}>
              {t.key !== "all" && <span aria-hidden className={`size-2 rounded-full ${statusMeta[t.key].dot}`} />}
              {t.label}
              <span className="rounded-full bg-current/12 px-1.5 text-[.72rem] font-bold">{counts[t.key]}</span>
            </Chip>
          ))}
        </div>
      </div>

      {/* Column header (desktop table layout) */}
      <div className="hidden grid-cols-[72px_minmax(220px,1fr)_170px_minmax(300px,340px)] gap-4 bg-surface/70 px-5 py-2.5 text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/50 lg:grid">
        <span>Roll no.</span>
        <span>Student</span>
        <span>Term attendance</span>
        <span>Status</span>
      </div>

      {rows.length === 0 ? (
        <p className="m-5 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">No students match this search or filter.</p>
      ) : (
        <ul ref={listRef} onKeyDown={onKeyDown} className="grid gap-2.5 p-3 sm:p-4 lg:gap-0 lg:p-0" aria-label="Class roster">
          {rows.map((s) => {
            const m = marks[s.id];
            const tone = rateTone(s.termRate);
            return (
              <li
                key={s.id}
                data-row={s.id}
                tabIndex={0}
                aria-label={`Roll ${s.rollNo}, ${s.name}, ${statusMeta[m.status].label}`}
                className={`grid gap-3 rounded-2xl border p-3.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-accent lg:grid-cols-[72px_minmax(220px,1fr)_170px_minmax(300px,340px)] lg:items-center lg:gap-x-4 lg:rounded-none lg:border-0 lg:border-t lg:px-5 lg:py-3 ${rowTint[m.status]}`}
              >
                <div className="flex items-center gap-3 lg:contents">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-[.8rem] font-extrabold tabular-nums text-surface">{pad(s.rollNo)}</span>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-[.8rem] font-bold ${s.gender === "Female" ? "bg-accent/18 text-[#3d6e71]" : "bg-primary/12 text-primary"}`}>{initials(s.name)}</span>
                    <span className="grid min-w-0">
                      <span className="truncate text-[.94rem] font-bold">{s.name}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-[.74rem] text-ink/55">
                        {s.regId}
                        <span className="rounded-full bg-ink/6 px-2 py-px font-semibold text-ink/60">{s.gender}</span>
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span
                    title={s.termRate < DEFAULTER_BELOW ? `Defaulter: below ${DEFAULTER_BELOW}% term attendance` : undefined}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/10 bg-white px-2.5 py-1 text-[.76rem] font-bold ${toneText[tone]}`}
                  >
                    {s.termRate < DEFAULTER_BELOW && <span aria-hidden className="size-2 rounded-full bg-danger" />}
                    {s.termRate}% attendance
                    {s.termRate < DEFAULTER_BELOW && <span className="sr-only"> (defaulter)</span>}
                  </span>
                </div>

                <StatusToggle name={s.name} value={m.status} locked={locked} onChange={(st) => onStatus(s.id, st)} />

                {m.status !== "present" && (
                  <div className="lg:col-span-3 lg:col-start-2 lg:pb-1">
                    <RemarkField name={s.name} mark={m} locked={locked} onChange={(r) => onRemark(s.id, r)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="hidden items-center gap-2 border-t border-ink/8 px-5 py-3 text-[.76rem] text-ink/50 lg:flex">
        <Icon d="M4 6h16v12H4z M8 10h.01 M12 10h.01 M16 10h.01 M8 14h8" className="size-4" />
        Keyboard: click a student, then <kbd className="rounded bg-ink/8 px-1.5 font-bold">↑</kbd>
        <kbd className="rounded bg-ink/8 px-1.5 font-bold">↓</kbd> to move, <kbd className="rounded bg-ink/8 px-1.5 font-bold">P</kbd> Present,{" "}
        <kbd className="rounded bg-ink/8 px-1.5 font-bold">A</kbd> Absent, <kbd className="rounded bg-ink/8 px-1.5 font-bold">L</kbd> Leave
      </p>
    </Card>
  );
}
