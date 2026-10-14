import { principal } from "@/lib/principal";
import { sectionLabel } from "@/lib/students";
import { AS_OF_LABEL, competitions, levelOf, shortDate, type Talent } from "@/lib/talents";
import { printDocument } from "./parts";

/** Talent endorsement certificate signed by the principal. */
export function printCertificate(t: Talent) {
  const s = t.student;
  return printDocument(`Talent Certificate - ${s.name}`, (e) => `
    <div class="cert">
      <p class="muted" style="letter-spacing:.2em;text-transform:uppercase">${e(principal.school)}</p>
      <h1>Certificate of Talent Endorsement</h1>
      <p>This is proudly presented to</p>
      <div class="name">${e(s.name)}</div>
      <p class="muted">${e(sectionLabel(s.section))} &middot; Roll No. ${s.rollNo} &middot; ${e(s.regId)}</p>
      <p>in recognition of outstanding ability in <strong>${e(t.primary.skill)}${t.primary.role ? ` (${e(t.primary.role)})` : ""}</strong>,<br/>
      endorsed at the level of <strong>${e(levelOf(t.level).label)}</strong>.</p>
      <p><em>${e(t.achievement)}</em></p>
      <div class="sign">
        <div>${e(t.remarks[0].by)}<br/><span class="muted">${e(t.remarks[0].role)}</span></div>
        <div>${e(AS_OF_LABEL)}<br/><span class="muted">Date</span></div>
        <div>${e(principal.name)}<br/><span class="muted">Principal</span></div>
      </div>
    </div>`);
}

/** Shortlisted candidates grouped by competition, ready to print or save as PDF. */
export function printShortlist(pool: { t: Talent; event: string }[]) {
  return printDocument("Competition Shortlist", (e) => {
    const groups = competitions
      .map((c) => ({ c, rows: pool.filter((p) => p.event === c.id) }))
      .filter((g) => g.rows.length)
      .map(
        ({ c, rows }) => `
        <h2>${e(c.title)} <span class="muted">&middot; ${e(shortDate(c.date))} &middot; ${rows.length} candidates</span></h2>
        <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th>Primary talent</th><th>Level</th><th>Key achievement</th></tr></thead><tbody>
        ${rows
          .map(
            ({ t }, i) => `<tr><td>${i + 1}</td><td><strong>${e(t.student.name)}</strong><br/><span class="muted">${e(t.student.regId)}</span></td>
            <td>${e(sectionLabel(t.student.section))}</td><td>${e(t.primary.skill)}${t.primary.role ? ` - ${e(t.primary.role)}` : ""}<br/><span class="muted">${e(t.primary.category)}</span></td>
            <td>${e(levelOf(t.level).label)}</td><td>${e(t.achievement)}</td></tr>`,
          )
          .join("")}
        </tbody></table>`,
      )
      .join("");
    return `<div class="bar"></div><div class="page">
      <h1>Competition Shortlist</h1>
      <p class="muted">${e(principal.school)} &middot; Prepared by ${e(principal.name)}, Principal &middot; ${e(AS_OF_LABEL)} &middot; ${pool.length} candidates</p>
      ${groups}
    </div>`;
  });
}
