"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Toast, type ToastData } from "@/components/dashboard/controls";
import { Card } from "@/components/dashboard/ui";
import AttendanceHistory from "@/components/teachers/AttendanceHistory";
import { leavePolicy, leaveRequests, leaveUsed, me, myHistory, onTimeStreak } from "@/lib/myAttendance";
import { summarize } from "@/lib/teacherAttendance";
import DayLog from "./DayLog";
import KpiRow from "./KpiRow";
import TodayBar from "./TodayBar";
import { isoOf, monthNames, weekdayNames } from "./shared";

// The record depends on the viewer's date, so the page renders on the client only.
const noop = () => () => {};
const clientToday = () => isoOf(new Date());

const pending = leaveRequests.filter((r) => r.status === "Pending");

/** Teacher's own attendance: today, this month, day-by-day log and full history. */
export default function MyAttendance() {
  const todayIso = useSyncExternalStore(noop, clientToday, () => "");
  if (!todayIso) {
    return (
      <main className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
        <div className="h-[170px] animate-pulse rounded-[20px] bg-ink/8" />
      </main>
    );
  }
  return <Board todayIso={todayIso} />;
}

function Board({ todayIso }: { todayIso: string }) {
  const records = useMemo(() => myHistory(new Date(`${todayIso}T12:00:00`)), [todayIso]);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const today = records[0]?.date === todayIso ? records[0] : undefined;
  const lastDay = today ? records[1] : records[0];
  const monthKey = todayIso.slice(0, 7);
  const month = summarize(records.filter((r) => r.date.startsWith(monthKey)));
  const used = useMemo(() => leaveUsed(records), [records]);

  const doCheckOut = () => {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setCheckOut(t);
    setToast({ text: "Checked out. Have a good evening!", action: { label: "Undo", run: () => (setCheckOut(null), setToast(null)) } });
  };

  const d = new Date(`${todayIso}T12:00:00`);
  const dateLabel = `${weekdayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  const allowed = leavePolicy.reduce((s, p) => s + p.allowed, 0);
  const usedTotal = Object.values(used).reduce((s, n) => s + n, 0);

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <TodayBar dateLabel={dateLabel} today={today} lastDay={lastDay} checkOut={checkOut} onCheckOut={doCheckOut} />

      <KpiRow
        month={month}
        monthName={monthNames[d.getMonth()]}
        streak={onTimeStreak(records)}
        leave={{ allowed, used: usedTotal, pending: pending.reduce((s, r) => s + r.days, 0) }}
      />

      <DayLog records={records} todayIso={todayIso} />

      <Card>
        <AttendanceHistory t={me} />
      </Card>

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
