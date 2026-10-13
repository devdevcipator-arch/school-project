"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Pagination, Select, ViewToggle, fieldClass, ghostSm, type DirectoryView } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { Icon } from "@/components/ui/Icon";
import { DEFAULTER_BELOW, classTeacherOf, sectionLabel, sections, students, type Student } from "@/lib/students";
import { AttendanceMeter, StatusBadge } from "./parts";
import StudentProfile, { type StudentTab } from "./StudentProfile";

const PAGE_SIZE = 15;
const noop = () => () => {};

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 10 : 0);
const order = (s: Student) => sections.indexOf(s.section) * 100 + s.rollNo;

/* ---------------- Actions ---------------- */

type Actions = { onView: (s: Student) => void; onLogs: (s: Student) => void };

const actionIcons = {
  view: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  logs: "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11",
};

function RowActions({ s, onView, onLogs, compact = false }: Actions & { s: Student; compact?: boolean }) {
  const items = [
    { key: "view", label: "View Full Profile", short: "Profile", run: () => onView(s) },
    { key: "logs", label: "View Attendance Logs", short: "Attendance", run: () => onLogs(s) },
  ] as const;
  return (
    <div className="flex items-center gap-0.5">
      {items.map((a) => (
        <button key={a.key} type="button" onClick={a.run} title={a.label} aria-label={`${a.label}: ${s.name}`} className={ghostSm}>
          <Icon d={actionIcons[a.key]} className="size-4" />
          {!compact && <span>{a.short}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Directory views ---------------- */

function Identity({ s }: { s: Student }) {
  return (
    <span className="text-[.76rem] text-ink/50">
      Roll {s.rollNo} · {s.regId} · {s.gender}
    </span>
  );
}

function StudentCard({ s, ...actions }: Actions & { s: Student }) {
  return (
    <li className="flex flex-col rounded-[18px] border border-ink/8 bg-white p-5 transition-[box-shadow,translate] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,30,41,.08)]">
      <div className="flex items-start gap-3">
        <Avatar name={s.name} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => actions.onView(s)} className="block max-w-full cursor-pointer truncate text-left text-[1rem] font-extrabold tracking-tight hover:text-primary">
            {s.name}
          </button>
          <Identity s={s} />
        </div>
        <StatusBadge status={s.today} />
      </div>

      <div className="mt-4 grid gap-1.5 text-[.82rem]">
        <span className="inline-flex min-w-0 items-center gap-2 text-ink/70">
          <Icon d="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" className="size-4 shrink-0 text-accent" />
          {sectionLabel(s.section)}
        </span>
        <span className="inline-flex min-w-0 items-center gap-2 text-ink/70">
          <Icon d="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" className="size-4 shrink-0 text-accent" />
          <span className="truncate">
            {s.guardian} <span className="text-ink/45">({s.guardianRelation})</span>
          </span>
        </span>
        <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-ink/70 hover:text-primary">
          <Icon d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" className="size-4 shrink-0 text-accent" />
          {s.phone}
        </a>
      </div>

      <div className="mb-4 mt-4">
        <AttendanceMeter rate={s.termRate} name={s.name} />
      </div>

      <div className="mt-auto flex justify-end border-t border-ink/8 pt-3">
        <RowActions s={s} {...actions} />
      </div>
    </li>
  );
}

function StudentTable({ list, ...actions }: Actions & { list: Student[] }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[940px] text-left text-[.86rem]">
        <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
          <tr>
            <th scope="col" className="px-5 py-3.5">Student</th>
            <th scope="col" className="px-3 py-3.5">Class</th>
            <th scope="col" className="px-3 py-3.5">Guardian & contact</th>
            <th scope="col" className="px-3 py-3.5">Today</th>
            <th scope="col" className="px-3 py-3.5">Term attendance</th>
            <th scope="col" className="px-3 py-3.5 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((s) => (
            <tr key={s.id} className="align-middle transition-colors hover:bg-surface/50">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <div className="min-w-0">
                    <button type="button" onClick={() => actions.onView(s)} className="cursor-pointer whitespace-nowrap text-left font-bold hover:text-primary">
                      {s.name}
                    </button>
                    <div className="mt-0.5 whitespace-nowrap">
                      <Identity s={s} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3.5 font-semibold">{s.section}</td>
              <td className="px-3 py-3.5 text-[.8rem]">
                <span className="block max-w-[200px] truncate text-ink/75">{s.guardian}</span>
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="whitespace-nowrap text-ink/50 hover:text-primary">
                  {s.phone}
                </a>
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge status={s.today} />
              </td>
              <td className="px-3 py-3.5">
                <AttendanceMeter rate={s.termRate} name={s.name} />
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end">
                  <RowActions s={s} {...actions} compact />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Summary strip for the selected class/section. */
function ClassStrip({ section }: { section: string }) {
  const roster = students.filter((s) => s.section === section);
  const present = roster.filter((s) => s.today === "present").length;
  const avg = Math.round((roster.reduce((n, s) => n + s.termRate, 0) / roster.length) * 10) / 10;
  const defaulters = roster.filter((s) => s.termRate < DEFAULTER_BELOW).length;
  const items = [
    { label: "Class teacher", value: classTeacherOf(section) },
    { label: "Students", value: roster.length },
    { label: "Present today", value: `${present} / ${roster.length}` },
    { label: "Term average", value: `${avg}%` },
    { label: "Defaulters", value: defaulters },
  ];
  return (
    <div className="flex animate-fade-in flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-linear-135 from-ink to-primary px-5 py-4 text-surface">
      <p className="text-[1.15rem] font-extrabold tracking-tight">{sectionLabel(section)}</p>
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="text-[.7rem] font-bold uppercase tracking-[.1em] text-surface/60">{i.label}</dt>
            <dd className="text-[.92rem] font-bold">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------------- Board ---------------- */

export default function StudentsBoard() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<DirectoryView>("table");
  const [page, setPage] = useState(1);
  const [profile, setProfile] = useState<{ s: Student; tab: StudentTab } | null>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const stats = useMemo(() => {
    const present = students.filter((s) => s.today === "present").length;
    const leave = students.filter((s) => s.today === "leave").length;
    return {
      total: students.length,
      boys: students.filter((s) => s.gender === "Male").length,
      present,
      rate: pct(present, students.length),
      away: students.length - present,
      leave,
      defaulters: students.filter((s) => s.termRate < DEFAULTER_BELOW).length,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return students
      .filter(
        (s) =>
          !q ||
          `${s.name} ${s.regId} ${s.guardian}`.toLowerCase().includes(q) ||
          (digits !== "" && (String(s.rollNo) === digits || (digits.length >= 4 && s.phone.replace(/\D/g, "").includes(digits)))),
      )
      .filter((s) => section === "all" || s.section === section)
      .filter((s) => (status === "all" ? true : status === "defaulter" ? s.termRate < DEFAULTER_BELOW : s.today === status))
      .sort((a, b) => order(a) - order(b));
  }, [query, section, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const filter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const filtersOn = query || section !== "all" || status !== "all";

  const actions: Actions = {
    onView: (s) => setProfile({ s, tab: "profile" }),
    onLogs: (s) => setProfile({ s, tab: "attendance" }),
  };

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students Enrolled" value={stats.total} icon="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" note={`${stats.boys} boys · ${stats.total - stats.boys} girls · ${sections.length} sections`} />
        <StatCard label="Today's Attendance Rate" value={`${stats.rate}%`} icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11" note={`${stats.present} of ${stats.total} present`} />
        <StatCard label="On Leave / Absent Today" value={stats.away} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" note={`${stats.leave} on leave · ${stats.away - stats.leave} absent`} />
        <StatCard label="Attendance Defaulters" value={stats.defaulters} icon="M12 4l9 16H3z M12 10v4 M12 17h.01" note={`Below ${DEFAULTER_BELOW}% this term`} />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search students</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => filter(setQuery)(e.target.value)} placeholder="Search by name, roll no., registration ID or parent phone" className={`${fieldClass} w-full pl-10`} />
          </label>
          <div className="grid grid-cols-2 gap-2.5 lg:flex">
            <Select label="Class / section" value={section} onChange={filter(setSection)} className="lg:w-[170px]">
              <option value="all">All classes</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {sectionLabel(s)}
                </option>
              ))}
            </Select>
            <Select label="Attendance status" value={status} onChange={filter(setStatus)} className="lg:w-[190px]">
              <option value="all">All statuses</option>
              <option value="present">Present today</option>
              <option value="absent">Absent</option>
              <option value="leave">On leave</option>
              <option value="defaulter">Defaulter (&lt;{DEFAULTER_BELOW}%)</option>
            </Select>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div role="group" aria-label="Classes" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {["all", ...sections].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={section === s}
              onClick={() => filter(setSection)(s)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition-colors ${
                section === s ? "border-primary bg-primary text-surface" : "border-ink/12 text-ink/70 hover:border-accent hover:text-primary"
              }`}
            >
              {s === "all" ? "All classes" : s}
            </button>
          ))}
        </div>

        {section !== "all" && <ClassStrip key={section} section={section} />}

        {filtersOn && (
          <div className="flex flex-wrap items-center gap-2 text-[.8rem]">
            <span className="text-ink/50" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "match" : "matches"}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSection("all");
                setStatus("all");
                setPage(1);
              }}
              className={ghostSm}
            >
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              Clear filters
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <Icon d="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" className="size-7" />
            </span>
            <p className="font-bold">No students match these filters</p>
            <p className="max-w-[360px] text-[.86rem] text-ink/55">Try a different name, roll number, class or attendance status.</p>
          </div>
        ) : (
          <>
            <ul className={`grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 ${view === "table" ? "lg:hidden" : ""}`}>
              {visible.map((s) => (
                <StudentCard key={s.id} s={s} {...actions} />
              ))}
            </ul>
            {view === "table" && (
              <div className="max-lg:hidden">
                <StudentTable list={visible} {...actions} />
              </div>
            )}
          </>
        )}

        <Pagination page={current} pages={pages} total={filtered.length} size={PAGE_SIZE} noun="students" onPage={setPage} />
      </section>

      {hydrated && profile && <StudentProfile key={`${profile.s.id}-${profile.tab}`} s={profile.s} tab={profile.tab} onClose={() => setProfile(null)} />}
    </main>
  );
}
