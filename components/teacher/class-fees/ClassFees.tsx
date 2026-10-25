"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Toast, type ToastData } from "@/components/dashboard/controls";
import { Icon } from "@/components/ui/Icon";
import { mySections, rosterOf } from "@/lib/classAttendance";
import { allMarked, feeMonthsUpTo, ledgerRegister, pastSubmitDate, type FeeMarks, type FeeMarkStatus } from "@/lib/classFees";
import { monthLabel, shortDate } from "@/lib/fees";
import { clock } from "@/lib/teachers";
import ContextBar from "./ContextBar";
import HistoryView from "./HistoryView";
import Roster, { type SortKey, type StatusFilter } from "./Roster";
import { ConfirmDialog, SubmitBar, type RegisterState } from "./SubmitBar";

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowHm = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Register = { marks: FeeMarks; state: RegisterState; savedAt?: string; correction?: boolean };

// "Today" comes from the viewer's clock, so the page renders on the client only.
const noop = () => () => {};
const clientToday = () => isoOf(new Date());

export default function ClassFees() {
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

/** Monthly fee register: opens pre-filled from the fee office ledger, the teacher marks who paid. */
function Board({ todayIso }: { todayIso: string }) {
  const months = useMemo(() => feeMonthsUpTo(todayIso), [todayIso]);
  const currentMonth = months.at(-1)!;
  const [view, setView] = useState<"mark" | "history">("mark");
  const [section, setSection] = useState(mySections[0].section);
  const [month, setMonth] = useState(currentMonth);
  const [registers, setRegisters] = useState<Record<string, Register>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("roll-asc");
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const roster = useMemo(() => rosterOf(section), [section]);
  const key = `${section}|${month}`;
  // Past months were submitted already; the current month starts open with the ledger's payments.
  const reg: Register =
    registers[key] ?? (month < currentMonth ? { marks: ledgerRegister(roster, month), state: "submitted", savedAt: pastSubmitDate(month) } : { marks: ledgerRegister(roster, month), state: "open" });
  const locked = reg.state === "submitted";

  const tally = { total: roster.length, paid: 0, unpaid: 0 };
  for (const s of roster) tally[reg.marks[s.id].status]++;
  const unpaid = roster.filter((s) => reg.marks[s.id].status === "unpaid");

  const save = (next: Partial<Register>) => setRegisters((r) => ({ ...r, [key]: { ...reg, ...next } }));
  const setMark = (id: string, patch: Partial<{ status: FeeMarkStatus; remark: string }>) => {
    if (locked) return;
    const cur = reg.marks[id];
    // Paid stamps today's date and clears the remark; Unpaid drops the paid date.
    const mark =
      patch.status === "paid"
        ? { status: "paid" as const, remark: "", paidOn: cur.status === "paid" ? cur.paidOn : todayIso }
        : patch.status === "unpaid"
          ? { status: "unpaid" as const, remark: cur.status === "unpaid" ? cur.remark : "" }
          : { ...cur, ...patch };
    save({ marks: { ...reg.marks, [id]: mark }, state: reg.state === "draft" ? "draft" : "open" });
  };

  const batch = (status: FeeMarkStatus, text: string) => {
    const prev = reg;
    save({ marks: allMarked(roster, status, reg.marks, todayIso) });
    setToast({ text, action: { label: "Undo", run: () => (setRegisters((r) => ({ ...r, [key]: prev })), setToast(null)) } });
  };

  const goMonth = (m: string) => {
    setMonth(months.includes(m) ? m : currentMonth);
    setConfirming(false);
  };
  const idx = months.indexOf(month);
  const stamp = () => `${shortDate(todayIso)}, ${clock(nowHm())}`;

  // History reads submitted registers: session edits first, then the ledger for past months.
  const registerFor = useCallback(
    (m: string): FeeMarks | null => {
      const r = registers[`${section}|${m}`];
      if (r?.state === "submitted") return r.marks;
      // A past month under correction keeps showing its stored register until resubmitted.
      return m < currentMonth ? ledgerRegister(roster, m) : null;
    },
    [registers, section, roster, currentMonth],
  );

  const tabs = [
    { key: "mark" as const, label: "Mark Fees", icon: "M3 7h18v12H3z M3 11h18 M7 15h3 M16 4H6" },
    { key: "history" as const, label: "Fee History", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" },
  ];

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div role="tablist" aria-label="Class fee views" className="flex gap-1 self-start rounded-2xl border border-ink/8 bg-white p-1 shadow-[0_10px_30px_rgba(6,30,41,.05)]">
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
        section={section}
        onSection={(s) => {
          setSection(s);
          setConfirming(false);
        }}
        month={month}
        months={months}
        currentMonth={currentMonth}
        onMonth={goMonth}
        onPrev={() => goMonth(months[Math.max(0, idx - 1)])}
        onNext={() => goMonth(months[Math.min(months.length - 1, idx + 1)])}
        canPrev={idx > 0}
        canNext={idx < months.length - 1}
        tally={tally}
        showTally={view === "mark"}
        locked={locked}
        onAllPaid={() => batch("paid", "All students marked Paid. Switch back the ones who have not paid.")}
        onAllUnpaid={() => batch("unpaid", "All students marked Unpaid.")}
      />

      {view === "history" ? (
        <HistoryView
          sectionName={section}
          roster={roster}
          months={months}
          currentMonth={currentMonth}
          registerFor={registerFor}
          onOpenMonth={(m) => {
            goMonth(m);
            setView("mark");
          }}
        />
      ) : (
        <>
          {reg.correction && !locked && (
            <p className="flex items-center gap-2.5 rounded-2xl border border-warn/40 bg-warn/8 px-4 py-3 text-[.86rem] font-semibold text-[#9a6a0f]">
              <Icon d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4" className="size-[18px] shrink-0" />
              Correcting the submitted fee register for {monthLabel(month)}. Submitting again notifies the principal of the change.
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
          />
          <SubmitBar
            sectionName={section}
            tally={tally}
            state={reg.state}
            savedAt={reg.savedAt}
            correction={!!reg.correction}
            onDraft={() => {
              save({ state: "draft", savedAt: stamp() });
              setToast({ text: `Draft saved for Class ${section}. Submit it once collection is done.` });
            }}
            onSubmit={() => setConfirming(true)}
            onEdit={() => {
              save({ state: "open", correction: true });
              setToast({ text: "Fee register unlocked for correction." });
            }}
          />
        </>
      )}

      {confirming && (
        <ConfirmDialog
          monthName={monthLabel(month)}
          unpaid={unpaid}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            save({ state: "submitted", savedAt: stamp() });
            setConfirming(false);
            setToast({ text: `Class ${section} fee register for ${monthLabel(month)} submitted. Principal dashboard updated and parents of unpaid students reminded.` });
          }}
        />
      )}

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
