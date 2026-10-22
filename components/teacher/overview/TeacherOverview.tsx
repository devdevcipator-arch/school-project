"use client";

import { useState } from "react";
import { classOverviews } from "@/lib/teacher";
import GreetingBar from "./GreetingBar";
import KpiRow from "./KpiRow";
import { AssessmentsWidget, AttendanceWidget } from "./widgets";

/** Teacher daily command center. Every widget follows the class picked in the greeting bar. */
export default function TeacherOverview() {
  const [classId, setClassId] = useState(classOverviews[0].id);
  const [switched, setSwitched] = useState(false);
  const c = classOverviews.find((x) => x.id === classId) ?? classOverviews[0];

  const onClassChange = (id: string) => {
    setClassId(id);
    setSwitched(true);
  };
  // Soft fade only when the class changes; no entrance animation on first load.
  const fade = switched ? "animate-fade-in" : "";

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <GreetingBar classId={classId} onClassChange={onClassChange} />
      <div key={`kpi-${c.id}`} className={fade}>
        <KpiRow c={c} />
      </div>
      {/* One full-width row per widget. */}
      <div key={`rows-${c.id}`} className={`grid gap-5 lg:gap-6 ${fade}`}>
        <AttendanceWidget c={c} />
        <AssessmentsWidget c={c} />
      </div>
    </main>
  );
}
