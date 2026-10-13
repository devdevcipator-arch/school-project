"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Dialog, Select, Toast, fieldClass, ghostBtn, ghostSm, type ToastData } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { grades, teachers as seed, teachesGrade, type Teacher } from "@/lib/teachers";
import { Avatar, CheckInChip, ScopeBadges, StatusBadge, SubjectPills } from "./parts";
import TeacherForm from "./TeacherForm";
import TeacherProfile, { type ProfileTab } from "./TeacherProfile";

const PAGE_SIZE = 12;
const noop = () => () => {};

/* ---------------- Stats ---------------- */

function Stat({ label, value, icon, note }: { label: string; value: number; icon: string; note: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(6,30,41,.1)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
        <Icon d={icon} className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-[.8rem] font-bold text-ink/55">{label}</p>
        <p className="text-[1.7rem] font-extrabold leading-tight tracking-tight">{value}</p>
        <p className="truncate text-[.74rem] text-ink/50">{note}</p>
      </div>
    </div>
  );
}

/* ---------------- Actions ---------------- */

type Actions = { onView: (t: Teacher) => void; onAttendance: (t: Teacher) => void; onEdit: (t: Teacher) => void; onRemove: (t: Teacher) => void };

const actionIcons = {
  view: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  attendance: "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11",
  edit: "M4 20h4L19 9l-4-4L4 16z M13 7l4 4",
  remove: "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13",
};

function RowActions({ t, onView, onAttendance, onEdit, onRemove, compact = false }: Actions & { t: Teacher; compact?: boolean }) {
  const items = [
    { key: "view", label: "View Profile & Schedule", short: "Profile", run: () => onView(t) },
    { key: "attendance", label: "Attendance Records", short: "Attendance", run: () => onAttendance(t) },
    { key: "edit", label: "Edit Details / Class Assignment", short: "Edit", run: () => onEdit(t) },
    { key: "remove", label: "Deactivate / Delete", short: "Remove", run: () => onRemove(t) },
  ] as const;
  return (
    <div className="flex items-center gap-0.5">
      {items.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={a.run}
          title={a.label}
          aria-label={`${a.label}: ${t.name}`}
          className={`${ghostSm} ${a.key === "remove" ? "hover:bg-danger/10 hover:text-danger" : ""}`}
        >
          <Icon d={actionIcons[a.key]} className="size-4" />
          {!compact && <span>{a.short}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Directory views ---------------- */

function TeacherCard({ t, ...actions }: Actions & { t: Teacher }) {
  const off = t.status === "inactive";
  return (
    <li className={`flex flex-col rounded-[18px] border border-ink/8 bg-white p-5 transition-[box-shadow,translate] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,30,41,.08)] ${off ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <Avatar name={t.name} muted={off} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => actions.onView(t)} className="block max-w-full cursor-pointer truncate text-left text-[1rem] font-extrabold tracking-tight hover:text-primary">
            {t.name}
          </button>
          <p className="text-[.78rem] text-ink/50">{t.empId}</p>
        </div>
        <StatusBadge status={t.status} />
      </div>

      <div className="mt-4 grid gap-1.5 text-[.82rem]">
        <a href={`mailto:${t.email}`} className="inline-flex min-w-0 items-center gap-2 text-ink/70 hover:text-primary">
          <Icon d="M4 6h16v12H4z M4 7l8 6 8-6" className="size-4 shrink-0 text-accent" />
          <span className="truncate">{t.email}</span>
        </a>
        <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-ink/70 hover:text-primary">
          <Icon d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" className="size-4 shrink-0 text-accent" />
          {t.phone}
        </a>
      </div>

      <div className="mb-4 mt-4 grid gap-2">
        <ScopeBadges t={t} />
        <SubjectPills subjects={t.subjects} />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3.5">
        <CheckInChip checkIn={t.checkIn} />
        <RowActions t={t} {...actions} compact />
      </div>
    </li>
  );
}

function TeacherTable({ list, ...actions }: Actions & { list: Teacher[] }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[940px] text-left text-[.86rem]">
        <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
          <tr>
            <th scope="col" className="px-5 py-3.5">Teacher</th>
            <th scope="col" className="px-3 py-3.5">Contact</th>
            <th scope="col" className="px-3 py-3.5">Academic scope</th>
            <th scope="col" className="px-3 py-3.5">Subjects</th>
            <th scope="col" className="px-3 py-3.5">Today</th>
            <th scope="col" className="px-3 py-3.5 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((t) => (
            <tr key={t.id} className={`align-middle transition-colors hover:bg-surface/50 ${t.status === "inactive" ? "opacity-65" : ""}`}>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} muted={t.status === "inactive"} />
                  <div className="min-w-0">
                    <button type="button" onClick={() => actions.onView(t)} className="cursor-pointer whitespace-nowrap text-left font-bold hover:text-primary">
                      {t.name}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="whitespace-nowrap text-[.76rem] text-ink/50">{t.empId}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5 text-[.8rem]">
                <a href={`mailto:${t.email}`} className="block max-w-[200px] truncate text-ink/75 hover:text-primary">
                  {t.email}
                </a>
                <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="whitespace-nowrap text-ink/50 hover:text-primary">
                  {t.phone}
                </a>
              </td>
              <td className="max-w-[210px] px-2.5 py-3.5">
                <ScopeBadges t={t} />
              </td>
              <td className="max-w-[180px] px-2.5 py-3.5">
                <SubjectPills subjects={t.subjects} />
              </td>
              <td className="px-3 py-3.5">
                <CheckInChip checkIn={t.checkIn} short />
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end">
                  <RowActions t={t} {...actions} compact />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(total, page * PAGE_SIZE);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[.8rem] text-ink/55">
        Showing <strong className="text-ink">{from}</strong> to <strong className="text-ink">{to}</strong> of <strong className="text-ink">{total}</strong> teachers
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M15 18l-6-6 6-6" className="size-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`grid size-9 cursor-pointer place-items-center rounded-lg text-[.84rem] font-bold transition-colors ${p === page ? "bg-primary text-surface" : "text-ink/65 hover:bg-primary/8 hover:text-primary"}`}
            >
              {p}
            </button>
          ))}
          <button type="button" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label="Next page" className={`${ghostSm} disabled:pointer-events-none disabled:opacity-40`}>
            <Icon d="M9 6l6 6-6 6" className="size-4" />
          </button>
        </div>
      )}
    </nav>
  );
}

/* ---------------- Board ---------------- */

export default function TeachersBoard({ startAdding = false }: { startAdding?: boolean }) {
  const [list, setList] = useState<Teacher[]>(seed);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ initial: Teacher | null } | null>(startAdding ? { initial: null } : null);
  const [profile, setProfile] = useState<{ t: Teacher; tab: ProfileTab } | null>(null);
  const [removing, setRemoving] = useState<Teacher | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  // Drawers render after hydration only (the form generates a random password).
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const closeToast = useCallback(() => setToast(null), []);
  const closeRemove = useCallback(() => setRemoving(null), []);

  const stats = useMemo(() => {
    const staff = list.filter((t) => t.status !== "inactive");
    return {
      faculty: staff.length,
      checkedIn: staff.filter((t) => t.checkIn.state === "present" || t.checkIn.state === "late").length,
      late: staff.filter((t) => t.checkIn.state === "late").length,
      leave: list.filter((t) => t.status === "leave").length,
      classTeachers: staff.filter((t) => t.classTeacher).length,
      inactive: list.length - staff.length,
    };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((t) => !q || `${t.name} ${t.empId} ${t.email}`.toLowerCase().includes(q))
      .filter((t) => grade === "all" || teachesGrade(t, grade))
      .filter((t) => status === "all" || t.status === status)
      .sort((a, b) => Number(a.status === "inactive") - Number(b.status === "inactive") || a.name.localeCompare(b.name));
  }, [list, query, grade, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const filter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const filtersOn = query || grade !== "all" || status !== "all";

  const actions: Actions = {
    onView: (t) => setProfile({ t, tab: "profile" }),
    onAttendance: (t) => setProfile({ t, tab: "attendance" }),
    onEdit: (t) => setForm({ initial: t }),
    onRemove: setRemoving,
  };

  const save = (t: Teacher, credential?: { type: "password" | "invite"; value: string }) => {
    const exists = list.some((x) => x.id === t.id);
    setList((l) => (exists ? l.map((x) => (x.id === t.id ? t : x)) : [t, ...l]));
    setToast({
      text: exists
        ? `${t.name}'s details were updated.`
        : credential?.type === "invite"
          ? `${t.name} onboarded. Invite link sent to ${credential.value}.`
          : `${t.name} onboarded with a temporary password.`,
    });
  };

  const setActive = (t: Teacher, active: boolean) => {
    setList((l) => l.map((x) => (x.id === t.id ? { ...x, status: active ? "active" : "inactive", checkIn: active ? { state: "absent" } : { state: "none" } } : x)));
    setRemoving(null);
    setToast({ text: active ? `${t.name} reactivated.` : `${t.name} deactivated. Their login is suspended.` });
  };

  const remove = (t: Teacher) => {
    const before = list;
    setList((l) => l.filter((x) => x.id !== t.id));
    setRemoving(null);
    setToast({ text: `${t.name} deleted.`, action: { label: "Undo", run: () => (setList(before), setToast(null)) } });
  };

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      {/* The page title lives in the portal top bar; this row keeps the page action. */}
      <header className="flex justify-end">
        <button type="button" onClick={() => setForm({ initial: null })} className={buttonClass("primary", "lg", "cursor-pointer max-sm:w-full")}>
          <Icon d="M12 5v14 M5 12h14" className="size-5" />
          Add New Teacher
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Faculty" value={stats.faculty} icon="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M16 3.5a4 4 0 0 1 0 7.5 M18 14c2.4.8 4 3.2 4 7" note={`${stats.inactive} inactive not counted`} />
        <Stat label="Checked In Today" value={stats.checkedIn} icon="M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11" note={`${stats.late} arrived late`} />
        <Stat label="On Leave" value={stats.leave} icon="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" note="Approved leave today" />
        <Stat label="Class Teachers" value={stats.classTeachers} icon="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" note="Sections with an assigned lead" />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search teachers</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input type="search" value={query} onChange={(e) => filter(setQuery)(e.target.value)} placeholder="Search by name, employee ID or email" className={`${fieldClass} w-full pl-10`} />
          </label>
          <div className="grid grid-cols-2 gap-2.5 lg:flex">
            <Select label="Class / grade" value={grade} onChange={filter(setGrade)} className="lg:w-[170px]">
              <option value="all">All classes</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Select label="Status" value={status} onChange={filter(setStatus)} className="lg:w-[160px]">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div role="group" aria-label="Layout" className="hidden rounded-xl border border-ink/10 p-1 lg:flex">
            {(
              [
                ["table", "Table", "M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14"],
                ["cards", "Cards", "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z"],
              ] as const
            ).map(([v, l, ic]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[.82rem] font-semibold transition-colors ${view === v ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
              >
                <Icon d={ic} className="size-4" />
                {l}
              </button>
            ))}
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
                setGrade("all");
                setStatus("all");
                setPage(1);
              }}
              className={ghostSm}
            >
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              Clear filters
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <Icon d="M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" className="size-7" />
            </span>
            <p className="font-bold">No teachers match these filters</p>
            <p className="max-w-[360px] text-[.86rem] text-ink/55">Try a different name, ID or class, or onboard a new teacher.</p>
          </div>
        ) : (
          <>
            <ul className={`grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 ${view === "table" ? "lg:hidden" : ""}`}>
              {visible.map((t) => (
                <TeacherCard key={t.id} t={t} {...actions} />
              ))}
            </ul>
            {view === "table" && (
              <div className="max-lg:hidden">
                <TeacherTable list={visible} {...actions} />
              </div>
            )}
          </>
        )}

        <Pagination page={current} pages={pages} total={filtered.length} onPage={setPage} />
      </section>

      {hydrated && form && <TeacherForm key={form.initial?.id ?? "new"} initial={form.initial} roster={list} onClose={() => setForm(null)} onSave={save} />}
      {hydrated && profile && (
        <TeacherProfile
          t={profile.t}
          tab={profile.tab}
          onClose={() => setProfile(null)}
          onEdit={() => {
            setForm({ initial: profile.t });
            setProfile(null);
          }}
        />
      )}
      {removing && (
        <Dialog label={`Deactivate or delete ${removing.name}`} onClose={closeRemove}>
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-danger/10 text-danger">
              <Icon d={actionIcons.remove} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[1.05rem] font-extrabold tracking-tight">{removing.status === "inactive" ? "Reactivate or delete" : "Deactivate or delete"} {removing.name}?</p>
              <p className="mt-1 text-[.86rem] text-ink/60">
                {removing.status === "inactive"
                  ? "Reactivating restores their login and class assignments."
                  : "Deactivating suspends their login but keeps their records and history. Deleting removes the teacher entirely."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button type="button" autoFocus onClick={closeRemove} className={`${ghostBtn} max-sm:flex-1`}>
              Cancel
            </button>
            <button type="button" onClick={() => setActive(removing, removing.status === "inactive")} className={buttonClass("dark", "md", "cursor-pointer max-sm:flex-1")}>
              {removing.status === "inactive" ? "Reactivate" : "Deactivate"}
            </button>
            <button
              type="button"
              onClick={() => remove(removing)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-danger px-[22px] py-[11px] text-[.95rem] font-semibold text-white transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(192,57,43,.35)] max-sm:w-full"
            >
              Delete permanently
            </button>
          </div>
        </Dialog>
      )}
      {toast && <Toast key={toast.text} text={toast.text} action={toast.action} onDone={closeToast} />}
    </main>
  );
}
