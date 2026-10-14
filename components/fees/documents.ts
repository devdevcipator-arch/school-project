import { printDocument } from "@/components/dashboard/print";
import { principal } from "@/lib/principal";
import { AS_OF, sectionLabel } from "@/lib/students";
import {
  behaviorFor,
  behaviorOf,
  paymentRecords,
  planOf,
  shortDate,
  stamp,
  statusMeta,
  type FeeAccount,
  type FeeRecord,
  type PaymentEntry,
} from "@/lib/fees";

const head = (title: string, sub: string) => `<div class="bar"></div><div class="page">
  <p class="muted" style="letter-spacing:.2em;text-transform:uppercase;margin:0 0 6px">${principal.school}</p>
  <h1>${title}</h1><p class="muted">${sub}</p>`;

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
    <table><thead><tr><th>Student</th><th>Class</th><th>Guardian</th><th>Plan</th><th>Status</th><th>Behavior since enrollment</th><th>On time</th><th>Avg delay</th></tr></thead><tbody>
    ${records
      .map((r) => {
        const s = r.account.student;
        const b = behaviorFor(r.account);
        return `<tr><td><strong>${e(s.name)}</strong><br/><span class="muted">Roll ${s.rollNo}</span></td><td>${e(s.section)}</td>
        <td>${e(s.guardian)}<br/><span class="muted">${e(s.phone)}</span></td><td>${e(planOf(r.account.plan).short)}</td>
        <td>${e(statusMeta[r.status].label)}${r.status === "defaulter" ? ` (${r.months} months)` : r.overdueDays ? ` (${r.overdueDays} days)` : ""}</td>
        <td>${e(behaviorOf(b.key).label)}<br/><span class="muted">since ${e(shortDate(s.enrolled))}</span></td><td>${b.onTime}/${b.due} (${b.rate}%)</td><td>${b.avgDelay ? `${b.avgDelay} days` : "-"}</td></tr>`;
      })
      .join("")}
    </tbody></table></div>`);
}

/** Spreadsheet export (CSV opens directly in Excel). */
export function downloadFeeCsv(records: FeeRecord[], period: string) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ["Student", "Roll No", "Registration ID", "Class", "Guardian", "Phone", "Enrolled", "Plan", "Period", "Status", "Due Date", "Days Overdue", "Unpaid Months", "Behavior (since enrollment)", "Installments Due", "Paid On Time", "Paid Late", "Paid In Parts", "On-time Rate %", "Average Delay (days)", "Longest Delay (days)"];
  const rows = records.map((r) => {
    const s = r.account.student;
    const b = behaviorFor(r.account);
    return [s.name, s.rollNo, s.regId, s.section, s.guardian, s.phone, s.enrolled, planOf(r.account.plan).label, period, statusMeta[r.status].label, r.dueDate, r.overdueDays, r.months, behaviorOf(b.key).label, b.due, b.onTime, b.late, b.partials, b.rate, b.avgDelay, b.maxDelay];
  });
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `fee-report-${period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}

/** Full payment history since enrollment, grouped by academic year. */
export function printPaymentHistory(a: FeeAccount) {
  const s = a.student;
  const life = behaviorFor(a);
  return printDocument(`Payment History - ${s.name}`, (e) => {
    const groups = [...a.years]
      .reverse()
      .map((y) => {
        const rows = paymentRecords(a).filter((r) => r.i.year === y);
        const b = behaviorFor(a, y);
        return `<h2>${e(y)} <span class="muted">&middot; ${e(planOf(a.plans[y]).label)} &middot; ${rows.length} payments &middot; ${b.rate}% on time</span></h2>
        <table><thead><tr><th>Date &amp; time</th><th>Installment</th><th>Type</th><th>Timing</th></tr></thead><tbody>
        ${
          rows.length
            ? rows
                .map(
                  ({ i, p, late }) =>
                    `<tr><td>${e(stamp(p.at))}</td><td>${e(i.label)}</td><td>${p.kind === "final" ? "Full" : "Part"}</td><td>${late ? `${late} days late` : "On time"}</td></tr>`,
                )
                .join("")
            : `<tr><td colspan="4" class="muted">No payments recorded in this year.</td></tr>`
        }
        </tbody></table>`;
      })
      .join("");
    return `${head("Student Payment History", `${e(s.name)} &middot; ${e(sectionLabel(s.section))} &middot; Roll No. ${s.rollNo} &middot; ${e(s.regId)}`)}
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">
        <div><span class="muted">Enrolled</span><br/><strong>${e(shortDate(s.enrolled))}</strong></div>
        <div><span class="muted">Academic years</span><br/><strong>${a.years.length}</strong></div>
        <div><span class="muted">On-time rate</span><br/><strong>${life.rate}%</strong></div>
        <div><span class="muted">Payment behavior</span><br/><strong>${e(behaviorOf(life.key).label)}</strong></div>
      </div>
      ${groups}
    </div>`;
  });
}

/** Spreadsheet of payment records (CSV opens directly in Excel). */
export function downloadPaymentsCsv(entries: PaymentEntry[], label: string) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ["Date", "Time", "Student", "Roll No", "Registration ID", "Class", "Academic Year", "Installment", "Due Date", "Type", "Timing", "Days Late"];
  const rows = entries.map(({ a, i, p, late, timing }) => [
    p.at.slice(0, 10),
    p.at.slice(11, 16),
    a.student.name,
    a.student.rollNo,
    a.student.regId,
    a.student.section,
    i.year,
    i.label,
    i.due,
    p.kind === "final" ? "Full payment" : "Part payment",
    timing === "ontime" ? "On time" : timing === "late" ? "Late" : "Part payment",
    late,
  ]);
  const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `payment-records-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}
