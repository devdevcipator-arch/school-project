"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Pagination, Select, Toast, fieldClass, ghostBtn, ghostSm, type ToastData } from "@/components/dashboard/controls";
import { Bar } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  CURRENT_PERIOD,
  DEFAULTER_MONTHS,
  accounts as seed,
  applyPayment,
  netOf,
  overdueBalance,
  paidOf,
  periods,
  planOf,
  plans,
  recordFor,
  rs,
  rsShort,
  shortDate,
  unpaidMonths,
  type FeeAccount,
  type FeeRecord,
  type FeeStatus,
  type Installment,
  type Payment,
} from "@/lib/fees";
import { sectionLabel, sections } from "@/lib/students";
import { downloadFeeCsv, printChallan, printFeeReport, printReceipt } from "./documents";
import FeeLedger from "./FeeLedger";
import { Aging, FeeStatusBadge } from "./parts";
import PaymentForm, { type ManualPayment } from "./PaymentForm";
import ReminderPanel, { type Channel } from "./ReminderPanel";

const PAGE_SIZE = 15;
const noop = () => () => {};

const severity: Record<FeeStatus, number> = { defaulter: 0, delayed: 1, partial: 2, pending: 3, paid: 4 };
const order = (r: FeeRecord) => severity[r.status] * 1e9 - r.balance;

const tabs: { key: "all" | Exclude<FeeStatus, "pending">; label: string; dot?: string }[] = [
  { key: "all", label: "All Records" },
  { key: "paid", label: "Paid", dot: "bg-ok" },
  { key: "partial", label: "Partially Paid", dot: "bg-warn" },
  { key: "delayed", label: "Delayed / Overdue", dot: "bg-serious" },
  { key: "defaulter", label: "Defaulters", dot: "bg-danger" },
];

/* ---------------- KPI tiles ---------------- */

function Kpi({ label, value, icon, note, tone = "from-primary to-accent", children }: { label: string; value: string; icon: string; note: string; tone?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(6,30,41,.1)]">
      <div className="flex items-center gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-135 text-surface ${tone}`}>
          <Icon d={icon} className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[.8rem] font-bold text-ink/55">{label}</p>
          <p className="text-[1.6rem] font-extrabold leading-tight tracking-tight">{value}</p>
        </div>
      </div>
      {children}
      <p className="text-[.76rem] text-ink/55">{note}</p>
    </div>
  );
}

/* ---------------- Row actions ---------------- */

type Actions = {
  alerted: Set<string>;
  onLedger: (a: FeeAccount) => void;
  onPay: (a: FeeAccount) => void;
  onAlert: (r: FeeRecord) => void;
};

const icons = {
  ledger: "M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6",
  pay: "M3 7h18v10H3z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z",
  alert: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0",
  sent: "M5 12l4 4 10-10",
};

function RowActions({ r, alerted, onLedger, onPay, onAlert, compact = false }: Actions & { r: FeeRecord; compact?: boolean }) {
  const s = r.account.student;
  const sent = alerted.has(s.id);
  const owes = r.balance > 0;
  const items = [
    { key: "ledger", label: "View Ledger / Challan", short: "Ledger", run: () => onLedger(r.account), off: false },
    { key: "pay", label: "Log Manual Payment", short: "Log Payment", run: () => onPay(r.account), off: !owes },
    { key: sent ? "sent" : "alert", label: sent ? "Fee alert sent today" : "Send Fee Alert", short: sent ? "Alert Sent" : "Send Alert", run: () => onAlert(r), off: !owes || sent },
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {items.map((a) => (
        <button key={a.key} type="button" onClick={a.run} disabled={a.off} title={a.label} aria-label={`${a.label}: ${s.name}`} className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40 ${a.key === "sent" ? "text-ok" : ""}`}>
          <Icon d={icons[a.key]} className="size-4" />
          {!compact && <span>{a.short}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Directory views ---------------- */

function PlanCell({ r }: { r: FeeRecord }) {
  const i = r.current[0];
  const perMonth = i ? i.tuition / i.months.length : 0;
  const extras = r.current.reduce((n, x) => n + x.extras.reduce((m, l) => m + l.amount, 0), 0);
  return (
    <div className="grid gap-0.5 text-[.78rem]">
      <span className="font-bold text-ink">{r.current.length > 1 ? `${r.current.length} installments` : (i?.label ?? "None")}</span>
      <span className="text-ink/55">
        {planOf(r.account.plan).short} · Tuition {rs(perMonth)}/mo
      </span>
      {(extras > 0 || r.discount > 0) && (
        <span className="text-ink/55">
          {extras > 0 && <span>+{rs(extras)} dues</span>}
          {extras > 0 && r.discount > 0 && " · "}
          {r.discount > 0 && <span className="text-ok">-{rs(r.discount)} disc.</span>}
        </span>
      )}
    </div>
  );
}

function Amounts({ r, stacked = false }: { r: FeeRecord; stacked?: boolean }) {
  const items = [
    { label: "Due", value: rs(r.due), cls: "text-ink" },
    { label: "Paid", value: rs(r.paid), cls: "text-ok" },
    { label: "Balance", value: rs(r.balance), cls: r.balance ? "text-danger" : "text-ink/45" },
  ];
  return (
    <dl className={stacked ? "grid gap-0.5 text-[.78rem]" : "grid grid-cols-3 gap-2 rounded-xl bg-surface/70 p-3 text-[.78rem]"}>
      {items.map((i) => (
        <div key={i.label} className={stacked ? "flex justify-between gap-3" : ""}>
          <dt className="text-ink/50">{i.label}</dt>
          <dd className={`whitespace-nowrap font-extrabold ${i.cls}`}>{i.value}</dd>
        </div>
      ))}
      {r.arrears > 0 && <p className={`text-[.72rem] text-danger ${stacked ? "" : "col-span-3"}`}>Includes {rs(r.arrears)} arrears</p>}
    </dl>
  );
}

function FeeCard({ r, ...actions }: Actions & { r: FeeRecord }) {
  const s = r.account.student;
  return (
    <li className={`flex flex-col rounded-[18px] border bg-white p-5 transition-[box-shadow,translate] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,30,41,.08)] ${r.status === "defaulter" ? "border-danger/30" : "border-ink/8"}`}>
      <div className="flex items-start gap-3">
        <Avatar name={s.name} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => actions.onLedger(r.account)} className="block max-w-full cursor-pointer truncate text-left text-[1rem] font-extrabold tracking-tight hover:text-primary">
            {s.name}
          </button>
          <span className="text-[.76rem] text-ink/50">
            Roll {s.rollNo} · {sectionLabel(s.section)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <FeeStatusBadge r={r} />
        <Aging r={r} />
      </div>
      <div className="mt-3">
        <Amounts r={r} />
      </div>
      <div className="mb-4 mt-3 grid gap-1 text-[.8rem] text-ink/65">
        <span className="truncate">
          <Icon d="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" className="mr-1.5 inline size-4 align-[-3px] text-accent" />
          {s.guardian} ·{" "}
          <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-primary">
            {s.phone}
          </a>
        </span>
        <span>
          <Icon d="M8 3v3 M16 3v3 M4 7h16v13H4z" className="mr-1.5 inline size-4 align-[-3px] text-accent" />
          {planOf(r.account.plan).short} plan{r.current[0] && ` · ${r.current[0].label}`}{r.dueDate && ` · due ${shortDate(r.dueDate)}`}
        </span>
      </div>
      <div className="mt-auto flex justify-end border-t border-ink/8 pt-3">
        <RowActions r={r} {...actions} />
      </div>
    </li>
  );
}

function FeeTable({ list, ...actions }: Actions & { list: FeeRecord[] }) {
  return (
    // The table scrolls inside its own frame so the header row stays pinned.
    <div className="max-h-[72vh] overflow-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[1180px] text-left text-[.86rem]">
        <thead className="sticky top-0 z-10 bg-[#eef0f0] text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/55 shadow-[0_1px_0_rgba(6,30,41,.08)]">
          <tr>
            <th scope="col" className="px-5 py-3.5">Student</th>
            <th scope="col" className="px-3 py-3.5">Guardian contact</th>
            <th scope="col" className="px-3 py-3.5">Installment plan</th>
            <th scope="col" className="px-3 py-3.5">Due date & aging</th>
            <th scope="col" className="px-3 py-3.5">Amount</th>
            <th scope="col" className="px-3 py-3.5">Status</th>
            <th scope="col" className="px-3 py-3.5 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((r) => {
            const s = r.account.student;
            return (
              <tr key={s.id} className={`align-middle transition-colors hover:bg-surface/50 ${r.status === "defaulter" ? "bg-danger/3" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} />
                    <div className="min-w-0">
                      <button type="button" onClick={() => actions.onLedger(r.account)} className="cursor-pointer whitespace-nowrap text-left font-bold hover:text-primary">
                        {s.name}
                      </button>
                      <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[.76rem] text-ink/50">
                        Roll {s.rollNo}
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[.7rem] font-bold text-primary">{sectionLabel(s.section)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-[.8rem]">
                  <span className="block max-w-[180px] truncate text-ink/75">{s.guardian}</span>
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="whitespace-nowrap text-ink/50 hover:text-primary">
                    {s.phone}
                  </a>
                </td>
                <td className="px-3 py-3.5">
                  <PlanCell r={r} />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5">
                  {r.dueDate && <span className="block text-[.8rem] font-semibold">{shortDate(r.dueDate)}</span>}
                  <Aging r={r} />
                </td>
                <td className="min-w-[170px] px-3 py-3.5">
                  <Amounts r={r} stacked />
                </td>
                <td className="px-3 py-3.5">
                  <FeeStatusBadge r={r} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end">
                    <RowActions r={r} {...actions} compact />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Export menu ---------------- */

function ExportMenu({ onPdf, onCsv }: { onPdf: () => void; onCsv: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  const item = "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[.86rem] font-semibold transition-colors hover:bg-primary/6";
  return (
    <div ref={ref} className="relative max-sm:flex-1">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${ghostBtn} w-full`}>
        <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
        Export Fee Report
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[230px] animate-fade-in rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_20px_50px_rgba(6,30,41,.16)]">
          <button type="button" className={item} onClick={() => (setOpen(false), onPdf())}>
            <Icon d="M7 3h7l5 5v13H7z M14 3v5h5" className="size-4 text-danger" />
            PDF report (print)
          </button>
          <button type="button" className={item} onClick={() => (setOpen(false), onCsv())}>
            <Icon d="M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14" className="size-4 text-ok" />
            Excel spreadsheet (.csv)
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Board ---------------- */

export default function FeesBoard() {
  const [list, setList] = useState<FeeAccount[]>(seed);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [section, setSection] = useState("all");
  const [periodKey, setPeriodKey] = useState(CURRENT_PERIOD);
  const [plan, setPlan] = useState("all");
  const [page, setPage] = useState(1);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [alerted, setAlerted] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<ToastData | null>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const closeToast = useCallback(() => setToast(null), []);
  const period = periods.find((p) => p.key === periodKey)!;

  const records = useMemo(() => list.map((a) => recordFor(a, period)), [list, period]);

  const kpi = useMemo(() => {
    const dueIn = list.flatMap((a) => a.installments.filter((i) => period.months.includes(i.due.slice(0, 7))));
    const expected = dueIn.reduce((n, i) => n + netOf(i), 0);
    const collected = dueIn.reduce((n, i) => n + Math.min(netOf(i), paidOf(i)), 0);
    const late = list.map((a) => ({ a, owed: overdueBalance(a) })).filter((x) => x.owed > 0);
    const critical = list.filter((a) => unpaidMonths(a) >= DEFAULTER_MONTHS);
    return {
      expected,
      collected,
      pct: expected ? Math.round((collected / expected) * 1000) / 10 : 0,
      challans: dueIn.length,
      overdue: late.reduce((n, x) => n + x.owed, 0),
      lateStudents: late.length,
      critical: critical.length,
      criticalOwed: critical.reduce((n, a) => n + overdueBalance(a), 0),
    };
  }, [list, period]);

  // Everything except the status tab, so tab counts reflect the other filters.
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return records.filter((r) => {
      const s = r.account.student;
      if (section !== "all" && s.section !== section) return false;
      if (plan !== "all" && r.account.plan !== plan) return false;
      if (!q) return true;
      if (`${s.name} ${s.regId} ${s.guardian}`.toLowerCase().includes(q)) return true;
      if (r.account.installments.some((i) => i.challan.toLowerCase().includes(q) || i.payments.some((p) => p.receipt.toLowerCase().includes(q)))) return true;
      return digits !== "" && (String(s.rollNo) === digits || (digits.length >= 4 && s.phone.replace(/\D/g, "").includes(digits)));
    });
  }, [records, query, section, plan]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length };
    for (const r of scoped) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [scoped]);

  const filtered = useMemo(() => scoped.filter((r) => tab === "all" || r.status === tab).sort((a, b) => order(a) - order(b)), [scoped, tab]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const filter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const filtersOn = query || section !== "all" || plan !== "all" || tab !== "all" || periodKey !== CURRENT_PERIOD;
  const reset = () => {
    setQuery("");
    setSection("all");
    setPlan("all");
    setTab("all");
    setPeriodKey(CURRENT_PERIOD);
    setPage(1);
  };
  const scope = `${section === "all" ? "All classes" : sectionLabel(section)}${plan === "all" ? "" : ` · ${planOf(plan as FeeAccount["plan"]).label}`}`;

  const popup = (ok: boolean) => !ok && setToast({ text: "Allow pop-ups for this site to open printable documents." });

  const actions: Actions = {
    alerted,
    onLedger: (a) => setLedgerId(a.student.id),
    onPay: (a) => setPayingId(a.student.id),
    onAlert: (r) => {
      setAlerted((s) => new Set(s).add(r.account.student.id));
      setToast({ text: `Fee alert sent to ${r.account.student.guardian} (${r.account.student.phone}) for ${rs(r.balance)}.` });
    },
  };

  const recordPayment = (a: FeeAccount, p: ManualPayment) => {
    const updated = applyPayment(a, p.amount, { at: `${p.date}T12:00`, method: p.method, ref: p.ref || undefined, note: p.note || undefined });
    setList((l) => l.map((x) => (x.student.id === a.student.id ? updated : x)));
    setToast({ text: `${rs(p.amount)} recorded for ${a.student.name} via ${p.method}.`, action: { label: "View ledger", run: () => (setLedgerId(a.student.id), setToast(null)) } });
  };

  const sendReminders = (to: FeeRecord[], via: Channel[]) => {
    setAlerted((s) => {
      const next = new Set(s);
      to.forEach((r) => next.add(r.account.student.id));
      return next;
    });
    setToast({ text: `Reminders sent to ${to.length} guardians via ${via.join(", ")}.` });
  };

  const ledger = ledgerId ? list.find((a) => a.student.id === ledgerId) : undefined;
  const paying = payingId ? list.find((a) => a.student.id === payingId) : undefined;
  const overdueInScope = scoped.filter((r) => r.overdueDays > 0 && r.balance > 0).length;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      {/* The page title lives in the portal top bar; this row keeps the page actions. */}
      <header className="flex flex-wrap justify-end gap-2.5">
        <ExportMenu onPdf={() => popup(printFeeReport(filtered, period.label, scope))} onCsv={() => downloadFeeCsv(filtered, period.label)} />
        <button type="button" onClick={() => setReminding(true)} className={buttonClass("primary", "lg", "cursor-pointer max-sm:w-full")}>
          <Icon d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0" className="size-5" />
          Send Defaulter Reminders
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Expected Revenue" value={rsShort(kpi.expected)} icon="M3 6h18v12H3z M3 10h18 M7 15h3" note={`${period.label} target · ${kpi.challans} challans issued`} />
        <Kpi label="Total Collected Fees" value={rsShort(kpi.collected)} icon="M5 12l4 4 10-10" note={`${kpi.pct}% of target · ${rsShort(Math.max(0, kpi.expected - kpi.collected))} still to collect`}>
          <Bar value={kpi.pct} fill="bg-ok" label={`${kpi.pct}% of expected revenue collected`} />
        </Kpi>
        <Kpi label="Delayed & Overdue Fees" value={rsShort(kpi.overdue)} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" tone="from-[#a84f12] to-serious" note={`${kpi.lateStudents} students past the due date`} />
        <Kpi label="Critical Defaulters" value={String(kpi.critical)} icon="M12 4l9 16H3z M12 10v4 M12 17h.01" tone="from-[#8e2a1f] to-danger" note={`${DEFAULTER_MONTHS}+ months unpaid · ${rsShort(kpi.criticalOwed)} outstanding`} />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <label className="relative">
          <span className="sr-only">Search fee records</span>
          <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
          <input
            type="search"
            value={query}
            onChange={(e) => filter(setQuery)(e.target.value)}
            placeholder="Search by student name, roll no., registration / challan ID or parent phone"
            className={`${fieldClass} w-full pl-10`}
          />
        </label>

        <div role="tablist" aria-label="Payment status" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => filter(setTab)(t.key)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition-colors ${
                  on ? "border-primary bg-primary text-surface" : "border-ink/12 text-ink/70 hover:border-accent hover:text-primary"
                }`}
              >
                {t.dot && <span aria-hidden className={`size-2.5 rounded-full ${t.dot}`} />}
                {t.label}
                <span className={`text-[.72rem] ${on ? "text-surface/70" : "text-ink/40"}`}>{counts[t.key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-[1fr_1.2fr_1fr_auto]">
          <Select label="Class & section" value={section} onChange={filter(setSection)}>
            <option value="all">All classes</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {sectionLabel(s)}
              </option>
            ))}
          </Select>
          <Select label="Month / academic term" value={periodKey} onChange={filter(setPeriodKey)}>
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select label="Installment plan" value={plan} onChange={filter(setPlan)} className="max-lg:col-span-2">
            <option value="all">All installment plans</option>
            {plans.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
          <button type="button" onClick={reset} disabled={!filtersOn} className={`${ghostBtn} max-lg:col-span-2 disabled:pointer-events-none disabled:opacity-45`}>
            <Icon d="M4 4v6h6 M4.5 15a8 8 0 1 0 1.9-8.3L4 10" className="size-[18px]" />
            Reset
          </button>
        </div>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[.8rem] text-ink/55" aria-live="polite">
          <span>
            <strong className="text-ink">{filtered.length}</strong> {filtered.length === 1 ? "record" : "records"} · {period.label} · {scope}
          </span>
          {counts.pending ? <span>{counts.pending} not yet due (shown under All Records)</span> : null}
          {overdueInScope > 0 && <span className="font-semibold text-danger">{overdueInScope} overdue in this view</span>}
        </p>

        {visible.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <Icon d="M3 6h18v12H3z M3 10h18 M7 15h3" className="size-7" />
            </span>
            <p className="font-bold">No fee records match these filters</p>
            <p className="max-w-[380px] text-[.86rem] text-ink/55">Try another class, period or status, or search by challan ID or parent phone.</p>
            <button type="button" onClick={reset} className={ghostBtn}>
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {visible.map((r) => (
                <FeeCard key={r.account.student.id} r={r} {...actions} />
              ))}
            </ul>
            <div className="max-lg:hidden">
              <FeeTable list={visible} {...actions} />
            </div>
          </>
        )}

        <Pagination page={current} pages={pages} total={filtered.length} size={PAGE_SIZE} noun="records" onPage={setPage} />
      </section>

      {hydrated && ledger && (
        <FeeLedger
          key={ledger.student.id}
          account={ledger}
          record={recordFor(ledger, period)}
          onPay={() => setPayingId(ledger.student.id)}
          onChallan={(items: Installment[]) => popup(printChallan(ledger, items))}
          onReceipt={(i: Installment, p: Payment) => popup(printReceipt(ledger, i, p))}
          onClose={() => setLedgerId(null)}
        />
      )}
      {hydrated && paying && <PaymentForm key={paying.student.id} account={paying} onSave={(p) => recordPayment(paying, p)} onClose={() => setPayingId(null)} />}
      {hydrated && reminding && <ReminderPanel records={scoped} scope={scope} onSend={sendReminders} onClose={() => setReminding(false)} />}
      {toast && <Toast {...toast} onDone={closeToast} />}
    </main>
  );
}
