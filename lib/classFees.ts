// Teacher portal, Class Fees: a monthly Paid / Unpaid fee register for each assigned section.
// Platform rule: status, dates and remarks only, never amounts. Past months are read from the
// fee ledger in ./fees; replace with the real API later.

import { accounts, DUE_DAY, DEFAULTER_MONTHS, MONTHS, settle, shortDate, unpaidMonths, type FeeAccount } from "./fees";
import type { Student } from "./students";

export type FeeMarkStatus = "paid" | "unpaid";
export type FeeMark = { status: FeeMarkStatus; remark: string; paidOn?: string };
export type FeeMarks = Record<string, FeeMark>;

const byStudent = new Map(accounts.map((a) => [a.student.id, a]));
export const accountOf = (s: Student): FeeAccount => byStudent.get(s.id)!;

/** Fee months the register covers: the academic year up to the viewer's current month. */
export function feeMonthsUpTo(todayIso: string) {
  const upTo = MONTHS.filter((m) => m <= todayIso.slice(0, 7));
  return upTo.length ? upTo : MONTHS.slice(0, 1);
}

/** "2026-10" to "15 Oct 2026". */
export const dueDateOf = (ym: string) => shortDate(`${ym}-${DUE_DAY}`);

/** Mock date a past month's register was submitted, e.g. "25 Sep 2026". */
export const pastSubmitDate = (ym: string) => shortDate(`${ym}-25`);

/** The month's register as the fee office ledger has it: cleared installments are Paid. */
export function ledgerRegister(roster: Student[], ym: string): FeeMarks {
  return Object.fromEntries(
    roster.map((s) => {
      const inst = accountOf(s).installments.find((i) => i.months.includes(ym));
      if (!inst) return [s.id, { status: "paid", remark: "" }];
      const st = settle(inst);
      if (st.cleared) return [s.id, { status: "paid", remark: "", paidOn: st.clearedAt!.slice(0, 10) }];
      const remark = inst.payments.length ? "Part payment made, balance pending" : st.late > 0 ? "Reminder sent to parents" : "";
      return [s.id, { status: "unpaid", remark }];
    }),
  );
}

export const allMarked = (roster: Student[], status: FeeMarkStatus, prev: FeeMarks, todayIso: string): FeeMarks =>
  Object.fromEntries(
    roster.map((s) => [s.id, status === "paid" ? { status, remark: "", paidOn: prev[s.id]?.paidOn ?? todayIso } : { status, remark: prev[s.id]?.remark ?? "" }]),
  );

/** Unpaid months on the fee ledger, with its tone for the roster badge. */
export function feeStanding(s: Student) {
  const months = unpaidMonths(accountOf(s));
  return { months, defaulter: months >= DEFAULTER_MONTHS };
}

export const feeRemarkPresets = ["Reminder sent to parents", "Parent promised to pay this week", "Concession request pending", "Part payment made, balance pending"];
