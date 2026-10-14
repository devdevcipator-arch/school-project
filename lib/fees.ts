// Student fee tracking: installment plans, due dates, payment records and each student's
// installment behavior, with a deterministic mock ledger for every student.
// Platform rule: fees are tracked by status, dates and behavior only. No amounts or currency.
// Replace with real API data in the backend phase.

import { AS_OF, hash, students, type Student } from "./students";

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
/** "2026-10" to "Oct". */
export const monthShort = (ym: string) => shortMonths[Number(ym.slice(5, 7)) - 1];
/** "2026-10-15" to "15 Oct 2026". */
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${shortMonths[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
/** "2026-10-05T10:24" to "5 Oct 2026, 10:24 AM". */
export function stamp(iso: string) {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  return `${shortDate(iso)}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

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

/* ---------------- Plans & payments ---------------- */

export type Plan = "monthly" | "biannual" | "annual";

export const plans: { key: Plan; label: string; short: string }[] = [
  { key: "monthly", label: "Monthly Installments", short: "Monthly" },
  { key: "biannual", label: "Installment 1 & 2 (Bi-annual)", short: "Bi-annual" },
  { key: "annual", label: "Full Annual", short: "Annual" },
];
export const planOf = (p: Plan) => plans.find((x) => x.key === p)!;

export type PaymentMethod = "Online Gateway" | "Bank Slip" | "Cash";
export const methods: PaymentMethod[] = ["Online Gateway", "Bank Slip", "Cash"];

export type Payment = {
  receipt: string;
  /** ISO date-time, e.g. "2026-10-05T10:24". */
  at: string;
  method: PaymentMethod;
  /** "part" leaves the installment open; "final" clears it. */
  kind: "part" | "final";
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
  /** Original due date when the principal has granted an extension on the challan. */
  originalDue?: string;
  payments: Payment[];
};

/** Per-student challan customisation set by the principal. */
export type ChallanSettings = {
  /** Challan numbers of the installments printed on the challan. */
  include: string[];
  issued: string;
  validUntil: string;
  instructions: string;
  note: string;
  /** Last edit, ISO date-time; undefined until the principal edits the challan. */
  editedAt?: string;
};

export type FeeAccount = { student: Student; plan: Plan; installments: Installment[]; challan?: ChallanSettings };

export type InstallmentStatus = "ontime" | "late" | "partial" | "overdue" | "due" | "upcoming";

export const installmentLabel: Record<InstallmentStatus, string> = {
  ontime: "Paid on time",
  late: "Paid late",
  partial: "Partially paid",
  overdue: "Overdue",
  due: "Due",
  upcoming: "Upcoming",
};

/** Where one installment stands as of a date. */
export function settle(i: Installment, on = AS_OF) {
  const final = i.payments.find((p) => p.kind === "final");
  const late = daysBetween(i.due, on);
  const clearedAt = final?.at;
  const delay = clearedAt ? Math.max(0, daysBetween(i.due, clearedAt)) : Math.max(0, late);
  const status: InstallmentStatus = clearedAt
    ? delay > 0
      ? "late"
      : "ontime"
    : i.payments.length
      ? "partial"
      : late > 0
        ? "overdue"
        : late >= -15
          ? "due"
          : "upcoming";
  return { cleared: !!clearedAt, clearedAt, late, delay, status, open: !clearedAt && (late >= -31 || i.payments.length > 0) };
}

/* ---------------- Student status for a period ---------------- */

export type FeeStatus = "paid" | "partial" | "delayed" | "defaulter" | "pending";

export const statusMeta: Record<FeeStatus, { label: string }> = {
  paid: { label: "Paid" },
  partial: { label: "Partial" },
  delayed: { label: "Delayed" },
  defaulter: { label: "Defaulter" },
  pending: { label: "Not yet due" },
};

/** Months of fees left unpaid past their due date (bi-annual / annual count each 30 days late as a month). */
export function unpaidMonths(a: FeeAccount, on = AS_OF) {
  let n = 0;
  for (const i of a.installments) {
    const s = settle(i, on);
    if (!s.cleared && s.late > 0) n += a.plan === "monthly" ? 1 : Math.min(i.months.length, 1 + Math.floor(s.late / 30));
  }
  return n;
}

export type FeeRecord = {
  account: FeeAccount;
  /** Installments covering the selected period. */
  current: Installment[];
  /** Earlier installments still unpaid (carried forward). */
  arrears: Installment[];
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
  const arrears = a.installments.filter((i) => !current.includes(i) && i.due < start && !settle(i, on).cleared);
  const cur = current.map((i) => ({ i, s: settle(i, on) }));
  const open = [...arrears.map((i) => ({ i, s: settle(i, on) })), ...cur].filter((x) => !x.s.cleared);
  const overdueRows = open.filter((x) => x.s.late > 0);
  const overdueDays = overdueRows.length ? Math.max(...overdueRows.map((x) => x.s.late)) : 0;
  const months = unpaidMonths(a, on);
  const partPaid = open.some((x) => x.i.payments.length > 0);
  const status: FeeStatus = !open.length ? "paid" : months >= DEFAULTER_MONTHS ? "defaulter" : overdueDays > 0 ? (partPaid ? "partial" : "delayed") : partPaid ? "partial" : "pending";
  const nextDue = open.filter((x) => x.s.late <= 0).map((x) => x.i.due).sort()[0];
  return {
    account: a,
    current,
    arrears,
    overdueDays,
    nextDue,
    dueDate: overdueRows.map((x) => x.i.due).sort()[0] ?? nextDue ?? current[0]?.due ?? "",
    paidOn: open.length ? undefined : cur.map((x) => x.s.clearedAt).filter(Boolean).sort().at(-1),
    months,
    status,
  };
}

/* ---------------- Installment behavior ---------------- */

export type BehaviorKey = "punctual" | "mostly" | "late" | "parts" | "defaulter";

export const behaviors: { key: BehaviorKey; label: string; hint: string }[] = [
  { key: "punctual", label: "Always on time", hint: "Every installment cleared by the due date" },
  { key: "mostly", label: "Mostly on time", hint: "75% or more cleared by the due date" },
  { key: "late", label: "Frequently late", hint: "Under 75% cleared by the due date" },
  { key: "parts", label: "Pays in parts", hint: "Two or more installments paid in parts" },
  { key: "defaulter", label: "Chronic defaulter", hint: `${DEFAULTER_MONTHS}+ months unpaid` },
];
export const behaviorOf = (k: BehaviorKey) => behaviors.find((b) => b.key === k)!;

export type MonthState = InstallmentStatus | "covered";

/** A student's full installment behavior record for the year so far. */
export function behaviorFor(a: FeeAccount, on = AS_OF) {
  const billed = a.installments.filter((i) => i.due <= on || i.payments.length > 0).map((i) => ({ i, s: settle(i, on) }));
  const onTime = billed.filter((x) => x.s.status === "ontime").length;
  const late = billed.filter((x) => x.s.status === "late");
  const partials = billed.filter((x) => x.i.payments.some((p) => p.kind === "part")).length;
  const unpaid = billed.filter((x) => !x.s.cleared && x.s.late > 0).length;
  const delays = late.map((x) => x.s.delay);
  const months = unpaidMonths(a, on);
  const due = billed.filter((x) => x.s.late > 0 || x.s.cleared).length;
  const rate = due ? Math.round((onTime / due) * 100) : 100;
  // Current streak of installments cleared on time, newest first.
  let streak = 0;
  for (const x of [...billed].reverse()) {
    if (x.s.status === "ontime") streak++;
    else if (x.s.late > 0 || x.s.cleared) break;
  }
  const key: BehaviorKey = months >= DEFAULTER_MONTHS ? "defaulter" : partials >= 2 ? "parts" : rate >= 95 && !unpaid ? "punctual" : rate >= 75 ? "mostly" : "late";
  // Month-by-month record; months inside an upfront installment share its state.
  const timeline = MONTHS.map((m) => {
    const i = a.installments.find((x) => x.months.includes(m))!;
    const s = settle(i, on);
    const state: MonthState = i.months[0] !== m && s.cleared ? "covered" : s.status;
    return { month: m, state, delay: s.delay, challan: i.challan };
  });
  return {
    key,
    rate,
    onTime,
    late: late.length,
    partials,
    unpaid,
    months,
    avgDelay: delays.length ? Math.round(delays.reduce((n, d) => n + d, 0) / delays.length) : 0,
    maxDelay: Math.max(0, ...delays, ...billed.filter((x) => !x.s.cleared && x.s.late > 0).map((x) => x.s.late)),
    streak,
    due,
    timeline,
  };
}

export type Behavior = ReturnType<typeof behaviorFor>;

/* ---------------- Mock ledger ---------------- */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

type Habit = "prompt" | "late" | "partial" | "lapse" | "defaulter";

function payment(seed: number, k: number, date: string, kind: Payment["kind"]): Payment {
  const r = (n: number) => hash(seed * 97 + k, n);
  const method: PaymentMethod = r(1) < 0.45 ? "Online Gateway" : r(1) < 0.86 ? "Bank Slip" : "Cash";
  return {
    receipt: `RCP-${date.slice(2, 4)}${date.slice(5, 7)}-${pad(seed, 4)}${k % 10}`,
    at: `${date}T${pad(9 + Math.floor(r(2) * 7))}:${pad(Math.floor(r(3) * 60))}`,
    method,
    kind,
    ref: method === "Bank Slip" ? `HBL-${Math.floor(100000 + r(4) * 899999)}` : method === "Online Gateway" ? `TXN${Math.floor(1e8 + r(5) * 8.9e8)}` : undefined,
  };
}

function buildAccount(s: Student): FeeAccount {
  const r = (n: number) => hash(s.seed * 7 + n, 211);
  const plan: Plan = r(5) < 0.06 ? "annual" : r(5) < 0.18 ? "biannual" : "monthly";
  // Upfront payers are reliable; monthly payers vary.
  const b = r(6);
  const habit: Habit = plan !== "monthly" ? (b < 0.85 ? "prompt" : "late") : b < 0.62 ? "prompt" : b < 0.8 ? "late" : b < 0.88 ? "partial" : b < 0.94 ? "lapse" : "defaulter";
  const groups = plan === "monthly" ? MONTHS.map((m) => [m]) : plan === "biannual" ? [MONTHS.slice(0, 6), MONTHS.slice(6)] : [MONTHS];

  const installments: Installment[] = groups.map((months, gi) => ({
    challan: `CH-${months[0].slice(2, 4)}${months[0].slice(5, 7)}-${pad(s.seed, 4)}`,
    label: plan === "monthly" ? monthLabel(months[0]) : plan === "biannual" ? `Installment ${gi + 1} (${monthShort(months[0])} - ${monthShort(months.at(-1)!)})` : `Full Annual ${ACADEMIC_YEAR}`,
    months,
    due: `${months[0]}-${DUE_DAY}`,
    payments: [],
  }));

  // Index of the latest installment already past due, for defaulter / lapse patterns.
  const lastDue = installments.reduce((idx, i, k) => (i.due < AS_OF ? k : idx), -1);
  const stopped = habit === "defaulter" ? 2 + Math.floor(r(7) * 3) : habit === "lapse" ? 1 : 0;
  // Even prompt payers slip occasionally; late payers are sometimes on time.
  const slip = r(8);

  installments.forEach((inst, k) => {
    const rk = (n: number) => hash(s.seed * 31 + k, 300 + n);
    const dueDay = toDay(inst.due);
    const pay = (day: number, kind: Payment["kind"], j = 0) => {
      const date = fromDay(day);
      if (date <= AS_OF) inst.payments.push(payment(s.seed, k * 3 + j, date, kind));
    };
    if (stopped && k > lastDue - stopped && k <= lastDue + 1) return;
    const lateThisTime = habit === "late" ? rk(1) < 0.75 : habit === "prompt" ? rk(1) < slip * 0.12 : false;
    if (habit === "partial" && rk(2) < 0.6) {
      pay(dueDay - 6 + Math.floor(rk(3) * 8), "part", 0);
      pay(dueDay + 18 + Math.floor(rk(4) * 40), "final", 1);
    } else if (lateThisTime) {
      pay(dueDay + 2 + Math.floor(rk(5) * 38), "final");
    } else {
      pay(dueDay - 14 + Math.floor(rk(6) * 14), "final");
    }
  });

  return { student: s, plan, installments };
}

export const accounts: FeeAccount[] = students.map(buildAccount);

/** Installments a challan can carry now: anything overdue, part-paid or in the current cycle. */
export const openInstallments = (a: FeeAccount, on = AS_OF) => a.installments.filter((i) => settle(i, on).open);

/** Installments not yet cleared, including future ones the principal may add to a challan early. */
export const unclearedInstallments = (a: FeeAccount, on = AS_OF) => a.installments.filter((i) => !settle(i, on).cleared);

export const DEFAULT_INSTRUCTIONS = `Pay at any HBL branch, online through the parent portal, or at the school accounts office by the due date shown for each installment. Keep the stamped parent copy as proof of payment.`;

/** The challan as the principal last saved it, or the standard one: open installments, valid until the latest due date. */
export function challanFor(a: FeeAccount, on = AS_OF): ChallanSettings {
  if (a.challan) return a.challan;
  const open = openInstallments(a, on);
  const last = open.map((i) => i.due).sort().at(-1);
  return {
    include: open.map((i) => i.challan),
    issued: on,
    validUntil: last && last > on ? last : fromDay(toDay(on) + 15),
    instructions: DEFAULT_INSTRUCTIONS,
    note: "",
  };
}

/** Saves challan edits: installment names and due dates (extensions) plus the challan settings. */
export function saveChallan(a: FeeAccount, settings: ChallanSettings, edits: Record<string, { label: string; due: string }>): FeeAccount {
  return {
    ...a,
    challan: settings,
    installments: a.installments.map((i) => {
      const e = edits[i.challan];
      if (!e) return i;
      const original = i.originalDue ?? i.due;
      return { ...i, label: e.label, due: e.due, originalDue: e.due === original ? undefined : original };
    }),
  };
}

/** Every payment the student has made, newest first, with the installment it was for and whether it was on time. */
export function paymentRecords(a: FeeAccount) {
  return a.installments
    .flatMap((i) => i.payments.map((p) => ({ i, p, late: Math.max(0, daysBetween(i.due, p.at)) })))
    .sort((x, y) => y.p.at.localeCompare(x.p.at));
}
