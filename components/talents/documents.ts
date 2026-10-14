import { principal } from "@/lib/principal";
import { sectionLabel } from "@/lib/students";
import { AS_OF_LABEL, levelOf, type Talent } from "@/lib/talents";
import { printDocument } from "@/components/dashboard/print";

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
