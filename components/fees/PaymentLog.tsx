"use client";

import { useMemo, useState } from "react";
import { Pagination, Select, fieldClass, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { Icon } from "@/components/ui/Icon";
import { academicYearOf, allPayments, paidIn, shortDate, stamp, timings, type FeeAccount, type PaymentEntry, type PaymentTiming } from "@/lib/fees";
import { sectionLabel, sections } from "@/lib/students";
import { downloadPaymentsCsv } from "./documents";
import PeriodSelects from "./PeriodSelects";

const PAGE_SIZE = 20;

type Sort = "newest" | "oldest" | "late" | "name";
const sorts: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "late", label: "Most days late" },
  { key: "name", label: "Student name (A-Z)" },
];

const timingDot: Record<PaymentTiming, string> = { ontime: "bg-ok", late: "bg-serious", part: "bg-warn" };

function Timing({ e }: { e: PaymentEntry }) {
  if (e.timing === "part") return <Badge tone="warn">Part payment{e.late ? ` · ${e.late}d after due` : ""}</Badge>;
  return e.late > 0 ? <Badge tone="serious">Late · {e.late} days</Badge> : <Badge tone="ok">On time</Badge>;
}

/** Every payment by every student since they joined the platform. */
export default function PaymentLog({ accounts, onView }: { accounts: FeeAccount[]; onView: (a: FeeAccount) => void }) {
  const all = useMemo(() => allPayments(accounts), [accounts]);
  const years = useMemo(() => [...new Set(all.map((e) => academicYearOf(e.p.at)))].sort().reverse(), [all]);
  const [query, setQuery] = useState("");
  const [timing, setTiming] = useState<PaymentTiming | "all">("all");
  const [section, setSection] = useState("all");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);

  // Everything except the timing tab, so tab counts follow the other filters.
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return all.filter(({ a, p }) => {
      const s = a.student;
      if (section !== "all" && s.section !== section) return false;
      if (!paidIn(p.at, year, month)) return false;
      if (!q) return true;
      if (`${s.name} ${s.regId} ${s.guardian}`.toLowerCase().includes(q)) return true;
      return digits !== "" && (String(s.rollNo) === digits || (digits.length >= 4 && s.phone.replace(/\D/g, "").includes(digits)));
    });
  }, [all, query, section, year, month]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length };
    for (const e of scoped) c[e.timing] = (c[e.timing] ?? 0) + 1;
    return c;
  }, [scoped]);

  const filtered = useMemo(() => {
    const list = scoped.filter((e) => timing === "all" || e.timing === timing);
    if (sort === "oldest") return [...list].reverse();
    if (sort === "late") return [...list].sort((x, y) => y.late - x.late || y.p.at.localeCompare(x.p.at));
    if (sort === "name") return [...list].sort((x, y) => x.a.student.name.localeCompare(y.a.student.name) || y.p.at.localeCompare(x.p.at));
    return list;
  }, [scoped, timing, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const filtersOn = query || timing !== "all" || section !== "all" || year !== "all" || month !== "all" || sort !== "newest";
  const reset = () => {
    setQuery("");
    setTiming("all");
    setSection("all");
    setYear("all");
    setMonth("all");
    setSort("newest");
    setPage(1);
  };

  const students = new Set(scoped.map((e) => e.a.student.id)).size;
  const first = scoped.at(-1);
  const pct = scoped.length ? Math.round(((counts.ontime ?? 0) / scoped.length) * 100) : 0;
  const label = [year === "all" ? "all years" : year, month === "all" ? "" : month, section === "all" ? "all classes" : sectionLabel(section)].filter(Boolean).join(" ");

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.05rem] font-extrabold tracking-tight">All payment records</h2>
          <p className="mt-0.5 text-[.84rem] text-ink/55">
            {scoped.length.toLocaleString("en-US")} payments by {students} students{first && ` since ${shortDate(first.p.at)}`} · {pct}% on time
          </p>
        </div>
        <button type="button" disabled={!filtered.length} onClick={() => downloadPaymentsCsv(filtered, label)} className={`${ghostBtn} disabled:pointer-events-none disabled:opacity-45 max-sm:w-full`}>
          <Icon d="M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14" className="size-[18px]" />
          Export to Excel
        </button>
      </div>

      <label className="relative">
        <span className="sr-only">Search payment records</span>
        <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
        <input type="search" value={query} onChange={(e) => filter(setQuery)(e.target.value)} placeholder="Search by student name, roll no., registration ID or parent phone" className={`${fieldClass} w-full pl-10`} />
      </label>

      <div role="tablist" aria-label="Payment timing" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {[{ key: "all" as const, label: "All payments" }, ...timings].map((t) => {
          const on = timing === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => filter(setTiming)(t.key)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition-colors ${
                on ? "border-primary bg-primary text-surface" : "border-ink/12 text-ink/70 hover:border-accent hover:text-primary"
              }`}
            >
              {t.key !== "all" && <span aria-hidden className={`size-2.5 rounded-full ${timingDot[t.key]}`} />}
              {t.label}
              <span className={`text-[.72rem] ${on ? "text-surface/70" : "text-ink/40"}`}>{(counts[t.key] ?? 0).toLocaleString("en-US")}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-[1fr_1fr_1.2fr_1fr_auto]">
        <Select label="Class & section" value={section} onChange={filter(setSection)}>
          <option value="all">All classes</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {sectionLabel(s)}
            </option>
          ))}
        </Select>
        <PeriodSelects years={years} year={year} month={month} onYear={filter(setYear)} onMonth={filter(setMonth)} />
        <Select label="Sort payments" value={sort} onChange={filter((v: string) => setSort(v as Sort))}>
          {sorts.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </Select>
        <button type="button" onClick={reset} disabled={!filtersOn} className={`${ghostBtn} max-lg:col-span-2 disabled:pointer-events-none disabled:opacity-45`}>
          <Icon d="M4 4v6h6 M4.5 15a8 8 0 1 0 1.9-8.3L4 10" className="size-[18px]" />
          Reset
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Icon d="M3 6h18v12H3z M3 10h18 M7 15h3" className="size-7" />
          </span>
          <p className="font-bold">No payments match these filters</p>
          <button type="button" onClick={reset} className={ghostBtn}>
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {visible.map((e) => (
              <li key={e.p.id} className="flex flex-col gap-3 rounded-[18px] border border-ink/8 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={e.a.student.name} />
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => onView(e.a)} className="block max-w-full cursor-pointer truncate text-left font-extrabold hover:text-primary">
                      {e.a.student.name}
                    </button>
                    <span className="text-[.76rem] text-ink/50">
                      Roll {e.a.student.rollNo} · {sectionLabel(e.a.student.section)}
                    </span>
                  </div>
                  <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${timingDot[e.timing]}`} />
                </div>
                <div className="rounded-xl bg-surface/70 px-3 py-2.5 text-[.8rem]">
                  <p className="font-bold">{e.i.label}</p>
                  <p className="text-ink/55">
                    Paid {stamp(e.p.at)} · due {shortDate(e.i.due)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Timing e={e} />
                  <span className="text-[.76rem] text-ink/55">{e.p.kind === "final" ? "Full payment" : "Part payment"}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="max-h-[72vh] overflow-auto rounded-[18px] border border-ink/8 max-lg:hidden">
            <table className="w-full min-w-[980px] text-left text-[.86rem]">
              <thead className="sticky top-0 z-10 bg-[#eef0f0] text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/55 shadow-[0_1px_0_rgba(6,30,41,.08)]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Paid on</th>
                  <th scope="col" className="px-3 py-3.5">Student</th>
                  <th scope="col" className="px-3 py-3.5">Installment</th>
                  <th scope="col" className="px-3 py-3.5">Type</th>
                  <th scope="col" className="px-3 py-3.5">Timing</th>
                  <th scope="col" className="px-3 py-3.5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {visible.map((e) => {
                  const s = e.a.student;
                  return (
                    <tr key={e.p.id} className="align-middle transition-colors hover:bg-surface/50">
                      <td className="whitespace-nowrap px-5 py-3 font-semibold">{stamp(e.p.at)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <div className="min-w-0">
                            <button type="button" onClick={() => onView(e.a)} className="cursor-pointer whitespace-nowrap text-left font-bold hover:text-primary">
                              {s.name}
                            </button>
                            <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[.76rem] text-ink/50">
                              Roll {s.rollNo}
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[.7rem] font-bold text-primary">{sectionLabel(s.section)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-semibold">{e.i.label}</span>
                        <span className="text-[.74rem] text-ink/50">
                          {e.i.year} · due {shortDate(e.i.due)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink/70">{e.p.kind === "final" ? "Full payment" : "Part payment"}</td>
                      <td className="px-3 py-3">
                        <Timing e={e} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => onView(e.a)} className={ghostSm} aria-label={`View payment records: ${s.name}`}>
                          <Icon d="M3 6h18v12H3z M3 10h18 M7 15h3" className="size-4" />
                          Records
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination page={current} pages={pages} total={filtered.length} size={PAGE_SIZE} noun="payments" onPage={setPage} />
    </section>
  );
}
