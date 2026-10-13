"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import {
  categories,
  formatDate,
  formatSize,
  notices as seed,
  plainText,
  readUnit,
  type Attachment,
  type Notice,
  type Priority,
} from "@/lib/announcements";
import { Select, Toast, fieldClass, ghostSm, type ToastData } from "@/components/dashboard/controls";
import Composer, { type ComposerResult } from "./Composer";
import { setEmergency, useEmergency } from "./emergency";
import { AudienceTag, PriorityBadge, PriorityDot } from "./tags";

type Tab = "all" | "school" | "staff" | "students" | "drafts";
const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All Notices" },
  { key: "school", label: "School-Wide" },
  { key: "staff", label: "Staff Only" },
  { key: "students", label: "Students Only" },
  { key: "drafts", label: "Drafts" },
];

function inTab(n: Notice, t: Tab) {
  if (t === "drafts") return n.status === "draft";
  if (n.status === "draft") return false;
  if (t === "school") return n.audience === "school";
  if (t === "staff") return n.audience === "staff" || n.audience === "department";
  if (t === "students") return n.audience === "students" || n.audience === "classes";
  return true;
}

const field = fieldClass;

/* ---------------- Metrics ---------------- */

function Metric({ label, value, icon, tone = "brand", note }: { label: string; value: number; icon: string; tone?: "brand" | "danger"; note: string }) {
  return (
    <div data-reveal className="flex items-center gap-4 rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(6,30,41,.1)]">
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl text-surface ${tone === "danger" ? "bg-danger" : "bg-linear-135 from-primary to-accent"}`}>
        <Icon d={icon} className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-[.8rem] font-bold text-ink/55">{label}</p>
        <p className={`text-[1.7rem] font-extrabold leading-tight tracking-tight ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
        <p className="truncate text-[.74rem] text-ink/50">{note}</p>
      </div>
    </div>
  );
}

/* ---------------- Emergency controller ---------------- */

const presets = ["Rain closure: school dismissed at 12:00 PM", "Security alert: all students stay inside classrooms", "Power outage: afternoon classes cancelled"];

function EmergencyController() {
  const live = useEmergency();
  const [msg, setMsg] = useState(presets[0]);

  return (
    <section
      data-reveal
      className={`relative overflow-hidden rounded-[20px] border p-5 transition-colors duration-500 sm:p-6 ${live ? "border-danger/40 bg-danger/5" : "border-ink/8 bg-white shadow-[0_10px_30px_rgba(6,30,41,.05)]"}`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-danger" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3.5 lg:w-[300px] lg:shrink-0">
          <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-danger text-white">
            {live && <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl bg-danger/40" />}
            <Icon d="M12 4 2.5 20h19z M12 10v4 M12 17h.01" className="relative size-5" />
          </span>
          <div>
            <h2 className="flex flex-wrap items-center gap-2 text-[1.05rem] font-extrabold tracking-tight">
              Urgent Broadcast Banner
              <span className={`rounded-full px-2.5 py-0.5 text-[.7rem] font-extrabold uppercase tracking-[.1em] ${live ? "bg-danger text-white" : "bg-ink/6 text-ink/55"}`}>{live ? "Live" : "Off"}</span>
            </h2>
            <p className="mt-0.5 text-[.82rem] text-ink/60">One click pushes a persistent red banner to every active portal session.</p>
          </div>
        </div>

        {live ? (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 rounded-xl border border-danger/25 bg-white px-4 py-3 text-[.9rem] font-semibold text-danger">{live}</p>
            <button type="button" onClick={() => setEmergency(null)} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-danger/40 bg-white px-[22px] py-[11px] text-[.92rem] font-bold text-danger transition-colors hover:bg-danger hover:text-white">
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              End Emergency
            </button>
          </div>
        ) : (
          <form
            className="flex min-w-0 flex-1 flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (msg.trim()) setEmergency(msg.trim());
            }}
          >
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <label htmlFor="emergency-msg" className="sr-only">
                Emergency message
              </label>
              <input id="emergency-msg" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={140} placeholder="Describe the emergency in one line" className={`${field} min-w-0 flex-1`} />
              <button
                type="submit"
                disabled={!msg.trim()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-danger px-[22px] py-[11px] text-[.92rem] font-bold text-white shadow-[0_8px_22px_rgba(192,57,43,.3)] transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(192,57,43,.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon d="M3 11l15-6v14L3 13z M7 13v5h3v-4" className="size-[18px]" />
                Push Banner Now
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button key={p} type="button" onClick={() => setMsg(p)} className="cursor-pointer rounded-full bg-ink/5 px-3 py-1 text-[.74rem] font-semibold text-ink/65 transition-colors hover:bg-danger/10 hover:text-danger">
                  {p}
                </button>
              ))}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/* ---------------- Notice pieces ---------------- */

function StatusBadge({ n }: { n: Notice }) {
  if (n.status === "published") return null;
  const draft = n.status === "draft";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[.72rem] font-bold ${draft ? "bg-ink/6 text-ink/60" : "bg-primary/10 text-primary"}`}>
      <Icon d={draft ? "M4 20h4L19 9l-4-4L4 16z" : "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2"} className="size-3" />
      {draft ? "Draft" : `Scheduled · ${formatDate(n.date)}`}
    </span>
  );
}

function ReadMetric({ n, compact = false }: { n: Notice; compact?: boolean }) {
  if (n.status !== "published") return <span className="text-[.78rem] text-ink/45">Not sent yet</span>;
  const pct = Math.round((n.reads.read / n.reads.total) * 100);
  const unit = readUnit(n.audience);
  const text = unit === "Teachers" ? `${n.reads.read}/${n.reads.total} Teachers read` : `${pct}% ${unit} viewed`;
  return (
    <span className={`grid gap-1 ${compact ? "min-w-[120px]" : "min-w-[150px]"}`}>
      <span className="text-[.78rem] font-semibold text-ink/70">{text}</span>
      <span role="meter" aria-label={text} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 overflow-hidden rounded-r-full bg-ink/6">
        <span className="block h-full rounded-r-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

function AttachmentChip({ files, onOpen }: { files: Attachment[]; onOpen: (a: Attachment) => void }) {
  if (!files.length) return null;
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.name)).length;
  const label = files.length === 1 ? `1 ${pdfs ? "PDF" : "file"} attached` : `${files.length} files attached`;
  return (
    <button type="button" onClick={() => onOpen(files[0])} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-[.76rem] font-bold text-primary transition-colors hover:bg-primary hover:text-surface">
      <Icon d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" className="size-3.5" />
      {label}
    </button>
  );
}

type Actions = { onEdit: (n: Notice) => void; onPin: (n: Notice) => void; onDelete: (n: Notice) => void };

function RowActions({ n, onEdit, onPin, onDelete, labels = true }: Actions & { n: Notice; labels?: boolean }) {
  const items: { label: string; icon: string; run: () => void; danger?: boolean; active?: boolean }[] = [
    { label: "Edit", icon: "M4 20h4L19 9l-4-4L4 16z M13 7l4 4", run: () => onEdit(n) },
    { label: n.pinned ? "Unpin" : "Pin to Top", icon: "M9 4h6l-1 5 3 3v2H7v-2l3-3z M12 14v6", run: () => onPin(n), active: n.pinned },
    { label: "Delete", icon: "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13", run: () => onDelete(n), danger: true },
  ];
  return (
    <div className="flex items-center gap-0.5">
      {items.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.run}
          aria-label={`${a.label}: ${n.title}`}
          title={a.label}
          className={`${ghostSm} ${a.danger ? "hover:bg-danger/10 hover:text-danger" : ""} ${a.active ? "text-primary" : ""}`}
        >
          <Icon d={a.icon} className="size-4" />
          {labels && <span className="max-sm:sr-only">{a.label}</span>}
        </button>
      ))}
    </div>
  );
}

const accent: Record<Priority, string> = { urgent: "bg-danger", important: "bg-warn", normal: "bg-transparent" };

function NoticeCard({ n, onOpenFile, ...actions }: Actions & { n: Notice; onOpenFile: (a: Attachment) => void }) {
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
        <StatusBadge n={n} />
        {n.pinned && (
          <span className="ml-auto inline-flex items-center gap-1 text-[.74rem] font-bold text-primary">
            <Icon d="M9 4h6l-1 5 3 3v2H7v-2l3-3z M12 14v6" className="size-3.5" />
            Pinned
          </span>
        )}
      </div>
      <h3 className="mt-3 text-[1.02rem] font-extrabold leading-snug tracking-tight">{n.title}</h3>
      <p className="mt-1 line-clamp-2 text-[.88rem] leading-relaxed text-ink/65">{plainText(n.body)}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-ink/8 pt-4">
        <span className="grid text-[.78rem]">
          <span className="font-semibold text-ink/75">{n.author}</span>
          <span className="text-ink/50">{formatDate(n.date)}</span>
        </span>
        <AttachmentChip files={n.attachments} onOpen={onOpenFile} />
        <ReadMetric n={n} />
        <div className="ml-auto">
          <RowActions n={n} {...actions} />
        </div>
      </div>
    </li>
  );
}

function NoticeTable({ list, onOpenFile, ...actions }: Actions & { list: Notice[]; onOpenFile: (a: Attachment) => void }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[980px] text-left text-[.86rem]">
        <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
          <tr>
            <th scope="col" className="px-5 py-3.5">Notice</th>
            <th scope="col" className="px-3 py-3.5">Audience</th>
            <th scope="col" className="px-3 py-3.5">Priority</th>
            <th scope="col" className="px-3 py-3.5">Published</th>
            <th scope="col" className="px-3 py-3.5">Delivery</th>
            <th scope="col" className="px-3 py-3.5 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((n) => (
            <tr key={n.id} className="align-top transition-colors hover:bg-surface/50">
              <td className="max-w-[360px] px-5 py-4">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5">
                    <PriorityDot priority={n.priority} />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-bold">
                      {n.pinned && <Icon d="M9 4h6l-1 5 3 3v2H7v-2l3-3z M12 14v6" className="size-3.5 shrink-0 text-primary" />}
                      <span className="truncate">{n.title}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[.8rem] text-ink/55">{plainText(n.body)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[.7rem] font-bold text-ink/55">{n.category}</span>
                      <StatusBadge n={n} />
                      <AttachmentChip files={n.attachments} onOpen={onOpenFile} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4">
                <AudienceTag audience={n.audience} targets={n.targets} />
              </td>
              <td className="px-3 py-4">
                <PriorityBadge priority={n.priority} />
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-[.8rem]">
                <p className="font-semibold text-ink/75">{n.author}</p>
                <p className="text-ink/50">{formatDate(n.date)}</p>
              </td>
              <td className="px-3 py-4">
                <ReadMetric n={n} compact />
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end">
                  <RowActions n={n} {...actions} labels={false} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Small overlays ---------------- */

function FilePreview({ file, onClose }: { file: Attachment; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-backdrop-in bg-ink/55 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={`Preview ${file.name}`} className="relative w-full max-w-[460px] animate-fade-in rounded-[22px] bg-white p-6 shadow-[0_30px_70px_rgba(6,30,41,.3)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[1rem] font-extrabold">{file.name}</p>
            <p className="text-[.8rem] text-ink/55">{formatSize(file.size)}</p>
          </div>
          <button type="button" autoFocus aria-label="Close preview" onClick={onClose} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink/60 hover:bg-ink/5">
            <Icon d="M6 6l12 12 M18 6 6 18" className="size-5" />
          </button>
        </div>
        <div aria-hidden className="mt-5 grid gap-2.5 rounded-2xl border border-ink/8 bg-surface/60 p-6">
          <span className="mb-2 h-3 w-1/2 rounded bg-primary/30" />
          {[100, 92, 96, 70, 88, 60].map((w, i) => (
            <span key={i} className="h-2 rounded bg-ink/10" style={{ width: `${w}%` }} />
          ))}
        </div>
        <p className="mt-4 text-center text-[.8rem] text-ink/50">Full document preview will be available once file storage is connected.</p>
      </div>
    </div>
  );
}

/* ---------------- Board ---------------- */

// "This month" follows the viewer's clock, so it is read on the client only.
// The prerender uses the newest seeded notice's month.
const noop = () => () => {};
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
const currentMonth = () => monthKey(new Date());
const seedMonth = monthKey(new Date(seed.reduce((a, n) => (n.date > a ? n.date : a), seed[0].date)));

export default function AnnouncementsBoard({ startComposing = false }: { startComposing?: boolean }) {
  const [list, setList] = useState<Notice[]>(seed);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [prio, setPrio] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<"feed" | "table">("feed");
  const [composer, setComposer] = useState<{ initial: Notice | null } | null>(startComposing ? { initial: null } : null);
  const [file, setFile] = useState<Attachment | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const closeToast = useCallback(() => setToast(null), []);
  const closeFile = useCallback(() => setFile(null), []);
  const tabIndex = tabs.findIndex((t) => t.key === tab);
  const { listRef, target, setHover } = useSlidingPill(tabIndex);

  const month = useSyncExternalStore(noop, currentMonth, () => seedMonth);
  const metrics = useMemo(() => {
    const thisMonth = (n: Notice) => monthKey(new Date(n.date)) === month;
    const sent = list.filter((n) => n.status !== "draft");
    return {
      active: sent.length,
      staff: sent.filter((n) => (n.audience === "staff" || n.audience === "department") && thisMonth(n)).length,
      students: sent.filter((n) => (n.audience === "students" || n.audience === "classes") && thisMonth(n)).length,
      urgent: sent.filter((n) => n.priority === "urgent").length,
      drafts: list.length - sent.length,
    };
  }, [list, month]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((n) => inTab(n, tab))
      .filter((n) => !q || `${n.title} ${plainText(n.body)} ${n.author} ${n.targets.join(" ")}`.toLowerCase().includes(q))
      .filter((n) => cat === "all" || n.category === cat)
      .filter((n) => prio === "all" || n.priority === prio)
      .filter((n) => {
        const day = n.date.slice(0, 10);
        return (!from || day >= from) && (!to || day <= to);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
  }, [list, tab, query, cat, prio, from, to]);

  const filtersOn = query || cat !== "all" || prio !== "all" || from || to;
  const clearFilters = () => {
    setQuery("");
    setCat("all");
    setPrio("all");
    setFrom("");
    setTo("");
  };

  const actions: Actions = {
    onEdit: (n) => setComposer({ initial: n }),
    onPin: (n) => {
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x)));
      setToast({ text: n.pinned ? "Notice unpinned." : "Notice pinned to the top." });
    },
    onDelete: (n) => {
      const before = list;
      setList((l) => l.filter((x) => x.id !== n.id));
      setToast({ text: `Deleted "${n.title}".`, action: { label: "Undo", run: () => (setList(before), setToast(null)) } });
    },
  };

  const onSubmit = ({ notice, action }: ComposerResult) => {
    setList((l) => (l.some((x) => x.id === notice.id) ? l.map((x) => (x.id === notice.id ? notice : x)) : [notice, ...l]));
    setTab(action === "draft" ? "drafts" : "all");
    setToast({
      text: action === "draft" ? "Draft saved." : notice.status === "scheduled" ? `Scheduled for ${formatDate(notice.date)}.` : "Announcement broadcast to recipients.",
    });
  };

  const tabCount = (t: Tab) => list.filter((n) => inTab(n, t)).length;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <header data-reveal className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[.78rem] font-bold uppercase tracking-[.14em] text-accent">Announcements</p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-tight">Institutional Announcements & Circulars</h1>
          <p className="mt-1.5 max-w-[640px] text-[.95rem] text-ink/60">Create, manage, and dispatch broadcasts across staff, students, and departments.</p>
        </div>
        <button type="button" onClick={() => setComposer({ initial: null })} className={buttonClass("primary", "lg", "cursor-pointer max-sm:w-full")}>
          <Icon d="M12 5v14 M5 12h14" className="size-5" />
          Create New Announcement
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Active Notices" value={metrics.active} icon="M3 11l15-6v14L3 13z M7 13v5h3v-4" note={`${metrics.drafts} draft${metrics.drafts === 1 ? "" : "s"} not yet sent`} />
        <Metric label="Staff Circulars This Month" value={metrics.staff} icon="M6 11V8a6 6 0 0 1 12 0v3 M5 11h14v10H5z M12 15v2" note="Teachers and departments" />
        <Metric label="Student Notices This Month" value={metrics.students} icon="M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" note="Students, parents and classes" />
        <Metric label="High-Priority / Urgent" value={metrics.urgent} icon="M12 4 2.5 20h19z M12 10v4 M12 17h.01" tone="danger" note="Active urgent broadcasts" />
      </div>

      <EmergencyController />

      <section data-reveal className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
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
                    <span className={`rounded-full px-1.5 text-[.72rem] font-bold transition-colors ${i === target ? "bg-surface/20" : "bg-ink/8"}`}>{tabCount(t.key)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <label className="relative xl:w-[320px]">
            <span className="sr-only">Search notices</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, keyword or author" className={`${field} w-full pl-10`} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="grid flex-1 grid-cols-2 gap-2.5 md:flex md:flex-none">
            <Select label="Category" value={cat} onChange={setCat}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select label="Priority" value={prio} onChange={setPrio}>
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </Select>
            <label className="grid">
              <span className="sr-only">From date</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={`${field} cursor-pointer`} />
            </label>
            <label className="grid">
              <span className="sr-only">To date</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`${field} cursor-pointer`} />
            </label>
          </div>
          {filtersOn && (
            <button type="button" onClick={clearFilters} className={ghostSm}>
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              Clear filters
            </button>
          )}
          <div role="group" aria-label="Layout" className="ml-auto hidden rounded-xl border border-ink/10 p-1 lg:flex">
            {(["feed", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[.82rem] font-semibold capitalize transition-colors ${view === v ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
              >
                <Icon d={v === "feed" ? "M4 5h16v5H4z M4 14h16v5H4z" : "M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14"} className="size-4" />
                {v}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[.8rem] text-ink/50" aria-live="polite">
          Showing {filtered.length} {filtered.length === 1 ? "notice" : "notices"}
        </p>

        {filtered.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <Icon d="M3 11l15-6v14L3 13z M7 13v5h3v-4" className="size-7" />
            </span>
            <p className="font-bold">No notices match these filters</p>
            <p className="max-w-[360px] text-[.86rem] text-ink/55">Try another tab or clear the filters. You can also create a new announcement.</p>
            {filtersOn && (
              <button type="button" onClick={clearFilters} className={buttonClass("dark", "md", "cursor-pointer")}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className={`grid gap-3 ${view === "table" ? "lg:hidden" : ""}`}>
              {filtered.map((n) => (
                <NoticeCard key={n.id} n={n} onOpenFile={setFile} {...actions} />
              ))}
            </ul>
            {view === "table" && (
              <div className="max-lg:hidden">
                <NoticeTable list={filtered} onOpenFile={setFile} {...actions} />
              </div>
            )}
          </>
        )}
      </section>

      {composer && <Composer initial={composer.initial} onClose={() => setComposer(null)} onSubmit={onSubmit} />}
      {file && <FilePreview file={file} onClose={closeFile} />}
      {toast && <Toast key={toast.text} text={toast.text} action={toast.action} onDone={closeToast} />}
    </main>
  );
}
