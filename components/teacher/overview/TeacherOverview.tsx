"use client";

import { classOverviews } from "@/lib/teacher";
import GreetingBar from "./GreetingBar";
import KpiRow from "./KpiRow";
import { AttendanceWidget } from "./widgets";

/** Teacher daily command center for their own class. */
export default function TeacherOverview() {
  const c = classOverviews[0];

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <GreetingBar />
      <KpiRow c={c} />
      {/* One full-width row per widget. */}
      <div className="grid gap-5 lg:gap-6">
        <AttendanceWidget c={c} />
      </div>
    </main>
  );
}
