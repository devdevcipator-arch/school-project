"use client";

import { Fragment, useMemo, useState } from "react";
import { Pagination, Select, fieldClass, ghostSm } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { schoolToday, shortDate, studentAssessments, utcMs, type Assessment, type AssessmentKind } from "@/lib/student";

type BoardTab = "today" | "upcoming" | "closed";

const PAGE_SIZE = 8;
const DAY_MS = 86_400_000;
const kinds: AssessmentKind[] = ["Quiz", "Test", "Homework"];
const subjects = [...new Set(studentAssessments.map((a) => a.subject))].sort();

const kindMeta: Record<AssessmentKind, { icon: string; chip: string }> = {
  Quiz: { icon: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3", chip: "bg-primary/10 text-primary" },
  Test: { icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2", chip: "bg-ink text-surface" },
  Homework: { icon: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z M11 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7", chip: "bg-accent/18 text-ink" },
};

const daysUntil = (iso: string) => Math.round((utcMs(iso) - utcMs(schoolToday)) / DAY_MS);
const tabOf = (a: Assessment): BoardTab => (a.due === schoolToday ? "today" : a.due > schoolToday ? "upcoming" : "closed");
const weekday = (iso: string) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(utcMs(iso)).getUTCDay()];

/** Due chip: amber for today, teal countdown for upcoming, muted once closed. */
function DueChip({ due }: { due: string }) {
  const n = daysUntil(due);
  const [label, cls, dot] =
    n === 0
      ? ["Due today", "border-warn/30 bg-warn/12 text-[#9a6a0f]", "bg-warn"]
      : n > 0
        ? [`In ${n} ${n === 1 ? "day" : "days"}`, "border-primary/20 bg-primary/7 text-primary", "bg-primary"]
        : ["Closed", "border-ink/10 bg-ink/4 text-ink/50", "bg-ink/30"];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[.74rem] font-semibold ${cls}`}>
      <span aria-hidden className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function AssessmentTable({ list, open, onToggle }: { list: Assessment[]; open: string | null; onToggle: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[900px] text-left text-[.86rem]">
        <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
          <tr>
            <th scope="col" className="px-5 py-3.5">Assessment</th>
            <th scope="col" className="px-3 py-3.5">Type</th>
            <th scope="col" className="px-3 py-3.5">Teacher</th>
            <th scope="col" className="px-3 py-3.5">Assigned</th>
            <th scope="col" className="px-3 py-3.5">Due</th>
            <th scope="col" className="px-3 py-3.5">Status</th>
            <th scope="col" className="px-3 py-3.5 text-right">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((a) => {
            const expanded = open === a.id;
            const closed = tabOf(a) === "closed";
            return (
              <Fragment key={a.id}>
                <tr className={`align-middle transition-colors hover:bg-surface/50 ${closed ? "opacity-65" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
                        <Icon d={kindMeta[a.kind].icon} className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap font-bold">{a.title}</p>
                        <p className="whitespace-nowrap text-[.76rem] text-ink/50">
                          {a.subject} · {a.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[.72rem] font-bold ${kindMeta[a.kind].chip}`}>{a.kind}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink/75">{a.teacher}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink/60">{shortDate(a.assigned)}</td>
                  <td className="px-3 py-3">
                    <p className="whitespace-nowrap font-bold">
                      {weekday(a.due)} {shortDate(a.due)}
                    </p>
                    {a.extendedFrom && (
                      <p className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[.74rem] font-semibold text-[#9a6a0f]">
                        <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" className="size-3.5" />
                        Extended from {shortDate(a.extendedFrom)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <DueChip due={a.due} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onToggle(a.id)}
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Hide" : "Show"} details for ${a.title}`}
                      className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink/55 transition-colors hover:bg-primary/8 hover:text-primary"
                    >
                      <Icon d="M6 9l6 6 6-6" className={`size-[18px] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr className="bg-surface/50">
                    <td colSpan={7} className="px-5 pb-4 pt-1">
                      <div className="flex gap-3 rounded-2xl border border-ink/8 bg-white p-4 text-[.86rem]">
                        <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 8h.01 M12 11v6" className="mt-0.5 size-[18px] shrink-0 text-primary" />
                        <div>
                          <p className="font-bold">What to prepare</p>
                          <p className="mt-1 text-ink/70">{a.details}</p>
                          {a.extendedFrom && (
                            <p className="mt-2 text-[.8rem] text-ink/55">
                              {a.teacher} moved the deadline from {weekday(a.extendedFrom)} {shortDate(a.extendedFrom)} to {weekday(a.due)} {shortDate(a.due)}.
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** View-only reminder board of quizzes, tests and homework, grouped by due today, upcoming and closed. */
export default function AssessmentsBoard() {
  const [tab, setTab] = useState<BoardTab>("today");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [subject, setSubject] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const stats = useMemo(() => {
    const live = studentAssessments.filter((a) => a.due >= schoolToday);
    return {
      today: live.filter((a) => a.due === schoolToday).length,
      week: live.filter((a) => daysUntil(a.due) > 0 && daysUntil(a.due) <= 7).length,
      extended: live.filter((a) => a.extendedFrom).length,
      closed: studentAssessments.length - live.length,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studentAssessments
      .filter((a) => tabOf(a) === tab)
      .filter((a) => !q || `${a.title} ${a.subject} ${a.teacher} ${a.id}`.toLowerCase().includes(q))
      .filter((a) => kind === "all" || a.kind === kind)
      .filter((a) => subject === "all" || a.subject === subject)
      .sort((a, b) => (tab === "closed" ? b.due.localeCompare(a.due) : a.due.localeCompare(b.due)));
  }, [tab, query, kind, subject]);

  const tabs: { key: BoardTab; label: string; count: number }[] = [
    { key: "today", label: "Due Today", count: stats.today },
    { key: "upcoming", label: "Upcoming", count: studentAssessments.filter((a) => tabOf(a) === "upcoming").length },
    { key: "closed", label: "Closed", count: stats.closed },
  ];
  const { listRef, target, setHover } = useSlidingPill(tabs.findIndex((t) => t.key === tab));

  const filter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };
  const switchTab = (t: BoardTab) => {
    setTab(t);
    setPage(1);
    setOpen(null);
  };
  const filtersOn = query || kind !== "all" || subject !== "all";

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        <StatCard label="Due Today" value={stats.today} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" note="Finish by end of day" />
        <StatCard label="Due This Week" value={stats.week} icon="M8 3v3 M16 3v3 M4 7h16v13H4z M4 11h16" note="Over the next 7 days" />
        <StatCard label="Extended by Teacher" value={stats.extended} icon="M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4 M12 8v4l3 2" note="Deadlines moved later" />
        <StatCard label="Closed" value={stats.closed} icon="M5 12l4 4 10-10" note="Past due this term" />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
            <ul ref={listRef} role="tablist" aria-label="Assessment lists" className="relative flex w-max gap-1 rounded-full bg-surface p-1" onMouseLeave={() => setHover(null)}>
              <span data-pill aria-hidden className={pillClass} />
              {tabs.map((t, i) => (
                <li key={t.key} role="presentation">
                  <button
                    data-pill-item
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => switchTab(t.key)}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className={`relative z-10 inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[.86rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                      i === target ? "text-surface" : "text-ink/65 hover:text-ink"
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 text-[.72rem] font-bold transition-colors ${i === target ? "bg-surface/20" : "bg-ink/8"}`}>{t.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="inline-flex items-center gap-1.5 text-[.8rem] text-ink/55">
            <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 8h.01 M12 11v6" className="size-4 shrink-0 text-primary" />
            View only. Your teachers set deadlines and may extend them by up to a week.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search assessments</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => filter(setQuery)(e.target.value)} placeholder="Search by title, subject or teacher" className={`${fieldClass} w-full pl-10`} />
          </label>
          <div className="grid grid-cols-2 gap-2.5 lg:flex">
            <Select label="Type" value={kind} onChange={filter(setKind)} className="lg:w-[160px]">
              <option value="all">All types</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
            <Select label="Subject" value={subject} onChange={filter(setSubject)} className="lg:w-[190px]">
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filtersOn && (
          <div className="flex flex-wrap items-center gap-2 text-[.8rem]">
            <span className="text-ink/50" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "match" : "matches"}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setKind("all");
                setSubject("all");
                setPage(1);
              }}
              className={ghostSm}
            >
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              Clear filters
            </button>
          </div>
        )}

        {visible.length > 0 ? (
          <AssessmentTable list={visible} open={open} onToggle={(id) => setOpen((o) => (o === id ? null : id))} />
        ) : (
          <p className="rounded-[18px] border border-dashed border-ink/12 px-5 py-10 text-center text-[.88rem] text-ink/55">
            {filtersOn ? "Nothing matches these filters." : tab === "today" ? "Nothing is due today." : "Nothing here yet."}
          </p>
        )}

        <Pagination page={current} pages={pages} total={filtered.length} size={PAGE_SIZE} noun="assessments" onPage={setPage} />
      </section>
    </main>
  );
}
