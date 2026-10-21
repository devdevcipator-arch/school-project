"use client";

import Link from "next/link";
import { Kpi, Ring, kpiBig as big, kpiSub as sub } from "@/components/dashboard/kpi";
import { Badge, Bar, Card, CardLink } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { dueSoon, latestResult, pendingWork, studentAttendance, todaySchedule, urgentNotices } from "@/lib/student";
import { to12h, toMinutes, useMinuteOfDay } from "./clock";

/* ---------- Urgent notice banner ---------- */

export function UrgentNotices() {
  return (
    <section aria-label="Urgent notices" className="grid gap-3 lg:grid-cols-2">
      {urgentNotices.map((n) => (
        <article
          key={n.title}
          className={`flex gap-4 rounded-[20px] border bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] ${
            n.tone === "danger" ? "border-danger/25" : "border-warn/30"
          }`}
        >
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${n.tone === "danger" ? "bg-danger/10 text-danger" : "bg-warn/12 text-[#9a6a0f]"}`}
          >
            <Icon d="M3 11l15-6v14L3 13z M7 13v5h3v-4" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={n.tone}>{n.source}</Badge>
              <span className="text-[.76rem] text-ink/50">{n.when}</span>
            </div>
            <h2 className="mt-2 text-[1rem] font-extrabold tracking-tight">{n.title}</h2>
            <p className="mt-1 text-[.86rem] leading-relaxed text-ink/65">{n.body}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

/* ---------- KPI row ---------- */

export function KpiRow() {
  const { present, absent, leave } = studentAttendance;
  const rate = Math.round((present / (present + absent + leave)) * 100);
  const closing = pendingWork.filter((p) => p.state === "Closes today").length;
  const quizzes = pendingWork.filter((p) => p.kind !== "Homework").length;
  const homework = pendingWork.length - quizzes;
  const r = latestResult;
  const pct = Math.round((r.score / r.total) * 100);
  const diff = pct - r.classAverage;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Kpi label="Term Attendance" icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11">
        <div className="flex items-center gap-4">
          <Ring percent={rate} label={`${rate}% attendance this term`} />
          <div className="min-w-0">
            <p className={big}>{rate}%</p>
            <p className="mt-1.5 text-[.82rem] text-ink/60">present this term</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">Present {present}</Badge>
          <Badge tone={absent > 0 ? "danger" : "ok"}>Absent {absent}</Badge>
          <Badge tone="neutral">Leave {leave}</Badge>
        </div>
      </Kpi>

      <Kpi label="Pending Quizzes & Homework" icon="M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3">
        <p className={big}>
          {quizzes} <span className={sub}>quizzes</span>
          <span className="mx-2 text-ink/25">/</span>
          {homework} <span className={sub}>homework</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {closing > 0 && <Badge tone="warn">{closing} closes today</Badge>}
          <Badge tone="neutral">{pendingWork.length} to do</Badge>
        </div>
      </Kpi>

      <Kpi label="Latest Result" icon="M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6">
        <p className={big}>
          {r.score}/{r.total} <span className={sub}>{pct}%</span>
        </p>
        <div className="grid gap-1.5">
          <span className="flex items-center justify-between gap-2 text-[.82rem]">
            <span className="truncate font-semibold text-ink/70">{r.title}</span>
            <span className="shrink-0 text-ink/50">{r.gradedOn}</span>
          </span>
          <Bar value={pct} label={`${r.title}: ${pct}%`} />
        </div>
        <p className="text-[.82rem] text-ink/60">
          Class average <strong className="text-ink">{r.classAverage}%</strong>
          <span className={`ml-2 font-bold ${diff >= 0 ? "text-ok" : "text-danger"}`}>
            {diff >= 0 ? "+" : ""}
            {diff} pts
          </span>
        </p>
      </Kpi>
    </div>
  );
}

/* ---------- Daily schedule ---------- */

export function ScheduleCard() {
  const minute = useMinuteOfDay();
  const nowIndex = todaySchedule.findIndex((p) => minute >= toMinutes(p.start) && minute < toMinutes(p.end));
  const nextIndex = minute < 0 ? -1 : todaySchedule.findIndex((p) => !p.isBreak && toMinutes(p.start) > minute);

  return (
    <Card title="Today's Schedule" subtitle={`${todaySchedule.filter((p) => !p.isBreak).length} classes · ${to12h(todaySchedule[0].start)} to ${to12h(todaySchedule.at(-1)!.end)}`}>
      <ol className="grid gap-2">
        {todaySchedule.map((p, i) => {
          const done = minute >= 0 && toMinutes(p.end) <= minute;
          const now = i === nowIndex;
          const next = i === nextIndex && nowIndex === -1;
          if (p.isBreak) {
            return (
              <li key={p.start} className={`flex items-center gap-3 px-3 py-1.5 text-[.8rem] font-semibold ${now ? "text-primary" : "text-ink/45"}`}>
                <span className="w-[74px] shrink-0 tabular-nums">{to12h(p.start)}</span>
                <span aria-hidden className="h-px flex-1 border-t border-dashed border-ink/15" />
                {now ? "Break now" : "Break"} · 20 min
                <span aria-hidden className="h-px flex-1 border-t border-dashed border-ink/15" />
              </li>
            );
          }
          return (
            <li
              key={p.start}
              aria-current={now ? "step" : undefined}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
                now ? "border-primary/30 bg-primary/6" : "border-ink/6 bg-surface/50"
              } ${done ? "opacity-55" : ""}`}
            >
              <span className="grid w-[74px] shrink-0 text-[.8rem] tabular-nums">
                <strong>{to12h(p.start)}</strong>
                <span className="text-ink/50">{to12h(p.end)}</span>
              </span>
              <span aria-hidden className={`h-9 w-1 shrink-0 rounded-full ${now ? "bg-primary" : "bg-accent/40"}`} />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-[.92rem] font-bold">{p.subject}</span>
                <span className="truncate text-[.78rem] text-ink/55">
                  {p.teacher} · {p.room}
                </span>
              </span>
              {now && <Badge tone="neutral">Now</Badge>}
              {next && <Badge tone="neutral">Next</Badge>}
              {done && (
                <span className="text-ok" aria-label="Finished">
                  <Icon d="M5 12l4 4 10-10" className="size-4" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ---------- Due soon ---------- */

export function DueSoonCard() {
  const next = pendingWork.find((p) => p.state === "Closes today") ?? pendingWork[0];
  return (
    <Card title="Due Soon" subtitle="Deadlines over the next 7 days">
      <ul className="grid gap-2.5">
        {dueSoon.map((d) => (
          <li key={d.title} className="flex items-center gap-3">
            <span
              className={`grid size-12 shrink-0 place-content-center rounded-xl text-center leading-none ${
                d.urgent ? "bg-linear-135 from-primary to-accent text-surface" : "bg-primary/8 text-primary"
              }`}
            >
              <span className="text-[.66rem] font-bold uppercase">{d.day}</span>
              <span className="mt-1 text-[.8rem] font-extrabold">{d.date.split(" ")[0]}</span>
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="truncate text-[.9rem] font-semibold">{d.title}</span>
              <span className="truncate text-[.78rem] text-ink/55">{d.subject}</span>
            </span>
            {d.urgent && <Badge tone="warn">Today</Badge>}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl border border-ink/8 bg-surface/60 p-4">
        <p className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Start next</p>
        <p className="mt-1 text-[.95rem] font-extrabold">{next.title}</p>
        <p className="text-[.8rem] text-ink/55">
          {next.subject} · <span className="font-semibold">{next.state}</span>
        </p>
        <Link href="/student/assessments" className={buttonClass("primary", "md", "mt-3 w-full")}>
          <Icon d="M8 5v14l11-7z" className="size-[18px]" />
          Start {next.kind}
        </Link>
      </div>

      <CardLink href="/student/assessments">View all assessments</CardLink>
    </Card>
  );
}
