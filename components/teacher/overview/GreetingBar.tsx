"use client";

import { useSyncExternalStore } from "react";
import { Select } from "@/components/dashboard/controls";
import { Icon } from "@/components/ui/Icon";
import { classOverviews, teacher, teacherToday } from "@/lib/teacher";

// Date and greeting come from the viewer's clock, so they render on the client only.
const noop = () => () => {};
const clientNow = () => {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const date = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${greeting}|${date}`;
};

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-3.5 py-2 text-[.82rem] font-semibold text-surface">
      <Icon d={icon} className="size-4 shrink-0 text-accent" />
      {children}
    </span>
  );
}

/** Greeting, date + session, class scope selector and today's status chips. */
export default function GreetingBar({ classId, onClassChange }: { classId: string; onClassChange: (id: string) => void }) {
  const [greeting, date] = useSyncExternalStore(noop, clientNow, () => "Welcome back|").split("|");

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-linear-135 from-ink via-[#0b2a38] to-primary p-5 text-surface shadow-[0_18px_40px_rgba(6,30,41,.18)] sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[.78rem] font-bold uppercase tracking-[.14em] text-accent">{teacher.session}</p>
          <h2 className="mt-1.5 text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold leading-tight tracking-tight">
            {greeting}, {teacher.firstName}
          </h2>
          <p className="mt-1 min-h-[1.4em] text-[.92rem] text-surface/70">{date}</p>
        </div>

        <div className="grid w-full gap-1.5 sm:w-[280px]">
          <span className="text-[.74rem] font-bold uppercase tracking-[.12em] text-surface/60">Viewing class</span>
          <Select label="Select class and section" value={classId} onChange={onClassChange} className="text-ink">
            {classOverviews.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2.5">
        <Chip icon="M5 12l4 4 10-10">Checked in at {teacherToday.checkIn}</Chip>
        <Chip icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2">
          {teacherToday.classesRemaining} of {teacherToday.classesTotal} classes remaining today
        </Chip>
      </div>
    </section>
  );
}
