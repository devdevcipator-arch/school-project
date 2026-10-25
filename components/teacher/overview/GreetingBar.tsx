"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { teacher, teacherToday } from "@/lib/teacher";

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

type Status = "in" | "break" | "leave";
const statuses: { key: Status; label: string }[] = [
  { key: "in", label: "Checked in" },
  { key: "break", label: "Break" },
  { key: "leave", label: "Leave" },
];

/** Greeting, date + session, today's status switch and status chips. */
export default function GreetingBar() {
  const [greeting, date] = useSyncExternalStore(noop, clientNow, () => "Welcome back|").split("|");
  const [status, setStatus] = useState<Status>("in");
  const statusText = status === "in" ? `Checked in at ${teacherToday.checkIn}` : status === "break" ? "On break" : "On leave today";

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

        <div role="radiogroup" aria-label="Today's status" className="grid w-full grid-cols-3 gap-1 rounded-xl border border-surface/20 bg-surface/10 p-1 sm:w-[340px]">
          {statuses.map((x) => (
            <button
              key={x.key}
              type="button"
              role="radio"
              aria-checked={status === x.key}
              onClick={() => setStatus(x.key)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-[.86rem] font-bold transition-colors ${status === x.key ? "bg-surface text-ink" : "text-surface/75 hover:bg-surface/10 hover:text-surface"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2.5">
        <Chip icon="M5 12l4 4 10-10">{statusText}</Chip>
        <Chip icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2">
          {teacherToday.classesRemaining} of {teacherToday.classesTotal} classes remaining today
        </Chip>
      </div>
    </section>
  );
}
