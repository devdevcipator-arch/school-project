import type { ReactNode } from "react";
import { Badge } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import { principal } from "@/lib/principal";
import { SUBJECT_MAX, letterGrade, totals, type Report } from "@/lib/reports";
import { classTeacherOf, sectionLabel, type Student } from "@/lib/students";
import { teacher } from "@/lib/teacher";

/**
 * The on-screen Progress Report Card, shared by the teacher preview and the student Reports page
 * so both always show the same marks, totals and layout.
 * `remarks` and `controls` let the teacher add editing tools; the student passes read-only content.
 */
export default function ReportSheet({
  s,
  report,
  termLabel,
  rankText,
  remarks,
  controls,
  note,
}: {
  s: Student;
  report: Report;
  termLabel: string;
  rankText: string;
  remarks: ReactNode;
  controls?: ReactNode;
  note: string;
}) {
  const t = totals(report);
  const days = s.term.present + s.term.absent + s.term.leave;

  return (
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
              {report.marks.map((m) => (
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
            ["Class rank", rankText],
            ["Attendance", `${s.term.present}/${days} days`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-ink/8 bg-surface/50 p-3">
              <p className="text-[.68rem] font-bold uppercase tracking-[.08em] text-ink/45">{k}</p>
              <p className="mt-1 text-[1.1rem] font-extrabold tracking-tight">{v}</p>
            </div>
          ))}
        </div>
        {controls}

        <div className="mt-5 grid gap-2">{remarks}</div>

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
        <p className="mt-4 text-center text-[.74rem] text-ink/45">{note}</p>
      </div>
    </article>
  );
}
