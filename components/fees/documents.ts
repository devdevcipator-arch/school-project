import { printDocument } from "@/components/dashboard/print";
import { principal } from "@/lib/principal";
import { AS_OF, sectionLabel } from "@/lib/students";
import { ACADEMIC_YEAR, DUE_DAY, netOf, planOf, rs, settle, shortDate, stamp, statusMeta, type FeeAccount, type FeeRecord, type Installment, type Payment } from "@/lib/fees";

const head = (title: string, sub: string) => `<div class="bar"></div><div class="page">
  <p class="muted" style="letter-spacing:.2em;text-transform:uppercase;margin:0 0 6px">${principal.school}</p>
  <h1>${title}</h1><p class="muted">${sub}</p>`;

/** Bank challan for every outstanding installment, with the fine as of today. */
export function printChallan(a: FeeAccount, items: Installment[]) {
  const s = a.student;
  return printDocument(`Fee Challan - ${s.name}`, (e) => {
    const rows = items.map((i) => ({ i, st: settle(i) })).filter((x) => x.st.balance > 0);
    const total = rows.reduce((n, x) => n + x.st.balance, 0);
    const copy = (who: string) => `<div class="slip">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>${who}</strong><span class="stamp due">PAYABLE</span></div>
      <div class="grid">
        <div><span class="muted">Student</span><br/><strong>${e(s.name)}</strong></div>
        <div><span class="muted">Class / Roll No.</span><br/><strong>${e(sectionLabel(s.section))} &middot; ${s.rollNo}</strong></div>
        <div><span class="muted">Registration ID</span><br/>${e(s.regId)}</div>
        <div><span class="muted">Guardian</span><br/>${e(s.guardian)} &middot; ${e(s.phone)}</div>
      </div>
      <table><thead><tr><th>Challan No.</th><th>Fee period</th><th>Due date</th><th class="right">Fee</th><th class="right">Late fine</th><th class="right">Paid</th><th class="right">Payable</th></tr></thead><tbody>
      ${rows
        .map(
          ({ i, st }) =>
            `<tr><td>${e(i.challan)}</td><td>${e(i.label)}</td><td>${e(shortDate(i.due))}</td><td class="right">${rs(st.net)}</td><td class="right">${rs(st.fine)}</td><td class="right">${rs(st.paid)}</td><td class="right">${rs(st.balance)}</td></tr>`,
        )
        .join("")}
      <tr class="total"><td colspan="6">Total payable</td><td class="right">${rs(total)}</td></tr></tbody></table>
      <p class="muted" style="margin-top:10px">Pay at any HBL branch, online via the parent portal, or in cash at the school accounts office. A late fine of Rs 500 applies after the ${DUE_DAY}th, plus Rs 500 for every further 30 days (maximum Rs 2,000).</p>
    </div>`;
    return `${head("Fee Challan", `Academic year ${ACADEMIC_YEAR} &middot; Issued ${shortDate(AS_OF)} &middot; ${planOf(a.plan).label}`)}
      ${rows.length ? copy("Bank copy") + copy("School copy") + copy("Parent copy") : "<p>No outstanding fees. Nothing is payable.</p>"}
    </div>`;
  });
}

/** Digital receipt for one recorded payment. */
export function printReceipt(a: FeeAccount, i: Installment, p: Payment) {
  const s = a.student;
  return printDocument(`Fee Receipt ${p.receipt}`, (e) => `${head("Fee Payment Receipt", `Receipt ${e(p.receipt)} &middot; ${e(stamp(p.at))}`)}
    <div class="slip">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>${e(s.name)}</strong><span class="stamp">RECEIVED</span></div>
      <div class="grid">
        <div><span class="muted">Class / Roll No.</span><br/>${e(sectionLabel(s.section))} &middot; ${s.rollNo}</div>
        <div><span class="muted">Registration ID</span><br/>${e(s.regId)}</div>
        <div><span class="muted">Fee period</span><br/>${e(i.label)} (${e(i.challan)})</div>
        <div><span class="muted">Payment method</span><br/>${e(p.method)}${p.ref ? ` &middot; ${e(p.ref)}` : ""}</div>
      </div>
      <table><tbody>
        <tr><td>Installment fee</td><td class="right">${rs(netOf(i))}</td></tr>
        <tr class="total"><td>Amount received</td><td class="right">${rs(p.amount)}</td></tr>
        <tr><td>Current balance on this installment</td><td class="right">${rs(settle(i).balance)}</td></tr>
      </tbody></table>
      ${p.note ? `<p class="muted">Note: ${e(p.note)}</p>` : ""}
    </div>
    <p class="muted">This is a computer-generated receipt and does not require a signature.</p></div>`);
}

/** Printable fee report for the filtered directory. */
export function printFeeReport(records: FeeRecord[], period: string, scope: string) {
  const sum = (f: (r: FeeRecord) => number) => records.reduce((n, r) => n + f(r), 0);
  return printDocument(`Fee Report - ${period}`, (e) => `${head("Student Fee Report", `${e(period)} &middot; ${e(scope)} &middot; Prepared for ${e(principal.name)} on ${shortDate(AS_OF)}`)}
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">
      <div><span class="muted">Students</span><br/><strong>${records.length}</strong></div>
      <div><span class="muted">Total due</span><br/><strong>${rs(sum((r) => r.due))}</strong></div>
      <div><span class="muted">Collected</span><br/><strong>${rs(sum((r) => r.paid))}</strong></div>
      <div><span class="muted">Outstanding</span><br/><strong>${rs(sum((r) => r.balance))}</strong></div>
    </div>
    <table><thead><tr><th>Student</th><th>Class</th><th>Guardian</th><th>Plan</th><th class="right">Due</th><th class="right">Paid</th><th class="right">Balance</th><th>Status</th></tr></thead><tbody>
    ${records
      .map(
        (r) => `<tr><td><strong>${e(r.account.student.name)}</strong><br/><span class="muted">Roll ${r.account.student.rollNo}</span></td><td>${e(r.account.student.section)}</td>
        <td>${e(r.account.student.guardian)}<br/><span class="muted">${e(r.account.student.phone)}</span></td><td>${e(planOf(r.account.plan).short)}</td>
        <td class="right">${rs(r.due)}</td><td class="right">${rs(r.paid)}</td><td class="right">${rs(r.balance)}</td>
        <td>${e(statusMeta[r.status].label)}${r.status === "defaulter" ? ` (${r.months} months)` : r.overdueDays ? ` (${r.overdueDays} days)` : ""}</td></tr>`,
      )
      .join("")}
    </tbody></table></div>`);
}

/** Spreadsheet export (CSV opens directly in Excel). */
export function downloadFeeCsv(records: FeeRecord[], period: string) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ["Student", "Roll No", "Registration ID", "Class", "Guardian", "Phone", "Plan", "Period", "Total Due", "Paid", "Balance", "Late Fine", "Days Overdue", "Unpaid Months", "Status"];
  const rows = records.map((r) => {
    const s = r.account.student;
    return [s.name, s.rollNo, s.regId, s.section, s.guardian, s.phone, planOf(r.account.plan).label, period, r.due, r.paid, r.balance, r.fine, r.overdueDays, r.months, statusMeta[r.status].label];
  });
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `fee-report-${period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}
