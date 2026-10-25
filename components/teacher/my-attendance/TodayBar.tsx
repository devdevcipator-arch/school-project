"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/dashboard/ui";
import StatusSwitch from "@/components/teacher/StatusSwitch";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SHIFT } from "@/lib/myAttendance";
import { teacher } from "@/lib/teacher";
import type { DayRecord } from "@/lib/teacherAttendance";
import { clock } from "@/lib/teachers";
import { stateMeta, shortDay } from "./shared";

const toMins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const hm = (mins: number) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-3.5 py-2 text-[.82rem] font-semibold text-surface">
      <Icon d={icon} className="size-4 shrink-0 text-accent" />
      {children}
    </span>
  );
}

/** Today's own status: check-in, live time on campus and the check-out action. */
export default function TodayBar({
  dateLabel,
  today,
  lastDay,
  checkOut,
  onCheckOut,
}: {
  dateLabel: string;
  /** Today's record, or undefined on weekends and breaks. */
  today?: DayRecord;
  lastDay?: DayRecord;
  checkOut: string | null;
  onCheckOut: () => void;
}) {
  const [nowMins, setNowMins] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const inAt = today?.checkIn;
  const endMins = checkOut ? toMins(checkOut) : Math.min(nowMins, toMins(SHIFT.end));
  const onCampus = inAt ? Math.max(0, endMins - toMins(inAt)) : 0;
  const shiftOver = nowMins >= toMins(SHIFT.end);
  const early = inAt ? toMins(SHIFT.start) - toMins(inAt) : 0;

  let heading: string;
  let line: React.ReactNode;
  if (!today) {
    heading = "No school today";
    line = lastDay ? (
      <>
        Last working day {shortDay(lastDay.date)}: <strong className="text-surface">{stateMeta[lastDay.state].label}</strong>
        {lastDay.checkIn && ` (in ${clock(lastDay.checkIn)}${lastDay.checkOut ? `, out ${clock(lastDay.checkOut)}` : ""})`}
      </>
    ) : null;
  } else if (inAt) {
    heading = `Checked in at ${clock(inAt)}`;
    line = today.state === "late" ? `${today.minutesLate} min after the ${clock(SHIFT.start)} start` : `${early} min before the ${clock(SHIFT.start)} start`;
  } else {
    heading = "No check-in recorded today";
    line = today.note;
  }

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-linear-135 from-ink via-[#0b2a38] to-primary p-5 text-surface shadow-[0_18px_40px_rgba(6,30,41,.18)] sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[.78rem] font-bold uppercase tracking-[.14em] text-accent">
            {teacher.session} · {dateLabel}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h2 className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold leading-tight tracking-tight">{heading}</h2>
            {today && <Badge tone={stateMeta[today.state].tone}>{stateMeta[today.state].label}</Badge>}
          </div>
          {line && <p className="mt-1 text-[.92rem] text-surface/70">{line}</p>}
        </div>

        <div className="grid w-full justify-items-stretch gap-2.5 sm:w-auto sm:justify-items-end">
          <StatusSwitch />
          {inAt && (checkOut ? (
              <span className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-surface/20 bg-surface/10 px-5 py-[11px] text-[.92rem] font-semibold">
                <Icon d="M5 12l4 4 10-10" className="size-[18px] text-accent" />
                Checked out at {clock(checkOut)}
              </span>
            ) : (
              <button type="button" onClick={onCheckOut} className={buttonClass("primary", "md", "cursor-pointer")}>
                <Icon d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" className="size-[18px] rotate-180" />
                Check Out
              </button>
            ))}
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2.5">
        <Chip icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2">
          Shift {clock(SHIFT.start)} to {clock(SHIFT.end)}
        </Chip>
        {inAt && (
          <Chip icon="M3 21h18 M5 21V8l7-5 7 5v13 M10 21v-6h4v6">
            {hm(onCampus)} on campus{!checkOut && shiftOver && ", check-out pending"}
          </Chip>
        )}
        <Chip icon="M12 7v6 M12 17h.01 M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z">Check-in after {clock(SHIFT.start)} counts as late</Chip>
      </div>
    </section>
  );
}
