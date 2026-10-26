"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Card } from "@/components/dashboard/ui";
import AttendanceHistory from "@/components/teachers/AttendanceHistory";
import { me, myHistory } from "@/lib/myAttendance";
import TodayBar from "./TodayBar";
import { isoOf, monthNames, weekdayNames } from "./shared";

// The record depends on the viewer's date, so the page renders on the client only.
const noop = () => () => {};
const clientToday = () => isoOf(new Date());

/** Teacher's own attendance: today and full history. */
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
  const today = records[0]?.date === todayIso ? records[0] : undefined;
  const lastDay = today ? records[1] : records[0];

  const d = new Date(`${todayIso}T12:00:00`);
  const dateLabel = `${weekdayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <TodayBar dateLabel={dateLabel} today={today} lastDay={lastDay} />

      <Card>
        <AttendanceHistory t={me} />
      </Card>
    </main>
  );
}
