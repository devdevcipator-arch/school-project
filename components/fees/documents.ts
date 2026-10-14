import { printDocument } from "@/components/dashboard/print";
import { principal } from "@/lib/principal";
import { AS_OF, sectionLabel } from "@/lib/students";
import {
  ACADEMIC_YEAR,
  behaviorFor,
  challanFor,
  behaviorOf,
  installmentLabel,
  planOf,
  settle,
  shortDate,
  stamp,
  statusMeta,
  type ChallanSettings,
  type FeeAccount,
  type FeeRecord,
  type Installment,
  type Payment,
} from "@/lib/fees";

const head = (title: string, sub: string) => `<div class="bar"></div><div class="page">
  <p class="muted" style="letter-spacing:.2em;text-transform:uppercase;margin:0 0 6px">${principal.school}</p>
  <h1>${title}</h1><p class="muted">${sub}</p>`;

/** Fee challan as the principal customised it (installments, due dates, validity, instructions, note). */
export function printChallan(a: FeeAccount, only?: Installment[], settings: ChallanSettings = challanFor(a)) {
  const s = a.student;
  const items = only ?? a.installments.filter((i) => settings.include.includes(i.challan));
  return printDocument(`Fee Challan - ${s.name}`, (e) => {
    const rows = items.map((i) => ({ i, st: settle(i) }));
    const copy = (who: string) => `<div class="slip">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>${who}</strong><span class="stamp due">PAYABLE</span></div>
      <div class="grid">
        <div><span class="muted">Student</span><br/><strong>${e(s.name)}</strong></div>
        <div><span class="muted">Class / Roll No.</span><br/><strong>${e(sectionLabel(s.section))} &middot; ${s.rollNo}</strong></div>
        <div><span class="muted">Registration ID</span><br/>${e(s.regId)}</div>
        <div><span class="muted">Guardian</span><br/>${e(s.guardian)} &middot; ${e(s.phone)}</div>
        <div><span class="muted">Issued</span><br/>${e(shortDate(settings.issued))}</div>
        <div><span class="muted">Valid until</span><br/><strong>${e(shortDate(settings.validUntil))}</strong></div>
      </div>
      <table><thead><tr><th>Challan No.</th><th>Fee period</th><th>Due date</th><th>Status</th></tr></thead><tbody>
      ${rows
        .map(
          ({ i, st }) =>
            `<tr><td>${e(i.challan)}</td><td>${e(i.label)}</td><td>${e(shortDate(i.due))}${i.originalDue ? `<br/><span class="muted">extended from ${e(shortDate(i.originalDue))}</span>` : ""}</td><td>${e(installmentLabel[st.status])}${st.late > 0 && !st.cleared ? ` (${st.late} days late)` : ""}</td></tr>`,
        )
        .join("")}
      </tbody></table>
      ${settings.note ? `<p style="margin-top:12px"><strong>Note from the principal:</strong> ${e(settings.note)}</p>` : ""}
      <p class="muted" style="margin-top:10px">${e(settings.instructions)}</p>
    </div>`;
    return `${head("Fee Challan", `Academic year ${ACADEMIC_YEAR} &middot; ${planOf(a.plan).label}`)}
      ${rows.length ? copy("Bank copy") + copy("School copy") + copy("Parent copy") : "<p>No installments are on this challan.</p>"}
    </div>`;
  });
}

/** Digital receipt for one recorded payment. */
export function printReceipt(a: FeeAccount, i: Installment, p: Payment) {
  const s = a.student;
  const st = settle(i);
  return printDocument(`Fee Receipt ${p.receipt}`, (e) => `${head("Fee Payment Receipt", `Receipt ${e(p.receipt)} &middot; ${e(stamp(p.at))}`)}
    <div class="slip">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>${e(s.name)}</strong><span class="stamp">RECEIVED</span></div>
      <div class="grid">
        <div><span class="muted">Class / Roll No.</span><br/>${e(sectionLabel(s.section))} &middot; ${s.rollNo}</div>
        <div><span class="muted">Registration ID</span><br/>${e(s.regId)}</div>
        <div><span class="muted">Fee period</span><br/>${e(i.label)} (${e(i.challan)})</div>
        <div><span class="muted">Payment method</span><br/>${e(p.method)}${p.ref ? ` &middot; ${e(p.ref)}` : ""}</div>
        <div><span class="muted">Payment type</span><br/>${p.kind === "final" ? "Full / final payment" : "Part payment"}</div>
        <div><span class="muted">Installment status</span><br/>${e(installmentLabel[st.status])}${st.status === "late" ? ` (${st.delay} days after due date)` : ""}</div>
      </div>
      ${p.note ? `<p class="muted">Note: ${e(p.note)}</p>` : ""}
    </div>
    <p class="muted">This is a computer-generated receipt and does not require a signature.</p></div>`);
}

/** Printable fee status and behavior report for the filtered directory. */
export function printFeeReport(records: FeeRecord[], period: string, scope: string) {
  const count = (k: FeeRecord["status"]) => records.filter((r) => r.status === k).length;
  return printDocument(`Fee Report - ${period}`, (e) => `${head("Student Fee Status Report", `${e(period)} &middot; ${e(scope)} &middot; Prepared for ${e(principal.name)} on ${shortDate(AS_OF)}`)}
    <div class="grid" style="grid-template-columns:repeat(5,1fr)">
      <div><span class="muted">Students</span><br/><strong>${records.length}</strong></div>
      <div><span class="muted">Paid</span><br/><strong>${count("paid")}</strong></div>
      <div><span class="muted">Partial</span><br/><strong>${count("partial")}</strong></div>
      <div><span class="muted">Delayed</span><br/><strong>${count("delayed")}</strong></div>
      <div><span class="muted">Defaulters</span><br/><strong>${count("defaulter")}</strong></div>
    </div>
    <table><thead><tr><th>Student</th><th>Class</th><th>Guardian</th><th>Plan</th><th>Status</th><th>Behavior</th><th>On time</th><th>Avg delay</th></tr></thead><tbody>
    ${records
      .map((r) => {
        const s = r.account.student;
        const b = behaviorFor(r.account);
        return `<tr><td><strong>${e(s.name)}</strong><br/><span class="muted">Roll ${s.rollNo}</span></td><td>${e(s.section)}</td>
        <td>${e(s.guardian)}<br/><span class="muted">${e(s.phone)}</span></td><td>${e(planOf(r.account.plan).short)}</td>
        <td>${e(statusMeta[r.status].label)}${r.status === "defaulter" ? ` (${r.months} months)` : r.overdueDays ? ` (${r.overdueDays} days)` : ""}</td>
        <td>${e(behaviorOf(b.key).label)}</td><td>${b.onTime}/${b.due} (${b.rate}%)</td><td>${b.avgDelay ? `${b.avgDelay} days` : "-"}</td></tr>`;
      })
      .join("")}
    </tbody></table></div>`);
}

/** Spreadsheet export (CSV opens directly in Excel). */
export function downloadFeeCsv(records: FeeRecord[], period: string) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ["Student", "Roll No", "Registration ID", "Class", "Guardian", "Phone", "Plan", "Period", "Status", "Due Date", "Days Overdue", "Unpaid Months", "Behavior", "Installments Due", "Paid On Time", "Paid Late", "Paid In Parts", "On-time Rate %", "Average Delay (days)", "Longest Delay (days)"];
  const rows = records.map((r) => {
    const s = r.account.student;
    const b = behaviorFor(r.account);
    return [s.name, s.rollNo, s.regId, s.section, s.guardian, s.phone, planOf(r.account.plan).label, period, statusMeta[r.status].label, r.dueDate, r.overdueDays, r.months, behaviorOf(b.key).label, b.due, b.onTime, b.late, b.partials, b.rate, b.avgDelay, b.maxDelay];
  });
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `fee-report-${period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}
