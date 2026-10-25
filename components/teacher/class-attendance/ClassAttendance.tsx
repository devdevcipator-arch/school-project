"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Toast, type ToastData } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { allPresent, mySections, nextSchoolDay, pastRegister, pastSubmitTime, rosterOf, type Marks } from "@/lib/classAttendance";
import { isSchoolDay, type DayStatus } from "@/lib/students";
import ContextBar from "./ContextBar";
import HistoryView from "./HistoryView";
import Roster, { type SortKey, type StatusFilter } from "./Roster";
import { ConfirmDialog, SubmitBar, type RegisterState } from "./SubmitBar";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowHm = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const longLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${dayNames[d.getUTCDay()]}, ${d.getUTCDate()} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const shortLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${dayNames[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${monthNames[d.getUTCMonth()].slice(0, 3)}`;
};

type Register = { marks: Marks; state: RegisterState; savedAt?: string; correction?: boolean };

// "Today" comes from the viewer's clock, so the page renders on the client only.
const noop = () => () => {};
const clientToday = () => isoOf(new Date());

export default function ClassAttendance() {
  const todayIso = useSyncExternalStore(noop, clientToday, () => "");
  if (!todayIso) {
    return (
      <main className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
        <div className="h-[220px] animate-pulse rounded-[20px] bg-ink/8" />
      </main>
    );
  }
  return <Board todayIso={todayIso} />;
}

/** Exception-based roll call: everyone starts Present, the teacher only marks Absent or Leave. */
function Board({ todayIso }: { todayIso: string }) {
  const [view, setView] = useState<"take" | "history">("take");
  // Always the teacher's own class.
  const section = mySections[0].section;
  // Opens on today, or on the latest school day during weekends and breaks.
  const [date, setDate] = useState(() => (isSchoolDay(todayIso) ? todayIso : nextSchoolDay(todayIso, -1)));
  const [registers, setRegisters] = useState<Record<string, Register>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("roll-asc");
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const roster = useMemo(() => rosterOf(section), [section]);
  const key = `${section}|${date}`;
  const schoolDay = isSchoolDay(date);
  // Past days were submitted already; today starts open with everyone Present.
  const reg: Register =
    registers[key] ?? (date < todayIso ? { marks: pastRegister(roster, date), state: "submitted", savedAt: pastSubmitTime(date) } : { marks: allPresent(roster), state: "open" });
  const locked = reg.state === "submitted";

  const tally = { total: roster.length, present: 0, absent: 0, leave: 0 };
  for (const s of roster) tally[reg.marks[s.id].status]++;
  const absent = roster.filter((s) => reg.marks[s.id].status === "absent");
  const leave = roster.filter((s) => reg.marks[s.id].status === "leave");

  const save = (next: Partial<Register>) => setRegisters((r) => ({ ...r, [key]: { ...reg, ...next } }));
  const setMark = (id: string, patch: Partial<{ status: DayStatus; remark: string }>) => {
    if (locked) return;
    const cur = reg.marks[id];
    // Switching back to Present clears the remark.
    const mark = { ...cur, ...patch, ...(patch.status === "present" ? { remark: "" } : {}) };
    save({ marks: { ...reg.marks, [id]: mark }, state: reg.state === "draft" ? "draft" : "open" });
  };

  const batch = (status: DayStatus, text: string) => {
    const prev = reg;
    save({ marks: Object.fromEntries(roster.map((s) => [s.id, { status, remark: status === "present" ? "" : reg.marks[s.id].remark }])) });
    setToast({ text, action: { label: "Undo", run: () => (setRegisters((r) => ({ ...r, [key]: prev })), setToast(null)) } });
  };

  const goDate = (d: string) => {
    setDate(d > todayIso ? todayIso : d);
    setConfirming(false);
  };

  const sectionName = section;
  const isToday = date === todayIso;
  const dayLabel = isToday ? "Today's" : `${shortLabel(date)}`;

  // History reads submitted registers: session edits first, then the stored past days.
  const registerFor = useCallback(
    (d: string): Marks | null => {
      const r = registers[`${section}|${d}`];
      if (r?.state === "submitted") return r.marks;
      // A past day under correction keeps showing its stored register until resubmitted.
      return d < todayIso ? pastRegister(roster, d) : null;
    },
    [registers, section, roster, todayIso],
  );

  const tabs = [
    { key: "take" as const, label: "Take Attendance", icon: "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11" },
    { key: "history" as const, label: "Attendance History", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" },
  ];

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div role="tablist" aria-label="Class attendance views" className="flex gap-1 self-start rounded-2xl border border-ink/8 bg-white p-1 shadow-[0_10px_30px_rgba(6,30,41,.05)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            onClick={() => setView(t.key)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-[.88rem] font-bold transition-colors ${view === t.key ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
          >
            <Icon d={t.icon} className="size-[18px]" />
            {t.label}
          </button>
        ))}
      </div>

      <ContextBar
        date={date}
        dateLabel={longLabel(date)}
        todayIso={todayIso}
        onDate={goDate}
        onPrev={() => goDate(nextSchoolDay(date, -1))}
        onNext={() => goDate(nextSchoolDay(date, 1))}
        canNext={nextSchoolDay(date, 1) <= todayIso}
        tally={tally}
        isSchoolDay={schoolDay && view === "take"}
        locked={locked}
        onResetPresent={() => batch("present", "Everyone is marked Present again.")}
        onAllAbsent={() => batch("absent", "All students marked Absent. Switch back the ones in class.")}
      />

      {view === "history" ? (
        <HistoryView
          sectionName={sectionName}
          roster={roster}
          todayIso={todayIso}
          registerFor={registerFor}
          onOpenDay={(d) => {
            goDate(d);
            setView("take");
          }}
        />
      ) : !schoolDay ? (
        <section className="grid justify-items-center gap-3 rounded-[20px] border border-dashed border-ink/15 bg-white px-6 py-14 text-center shadow-[0_10px_30px_rgba(6,30,41,.05)]">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon d="M8 3v3 M16 3v3 M4 7h16v13H4z M4 11h16" className="size-7" />
          </span>
          <h2 className="text-[1.15rem] font-extrabold tracking-tight">No school on {longLabel(date)}</h2>
          <p className="max-w-[420px] text-[.9rem] text-ink/60">Weekends and school breaks have no roll call. Open the last school day to review or correct its register.</p>
          <button type="button" onClick={() => goDate(nextSchoolDay(date, -1))} className={buttonClass("primary", "md", "mt-2 cursor-pointer")}>
            Open {longLabel(nextSchoolDay(date, -1))}
          </button>
        </section>
      ) : (
        <>
          {reg.correction && !locked && (
            <p className="flex items-center gap-2.5 rounded-2xl border border-warn/40 bg-warn/8 px-4 py-3 text-[.86rem] font-semibold text-[#9a6a0f]">
              <Icon d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4" className="size-[18px] shrink-0" />
              Correcting the submitted register for {longLabel(date)}. Submitting again notifies the principal of the change.
            </p>
          )}
          <Roster
            roster={roster}
            marks={reg.marks}
            locked={locked}
            query={query}
            onQuery={setQuery}
            filter={filter}
            onFilter={setFilter}
            sort={sort}
            onSort={setSort}
            onStatus={(id, status) => setMark(id, { status })}
            onRemark={(id, remark) => setMark(id, { remark })}
          />
          <SubmitBar
            sectionName={sectionName}
            tally={tally}
            state={reg.state}
            savedAt={reg.savedAt}
            correction={!!reg.correction}
            onDraft={() => {
              save({ state: "draft", savedAt: nowHm() });
              setToast({ text: `Draft saved for Class ${sectionName}. Submit it before the end of the day.` });
            }}
            onSubmit={() => setConfirming(true)}
            onEdit={() => {
              save({ state: "open", correction: true });
              setToast({ text: "Register unlocked for correction." });
            }}
          />
        </>
      )}

      {confirming && (
        <ConfirmDialog
          dayLabel={dayLabel}
          absent={absent}
          leave={leave}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            save({ state: "submitted", savedAt: nowHm() });
            setConfirming(false);
            setToast({ text: `Class ${sectionName} attendance submitted. Principal dashboard and parents notified.` });
          }}
        />
      )}

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
