// Student fee management: fee structure, installment ledgers, late fines and status rules,
// with a deterministic mock ledger for every student in the directory.
// Replace with real API data in the backend phase.

import { AS_OF, gradeNum, hash, students, type Student } from "./students";

/* ---------------- Calendar ---------------- */

/** Academic year runs April to March. */
export const ACADEMIC_YEAR = "2026-27";
export const MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"];
/** Fees fall due on this day of the month. */
export const DUE_DAY = 15;
/** Two or more unpaid months makes a critical defaulter. */
export const DEFAULTER_MONTHS = 2;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" to "October 2026". */
export const monthLabel = (ym: string) => `${monthNames[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
/** "2026-10-15" to "15 Oct 2026". */
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${shortMonths[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
/** "2026-10-05T10:24" to "5 Oct 2026, 10:24 AM". */
export function stamp(iso: string) {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  return `${shortDate(iso)}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Whole-rupee amounts with thousands separators, e.g. "Rs 12,500" (no locale APIs, so SSR and client agree). */
export const rs = (n: number) => `Rs ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
/** Compact form for KPI tiles, e.g. "Rs 4.82M" or "Rs 865K". */
export const rsShort = (n: number) => (n >= 1e6 ? `Rs ${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `Rs ${Math.round(n / 1e3)}K` : rs(n));

const DAY = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY;
const fromDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => toDay(to) - toDay(from);

export type Period = { key: string; label: string; months: string[] };

/** Month and term choices for the period selector, newest first; months stop at the current one. */
export const periods: Period[] = [
  ...MONTHS.filter((m) => m <= AS_OF.slice(0, 7))
    .reverse()
    .map((m) => ({ key: m, label: monthLabel(m), months: [m] })),
  { key: "term1", label: "First Term (Apr - Sep 2026)", months: MONTHS.slice(0, 6) },
  { key: "term2", label: "Second Term (Oct 2026 - Mar 2027)", months: MONTHS.slice(6) },
];
export const CURRENT_PERIOD = AS_OF.slice(0, 7);

/* ---------------- Fee structure ---------------- */

export type Plan = "monthly" | "biannual" | "annual";

export const plans: { key: Plan; label: string; short: string }[] = [
  { key: "monthly", label: "Monthly Installments", short: "Monthly" },
  { key: "biannual", label: "Installment 1 & 2 (Bi-annual)", short: "Bi-annual" },
  { key: "annual", label: "Full Annual", short: "Annual" },
];
export const planOf = (p: Plan) => plans.find((x) => x.key === p)!;

/** Monthly tuition by grade band. */
export const tuitionFor = (grade: number) => (grade <= 3 ? 6500 : grade <= 5 ? 7500 : grade <= 8 ? 8500 : 10000);

export type Line = { label: string; amount: number };

export type PaymentMethod = "Online Gateway" | "Bank Slip" | "Cash";
export const methods: PaymentMethod[] = ["Online Gateway", "Bank Slip", "Cash"];

export type Payment = {
  receipt: string;
  /** ISO date-time, e.g. "2026-10-05T10:24". */
  at: string;
  amount: number;
  method: PaymentMethod;
  /** Bank slip / transaction reference. */
  ref?: string;
  note?: string;
};

export type Installment = {
  /** Challan number, e.g. "CH-2610-0042". */
  challan: string;
  label: string;
  /** Months (yyyy-mm) this installment covers. */
  months: string[];
  due: string;
  tuition: number;
  extras: Line[];
  discounts: Line[];
  payments: Payment[];
};

export type FeeAccount = {
  student: Student;
  plan: Plan;
  /** Recurring monthly charges and concessions (for the structure breakdown). */
  extras: Line[];
  discounts: Line[];
  installments: Installment[];
};

/** Net amount of an installment before any late fine. */
export const netOf = (i: Installment) => i.tuition + i.extras.reduce((n, l) => n + l.amount, 0) - i.discounts.reduce((n, l) => n + l.amount, 0);
export const paidOf = (i: Installment) => i.payments.reduce((n, p) => n + p.amount, 0);

/** Late fine: Rs 500 once past the due date, plus Rs 500 per further 30 days, capped at Rs 2,000. */
export const fineAt = (due: string, on: string) => {
  const late = daysBetween(due, on);
  return late <= 0 ? 0 : Math.min(2000, 500 + 500 * Math.floor(late / 30));
};

export type InstallmentStatus = "paid" | "partial" | "overdue" | "due" | "upcoming";

/** Fine, totals and status of one installment as of a date. A fully paid one keeps the fine owed when it was settled. */
export function settle(i: Installment, on = AS_OF) {
  const net = netOf(i);
  const paid = paidOf(i);
  const last = i.payments.at(-1)?.at.slice(0, 10);
  const settledFine = last ? fineAt(i.due, last) : 0;
  const cleared = !!last && paid >= net + settledFine;
  const fine = cleared ? settledFine : fineAt(i.due, on);
  const total = net + fine;
  const balance = Math.max(0, total - paid);
  const late = daysBetween(i.due, on);
  const status: InstallmentStatus = balance === 0 ? "paid" : late > 0 ? (paid > 0 ? "partial" : "overdue") : paid > 0 ? "partial" : late >= -15 ? "due" : "upcoming";
  return { net, fine, total, paid, balance, status, late, paidOn: cleared ? i.payments.at(-1)!.at : undefined };
}

/* ---------------- Student status for a period ---------------- */

export type FeeStatus = "paid" | "partial" | "delayed" | "defaulter" | "pending";

export const statusMeta: Record<FeeStatus, { label: string; tab: string }> = {
  paid: { label: "Paid", tab: "Paid" },
  partial: { label: "Partial", tab: "Partially Paid" },
  delayed: { label: "Delayed", tab: "Delayed / Overdue" },
  defaulter: { label: "Defaulter", tab: "Defaulters" },
  pending: { label: "Not yet due", tab: "Not yet due" },
};

/** Months of fees left unpaid past their due date (bi-annual / annual count each 30 days late as a month). */
export function unpaidMonths(a: FeeAccount, on = AS_OF) {
  let n = 0;
  for (const i of a.installments) {
    const s = settle(i, on);
    if (s.balance > 0 && s.late > 0) n += a.plan === "monthly" ? 1 : Math.min(i.months.length, 1 + Math.floor(s.late / 30));
  }
  return n;
}

export type FeeRecord = {
  account: FeeAccount;
  /** Installments covering the selected period. */
  current: Installment[];
  /** Unpaid balance carried from installments due before the period. */
  arrears: number;
  due: number;
  paid: number;
  balance: number;
  fine: number;
  discount: number;
  /** Days since the oldest unpaid due date (0 if nothing is overdue). */
  overdueDays: number;
  /** Next due date when nothing is overdue yet. */
  nextDue?: string;
  /** Date shown in the directory: oldest unpaid overdue date, else the next or current due date. */
  dueDate: string;
  paidOn?: string;
  months: number;
  status: FeeStatus;
};

export function recordFor(a: FeeAccount, period: Period, on = AS_OF): FeeRecord {
  const start = `${period.months[0]}-01`;
  const current = a.installments.filter((i) => i.months.some((m) => period.months.includes(m)));
  const earlier = a.installments.filter((i) => !current.includes(i) && i.due < start);
  const cur = current.map((i) => ({ i, s: settle(i, on) }));
  const old = earlier.map((i) => ({ i, s: settle(i, on) })).filter((x) => x.s.balance > 0);
  const arrears = old.reduce((n, x) => n + x.s.balance, 0);
  const due = cur.reduce((n, x) => n + x.s.total, 0) + arrears;
  const paid = cur.reduce((n, x) => n + x.s.paid, 0);
  const balance = Math.max(0, due - paid);
  const overdueRows = [...old, ...cur].filter((x) => x.s.balance > 0 && x.s.late > 0);
  const overdue = overdueRows.map((x) => x.s.late);
  const overdueDays = overdue.length ? Math.max(...overdue) : 0;
  const months = unpaidMonths(a, on);
  const status: FeeStatus =
    balance === 0 ? "paid" : months >= DEFAULTER_MONTHS ? "defaulter" : overdueDays > 0 ? (paid > 0 ? "partial" : "delayed") : paid > 0 ? "partial" : "pending";
  const upcoming = cur.filter((x) => x.s.balance > 0 && x.s.late <= 0).map((x) => x.i.due).sort()[0];
  const lastPaid = cur.map((x) => x.s.paidOn).filter(Boolean).sort().at(-1);
  return {
    account: a,
    current,
    arrears,
    due,
    paid,
    balance,
    fine: [...old, ...cur].reduce((n, x) => n + x.s.fine, 0),
    discount: current.reduce((n, i) => n + i.discounts.reduce((m, l) => m + l.amount, 0), 0),
    overdueDays,
    nextDue: upcoming,
    dueDate: overdueRows.map((x) => x.i.due).sort()[0] ?? upcoming ?? current[0]?.due ?? "",
    paidOn: balance === 0 ? lastPaid : undefined,
    months,
    status,
  };
}

/** Whole-account position for the ledger header: billed to date, paid, outstanding, fines. */
export function accountSummary(a: FeeAccount, on = AS_OF) {
  const rows = a.installments.map((i) => settle(i, on));
  const billed = a.installments.filter((i) => i.due <= on || paidOf(i) > 0);
  return {
    annual: a.installments.reduce((n, i) => n + netOf(i), 0),
    billed: billed.reduce((n, i) => n + settle(i, on).total, 0),
    paid: rows.reduce((n, r) => n + r.paid, 0),
    outstanding: rows.filter((r) => r.late > 0 || r.paid > 0).reduce((n, r) => n + r.balance, 0),
    fines: rows.reduce((n, r) => n + r.fine, 0),
    discounts: a.installments.reduce((n, i) => n + i.discounts.reduce((m, l) => m + l.amount, 0), 0),
  };
}

/* ---------------- Mock ledger ---------------- */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

type Behavior = "prompt" | "late" | "partial" | "lapse" | "defaulter";

function payment(seed: number, k: number, date: string, amount: number, forceMethod?: PaymentMethod): Payment {
  const r = (n: number) => hash(seed * 97 + k, n);
  const method = forceMethod ?? (r(1) < 0.45 ? "Online Gateway" : r(1) < 0.86 ? "Bank Slip" : "Cash");
  return {
    receipt: `RCP-${date.slice(2, 4)}${date.slice(5, 7)}-${pad(seed, 4)}${k % 10}`,
    at: `${date}T${pad(9 + Math.floor(r(2) * 7))}:${pad(Math.floor(r(3) * 60))}`,
    amount,
    method,
    ref: method === "Bank Slip" ? `HBL-${Math.floor(100000 + r(4) * 899999)}` : method === "Online Gateway" ? `TXN${Math.floor(1e8 + r(5) * 8.9e8)}` : undefined,
  };
}

function buildAccount(s: Student): FeeAccount {
  const r = (n: number) => hash(s.seed * 7 + n, 211);
  const grade = gradeNum(s.section);
  const tuition = tuitionFor(grade);

  const extras: Line[] = [];
  if (grade >= 6) extras.push({ label: "Computer lab fee", amount: 500 });
  if (grade >= 9) extras.push({ label: "Science lab fee", amount: 700 });
  if (r(1) < 0.3) extras.push({ label: "Transport (van service)", amount: 3500 });

  const discounts: Line[] = [];
  if (r(2) < 0.12) discounts.push({ label: "Sibling discount (10%)", amount: Math.round(tuition * 0.1) });
  if (r(3) < 0.05) discounts.push(r(4) < 0.6 ? { label: "Merit scholarship (25%)", amount: Math.round(tuition * 0.25) } : { label: "Need-based scholarship (50%)", amount: Math.round(tuition * 0.5) });

  const plan: Plan = r(5) < 0.06 ? "annual" : r(5) < 0.18 ? "biannual" : "monthly";
  // Upfront payers are reliable; monthly payers vary.
  const b = r(6);
  const behavior: Behavior = plan !== "monthly" ? (b < 0.85 ? "prompt" : "late") : b < 0.7 ? "prompt" : b < 0.83 ? "late" : b < 0.9 ? "partial" : b < 0.95 ? "lapse" : "defaulter";

  const scale = (lines: Line[], n: number) => lines.map((l) => ({ ...l, amount: l.amount * n }));
  const groups = plan === "monthly" ? MONTHS.map((m) => [m]) : plan === "biannual" ? [MONTHS.slice(0, 6), MONTHS.slice(6)] : [MONTHS];

  const installments: Installment[] = groups.map((months, gi) => {
    const n = months.length;
    const disc = scale(discounts, n);
    if (plan === "annual") disc.push({ label: "Advance annual payment (5%)", amount: Math.round(tuition * n * 0.05) });
    return {
      challan: `CH-${months[0].slice(2, 4)}${months[0].slice(5, 7)}-${pad(s.seed, 4)}`,
      label: plan === "monthly" ? monthLabel(months[0]) : plan === "biannual" ? `Installment ${gi + 1} (${shortMonths[Number(months[0].slice(5)) - 1]} - ${shortMonths[Number(months.at(-1)!.slice(5)) - 1]})` : `Full Annual ${ACADEMIC_YEAR}`,
      months,
      due: `${months[0]}-${DUE_DAY}`,
      tuition: tuition * n,
      extras: scale(extras, n),
      discounts: disc,
      payments: [],
    };
  });

  // Index of the latest installment already past due, for defaulter / lapse patterns.
  const lastDue = installments.reduce((idx, i, k) => (i.due < AS_OF ? k : idx), -1);
  const stopped = behavior === "defaulter" ? 2 + Math.floor(r(7) * 3) : behavior === "lapse" ? 1 : 0;

  installments.forEach((inst, k) => {
    const rk = (n: number) => hash(s.seed * 31 + k, 300 + n);
    const net = netOf(inst);
    const dueDay = toDay(inst.due);
    const pay = (day: number, amount: number, j = 0) => {
      const date = fromDay(day);
      if (date <= AS_OF) inst.payments.push(payment(s.seed, k * 3 + j, date, amount));
    };
    if (stopped && k > lastDue - stopped && k <= lastDue + 1) return;
    switch (behavior) {
      case "prompt":
        pay(dueDay - 14 + Math.floor(rk(1) * 14), net);
        break;
      case "late": {
        // Usually pays late with the fine; some recent months are still outstanding.
        const day = dueDay + 3 + Math.floor(rk(2) * 38);
        pay(day, net + fineAt(inst.due, fromDay(day)));
        break;
      }
      case "partial": {
        const first = Math.round((net * (0.5 + rk(3) * 0.3)) / 100) * 100;
        pay(dueDay - 6 + Math.floor(rk(4) * 8), first, 0);
        const day = dueDay + 18 + Math.floor(rk(5) * 40);
        pay(day, net - first + fineAt(inst.due, fromDay(day)), 1);
        break;
      }
      default:
        // Lapse and defaulter accounts paid on time before they stopped.
        pay(dueDay - 10 + Math.floor(rk(6) * 12), net);
    }
  });

  return { student: s, plan, extras, discounts, installments };
}

export const accounts: FeeAccount[] = students.map(buildAccount);

/** Records a manual payment against the oldest outstanding installments first. */
export function applyPayment(a: FeeAccount, amount: number, base: Omit<Payment, "amount" | "receipt">): FeeAccount {
  let left = amount;
  let k = 0;
  const installments = a.installments.map((i) => {
    if (left <= 0) return i;
    const { balance, late, paid } = settle(i, base.at.slice(0, 10));
    // Only fees already billed (due, overdue or part-paid) take manual payments.
    if (balance <= 0 || (late < -31 && paid === 0)) return i;
    const part = Math.min(balance, left);
    left -= part;
    k++;
    return { ...i, payments: [...i.payments, { ...base, amount: part, receipt: `RCP-${base.at.slice(2, 4)}${base.at.slice(5, 7)}-M${pad(a.student.seed, 4)}${k}` }] };
  });
  return { ...a, installments };
}

/** Amount a manual payment can clear now: everything overdue plus the current cycle. */
export const payableNow = (a: FeeAccount, on = AS_OF) =>
  a.installments.reduce((n, i) => {
    const s = settle(i, on);
    return n + (s.balance > 0 && (s.late >= -31 || s.paid > 0) ? s.balance : 0);
  }, 0);


/** Balance of installments already past their due date (what is actually overdue). */
export const overdueBalance = (a: FeeAccount, on = AS_OF) =>
  a.installments.reduce((n, i) => {
    const s = settle(i, on);
    return n + (s.late > 0 ? s.balance : 0);
  }, 0);
