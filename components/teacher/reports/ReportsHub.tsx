"use client";

import { useCallback, useMemo, useState } from "react";
import { Dialog, Select, Toast, fieldClass, ghostBtn, ghostSm, type ToastData } from "@/components/dashboard/controls";
import { Badge, StatCard, toneText, type Tone } from "@/components/dashboard/ui";
import { rateTone } from "@/components/students/parts";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mySections, rosterOf } from "@/lib/classAttendance";
import { compile, remarkPresets, seedReports, statusOf, suggestFeedback, terms, totals, trendOf, type Report, type ReportStatus, type TermId, type Trend } from "@/lib/reports";
import { sectionLabel, type Student } from "@/lib/students";
import ReportCard from "./ReportCard";

const aiIcon = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";
const sendIcon = "M4 12l16-8-6 16-2-6z";

const statusMeta: Record<ReportStatus, { label: string; tone: Tone }> = {
  ready: { label: "Ready to Send", tone: "ok" },
  draft: { label: "Draft / Missing Marks", tone: "warn" },
  sent: { label: "Already Dispatched", tone: "neutral" },
};
const trendMeta: Record<Trend, { label: string; tone: Tone; icon: string }> = {
  improving: { label: "Improving", tone: "ok", icon: "M4 17l6-6 4 4 6-6 M14 9h6v6" },
  consistent: { label: "Consistent", tone: "neutral", icon: "M4 12h16 M16 8l4 4-4 4" },
  attention: { label: "Needs Attention", tone: "warn", icon: "M4 7l6 6 4-4 6 6 M14 15h6V9" },
};

function TrendChip({ t }: { t: Trend }) {
  const m = trendMeta[t];
  const cls = { ok: "bg-ok/10 text-ok", neutral: "bg-ink/6 text-ink/65", warn: "bg-warn/12 text-[#9a6a0f]", danger: "", serious: "" }[m.tone];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[.74rem] font-bold ${cls}`}>
      <Icon d={m.icon} className="size-3.5" />
      {m.label}
    </span>
  );
}

/** Remarks input; preset pills appear while it has focus. */
function RemarkEditor({ value, locked, onChange, onAi }: { value: string; locked: boolean; onChange: (v: string) => void; onAi: () => void }) {
  const [open, setOpen] = useState(false);
  if (locked) return <p className="line-clamp-2 text-[.8rem] text-ink/60">{value || "No remarks"}</p>;
  return (
    <div
      className="grid gap-1.5"
      onFocus={() => setOpen(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <div className="flex items-start gap-1.5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="Add remarks"
          aria-label="Teacher remarks"
          className={`${fieldClass} min-w-0 flex-1 resize-y !py-2 text-[.8rem] ${value.trim() ? "" : "border-warn/60"}`}
        />
        <button type="button" onClick={onAi} title="AI Suggest Feedback" aria-label="AI suggest feedback" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-ink text-surface transition-colors hover:bg-primary">
          <Icon d={aiIcon} className="size-4" />
        </button>
      </div>
      {open && (
        <div className="flex animate-fade-in flex-wrap gap-1">
          {remarkPresets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(value.trim() ? `${value.trim().replace(/\.$/, "")}. ${p}.` : `${p}.`)}
              className="cursor-pointer rounded-full border border-ink/12 bg-white px-2 py-0.5 text-[.7rem] font-semibold text-ink/60 hover:border-accent hover:text-primary"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Row = { s: Student; r: Report; status: ReportStatus; pct: number; grade: string; trend: Trend; rank: number };

export default function ReportsHub() {
  const [section, setSection] = useState(mySections[0].section);
  const [term, setTerm] = useState<TermId>("first-2026");
  const [store, setStore] = useState<Record<string, Report[]>>({});
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dispatch, setDispatch] = useState<string[] | null>(null);
  const [channels, setChannels] = useState({ dashboard: true, alert: true });
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const roster = useMemo(() => rosterOf(section), [section]);
  const key = `${section}|${term}`;
  const reports = useMemo(() => store[key] ?? seedReports(roster, section, term), [store, key, roster, section, term]);
  const termInfo = terms.find((t) => t.id === term)!;

  const rows: Row[] = useMemo(() => {
    const base = roster.map((s, i) => {
      const r = reports[i];
      const t = totals(r);
      return { s, r, status: statusOf(r), pct: t.pct, grade: t.grade, trend: trendOf(r), rank: 0 };
    });
    const ranked = [...base].sort((a, b) => b.pct - a.pct);
    return base.map((x) => ({ ...x, rank: ranked.indexOf(x) + 1 }));
  }, [roster, reports]);

  const write = (fn: (r: Report, s: Student) => Report, ids?: Set<string>) =>
    setStore((st) => ({ ...st, [key]: reports.map((r, i) => (!ids || ids.has(r.studentId) ? fn(r, roster[i]) : r)) }));

  const stats = {
    total: rows.length,
    ready: rows.filter((x) => x.status === "ready").length,
    pending: rows.filter((x) => x.status === "draft").length,
    missingMarks: rows.filter((x) => totals(x.r).missing > 0 && !x.r.sentAt).length,
    missingRemarks: rows.filter((x) => !x.r.remark.trim() && !x.r.sentAt).length,
    sent: rows.filter((x) => x.status === "sent").length,
  };

  const q = query.trim().toLowerCase();
  const visible = rows.filter((x) => !q || `${x.s.name} ${x.s.regId} ${x.s.rollNo}`.toLowerCase().includes(q));
  const unsentIds = rows.filter((x) => !x.r.sentAt).map((x) => x.s.id);
  const selectable = visible.filter((x) => !x.r.sentAt);
  const allOn = selectable.length > 0 && selectable.every((x) => selected.has(x.s.id));

  const changeScope = (fn: () => void) => {
    fn();
    setSelected(new Set());
  };

  const autoCompile = () => {
    const n = rows.filter((x) => !x.r.sentAt && totals(x.r).missing > 0).length;
    write((r, s) => (r.sentAt ? r : compile(r, s, term)));
    setToast({ text: n ? `Marks compiled for ${n} students from recorded assessments and attendance.` : "All marks were already compiled. Nothing to update." });
  };

  const send = (ids: string[]) => {
    const set = new Set(ids);
    const stamp = new Date().toISOString();
    const prev = reports;
    write((r) => (r.sentAt ? r : { ...r, sentAt: stamp }), set);
    setSelected(new Set());
    setDispatch(null);
    setToast({
      text: `${ids.length} report card${ids.length === 1 ? "" : "s"} dispatched${channels.alert ? " with a notification alert" : ""}.`,
      action: { label: "Undo", run: () => (setStore((st) => ({ ...st, [key]: prev })), setToast(null)) },
    });
  };

  const sendOne = (x: Row) => (x.status === "ready" ? send([x.s.id]) : setDispatch([x.s.id]));

  const pv = preview ? rows.find((x) => x.s.id === preview) : undefined;
  const dispatchRows = dispatch ? rows.filter((x) => dispatch.includes(x.s.id)) : [];
  const dReady = dispatchRows.filter((x) => x.status === "ready").length;

  const actions = (x: Row) => (
    <div className="flex flex-nowrap items-center gap-1">
      <button type="button" onClick={() => setPreview(x.s.id)} title="Preview Digital Report Card" aria-label={`Preview report card: ${x.s.name}`} className={ghostSm}>
        <Icon d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" className="size-4" />
        <span>Preview</span>
      </button>
      <button
        type="button"
        onClick={() => sendOne(x)}
        disabled={!!x.r.sentAt}
        title="Send Single Report"
        aria-label={`Send report: ${x.s.name}`}
        className={`${ghostSm} disabled:pointer-events-none disabled:opacity-35`}
      >
        <Icon d={sendIcon} className="size-4" />
        <span>Send</span>
      </button>
    </div>
  );

  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <section className="flex flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 xl:w-[480px]">
          <label className="grid gap-1.5 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">
            Class & section
            <Select label="Class and section" value={section} onChange={(v) => changeScope(() => setSection(v))} className="normal-case tracking-normal text-ink">
              {mySections.map((s) => (
                <option key={s.section} value={s.section}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">
            Academic term
            <Select label="Academic term" value={term} onChange={(v) => changeScope(() => setTerm(v as TermId))} className="normal-case tracking-normal text-ink">
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={autoCompile} disabled={!unsentIds.length} className={`${ghostBtn} max-sm:flex-1 disabled:pointer-events-none disabled:opacity-45`}>
            <Icon d="M4 4v6h6 M20 20v-6h-6 M5.5 15a7 7 0 0 0 12 2.5 M18.5 9a7 7 0 0 0-12-2.5" className="size-[18px]" />
            Auto-Compile Marks
          </button>
          <button type="button" onClick={() => setDispatch(unsentIds)} disabled={!unsentIds.length} className={buttonClass("dark", "md", "cursor-pointer max-sm:flex-1 disabled:pointer-events-none disabled:opacity-45")}>
            <Icon d={sendIcon} className="size-[18px]" />
            Batch Send Reports to All Students
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard label="Total Class Strength" value={`${stats.total} Students`} icon="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1 M9 4a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M22 19v-1a4 4 0 0 0-3-3.9 M16 4.1a3 3 0 0 1 0 5.8" note={sectionLabel(section)} />
        <StatCard label="Reports Ready" value={`${stats.ready} Ready`} icon="M5 12l4 4 10-10" note="Marks complete and remarks added" />
        <StatCard
          label="Pending Evaluation"
          value={`${stats.pending} Incomplete`}
          icon="M12 7v6 M12 17h.01 M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z"
          note={stats.pending ? `${stats.missingMarks} missing marks · ${stats.missingRemarks} missing remarks` : "Nothing pending"}
        />
        <StatCard
          label="Dispatched Status"
          value={`${stats.sent} Dispatched`}
          icon={sendIcon}
          note={stats.sent === 0 ? "Draft Phase" : stats.sent === stats.total ? "All delivered" : `${stats.total - stats.sent} still unsent`}
        />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[1.05rem] font-extrabold tracking-tight">Report Builder</h2>
            <p className="text-[.84rem] text-ink/55">
              {sectionLabel(section)} · {termInfo.label}
            </p>
          </div>
          <label className="relative lg:w-[320px]">
            <span className="sr-only">Search students</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, roll no. or ID" className={`${fieldClass} w-full pl-10`} />
          </label>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-surface" aria-live="polite">
            <span className="text-[.88rem] font-semibold">{selected.size} selected</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelected(new Set())} className="cursor-pointer rounded-lg px-3 py-1.5 text-[.82rem] font-bold text-surface/75 hover:bg-surface/10">
                Clear
              </button>
              <button type="button" onClick={() => write((r, s) => ({ ...r, remark: r.remark.trim() ? r.remark : suggestFeedback(s, r) }), selected)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface/25 px-3 py-1.5 text-[.82rem] font-bold hover:bg-surface/10">
                <Icon d={aiIcon} className="size-4" />
                AI fill empty remarks
              </button>
              <button type="button" onClick={() => setDispatch([...selected])} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-[.82rem] font-bold text-ink hover:bg-white">
                <Icon d={sendIcon} className="size-4" />
                Send Selected Reports
              </button>
            </div>
          </div>
        )}

        {/* Desktop table */}
        <div className="overflow-x-auto rounded-[18px] border border-ink/8 max-xl:hidden">
          <table className="w-full min-w-[980px] text-left text-[.84rem]">
            <thead className="bg-surface/70 text-[.7rem] font-bold uppercase tracking-[.1em] text-ink/50">
              <tr>
                <th scope="col" className="w-10 py-3 pl-4">
                  <input
                    type="checkbox"
                    checked={allOn}
                    onChange={() => setSelected(allOn ? new Set() : new Set(selectable.map((x) => x.s.id)))}
                    aria-label="Select all unsent reports"
                    className="size-4 accent-[#1D546D]"
                  />
                </th>
                <th scope="col" className="px-3 py-3">Student</th>
                <th scope="col" className="px-3 py-3">Attendance</th>
                <th scope="col" className="px-3 py-3">Academic score & trend</th>
                <th scope="col" className="w-[32%] px-3 py-3">Teacher remarks</th>
                <th scope="col" className="px-3 py-3">Status & actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {visible.map((x) => (
                <tr key={x.s.id} className={`align-top transition-colors ${selected.has(x.s.id) ? "bg-primary/5" : "hover:bg-surface/40"}`}>
                  <td className="py-4 pl-4">
                    <input type="checkbox" checked={selected.has(x.s.id)} disabled={!!x.r.sentAt} onChange={() => toggle(x.s.id)} aria-label={`Select ${x.s.name}`} className="size-4 accent-[#1D546D] disabled:opacity-30" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-[200px] items-center gap-2.5">
                      <Avatar name={x.s.name} />
                      <span className="grid min-w-0">
                        <button type="button" onClick={() => setPreview(x.s.id)} className="cursor-pointer text-left font-bold hover:text-primary">
                          {x.s.name}
                        </button>
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-[.74rem] text-ink/50">
                          <span className="rounded-full bg-ink px-1.5 py-px text-[.68rem] font-extrabold text-surface">#{String(x.s.rollNo).padStart(2, "0")}</span>
                          {x.s.regId}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`whitespace-nowrap rounded-full border border-ink/10 px-2.5 py-1 text-[.76rem] font-bold ${toneText[rateTone(x.s.termRate)]}`}>{x.s.termRate}% Attendance</span>
                  </td>
                  <td className="px-3 py-4">
                    {totals(x.r).missing === x.r.marks.length ? (
                      <Badge tone="warn">Not compiled</Badge>
                    ) : (
                      <span className="grid">
                        <strong className="whitespace-nowrap tabular-nums">
                          {x.pct}% - Grade {x.grade}
                        </strong>
                        <span className="text-[.74rem] text-ink/50">{totals(x.r).missing ? `${totals(x.r).missing} mark missing` : `Rank ${x.rank} of ${rows.length}`}</span>
                        <span className="mt-1.5">
                          <TrendChip t={x.trend} />
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <RemarkEditor value={x.r.remark} locked={!!x.r.sentAt} onChange={(v) => write((r) => ({ ...r, remark: v }), new Set([x.s.id]))} onAi={() => write((r, s) => ({ ...r, remark: suggestFeedback(s, r) }), new Set([x.s.id]))} />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="grid justify-items-start gap-1.5">
                      <Badge tone={statusMeta[x.status].tone}>{statusMeta[x.status].label}</Badge>
                      {actions(x)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile and tablet: collapsible summary cards */}
        <ul className="grid items-start gap-2.5 md:grid-cols-2 xl:hidden">
          {visible.map((x) => (
            <li key={x.s.id} className={`rounded-2xl border ${selected.has(x.s.id) ? "border-primary bg-primary/5" : "border-ink/8"}`}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 [&::-webkit-details-marker]:hidden">
                  <input
                    type="checkbox"
                    checked={selected.has(x.s.id)}
                    disabled={!!x.r.sentAt}
                    onChange={() => toggle(x.s.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${x.s.name}`}
                    className="size-5 shrink-0 accent-[#1D546D] disabled:opacity-30"
                  />
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[.72rem] font-extrabold text-surface">{String(x.s.rollNo).padStart(2, "0")}</span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-[.92rem] font-bold">{x.s.name}</span>
                    <span className="text-[.76rem] text-ink/55">{totals(x.r).missing === x.r.marks.length ? "Not compiled" : `${x.pct}% - Grade ${x.grade}`}</span>
                  </span>
                  <Badge tone={statusMeta[x.status].tone}>{statusMeta[x.status].label.split(" / ")[0]}</Badge>
                  <Icon d="m6 9 6 6 6-6" className="size-4 shrink-0 text-ink/45 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-3 border-t border-ink/8 p-3.5">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border border-ink/10 px-2.5 py-1 text-[.76rem] font-bold ${toneText[rateTone(x.s.termRate)]}`}>{x.s.termRate}% Attendance</span>
                    <TrendChip t={x.trend} />
                    <span className="rounded-full bg-ink/6 px-2.5 py-1 text-[.74rem] font-semibold text-ink/60">{x.s.regId}</span>
                  </div>
                  <RemarkEditor value={x.r.remark} locked={!!x.r.sentAt} onChange={(v) => write((r) => ({ ...r, remark: v }), new Set([x.s.id]))} onAi={() => write((r, s) => ({ ...r, remark: suggestFeedback(s, r) }), new Set([x.s.id]))} />
                  {actions(x)}
                </div>
              </details>
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">No students match this search.</p>}
      </section>

      {pv && (
        <ReportCard
          key={pv.s.id}
          s={pv.s}
          report={pv.r}
          termLabel={termInfo.label}
          rank={pv.rank}
          size={rows.length}
          onClose={() => setPreview(null)}
          onSave={(r) => {
            write(() => r, new Set([pv.s.id]));
            setToast({ text: `Report card saved for ${pv.s.name}.` });
          }}
          onSend={(r) => {
            write(() => r, new Set([pv.s.id]));
            if (statusOf(r) === "ready") send([pv.s.id]);
            else setDispatch([pv.s.id]);
          }}
        />
      )}

      {dispatch && (
        <Dialog label="Confirm dispatch" onClose={() => setDispatch(null)}>
          <span className="grid size-12 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
            <Icon d={sendIcon} className="size-6" />
          </span>
          <h2 className="mt-4 text-[1.2rem] font-extrabold tracking-tight">Dispatch report cards</h2>
          <p className="mt-1.5 text-[.9rem] text-ink/65">
            You are about to dispatch <strong className="text-ink">{dispatchRows.length} report card{dispatchRows.length === 1 ? "" : "s"}</strong> for {sectionLabel(section)} ({termInfo.short}).
          </p>
          {dReady < dispatchRows.length ? (
            <p className="mt-3 flex gap-2 rounded-xl border border-warn/40 bg-warn/8 px-3.5 py-3 text-[.84rem] text-[#7a530b]">
              <Icon d="M12 7v6 M12 17h.01 M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z" className="mt-0.5 size-[18px] shrink-0" />
              <span>
                {dReady} report{dReady === 1 ? " is" : "s are"} fully finalized. <strong>{dispatchRows.length - dReady}</strong> report{dispatchRows.length - dReady === 1 ? " has" : "s have"} missing marks or incomplete teacher remarks. Proceed anyway?
              </span>
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-ok/8 px-3.5 py-3 text-[.84rem] font-semibold text-ok">
              <Icon d="M5 12l4 4 10-10" className="size-[18px]" />
              All selected reports are fully finalized.
            </p>
          )}
          <fieldset className="mt-4 grid gap-2">
            <legend className="mb-1 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Delivery channels</legend>
            {(
              [
                ["dashboard", "Publish to Student Dashboard"],
                ["alert", "Direct Notification Alert"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2.5 text-[.88rem] font-semibold">
                <input type="checkbox" checked={channels[k]} onChange={(e) => setChannels((c) => ({ ...c, [k]: e.target.checked }))} className="size-4 accent-[#1D546D]" />
                {l}
              </label>
            ))}
          </fieldset>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => setDispatch(null)} className={`${ghostBtn} flex-1`}>
              Cancel & Keep Editing
            </button>
            <button
              type="button"
              onClick={() => send(dispatch)}
              disabled={!channels.dashboard && !channels.alert}
              className={buttonClass("primary", "md", "flex-1 cursor-pointer disabled:pointer-events-none disabled:opacity-50")}
            >
              Confirm & Send {dispatchRows.length > 1 ? "All Reports" : "Report"}
            </button>
          </div>
        </Dialog>
      )}

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
