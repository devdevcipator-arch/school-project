import { printDocument } from "@/components/dashboard/print";
import { principal } from "@/lib/principal";
import { letterGrade, totals, type Report } from "@/lib/reports";
import { classTeacherOf, sectionLabel, type Student } from "@/lib/students";
import { teacher } from "@/lib/teacher";

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
