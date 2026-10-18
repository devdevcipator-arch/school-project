"use client";

import { useState } from "react";
import { Drawer, fieldClass, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { printDocument } from "@/components/dashboard/print";
import { Badge } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { principal } from "@/lib/principal";
import { SUBJECT_MAX, letterGrade, statusOf, suggestFeedback, totals, type Report } from "@/lib/reports";
import { TERM_LABEL, classTeacherOf, sectionLabel, type Student } from "@/lib/students";
import { teacher } from "@/lib/teacher";

const aiIcon = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";

/** Opens the print-ready card; "Save as PDF" in the dialog downloads it. */
export function printReport(s: Student, r: Report, termLabel: string, rank: number | null, size: number) {
  const t = totals(r);
  return printDocument(`Report Card - ${s.name} - ${termLabel}`, (e) => {
    const rows = r.marks
      .map((m) => `<tr><td>${e(m.subject)}</td><td class="right">${m.max}</td><td class="right">${m.obtained ?? "-"}</td><td>${m.obtained === null ? "-" : letterGrade((m.obtained / m.max) * 100)}</td><td>${e(m.remark || "Pending")}</td></tr>`)
      .join("");
    return `<div class="bar"></div><div class="page">
<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
  <div><p class="muted" style="letter-spacing:.2em;text-transform:uppercase;margin:0">${e(principal.school)} · ${e(teacher.session)}</p>
  <h1 style="margin-top:6px">Progress Report Card</h1><p class="muted">${e(termLabel)}</p></div>
  <span class="stamp">PRINCIPAL ENDORSED</span>
</div>
<div class="grid">
  <div><b>Student:</b> ${e(s.name)}</div><div><b>Roll no.:</b> ${s.rollNo}</div>
  <div><b>Class:</b> ${e(sectionLabel(s.section))}</div><div><b>System ID:</b> ${e(s.regId)}</div>
  <div><b>Guardian:</b> ${e(s.guardian)} (${e(s.guardianRelation)})</div><div><b>Class teacher:</b> ${e(classTeacherOf(s.section))}</div>
</div>
<h2>Subject-wise marks</h2>
<table><thead><tr><th>Subject</th><th class="right">Max</th><th class="right">Obtained</th><th>Grade</th><th>Subject teacher remarks</th></tr></thead>
<tbody>${rows}<tr class="total"><td>Total</td><td class="right">${t.max}</td><td class="right">${t.got}</td><td>${t.grade}</td><td>${t.pct}% · GPA ${t.gpa.toFixed(1)}</td></tr></tbody></table>
<h2>Summary</h2>
<div class="grid"><div><b>Overall percentage:</b> ${t.pct}%</div><div><b>GPA:</b> ${t.gpa.toFixed(1)} / 4.0</div>
${rank ? `<div><b>Class rank:</b> ${rank} of ${size}</div>` : ""}<div><b>Attendance:</b> ${s.term.present} of ${s.term.present + s.term.absent + s.term.leave} days (${s.termRate}%)</div></div>
<h2>Class teacher remarks</h2><p style="font-size:14px;line-height:1.7">${e(r.remark || "Remarks pending.")}</p>
<div class="sign"><div>${e(teacher.name)}<br/><span class="muted">Class Teacher</span></div><div>${e(principal.name)}<br/><span class="muted">Principal · digitally verified</span></div></div>
</div>`;
  });
}

/** High-fidelity preview of one report card with editable remarks and send actions. */
export default function ReportCard({
  s,
  report,
  termLabel,
  rank,
  size,
  onSave,
  onSend,
  onClose,
}: {
  s: Student;
  report: Report;
  termLabel: string;
  rank: number;
  size: number;
  onSave: (r: Report) => void;
  onSend: (r: Report) => void;
  onClose: () => void;
}) {
  const [remark, setRemark] = useState(report.remark);
  const [showRank, setShowRank] = useState(true);
  const r = { ...report, remark };
  const t = totals(r);
  const status = statusOf(r);
  const days = s.term.present + s.term.absent + s.term.leave;
  const print = () => printReport(s, r, termLabel, showRank ? rank : null, size);

  return (
    <Drawer
      title="Digital Report Card"
      subtitle={`${s.name} · ${termLabel}`}
      width="max-w-[900px]"
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={print} className={ghostBtn}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Download PDF
          </button>
          <button type="button" onClick={print} className={ghostBtn}>
            <Icon d="M6 9V3h12v6 M6 18H4v-7h16v7h-2 M8 14h8v7H8z" className="size-[18px]" />
            Print
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => {
              onSave(r);
              close();
            }}
            className={ghostBtn}
          >
            Save Changes
          </button>
          <button
            type="button"
            disabled={!!report.sentAt}
            onClick={() => {
              onSend(r);
              close();
            }}
            className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50")}
          >
            <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
            {report.sentAt ? "Already Sent" : "Send Directly to Student"}
          </button>
        </>
      )}
    >
      {() => (
        <div className="bg-surface/60 p-4 sm:p-7">
          <article className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_18px_40px_rgba(6,30,41,.1)]">
            <div className="h-1.5 bg-linear-135 from-ink via-primary to-accent" />
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/8 p-5 sm:p-7">
              <div className="flex items-center gap-3.5">
                <svg viewBox="0 0 40 40" className="size-12 shrink-0" aria-hidden>
                  <rect width="40" height="40" rx="10" className="fill-primary" />
                  <path d="M20 9 6 16l14 7 11-5.5V25h3v-9L20 9Z" fill="#F3F4F4" />
                  <path d="M12 21.5V27c0 2.2 3.6 4 8 4s8-1.8 8-4v-5.5l-8 4-8-4Z" fill="#061E29" opacity=".55" />
                </svg>
                <div>
                  <p className="text-[.72rem] font-bold uppercase tracking-[.16em] text-accent">{principal.school}</p>
                  <h2 className="text-[1.3rem] font-extrabold tracking-tight">Progress Report Card</h2>
                  <p className="text-[.8rem] text-ink/55">
                    {termLabel} · {teacher.session}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ok/50 px-3 py-1 text-[.72rem] font-extrabold uppercase tracking-[.1em] text-ok">
                <Icon d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z M9 12l2 2 4-4" className="size-4" />
                Principal Endorsed
              </span>
            </header>

            <dl className="grid gap-x-6 gap-y-2.5 border-b border-ink/8 p-5 text-[.86rem] sm:grid-cols-2 sm:p-7">
              {[
                ["Student", s.name],
                ["Roll no.", `#${String(s.rollNo).padStart(2, "0")}`],
                ["Grade & section", sectionLabel(s.section)],
                ["System ID", s.regId],
                ["Guardian", `${s.guardian} (${s.guardianRelation})`],
                ["Class teacher", classTeacherOf(s.section)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-dashed border-ink/8 pb-2">
                  <dt className="text-ink/55">{k}</dt>
                  <dd className="text-right font-bold">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="p-5 sm:p-7">
              <h3 className="mb-3 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Subject-wise marks ledger</h3>
              <div className="overflow-x-auto rounded-xl border border-ink/8">
                <table className="w-full min-w-[560px] text-left text-[.84rem]">
                  <thead className="bg-surface/70 text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/50">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Subject</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Max</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Obtained</th>
                      <th scope="col" className="px-3 py-2.5">Grade</th>
                      <th scope="col" className="px-3 py-2.5">Subject teacher remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/8">
                    {r.marks.map((m) => (
                      <tr key={m.subject}>
                        <th scope="row" className="px-3 py-2.5 font-semibold">{m.subject}</th>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink/60">{m.max}</td>
                        <td className="px-3 py-2.5 text-right font-bold tabular-nums">{m.obtained ?? <Badge tone="warn">Missing</Badge>}</td>
                        <td className="px-3 py-2.5 font-bold">{m.obtained === null ? "-" : letterGrade((m.obtained / SUBJECT_MAX) * 100)}</td>
                        <td className="px-3 py-2.5 text-ink/65">{m.remark || "Pending"}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface/50 font-extrabold">
                      <th scope="row" className="px-3 py-2.5">Total</th>
                      <td className="px-3 py-2.5 text-right tabular-nums">{t.max}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{t.got}</td>
                      <td className="px-3 py-2.5">{t.grade}</td>
                      <td className="px-3 py-2.5 text-ink/60">{t.missing ? `${t.missing} subject mark${t.missing > 1 ? "s" : ""} missing` : "All subjects recorded"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  ["Overall", `${t.pct}%`],
                  ["GPA", `${t.gpa.toFixed(1)} / 4.0`],
                  ["Class rank", showRank ? `${rank} of ${size}` : "Hidden"],
                  ["Attendance", `${s.term.present}/${days} days`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-ink/8 bg-surface/50 p-3">
                    <p className="text-[.68rem] font-bold uppercase tracking-[.08em] text-ink/45">{k}</p>
                    <p className="mt-1 text-[1.1rem] font-extrabold tracking-tight">{v}</p>
                  </div>
                ))}
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[.8rem] font-semibold text-ink/65">
                <input type="checkbox" checked={showRank} onChange={(e) => setShowRank(e.target.checked)} className="size-4 accent-[#1D546D]" />
                Show class rank on the card
              </label>

              <div className="mt-5 grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Class teacher remarks</h3>
                  <button type="button" onClick={() => setRemark(suggestFeedback(s, r))} disabled={!!report.sentAt} className={`${ghostSm} disabled:opacity-40`}>
                    <Icon d={aiIcon} className="size-4" />
                    AI Suggest Feedback
                  </button>
                </div>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  readOnly={!!report.sentAt}
                  rows={3}
                  placeholder="Write a short, constructive remark for the student and parents."
                  className={`${fieldClass} resize-y ${!remark.trim() ? "border-warn" : ""}`}
                />
              </div>

              <footer className="mt-7 grid gap-5 border-t border-ink/8 pt-5 sm:grid-cols-2">
                {[
                  [teacher.name, "Class Teacher"],
                  [principal.name, "Principal"],
                ].map(([n, role]) => (
                  <div key={role} className="flex items-end justify-between gap-3">
                    <div>
                      <p className="font-[cursive] text-[1.15rem] text-primary">{n}</p>
                      <p className="border-t border-ink/30 pt-1 text-[.76rem] text-ink/55">{role}</p>
                    </div>
                    <span className="grid size-14 shrink-0 -rotate-12 place-items-center rounded-full border-2 border-dashed border-ok/60 text-center text-[.5rem] font-extrabold uppercase leading-tight tracking-wider text-ok">
                      Digitally
                      <br />
                      verified
                    </span>
                  </div>
                ))}
              </footer>
              <p className="mt-4 text-center text-[.74rem] text-ink/45">
                {status === "sent" ? "Dispatched to the student dashboard and parent portal." : status === "ready" ? "Ready to send." : "Draft: complete missing marks and remarks before sending."} Attendance counted for the {TERM_LABEL.toLowerCase()}.
              </p>
            </div>
          </article>
        </div>
      )}
    </Drawer>
  );
}
