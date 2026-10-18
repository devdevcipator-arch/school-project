"use client";

import { useState } from "react";
import { Chip, Drawer, fieldClass, ghostBtn } from "@/components/dashboard/controls";
import { Badge, Bar, type Tone } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Assessment, Submission } from "@/lib/assessments";
import type { Student } from "@/lib/students";
import { FormatBadge, counts, when } from "./parts";

type Filter = "all" | "on-time" | "late" | "none" | "review";

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

function stateBadge(s: Submission, overdue: boolean): { label: string; tone: Tone } {
  if (s.state === "on-time") return { label: "Submitted - On Time", tone: "ok" };
  if (s.state === "late") return { label: "Submitted - Late", tone: "warn" };
  return overdue ? { label: "Missing", tone: "danger" } : { label: "Pending", tone: "neutral" };
}

/** Mock document preview: the real file viewer plugs in here once uploads are stored. */
function FilePreview({ file, name }: { file: NonNullable<Submission["file"]>; name: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-ink/10 bg-surface/70">
      <figcaption className="flex items-center gap-2 border-b border-ink/8 bg-white px-3 py-2 text-[.78rem] font-semibold">
        <Icon d={file.kind === "pdf" ? "M7 3h7l5 5v13H7z M14 3v5h5" : "M4 5h16v14H4z M4 15l4-4 4 4 3-3 5 5 M15 9h.01"} className="size-4 text-primary" />
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <span className="text-ink/45">{file.kind === "pdf" ? "PDF · 2 pages" : "Photo"}</span>
      </figcaption>
      <div className="grid place-items-center p-4">
        <svg viewBox="0 0 300 380" className={`w-full max-w-[300px] rounded-md bg-white shadow-[0_8px_20px_rgba(6,30,41,.12)] ${file.kind === "image" ? "-rotate-1" : ""}`} role="img" aria-label={`Preview of ${name}'s submission`}>
          <text x="22" y="34" className="fill-ink text-[13px] font-bold">{name}</text>
          <line x1="22" y1="44" x2="278" y2="44" className="stroke-ink/15" />
          {Array.from({ length: 13 }, (_, i) => (
            <path
              key={i}
              d={`M22 ${70 + i * 23} q 30 ${i % 2 ? -3 : 3} 60 0 t 60 0 t 60 0 ${i % 3 ? "t 50 0" : ""}`}
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              className={file.kind === "image" ? "stroke-primary/55" : "stroke-ink/30"}
            />
          ))}
          <circle cx="250" cy="340" r="18" fill="none" strokeWidth="2" className="stroke-danger/50" />
        </svg>
      </div>
    </figure>
  );
}

/** Submission ledger: roster status, auto marks or manual marking, remarks, release and export. */
export default function GradingDrawer({
  a,
  roster,
  subs: initial,
  now,
  onSave,
  onClose,
}: {
  a: Assessment;
  roster: Student[];
  subs: Submission[];
  now: number;
  onSave: (subs: Submission[], release: boolean) => void;
  onClose: () => void;
}) {
  const [subs, setSubs] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(roster[0]?.id ?? null);
  const overdue = now > new Date(a.due).getTime() || a.status === "closed";
  const c = counts(subs);
  const marked = subs.filter((s) => s.score !== null);
  const avg = marked.length ? pct(marked.reduce((t, s) => t + (s.score ?? 0), 0), marked.length * a.totalMarks) : 0;
  const byId = new Map(subs.map((s) => [s.studentId, s]));

  const rows = roster.filter((st) => {
    const s = byId.get(st.id)!;
    return filter === "all" || (filter === "review" ? s.state !== "none" && s.score === null : s.state === filter);
  });
  const sel = selected ? roster.find((r) => r.id === selected) : undefined;
  const selSub = sel ? byId.get(sel.id) : undefined;

  const update = (id: string, patch: Partial<Submission>) => setSubs((x) => x.map((s) => (s.studentId === id ? { ...s, ...patch } : s)));

  const exportCsv = () => {
    const head = ["Roll No", "Name", "System ID", "Status", "Submitted At", "Score", "Total", "Percent", "Remarks"];
    const lines = roster.map((st) => {
      const s = byId.get(st.id)!;
      return [st.rollNo, st.name, st.regId, stateBadge(s, overdue).label, s.submittedAt ? when(s.submittedAt) : "", s.score ?? "", a.totalMarks, s.score === null ? "" : pct(s.score, a.totalMarks), s.remarks];
    });
    const csv = [head, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: `${a.title.replace(/\W+/g, "-")}-${a.section}-results.csv` }).click();
    URL.revokeObjectURL(url);
  };

  const filters: { key: Filter; label: string; n: number }[] = [
    { key: "all", label: "All students", n: c.total },
    { key: "on-time", label: "On time", n: c.submitted - c.late },
    { key: "late", label: "Late", n: c.late },
    { key: "none", label: overdue ? "Missing" : "Pending", n: c.missing },
    ...(a.autoGraded ? [] : [{ key: "review" as const, label: "Needs marking", n: c.pending }]),
  ];

  return (
    <Drawer
      title={a.title}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          Class {a.section} · {a.subject} · {a.totalMarks} marks · due {when(a.due)}
          {a.released && <span className="rounded-full bg-surface/15 px-2 py-0.5 text-[.72rem] font-bold">Marks released</span>}
        </span>
      }
      width="max-w-[1080px]"
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={exportCsv} className={ghostBtn}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Export Results CSV / Excel
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => {
              onSave(subs, false);
              close();
            }}
            className={ghostBtn}
          >
            Save Marks
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(subs, true);
              close();
            }}
            disabled={!marked.length}
            className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50")}
          >
            <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
            Save & Release Marks to Student Portals
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <FormatBadge format={a.format} />
            {a.autoGraded ? <Badge tone="ok">Auto-graded</Badge> : <Badge tone={c.pending ? "warn" : "ok"}>{c.pending ? `${c.pending} pending review` : "All marked"}</Badge>}
            {a.mode === "physical" && <Badge tone="neutral">Physical submission</Badge>}
          </div>

          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { l: "Submitted", v: `${c.submitted}/${c.total}`, cls: "text-ink" },
              { l: "Late", v: c.late, cls: "text-[#9a6a0f]" },
              { l: overdue ? "Missing" : "Pending", v: c.missing, cls: overdue ? "text-danger" : "text-primary" },
              { l: "Class average", v: marked.length ? `${avg}%` : "-", cls: "text-ink" },
            ].map((t) => (
              <div key={t.l} className="rounded-2xl border border-ink/8 bg-surface/50 p-3">
                <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{t.l}</dt>
                <dd className={`mt-1 text-[1.35rem] font-extrabold tracking-tight ${t.cls}`}>{t.v}</dd>
              </div>
            ))}
          </dl>

          <div role="radiogroup" aria-label="Filter submissions" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Chip key={f.key} type="radio" name="sub-filter" checked={filter === f.key} onChange={() => setFilter(f.key)}>
                {f.label}
                <span className="rounded-full bg-current/12 px-1.5 text-[.72rem] font-bold">{f.n}</span>
              </Chip>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <ul className="grid max-h-[560px] content-start gap-1.5 overflow-y-auto pr-1" aria-label="Submission roster">
              {rows.length === 0 && <li className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-[.86rem] text-ink/55">No students in this filter.</li>}
              {rows.map((st) => {
                const s = byId.get(st.id)!;
                const b = stateBadge(s, overdue);
                const on = st.id === selected;
                return (
                  <li key={st.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(st.id)}
                      aria-pressed={on}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${on ? "border-primary bg-primary/6" : "border-ink/8 hover:border-accent"}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[.74rem] font-extrabold text-surface">{String(st.rollNo).padStart(2, "0")}</span>
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-[.88rem] font-bold">{st.name}</span>
                        <span className="truncate text-[.74rem] text-ink/50">{s.submittedAt ? when(s.submittedAt) : st.regId}</span>
                      </span>
                      <span className="grid justify-items-end gap-1">
                        <Badge tone={b.tone}>{b.label}</Badge>
                        {s.state !== "none" && (
                          <span className={`text-[.76rem] font-bold tabular-nums ${s.score === null ? "text-[#9a6a0f]" : "text-ink/70"}`}>{s.score === null ? "To mark" : `${s.score}/${a.totalMarks}`}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <section className="grid content-start gap-4 rounded-2xl border border-ink/10 p-4 lg:sticky lg:top-0" aria-live="polite">
              {!sel || !selSub ? (
                <p className="text-[.86rem] text-ink/55">Select a student to see their submission.</p>
              ) : (
                <>
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <span className="grid">
                      <strong className="text-[1rem]">{sel.name}</strong>
                      <span className="text-[.76rem] text-ink/55">
                        Roll {sel.rollNo} · {sel.regId}
                      </span>
                    </span>
                    <Badge tone={stateBadge(selSub, overdue).tone}>{stateBadge(selSub, overdue).label}</Badge>
                  </header>

                  {selSub.state === "none" && a.mode === "online" ? (
                    <p className="rounded-xl bg-surface/80 px-3.5 py-3 text-[.86rem] text-ink/60">{overdue ? "No submission received before the deadline." : "Not submitted yet."}</p>
                  ) : a.autoGraded && a.questions ? (
                    selSub.results ? (
                      <>
                        <div className="flex items-end justify-between gap-3">
                          <p className="text-[2rem] font-extrabold leading-none">
                            {selSub.score}
                            <span className="text-[1rem] text-ink/45">/{a.totalMarks}</span>
                          </p>
                          <span className="text-[.82rem] text-ink/60">
                            <strong className="text-ok">{selSub.results.filter(Boolean).length} correct</strong> · <strong className="text-danger">{selSub.results.filter((r) => !r).length} wrong</strong>
                          </span>
                        </div>
                        <Bar value={selSub.score ?? 0} max={a.totalMarks} fill="bg-ok" label={`${sel.name} scored ${selSub.score} of ${a.totalMarks}`} />
                        <ol className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                          {a.questions.map((q, i) => (
                            <li
                              key={q.id}
                              title={`Q${i + 1}: ${q.text}`}
                              className={`grid place-items-center gap-0.5 rounded-lg border py-1.5 text-[.72rem] font-extrabold ${selSub.results![i] ? "border-ok/30 bg-ok/8 text-ok" : "border-danger/30 bg-danger/8 text-danger"}`}
                            >
                              Q{i + 1}
                              <Icon d={selSub.results![i] ? "M5 12l4 4 10-10" : "M7 7l10 10 M17 7 7 17"} className="size-3.5" />
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : (
                      <p className="text-[.86rem] text-ink/60">Not attempted.</p>
                    )
                  ) : (
                    <>
                      {selSub.file ? (
                        <FilePreview file={selSub.file} name={sel.name} />
                      ) : (
                        <p className="flex items-center gap-2 rounded-xl bg-surface/80 px-3.5 py-3 text-[.84rem] text-ink/60">
                          <Icon d="M4 5h16v14H4z M8 9h8 M8 13h5" className="size-[18px] shrink-0 text-primary" />
                          Physical submission. Mark the paper copy collected in class.
                        </p>
                      )}
                      {a.mode === "physical" && (
                        <label className="flex items-center gap-2.5 text-[.86rem] font-semibold">
                          <input
                            type="checkbox"
                            checked={selSub.state !== "none"}
                            onChange={(e) => update(sel.id, e.target.checked ? { state: "on-time", submittedAt: new Date(now).toISOString() } : { state: "none", submittedAt: undefined, score: null })}
                            className="size-4 accent-[#1D546D]"
                          />
                          Paper received
                        </label>
                      )}
                      {selSub.state !== "none" && (
                        <div className="grid gap-3">
                          <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
                            Marks obtained (out of {a.totalMarks})
                            <input
                              type="number"
                              min={0}
                              max={a.totalMarks}
                              value={selSub.score ?? ""}
                              placeholder="Enter marks"
                              onChange={(e) => update(sel.id, { score: e.target.value === "" ? null : Math.max(0, Math.min(a.totalMarks, Number(e.target.value))) })}
                              className={`${fieldClass} w-40`}
                            />
                          </label>
                          <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
                            Teacher remarks
                            <textarea value={selSub.remarks} onChange={(e) => update(sel.id, { remarks: e.target.value })} rows={3} placeholder="Qualitative feedback the student will see" className={`${fieldClass} resize-y font-normal`} />
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </Drawer>
  );
}
