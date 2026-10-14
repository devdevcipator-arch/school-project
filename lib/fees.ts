// Student fee tracking: installment plans, due dates, payment records and each student's
// installment behavior from the day they enrolled, with a deterministic mock ledger.
// Platform rule: fees are tracked by status, dates and behavior only. No amounts or currency.
// Replace with real API data in the backend phase.

import { AS_OF, hash, students, type Student } from "./students";

/* ---------------- Calendar ---------------- */

/** Fees fall due on this day of the month. */
export const DUE_DAY = 15;
/** Two or more unpaid months makes a critical defaulter. */
export const DEFAULTER_MONTHS = 2;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Academic years run April to March, e.g. 2026 gives "2026-27". */
export const yearLabel = (start: number) => `${start}-${pad((start + 1) % 100)}`;
/** The twelve months (yyyy-mm) of the academic year starting in April of `start`. */
export const academicMonths = (start: number) => Array.from({ length: 12 }, (_, k) => `${start + (k >= 9 ? 1 : 0)}-${pad(((3 + k) % 12) + 1)}`);

const CURRENT_START = Number(AS_OF.slice(0, 4)) - (Number(AS_OF.slice(5, 7)) < 4 ? 1 : 0);
export const ACADEMIC_YEAR = yearLabel(CURRENT_START);
/** Months of the current academic year. */
export const MONTHS = academicMonths(CURRENT_START);

/** Academic year a date falls in, e.g. "2026-02-10" gives "2025-26". */
export const academicYearOf = (iso: string) => yearLabel(Number(iso.slice(0, 4)) - (Number(iso.slice(5, 7)) < 4 ? 1 : 0));

/** Month names in academic order (April first), as "04" ... "03" with labels. */
export const academicMonthNames = academicMonths(2000).map((m) => ({ mm: m.slice(5, 7), name: monthNames[Number(m.slice(5, 7)) - 1] }));

/** "2026-10" to "October 2026". */
export const monthLabel = (ym: string) => `${monthNames[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
/** "2026-10" to "Oct". */
export const monthShort = (ym: string) => shortMonths[Number(ym.slice(5, 7)) - 1];
/** "2026-10-15" to "15 Oct 2026". */
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${shortMonths[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
/** "2026-10-05T10:24" to "5 Oct 2026, 10:24 AM". */
export function stamp(iso: string) {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  return `${shortDate(iso)}, ${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

const DAY = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY;
const fromDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => toDay(to) - toDay(from);

export type Period = { key: string; label: string; months: string[] };

/** Month and term choices for the period selector (current year), newest first; months stop at the current one. */
export const periods: Period[] = [
  ...MONTHS.filter((m) => m <= AS_OF.slice(0, 7))
    .reverse()
    .map((m) => ({ key: m, label: monthLabel(m), months: [m] })),
  { key: "term1", label: `First Term (Apr - Sep ${CURRENT_START})`, months: MONTHS.slice(0, 6) },
  { key: "term2", label: `Second Term (Oct ${CURRENT_START} - Mar ${CURRENT_START + 1})`, months: MONTHS.slice(6) },
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

export type Payment = {
  /** Internal key only; never shown. */
  id: string;
  /** ISO date-time, e.g. "2026-10-05T10:24". */
  at: string;
  /** "part" leaves the installment open; "final" clears it. */
  kind: "part" | "final";
};

export type Installment = {
  id: string;
  /** Academic year, e.g. "2026-27". */
  year: string;
  label: string;
  /** Months (yyyy-mm) this installment covers. */
  months: string[];
  due: string;
  payments: Payment[];
};

export type FeeAccount = {
  student: Student;
  /** Plan for the current academic year. */
  plan: Plan;
  /** Plan chosen in each academic year since enrollment. */
  plans: Record<string, Plan>;
  /** Academic years on record, oldest first. */
  years: string[];
  installments: Installment[];
};

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
  return { cleared: !!clearedAt, clearedAt, late, delay, status };
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
    if (!s.cleared && s.late > 0) n += i.months.length === 1 ? 1 : Math.min(i.months.length, 1 + Math.floor(s.late / 30));
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
  { key: "parts", label: "Pays in parts", hint: "Paid one installment in five or more in parts" },
  { key: "defaulter", label: "Chronic defaulter", hint: `${DEFAULTER_MONTHS}+ months unpaid right now` },
];
export const behaviorOf = (k: BehaviorKey) => behaviors.find((b) => b.key === k)!;

export type MonthState = InstallmentStatus | "covered";

/**
 * A student's installment behavior record. With no `year` it covers every year since enrollment;
 * the month strip always shows one academic year (the given one, or the current one).
 */
export function behaviorFor(a: FeeAccount, year?: string, on = AS_OF) {
  const pool = year ? a.installments.filter((i) => i.year === year) : a.installments;
  const billed = pool.filter((i) => i.due <= on || i.payments.length > 0).map((i) => ({ i, s: settle(i, on) }));
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
  const key: BehaviorKey = months >= DEFAULTER_MONTHS ? "defaulter" : due && partials / due >= 0.2 ? "parts" : rate >= 95 && !unpaid ? "punctual" : rate >= 75 ? "mostly" : "late";
  // Month-by-month record; months inside an upfront installment share its state.
  const stripYear = year ?? ACADEMIC_YEAR;
  const timeline = academicMonths(Number(stripYear.slice(0, 4))).map((m) => {
    const i = a.installments.find((x) => x.months.includes(m));
    if (!i) return { month: m, state: null, delay: 0 };
    const s = settle(i, on);
    const state: MonthState = i.months[0] !== m && s.cleared ? "covered" : s.status;
    return { month: m, state, delay: s.delay };
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
    stripYear,
  };
}

export type Behavior = ReturnType<typeof behaviorFor>;


export type PaymentTiming = "ontime" | "late" | "part";

export const timings: { key: PaymentTiming; label: string; hint: string }[] = [
  { key: "ontime", label: "On time", hint: "Full payment by the due date" },
  { key: "late", label: "Late", hint: "Full payment after the due date" },
  { key: "part", label: "Part payment", hint: "Installment paid in parts" },
];

export type PaymentEntry = { a: FeeAccount; i: Installment; p: Payment; late: number; timing: PaymentTiming };

const entry = (a: FeeAccount, i: Installment, p: Payment): PaymentEntry => {
  const late = Math.max(0, daysBetween(i.due, p.at));
  return { a, i, p, late, timing: p.kind === "part" ? "part" : late > 0 ? "late" : "ontime" };
};

/** Every payment the student has made since enrollment, newest first, with its installment and timing. */
export function paymentRecords(a: FeeAccount) {
  return a.installments.flatMap((i) => i.payments.map((p) => entry(a, i, p))).sort((x, y) => y.p.at.localeCompare(x.p.at));
}

/** Every payment by every student since they joined, newest first. */
export const allPayments = (list: FeeAccount[]) => list.flatMap((a) => a.installments.flatMap((i) => i.payments.map((p) => entry(a, i, p)))).sort((x, y) => y.p.at.localeCompare(x.p.at));

/* ---------------- Mock ledger ---------------- */

type Habit = "prompt" | "late" | "partial" | "lapse" | "defaulter";

function payment(seed: number, k: number, date: string, kind: Payment["kind"]): Payment {
  const r = (n: number) => hash(seed * 97 + k, n);
  return {
    id: `p${seed}-${k}`,
    at: `${date}T${pad(9 + Math.floor(r(2) * 7))}:${pad(Math.floor(r(3) * 60))}`,
    kind,
  };
}

function planFor(seed: number, start: number): Plan {
  const r = start === CURRENT_START ? hash(seed * 7 + 5, 211) : hash(seed * 11 + start, 523);
  return r < 0.06 ? "annual" : r < 0.18 ? "biannual" : "monthly";
}

function buildAccount(s: Student): FeeAccount {
  const r = (n: number) => hash(s.seed * 7 + n, 211);
  const b = r(6);
  // A student's habit is stable across years; upfront payers are reliable.
  const habitFor = (plan: Plan): Habit =>
    plan !== "monthly" ? (b < 0.85 ? "prompt" : "late") : b < 0.62 ? "prompt" : b < 0.8 ? "late" : b < 0.88 ? "partial" : b < 0.94 ? "lapse" : "defaulter";
  // Even prompt payers slip occasionally; late payers are sometimes on time.
  const slip = r(8);
  const first = Number(s.enrolled.slice(0, 4));
  const plansByYear: Record<string, Plan> = {};
  const installments: Installment[] = [];
  let k = 0;

  for (let start = first; start <= CURRENT_START; start++) {
    const year = yearLabel(start);
    const plan = planFor(s.seed, start);
    plansByYear[year] = plan;
    const months = academicMonths(start);
    const groups = plan === "monthly" ? months.map((m) => [m]) : plan === "biannual" ? [months.slice(0, 6), months.slice(6)] : [months];
    const yearInst: Installment[] = groups.map((ms, gi) => ({
      id: `IN-${ms[0].slice(2, 4)}${ms[0].slice(5, 7)}-${pad(s.seed, 4)}`,
      year,
      label: plan === "monthly" ? monthLabel(ms[0]) : plan === "biannual" ? `Installment ${gi + 1} (${monthShort(ms[0])} - ${monthShort(ms.at(-1)!)} ${year})` : `Full Annual ${year}`,
      months: ms,
      due: `${ms[0]}-${DUE_DAY}`,
      payments: [],
    }));

    const habit = habitFor(plan);
    const current = start === CURRENT_START;
    // Lapses and defaults only exist in the current year; earlier years were settled in full.
    const lastDue = yearInst.reduce((idx, i, n) => (i.due < AS_OF ? n : idx), -1);
    const stopped = current ? (habit === "defaulter" ? 2 + Math.floor(r(7) * 3) : habit === "lapse" ? 1 : 0) : 0;
    const lateBias = habit === "defaulter" || habit === "lapse" ? 0.5 : habit === "late" ? 0.75 : habit === "prompt" ? slip * 0.12 : 0.2;

    yearInst.forEach((inst, n) => {
      const rk = (x: number) => hash(s.seed * 31 + k, 300 + x);
      const dueDay = toDay(inst.due);
      const pay = (day: number, kind: Payment["kind"], j = 0) => {
        const date = fromDay(day);
        if (date <= AS_OF) inst.payments.push(payment(s.seed, k * 3 + j, date, kind));
      };
      k++;
      if (stopped && n > lastDue - stopped && n <= lastDue + 1) return;
      if (habit === "partial" && rk(2) < 0.6) {
        pay(dueDay - 6 + Math.floor(rk(3) * 8), "part", 0);
        pay(dueDay + 18 + Math.floor(rk(4) * 40), "final", 1);
      } else if (rk(1) < lateBias) {
        pay(dueDay + 2 + Math.floor(rk(5) * 38), "final");
      } else {
        pay(dueDay - 14 + Math.floor(rk(6) * 14), "final");
      }
    });
    installments.push(...yearInst);
  }

  const years = Object.keys(plansByYear);
  return { student: s, plan: plansByYear[ACADEMIC_YEAR], plans: plansByYear, years, installments };
}

export const accounts: FeeAccount[] = students.map(buildAccount);

/**
 * Whether a payment date falls in the chosen academic year and month.
 * `month` is "all", a calendar month "yyyy-mm" (when a year is chosen) or "mm" (that month in any year).
 */
export const paidIn = (at: string, year: string, month: string) =>
  (year === "all" || academicYearOf(at) === year) && (month === "all" || (month.length === 2 ? at.slice(5, 7) === month : at.startsWith(month)));
