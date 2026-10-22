"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Select, fieldClass, ghostSm } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/ui";
import { useNoticeList } from "@/components/announcements/store";
import { AudienceTag, PriorityBadge } from "@/components/announcements/tags";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { Icon } from "@/components/ui/Icon";
import { categories, formatDate, formatSize, plainText, safeHtml, type Notice, type Priority } from "@/lib/announcements";
import { studentRecord } from "@/lib/student";

type Tab = "all" | "school" | "students" | "class";

const myGrade = `Grade ${parseInt(studentRecord.section)}`;
const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All Notices" },
  { key: "school", label: "School-Wide" },
  { key: "students", label: "Students" },
  { key: "class", label: myGrade },
];

/** What the principal's audience picker means for this student: never staff notices or drafts. */
const isForMe = (n: Notice, now: number) =>
  (n.status === "published" || (n.status === "scheduled" && Date.parse(n.date) <= now)) &&
  (n.audience === "school" || n.audience === "students" || (n.audience === "classes" && n.targets.includes(myGrade)));

const inTab = (n: Notice, t: Tab) => t === "all" || (t === "school" ? n.audience === "school" : t === "students" ? n.audience === "students" : n.audience === "classes");

const accent: Record<Priority, string> = { urgent: "bg-danger", important: "bg-warn", normal: "bg-transparent" };

// Scheduled notices appear once their time passes on the viewer's clock (client only).
const noop = () => () => {};
const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

function NoticeCard({ n }: { n: Notice }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      className={`relative overflow-hidden rounded-[18px] border bg-white p-5 transition-[border-color,box-shadow,translate] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,30,41,.08)] ${
        n.priority === "urgent" ? "border-danger/30" : n.priority === "important" ? "border-warn/40" : "border-ink/8"
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${accent[n.priority]}`} />
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={n.priority} />
        <AudienceTag audience={n.audience} targets={n.targets} />
        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[.72rem] font-bold text-ink/60">{n.category}</span>
        {n.pinned && (
          <span className="ml-auto inline-flex items-center gap-1 text-[.74rem] font-bold text-primary">
            <Icon d="M9 4h6l-1 5 3 3v2H7v-2l3-3z M12 14v6" className="size-3.5" />
            Pinned
          </span>
        )}
      </div>
      <h3 className="mt-3 text-[1.02rem] font-extrabold leading-snug tracking-tight">{n.title}</h3>
      {open ? (
        <div
          className="mt-2 text-[.9rem] leading-relaxed text-ink/75 [&_li]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-2 [&_strong]:text-ink [&_ul]:mt-1.5 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: safeHtml(n.body) }}
        />
      ) : (
        <p className="mt-1 line-clamp-2 text-[.88rem] leading-relaxed text-ink/65">{plainText(n.body)}</p>
      )}

      {open && n.attachments.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {n.attachments.map((a) => (
            <li key={a.name} title="Downloads open once file storage is connected" className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-surface/60 px-3 py-2 text-[.8rem]">
              <Icon d="M7 3h7l5 5v13H7z M14 3v5h5" className="size-4 text-primary" />
              <span className="font-semibold">{a.name}</span>
              <span className="text-ink/45">{formatSize(a.size)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-ink/8 pt-4">
        <span className="grid text-[.78rem]">
          <span className="font-semibold text-ink/75">{n.author}</span>
          <span className="text-ink/50">{formatDate(n.date)}</span>
        </span>
        {n.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-[.76rem] font-bold text-primary">
            <Icon d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" className="size-3.5" />
            {n.attachments.length === 1 ? "1 file attached" : `${n.attachments.length} files attached`}
          </span>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${ghostSm} ml-auto`}>
          {open ? "Show less" : "Read full notice"}
          <Icon d="M6 9l6 6 6-6" className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
    </li>
  );
}

/** Read-only notice feed: exactly the principal's published announcements addressed to this student. */
export default function NoticesFeed() {
  const all = useNoticeList();
  const now = useSyncExternalStore(noop, minuteNow, () => 0);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [prio, setPrio] = useState("all");

  const mine = useMemo(() => all.filter((n) => isForMe(n, now)), [all, now]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine
      .filter((n) => inTab(n, tab))
      .filter((n) => !q || `${n.title} ${plainText(n.body)} ${n.author}`.toLowerCase().includes(q))
      .filter((n) => cat === "all" || n.category === cat)
      .filter((n) => prio === "all" || n.priority === prio)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
  }, [mine, tab, query, cat, prio]);

  const { listRef, target, setHover } = useSlidingPill(tabs.findIndex((t) => t.key === tab));
  const filtersOn = query || cat !== "all" || prio !== "all";

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        <StatCard label="Notices for You" value={mine.length} icon="M3 11l15-6v14L3 13z M7 13v5h3v-4" note="From the Principal Office" />
        <StatCard label="Urgent" value={mine.filter((n) => n.priority === "urgent").length} icon="M12 4l9 16H3z M12 10v4 M12 17v.5" note="Read these first" />
        <StatCard label="Important" value={mine.filter((n) => n.priority === "important").length} icon="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" note="Exams and deadlines" />
        <StatCard label={`For ${myGrade}`} value={mine.filter((n) => n.audience === "classes").length} icon="M4 6h16 M4 12h16 M4 18h10" note="Addressed to your class" />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
            <ul ref={listRef} role="tablist" aria-label="Notice filter" className="relative flex w-max gap-1 rounded-full bg-surface p-1" onMouseLeave={() => setHover(null)}>
              <span data-pill aria-hidden className={pillClass} />
              {tabs.map((t, i) => (
                <li key={t.key} role="presentation">
                  <button
                    data-pill-item
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className={`relative z-10 inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[.86rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                      i === target ? "text-surface" : "text-ink/65 hover:text-ink"
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 text-[.72rem] font-bold transition-colors ${i === target ? "bg-surface/20" : "bg-ink/8"}`}>{mine.filter((n) => inTab(n, t.key)).length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="inline-flex items-center gap-1.5 text-[.8rem] text-ink/55">
            <Icon d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z" className="size-4 shrink-0 text-primary" />
            Read-only. Notices are published by the Principal Office.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search notices</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notices" className={`${fieldClass} w-full pl-10`} />
          </label>
          <div className="grid grid-cols-2 gap-2.5 lg:flex">
            <Select label="Category" value={cat} onChange={setCat} className="lg:w-[200px]">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select label="Priority" value={prio} onChange={setPrio} className="lg:w-[170px]">
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </Select>
          </div>
        </div>

        {filtersOn && (
          <div className="flex flex-wrap items-center gap-2 text-[.8rem]">
            <span className="text-ink/50" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "match" : "matches"}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCat("all");
                setPrio("all");
              }}
              className={ghostSm}
            >
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              Clear filters
            </button>
          </div>
        )}

        {filtered.length > 0 ? (
          <ul className="grid gap-3">
            {filtered.map((n) => (
              <NoticeCard key={n.id} n={n} />
            ))}
          </ul>
        ) : (
          <p className="rounded-[18px] border border-dashed border-ink/12 px-5 py-10 text-center text-[.88rem] text-ink/55">
            {filtersOn ? "No notices match these filters." : "No notices here yet."}
          </p>
        )}
      </section>
    </main>
  );
}
