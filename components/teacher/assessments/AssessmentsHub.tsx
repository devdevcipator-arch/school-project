"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Dialog, Select, Toast, fieldClass, ghostBtn, ghostSm, type ToastData } from "@/components/dashboard/controls";
import { Badge, Bar, StatCard } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mySections, rosterOf } from "@/lib/classAttendance";
import { sectionSubjects, seedAssessments, seedSubmissions, type Assessment, type AssessmentStatus, type Submission } from "@/lib/assessments";
import AiWizard from "./AiWizard";
import { printAssessment } from "./documents";
import GradingDrawer from "./GradingDrawer";
import ManualComposer from "./ManualComposer";
import { EvalBadge, FormatBadge, aiIcon, counts, isToday, pacing, statusMeta, when } from "./parts";

type Tab = "all" | AssessmentStatus;
const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Active / Live" },
  { key: "scheduled", label: "Scheduled" },
  { key: "closed", label: "Completed / Closed" },
  { key: "draft", label: "Drafts" },
];

const icons = {
  review: "M9 4h6 M8 4H6v17h12V4h-2 M9 11l2 2 4-4 M9 17h6",
  print: "M6 9V3h12v6 M6 18H4v-7h16v7h-2 M8 14h8v7H8z",
  edit: "M4 20h4L19 9l-4-4L4 16z M14 6l4 4",
  close: "M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z",
  trash: "M5 7h14 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3",
};

const pad = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const allSubjects = [...new Set(mySections.flatMap((s) => sectionSubjects(s.section)))];

// Deadlines are relative to the viewer's clock, so the hub renders on the client only.
const noop = () => () => {};
const clientNow = () => Math.floor(Date.now() / 60_000) * 60_000;

export default function AssessmentsHub() {
  const now = useSyncExternalStore(noop, clientNow, () => 0);
  if (!now) {
    return (
      <main className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
        <div className="h-[220px] animate-pulse rounded-[20px] bg-ink/8" />
      </main>
    );
  }
  return <Hub now={now} />;
}

type Actions = {
  onReview: (a: Assessment) => void;
  onPrint: (a: Assessment) => void;
  onEdit: (a: Assessment) => void;
  onClose: (a: Assessment) => void;
  onContinue: (a: Assessment) => void;
  onDelete: (a: Assessment) => void;
};

function Progress({ a, subs }: { a: Assessment; subs: Submission[] }) {
  const c = counts(subs);
  const p = c.total ? Math.round((c.submitted / c.total) * 100) : 0;
  return (
    <div className="grid min-w-[150px] gap-1.5">
      <span className="text-[.78rem] font-semibold text-ink/65">
        <strong className="tabular-nums text-ink">
          {c.submitted} / {c.total}
        </strong>{" "}
        submitted ({p}%)
      </span>
      <Bar value={c.submitted} max={c.total || 1} fill={p >= 75 ? "bg-ok" : a.status === "closed" || p < 40 ? "bg-danger" : "bg-warn"} label={`${a.title}: ${c.submitted} of ${c.total} submitted`} />
    </div>
  );
}

function RowActions({ a, act, compact = false, nowrap = false }: { a: Assessment; act: Actions; compact?: boolean; nowrap?: boolean }) {
  const wrap = nowrap ? "flex-nowrap" : "flex-wrap";
  if (a.status === "draft") {
    return (
      <div className={`flex ${wrap} items-center gap-1`}>
        <button type="button" onClick={() => act.onContinue(a)} className={buttonClass("primary", "md", "cursor-pointer !px-3.5 !py-2 text-[.82rem]")}>
          <Icon d={icons.edit} className="size-4" />
          Continue Editing
        </button>
        <button type="button" onClick={() => act.onDelete(a)} title="Delete draft" aria-label={`Delete draft ${a.title}`} className={`${ghostSm} hover:!bg-danger/8 hover:!text-danger`}>
          <Icon d={icons.trash} className="size-4" />
          {!compact && "Delete"}
        </button>
      </div>
    );
  }
  const small = [
    { key: "print", label: "Export PDF / Print", icon: icons.print, run: act.onPrint, show: true },
    { key: "edit", label: "Edit Details / Extend Deadline", icon: icons.edit, run: act.onEdit, show: a.status !== "closed" },
    { key: "close", label: "Close Assessment", icon: icons.close, run: act.onClose, show: a.status === "live" },
  ].filter((x) => x.show);
  return (
    <div className={`flex ${wrap} items-center gap-1`}>
      <button type="button" onClick={() => act.onReview(a)} className={buttonClass("primary", "md", "cursor-pointer !px-3.5 !py-2 text-[.82rem]")}>
        <Icon d={icons.review} className="size-4" />
        {compact ? "Review" : "Review Submissions & Grades"}
      </button>
      {small.map((x) => (
        <button key={x.key} type="button" onClick={() => x.run(a)} title={x.label} aria-label={`${x.label}: ${a.title}`} className={ghostSm}>
          <Icon d={x.icon} className="size-4" />
          {!compact && <span className="max-sm:sr-only">{x.label.split(" / ")[0]}</span>}
        </button>
      ))}
    </div>
  );
}

function AssessmentCard({ a, subs, now, act }: { a: Assessment; subs: Submission[]; now: number; act: Actions }) {
  const pace = pacing(a, now);
  return (
    <li className="flex flex-col gap-3 rounded-[18px] border border-ink/8 bg-white p-4 transition-shadow hover:shadow-[0_16px_36px_rgba(6,30,41,.08)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="grid min-w-0 gap-1.5">
          <strong className="text-[1rem] leading-snug">{a.title}</strong>
          <span className="flex flex-wrap items-center gap-1.5">
            <FormatBadge format={a.format} />
            <span className="rounded-full bg-ink/6 px-2.5 py-0.5 text-[.7rem] font-bold text-ink/65">
              Class {a.section} • {a.subject}
            </span>
          </span>
        </span>
        <Badge tone={statusMeta[a.status].tone}>{statusMeta[a.status].label}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[.78rem] text-ink/55">
        <Badge tone={pace.tone}>{pace.text}</Badge>
        <span>
          {when(a.start)} to {when(a.due)}
        </span>
      </div>
      {a.status !== "draft" && a.status !== "scheduled" && <Progress a={a} subs={subs} />}
      <EvalBadge a={a} subs={subs} />
      <div className="mt-auto border-t border-ink/8 pt-3">
        <RowActions a={a} act={act} compact />
      </div>
    </li>
  );
}

function Hub({ now }: { now: number }) {
  const [list, setList] = useState<Assessment[]>(() => seedAssessments(new Date(now)));
  const [subs, setSubs] = useState<Record<string, Submission[]>>(() => Object.fromEntries(list.map((a) => [a.id, seedSubmissions(a, rosterOf(a.section))])));
  const [section, setSection] = useState(mySections[0].section);
  const [subject, setSubject] = useState("all");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  // The Overview "Create New Assessment" button links here with ?new=1.
  const [creating, setCreating] = useState<null | { kind: "ai" | "manual"; draft?: Assessment }>(() => (new URLSearchParams(window.location.search).has("new") ? { kind: "ai" } : null));
  const [reviewing, setReviewing] = useState<Assessment | null>(null);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [closing, setClosing] = useState<Assessment | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const subjects = section === "all" ? allSubjects : sectionSubjects(section);
  const scoped = useMemo(() => list.filter((a) => (section === "all" || a.section === section) && (subject === "all" || a.subject === subject)), [list, section, subject]);

  const stats = useMemo(() => {
    const live = scoped.filter((a) => a.status === "live");
    const dueToday = live.filter((a) => isToday(a.due, now));
    const closedPcts = scoped
      .filter((a) => a.status === "closed")
      .map((a) => {
        const m = (subs[a.id] ?? []).filter((s) => s.score !== null);
        return m.length ? (m.reduce((t, s) => t + (s.score ?? 0), 0) / (m.length * a.totalMarks)) * 100 : null;
      })
      .filter((x): x is number => x !== null);
    const manual = scoped.filter((a) => !a.autoGraded && a.status !== "draft");
    return {
      active: live.length + scoped.filter((a) => a.status === "scheduled").length,
      live: live.length,
      scheduled: scoped.filter((a) => a.status === "scheduled").length,
      dueToday: dueToday.reduce((t, a) => t + counts(subs[a.id]).missing, 0),
      dueTodayCount: dueToday.length,
      avg: closedPcts.length ? Math.round((closedPcts.reduce((t, x) => t + x, 0) / closedPcts.length) * 10) / 10 : null,
      avgCount: closedPcts.length,
      reviews: manual.reduce((t, a) => t + counts(subs[a.id]).pending, 0),
      reviewTasks: manual.filter((a) => counts(subs[a.id]).pending > 0).length,
    };
  }, [scoped, subs, now]);

  const q = query.trim().toLowerCase();
  const rows = scoped
    .filter((a) => (tab === "all" || a.status === tab) && (!q || `${a.title} ${a.topic} ${a.subject}`.toLowerCase().includes(q)))
    .sort((a, b) => ["live", "scheduled", "draft", "closed"].indexOf(a.status) - ["live", "scheduled", "draft", "closed"].indexOf(b.status) || (a.status === "closed" ? b.due.localeCompare(a.due) : a.due.localeCompare(b.due)));
  const tabCount = (t: Tab) => (t === "all" ? scoped.length : scoped.filter((a) => a.status === t).length);

  const save = (a: Assessment, publish: boolean) => {
    setList((l) => (l.some((x) => x.id === a.id) ? l.map((x) => (x.id === a.id ? a : x)) : [a, ...l]));
    setSubs((s) => ({ ...s, [a.id]: s[a.id] ?? seedSubmissions({ ...a, status: "scheduled" }, rosterOf(a.section)) }));
    setSection(a.section);
    setSubject("all");
    setTab(publish ? a.status : "draft");
    setToast({ text: publish ? `"${a.title}" ${a.status === "scheduled" ? "scheduled" : "published"} for Class ${a.section}. Students can see it in their portal.` : `"${a.title}" saved as a draft.` });
  };

  const act: Actions = {
    onReview: setReviewing,
    onPrint: (a) => {
      if (!printAssessment(a, !!a.questions)) setToast({ text: "Allow pop-ups for this site to print the paper." });
    },
    onEdit: setEditing,
    onClose: setClosing,
    onContinue: (a) => setCreating({ kind: a.format === "ai-quiz" ? "ai" : "manual", draft: a }),
    onDelete: (a) => {
      const prev = list;
      setList((l) => l.filter((x) => x.id !== a.id));
      setToast({ text: `Draft "${a.title}" deleted.`, action: { label: "Undo", run: () => (setList(prev), setToast(null)) } });
    },
  };

  const defaultSubject = subject !== "all" ? subject : (section === "all" ? sectionSubjects(mySections[0].section) : subjects)[0];
  const defaultSection = section === "all" ? mySections[0].section : section;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <section className="flex flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 xl:w-[440px]">
          <label className="grid gap-1.5 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">
            Class & section
            <Select
              label="Class and section"
              value={section}
              onChange={(v) => {
                setSection(v);
                if (v !== "all" && subject !== "all" && !sectionSubjects(v).includes(subject)) setSubject("all");
              }}
              className="normal-case tracking-normal text-ink"
            >
              <option value="all">All my classes</option>
              {mySections.map((s) => (
                <option key={s.section} value={s.section}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">
            Subject
            <Select label="Subject" value={subject} onChange={setSubject} className="normal-case tracking-normal text-ink">
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => setCreating({ kind: "manual" })} className={`${ghostBtn} max-sm:flex-1`}>
            <Icon d="M12 5v14 M5 12h14" className="size-[18px]" />
            Create Manual Assignment / Task
          </button>
          <button type="button" onClick={() => setCreating({ kind: "ai" })} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1")}>
            <Icon d={aiIcon} className="size-[18px]" />
            Generate AI Test / Quiz
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard label="Active Assessments" value={stats.active} icon="M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3" note={`${stats.live} live · ${stats.scheduled} scheduled`} />
        <StatCard label="Submissions Due Today" value={stats.dueToday} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" note={stats.dueTodayCount ? `still missing across ${stats.dueTodayCount} closing today` : "Nothing closes today"} />
        <StatCard label="Average Class Score" value={stats.avg === null ? "-" : `${stats.avg}%`} icon="M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6" note={stats.avgCount ? `across ${stats.avgCount} completed assessments` : "No completed assessments yet"} />
        <StatCard label="Pending Manual Reviews" value={stats.reviews} icon={icons.review} note={stats.reviewTasks ? `submissions to mark in ${stats.reviewTasks} tasks` : "All caught up"} />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div role="tablist" aria-label="Assessment status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[.82rem] font-semibold transition-colors ${tab === t.key ? "border-primary bg-primary text-surface" : "border-ink/12 text-ink/70 hover:border-accent hover:text-primary"}`}
              >
                {t.label}
                <span className={`text-[.72rem] ${tab === t.key ? "text-surface/70" : "text-ink/40"}`}>{tabCount(t.key)}</span>
              </button>
            ))}
          </div>
          <label className="relative xl:w-[340px]">
            <span className="sr-only">Search assessments</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title or topic" className={`${fieldClass} w-full pl-10`} />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <Icon d={icons.review} className="size-7" />
            </span>
            <p className="font-bold">No assessments here yet</p>
            <p className="max-w-[380px] text-[.86rem] text-ink/55">Try another tab or class, or create a new AI quiz or assignment.</p>
          </div>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 xl:hidden">
              {rows.map((a) => (
                <AssessmentCard key={a.id} a={a} subs={subs[a.id] ?? []} now={now} act={act} />
              ))}
            </ul>
            <div className="overflow-x-auto rounded-[18px] border border-ink/8 max-xl:hidden">
              <table className="w-full min-w-[960px] text-left text-[.86rem]">
                <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Assessment</th>
                    <th scope="col" className="px-3 py-3.5">Deadline & pacing</th>
                    <th scope="col" className="px-3 py-3.5">Submissions</th>
                    <th scope="col" className="px-3 py-3.5">Evaluation</th>
                    <th scope="col" className="px-3 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {rows.map((a) => {
                    const pace = pacing(a, now);
                    const s = subs[a.id] ?? [];
                    return (
                      <tr key={a.id} className="align-middle transition-colors hover:bg-surface/40">
                        <td className="px-5 py-4">
                          <div className="grid gap-1.5">
                            <span className="flex items-center gap-2">
                              <strong className="text-[.95rem]">{a.title}</strong>
                              {a.status !== "live" && <Badge tone={statusMeta[a.status].tone}>{statusMeta[a.status].label}</Badge>}
                            </span>
                            <span className="flex flex-wrap items-center gap-1.5">
                              <FormatBadge format={a.format} />
                              <span className="rounded-full bg-ink/6 px-2.5 py-0.5 text-[.7rem] font-bold text-ink/65">
                                Class {a.section} • {a.subject}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="grid justify-items-start gap-1">
                            <Badge tone={pace.tone}>{pace.text}</Badge>
                            <span className="whitespace-nowrap text-[.74rem] text-ink/55">Start {when(a.start)}</span>
                            <span className="whitespace-nowrap text-[.74rem] text-ink/55">Due {when(a.due)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4">{a.status === "draft" || a.status === "scheduled" ? <span className="text-[.78rem] text-ink/45">Opens {when(a.start).split(",")[0]}</span> : <Progress a={a} subs={s} />}</td>
                        <td className="px-3 py-4">
                          <div className="grid justify-items-start gap-1">
                            <EvalBadge a={a} subs={s} />
                            {a.released && <span className="text-[.72rem] font-semibold text-ok">Marks released</span>}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-end">
                            <RowActions a={a} act={act} compact nowrap />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {creating?.kind === "ai" && <AiWizard section={creating.draft?.section ?? defaultSection} subject={defaultSubject} draft={creating.draft} now={now} onSave={save} onClose={() => setCreating(null)} />}
      {creating?.kind === "manual" && <ManualComposer section={creating.draft?.section ?? defaultSection} subject={defaultSubject} draft={creating.draft} now={now} onSave={save} onClose={() => setCreating(null)} />}

      {reviewing && (
        <GradingDrawer
          key={reviewing.id}
          a={reviewing}
          roster={rosterOf(reviewing.section)}
          subs={subs[reviewing.id] ?? []}
          now={now}
          onClose={() => setReviewing(null)}
          onSave={(next, release) => {
            setSubs((s) => ({ ...s, [reviewing.id]: next }));
            if (release) setList((l) => l.map((x) => (x.id === reviewing.id ? { ...x, released: true } : x)));
            setToast({ text: release ? `Marks for "${reviewing.title}" released to student portals.` : "Marks saved." });
          }}
        />
      )}

      {editing && <EditDialog a={editing} onClose={() => setEditing(null)} onSave={(a) => (setList((l) => l.map((x) => (x.id === a.id ? a : x))), setEditing(null), setToast({ text: `"${a.title}" updated. New deadline ${when(a.due)}.` }))} />}

      {closing && (
        <Dialog label="Close assessment" onClose={() => setClosing(null)}>
          <span className="grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger">
            <Icon d={icons.close} className="size-6" />
          </span>
          <h2 className="mt-4 text-[1.2rem] font-extrabold tracking-tight">Close &ldquo;{closing.title}&rdquo;?</h2>
          <p className="mt-1.5 text-[.9rem] text-ink/65">
            Students can no longer submit. {counts(subs[closing.id]).missing} students without a submission will be marked <strong className="text-danger">Missing</strong>.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                const c = closing;
                setList((l) => l.map((x) => (x.id === c.id ? { ...x, status: "closed", due: new Date(Math.min(now, new Date(x.due).getTime())).toISOString() } : x)));
                setClosing(null);
                setToast({ text: `"${c.title}" closed.` });
              }}
              className={buttonClass("dark", "md", "flex-1 cursor-pointer")}
            >
              Close Assessment
            </button>
            <button type="button" onClick={() => setClosing(null)} className={`${ghostBtn} flex-1`}>
              Keep Open
            </button>
          </div>
        </Dialog>
      )}

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}

/** Rename, change the time limit or push the deadline back. */
function EditDialog({ a, onSave, onClose }: { a: Assessment; onSave: (a: Assessment) => void; onClose: () => void }) {
  const [title, setTitle] = useState(a.title);
  const [due, setDue] = useState(() => local(new Date(a.due)));
  const extend = (hours: number) => setDue(local(new Date(new Date(due).getTime() + hours * 3_600_000)));
  const bad = !title.trim() || new Date(due) <= new Date(a.start);
  return (
    <Dialog label="Edit assessment" onClose={onClose}>
      <h2 className="text-[1.2rem] font-extrabold tracking-tight">Edit Details / Extend Deadline</h2>
      <p className="mt-1 text-[.84rem] text-ink/55">
        Class {a.section} · {a.subject}
      </p>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
          Due date & time
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={fieldClass} />
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            ["+1 hour", 1],
            ["+1 day", 24],
            ["+3 days", 72],
            ["+1 week", 168],
          ].map(([l, h]) => (
            <button key={l} type="button" onClick={() => extend(h as number)} className="cursor-pointer rounded-full border border-ink/12 px-3 py-1.5 text-[.78rem] font-bold text-ink/70 transition-colors hover:border-accent hover:text-primary">
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" disabled={bad} onClick={() => onSave({ ...a, title: title.trim(), due: new Date(due).toISOString() })} className={buttonClass("primary", "md", "flex-1 cursor-pointer disabled:pointer-events-none disabled:opacity-50")}>
          Save Changes
        </button>
        <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>
          Cancel
        </button>
      </div>
    </Dialog>
  );
}
