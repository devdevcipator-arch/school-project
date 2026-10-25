"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Toast, type ToastData } from "@/components/dashboard/controls";
import { Card } from "@/components/dashboard/ui";
import AttendanceHistory from "@/components/teachers/AttendanceHistory";
import { me, myHistory } from "@/lib/myAttendance";
import LeaveRequest from "./LeaveRequest";
import TodayBar from "./TodayBar";
import { isoOf, monthNames, weekdayNames } from "./shared";

// The record depends on the viewer's date, so the page renders on the client only.
const noop = () => () => {};
const clientToday = () => isoOf(new Date());

/** Teacher's own attendance: today, full history and a leave request box. */
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

  const doCheckOut = () => {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setCheckOut(t);
    setToast({ text: "Checked out. Have a good evening!", action: { label: "Undo", run: () => (setCheckOut(null), setToast(null)) } });
  };

  const d = new Date(`${todayIso}T12:00:00`);
  const dateLabel = `${weekdayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <TodayBar dateLabel={dateLabel} today={today} lastDay={lastDay} checkOut={checkOut} onCheckOut={doCheckOut} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <Card>
          <AttendanceHistory t={me} />
        </Card>
        <div className="lg:sticky lg:top-24">
          <LeaveRequest onSent={() => setToast({ text: "Leave request sent to the principal." })} />
        </div>
      </div>

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
