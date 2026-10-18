import { printDocument } from "@/components/dashboard/print";
import { formatMeta, questionTypeMeta, type Assessment } from "@/lib/assessments";
import { principal } from "@/lib/principal";
import { sectionLabel } from "@/lib/students";
import { teacher } from "@/lib/teacher";

const letters = "ABCDEFGH";

/** Question paper, optionally followed by the answer key; or a task sheet for manual assignments. */
export function printAssessment(a: Assessment, withKey = false) {
  return printDocument(`${a.title} - ${a.section}`, (e) => {
    const head = `<div class="bar"></div><div class="page">
<p class="muted" style="letter-spacing:.2em;text-transform:uppercase">${e(principal.school)}</p>
<h1>${e(a.title)}</h1>
<div class="grid">
  <div><b>Class:</b> ${e(sectionLabel(a.section))}</div><div><b>Subject:</b> ${e(a.subject)}</div>
  <div><b>Type:</b> ${e(formatMeta[a.format].label)}</div><div><b>Total marks:</b> ${a.totalMarks}</div>
  ${a.durationMins ? `<div><b>Time allowed:</b> ${a.durationMins} minutes</div>` : ""}<div><b>Teacher:</b> ${e(teacher.name)}</div>
  <div><b>Name:</b> ______________________</div><div><b>Roll no.:</b> ________</div>
</div>`;

    if (!a.questions?.length) {
      const files = a.attachments?.length ? `<h2>Attachments</h2><p>${a.attachments.map((f) => e(f.name)).join("<br/>")}</p>` : "";
      return `${head}<h2>Instructions</h2><p style="white-space:pre-wrap;font-size:14px;line-height:1.7">${e(a.instructionsText ?? "")}</p>${files}
<p class="muted">Submission: ${a.mode === "online" ? "upload online to the student portal" : "hand in a physical copy in class"}.</p></div>`;
    }

    const qs = a.questions
      .map((q, i) => {
        const opts = q.options ? `<div style="margin:6px 0 0 18px">${q.options.map((o, k) => `<div>(${letters[k]}) ${e(o)}</div>`).join("")}</div>` : q.type === "short" ? `<div style="border-bottom:1px solid #ccc;height:64px"></div>` : "";
        return `<div style="margin:14px 0;font-size:14px"><b>Q${i + 1}.</b> ${e(q.text)} <span class="muted">[${q.marks}]</span>${opts}</div>`;
      })
      .join("");
    const key = withKey
      ? `<div style="page-break-before:always"></div><div class="bar"></div><h1>Answer key</h1><p class="muted">${e(a.title)} · ${e(a.section)}</p>
<table><thead><tr><th>#</th><th>Type</th><th>Answer</th><th>Explanation</th></tr></thead><tbody>${a.questions
          .map((q, i) => `<tr><td>${i + 1}</td><td>${e(questionTypeMeta[q.type].short)}</td><td><b>${e(q.answer)}</b></td><td>${e(q.explanation)}</td></tr>`)
          .join("")}</tbody></table>`
      : "";
    return `${head}<h2>Answer all questions</h2>${qs}${key}</div>`;
  });
}
