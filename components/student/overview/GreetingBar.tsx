"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { student, studentAttendance, todaySchedule } from "@/lib/student";
import { toMinutes, useMinuteOfDay } from "./clock";

const noop = () => () => {};
const clientDate = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-3.5 py-2 text-[.82rem] font-semibold text-surface">
      <Icon d={icon} className="size-4 shrink-0 text-accent" />
      {children}
    </span>
  );
}

/** Greeting, date, class and today's quick status chips. */
export default function GreetingBar() {
  const minute = useMinuteOfDay();
  const date = useSyncExternalStore(noop, clientDate, () => "");
  const greeting = minute < 0 ? "Welcome back" : minute < 720 ? "Good morning" : minute < 1020 ? "Good afternoon" : "Good evening";

  const lessons = todaySchedule.filter((p) => !p.isBreak);
  const left = minute < 0 ? lessons.length : lessons.filter((p) => toMinutes(p.end) > minute).length;

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-linear-135 from-ink via-[#0b2a38] to-primary p-5 text-surface shadow-[0_18px_40px_rgba(6,30,41,.18)] sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative min-w-0">
        <p className="text-[.78rem] font-bold uppercase tracking-[.14em] text-accent">
          {student.classLabel} · {student.roll}
        </p>
        <h2 className="mt-1.5 text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold leading-tight tracking-tight">
          {greeting}, {student.firstName}
        </h2>
        <p className="mt-1 min-h-[1.4em] text-[.92rem] text-surface/70">{date}</p>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2.5">
        <Chip icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2">
          {left === 0 ? "All classes done for today" : `${left} of ${lessons.length} classes left today`}
        </Chip>
        <Chip icon="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.6.7-2.8 1.5-3.7.2 1.2.9 2 1.7 2.4C11 8 11 5.5 12 3z">
          {studentAttendance.streak}-day attendance streak
        </Chip>
      </div>
    </section>
  );
}
