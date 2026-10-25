"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { MultiSelect, Pagination, Select, Toast, ViewToggle, fieldClass, ghostBtn, ghostSm, type DirectoryView, type ToastData } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { principal } from "@/lib/principal";
import { AS_OF, gradeNum, sectionLabel, sections, students } from "@/lib/students";
import {
  DEBATE,
  SPORTS,
  catalogFrom,
  categoriesOf,
  categoryIcon,
  competitions,
  initialShortlist,
  levelOf,
  levelRank,
  levels,
  mentorFor,
  skillsOf,
  tagsOf,
  talents as seed,
  type Talent,
} from "@/lib/talents";
import { printCertificate } from "./documents";
import EndorseForm, { type Endorsement } from "./EndorseForm";
import { LevelBadge, PrimaryTalent, SkillChips, categoryTone, trophyIcon } from "./parts";
import { ShortlistDialog } from "./Shortlist";
import TalentProfile from "./TalentProfile";

const PAGE_SIZE = 12;
const noop = () => () => {};

const order = (t: Talent) => -levelRank(t.level) * 1000 - gradeNum(t.student.section) * 10;

/* ---------------- Actions ---------------- */

type Actions = { shortlist: Record<string, string>; onView: (t: Talent) => void; onShortlist: (t: Talent) => void };

function ShortlistButton({ t, shortlist, onShortlist, compact = false }: Pick<Actions, "shortlist" | "onShortlist"> & { t: Talent; compact?: boolean }) {
  const on = !!shortlist[t.id];
  const label = on ? "Shortlisted" : "Shortlist for Event";
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onShortlist(t)}
      title={on ? "Remove from competition shortlist" : "Add to a competition shortlist"}
      aria-label={`${on ? "Remove from shortlist" : "Shortlist for event"}: ${t.student.name}`}
      className={on ? "inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-[.8rem] font-semibold text-surface transition-colors hover:bg-ink" : ghostSm}
    >
      <Icon d={on ? "M5 12l4 4 10-10" : "M12 5v14 M5 12h14"} className="size-4" />
      {!compact && <span>{label}</span>}
    </button>
  );
}

function ViewButton({ t, onView, compact = false }: Pick<Actions, "onView"> & { t: Talent; compact?: boolean }) {
  return (
    <button type="button" onClick={() => onView(t)} title="View Student Profile" aria-label={`View student profile: ${t.student.name}`} className={ghostSm}>
      <Icon d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" className="size-4" />
      {!compact && <span>View Profile</span>}
    </button>
  );
}

/* ---------------- Directory views ---------------- */

function ClassBadge({ section }: { section: string }) {
  return <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-[.72rem] font-bold text-primary">{sectionLabel(section)}</span>;
}

function Achievement({ text }: { text: string }) {
  return (
    <p className="flex min-w-0 items-start gap-2 text-[.82rem] text-ink/70" title={text}>
      <Icon d={trophyIcon} className="mt-px size-4 shrink-0 text-[#b8860b]" />
      <span className="line-clamp-2">{text}</span>
    </p>
  );
}

function TalentCard({ t, ...actions }: Actions & { t: Talent }) {
  const s = t.student;
  return (
    <li className="flex flex-col rounded-[18px] border border-ink/8 bg-white p-5 transition-[box-shadow,translate] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,30,41,.08)]">
      <div className="flex items-center gap-3">
        <Avatar name={s.name} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => actions.onView(t)} className="block max-w-full cursor-pointer truncate text-left text-[1rem] font-extrabold tracking-tight hover:text-primary">
            {s.name}
          </button>
        </div>
        <ClassBadge section={s.section} />
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-ink/8 pt-3">
        <ViewButton t={t} {...actions} />
      </div>
    </li>
  );
}

function TalentTable({ list, ...actions }: Actions & { list: Talent[] }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-ink/8 bg-white">
      <table className="w-full min-w-[1080px] text-left text-[.86rem]">
        <thead className="bg-surface/70 text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/50">
          <tr>
            <th scope="col" className="px-5 py-3.5">Student</th>
            <th scope="col" className="px-3 py-3.5">Class</th>
            <th scope="col" className="px-3 py-3.5">Primary talent</th>
            <th scope="col" className="px-3 py-3.5">Additional skills</th>
            <th scope="col" className="px-3 py-3.5">Level</th>
            <th scope="col" className="px-3 py-3.5">Key achievement</th>
            <th scope="col" className="px-3 py-3.5 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">
          {list.map((t) => (
            <tr key={t.id} className="align-middle transition-colors hover:bg-surface/50">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={t.student.name} />
                  <div className="min-w-0">
                    <button type="button" onClick={() => actions.onView(t)} className="cursor-pointer whitespace-nowrap text-left font-bold hover:text-primary">
                      {t.student.name}
                    </button>
                    <div className="mt-0.5 whitespace-nowrap text-[.76rem] text-ink/50">
                      {t.student.regId} · Roll {t.student.rollNo}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3.5 font-semibold">{t.student.section}</td>
              <td className="px-3 py-3.5">
                <PrimaryTalent {...t.primary} />
              </td>
              <td className="px-3 py-3.5">{t.extra.length ? <SkillChips list={t.extra} /> : <span className="text-ink/35">None</span>}</td>
              <td className="px-3 py-3.5">
                <LevelBadge level={t.level} short />
              </td>
              <td className="max-w-[260px] px-3 py-3.5">
                <Achievement text={t.achievement} />
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-0.5">
                  <ShortlistButton t={t} {...actions} compact />
                  <ViewButton t={t} {...actions} compact />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Board ---------------- */

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const topSkills = (list: Talent[], cat: string, n = 3) => {
  const count = new Map<string, number>();
  for (const t of list) for (const g of tagsOf(t)) if (g.category === cat) count.set(g.skill, (count.get(g.skill) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, n);
};

/** Who endorses from this board, and which sections it covers (all of them for the principal). */
type Scope = { sections?: string[]; endorser?: { name: string; role: string } };

export default function TalentsBoard({ sections: scope = sections, endorser = { name: principal.name, role: "Principal" } }: Scope) {
  const pool = useMemo(() => students.filter((s) => scope.includes(s.section)), [scope]);
  const grades = useMemo(() => [...new Set(scope.map(gradeNum))].sort((a, b) => a - b), [scope]);
  const letters = useMemo(() => [...new Set(scope.map((s) => s.split("-")[1]))].sort(), [scope]);
  const [list, setList] = useState<Talent[]>(() => seed.filter((t) => scope.includes(t.student.section)));
  const [shortlist, setShortlist] = useState<Record<string, string>>(initialShortlist);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [skillSel, setSkillSel] = useState<string[]>([]);
  const [gradeSel, setGradeSel] = useState<string[]>([]);
  const [letter, setLetter] = useState("all");
  const [level, setLevel] = useState("all");
  const [view, setView] = useState<DirectoryView>("cards");
  const [page, setPage] = useState(1);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [picking, setPicking] = useState<Talent | null>(null);
  const [endorsing, setEndorsing] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const closeToast = useCallback(() => setToast(null), []);
  const closePick = useCallback(() => setPicking(null), []);

  const stats = useMemo(() => {
    const sports = list.filter((t) => categoriesOf(t).includes(SPORTS));
    const debate = list.filter((t) => categoriesOf(t).includes(DEBATE));
    return {
      total: list.length,
      share: Math.round((list.length / pool.length) * 100),
      multi: list.filter((t) => t.extra.length).length,
      sports: sports.length,
      sportsNote: topSkills(sports, SPORTS).map(([k, n]) => `${k} ${n}`).join(" · "),
      debate: debate.length,
      mun: list.filter((t) => skillsOf(t).includes("Model UN")).length,
      orators: list.filter((t) => skillsOf(t).some((k) => k === "Urdu Speech" || k === "English Speech")).length,
    };
  }, [list, pool]);

  const catalog = useMemo(() => catalogFrom(list), [list]);

  const skillOptions = useMemo(() => {
    const seen = new Set<string>();
    return catalog.skills
      .filter((k) => category === "all" || k.category === category)
      .filter((k) => !seen.has(k.skill) && !!seen.add(k.skill))
      .map((k) => ({
        value: k.skill,
        label: k.skill,
        hint: <span aria-hidden title={k.category} className={`size-2 shrink-0 rounded-full ${categoryTone(k.category).dot}`} />,
      }));
  }, [catalog, category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return list
      .filter((t) => {
        if (!q) return true;
        const s = t.student;
        const hay = `${s.name} ${s.regId} ${t.primary.skill} ${t.primary.role} ${t.primary.category} ${t.extra.map((g) => `${g.skill} ${g.category}`).join(" ")} ${t.achievement} ${levelOf(t.level).label}`.toLowerCase();
        return hay.includes(q) || (digits !== "" && digits === q && String(s.rollNo) === digits);
      })
      .filter((t) => category === "all" || categoriesOf(t).includes(category))
      .filter((t) => !skillSel.length || skillsOf(t).some((k) => skillSel.includes(k)))
      .filter((t) => !gradeSel.length || gradeSel.includes(String(gradeNum(t.student.section))))
      .filter((t) => letter === "all" || t.student.section.endsWith(`-${letter}`))
      .filter((t) => level === "all" || t.level === level)
      .sort((a, b) => order(a) - order(b) || a.student.name.localeCompare(b.student.name));
  }, [list, query, category, skillSel, gradeSel, letter, level]);


  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const filter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const filtersOn = query || category !== "all" || skillSel.length || gradeSel.length || letter !== "all" || level !== "all";
  const reset = () => {
    setQuery("");
    setCategory("all");
    setSkillSel([]);
    setGradeSel([]);
    setLetter("all");
    setLevel("all");
    setPage(1);
  };

  const pickCategory = (c: string) => {
    setCategory(c);
    // Drop selected skills that fall outside the new category.
    setSkillSel((sel) => (c === "all" ? sel : sel.filter((k) => catalog.skills.some((x) => x.skill === k && x.category === c))));
    setPage(1);
  };

  const unshortlist = (t: Talent) => {
    const event = shortlist[t.id];
    setShortlist((s) => Object.fromEntries(Object.entries(s).filter(([id]) => id !== t.id)));
    setToast({ text: `${t.student.name} removed from the shortlist.`, action: { label: "Undo", run: () => (setShortlist((s) => ({ ...s, [t.id]: event })), setToast(null)) } });
  };

  const actions: Actions = {
    shortlist,
    onView: (t) => setProfileId(t.id),
    onShortlist: (t) => (shortlist[t.id] ? unshortlist(t) : setPicking(t)),
  };

  const shortlistFor = (t: Talent, event: string) => {
    setShortlist((s) => ({ ...s, [t.id]: event }));
    setPicking(null);
    setToast({ text: `${t.student.name} shortlisted for ${competitions.find((c) => c.id === event)!.title}.` });
  };


  const certificate = (t: Talent) => {
    if (!printCertificate(t)) setToast({ text: "Allow pop-ups for this site to print the certificate." });
  };

  const endorse = (e: Endorsement) => {
    const existing = list.find((t) => t.student.id === e.student.id);
    const tag = { skill: e.skill, category: e.category };
    const event = e.achievement
      ? [{ date: AS_OF, title: e.achievement, scope: levelRank(e.level) >= 3 ? ("District" as const) : ("School" as const), result: levelOf(e.level).short, ...tag }]
      : [];
    const remark = e.remark ? [{ by: endorser.name, role: endorser.role, date: AS_OF, text: e.remark }] : [];

    if (existing) {
      const isPrimary = same(existing.primary.skill, e.skill);
      const hasExtra = existing.extra.some((g) => same(g.skill, e.skill));
      const raised = levelRank(e.level) > levelRank(existing.level);
      const updated: Talent = {
        ...existing,
        primary: isPrimary ? { ...tag, role: e.role || existing.primary.role } : existing.primary,
        extra: isPrimary ? existing.extra : hasExtra ? existing.extra.map((g) => (same(g.skill, e.skill) ? tag : g)) : [...existing.extra, tag],
        level: raised ? e.level : existing.level,
        achievement: e.achievement && (raised || isPrimary) ? e.achievement : existing.achievement,
        history: [...event, ...existing.history],
        remarks: [...remark, ...existing.remarks],
      };
      setList((l) => l.map((t) => (t.id === existing.id ? updated : t)));
      setToast({ text: `${e.skill} endorsement added to ${e.student.name}'s talent record.`, action: { label: "View", run: () => (setProfileId(existing.id), setToast(null)) } });
    } else {
      const id = `t${e.student.seed}`;
      const fresh: Talent = {
        id,
        student: e.student,
        primary: { ...tag, role: e.role },
        extra: [],
        level: e.level,
        achievement: e.achievement || `Endorsed in ${e.skill} by the ${endorser.role.toLowerCase()}, ${AS_OF.slice(0, 4)}`,
        history: event,
        remarks: remark.length ? remark : [{ by: mentorFor(e.category).name, role: mentorFor(e.category).role, date: AS_OF, text: "Newly profiled talent. Progress will be reviewed at the end of term." }],
      };
      setList((l) => [fresh, ...l]);
      setToast({ text: `${e.student.name} added to the talent directory for ${e.skill}.`, action: { label: "View", run: () => (setProfileId(id), setToast(null)) } });
    }
  };

  const profile = profileId ? list.find((t) => t.id === profileId) : undefined;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      {/* The page title lives in the portal top bar; this row keeps the page action. */}
      <header className="flex justify-end">
        <button type="button" onClick={() => setEndorsing(true)} className={buttonClass("primary", "lg", "cursor-pointer max-sm:w-full")}>
          <Icon d="M12 5v14 M5 12h14" className="size-5" />
          Endorse / Tag Student Skill
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Profiled Talents" value={stats.total} icon="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" note={`${stats.share}% of students · ${stats.multi} multi-talented`} />
        <StatCard label="Active Sports Talents" value={stats.sports} icon={categoryIcon(SPORTS)} note={stats.sportsNote} />
        <StatCard label="Public Speaking & Debates" value={stats.debate} icon={categoryIcon(DEBATE)} note={`${stats.orators} orators · ${stats.mun} MUN delegates`} />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search talents</span>
            <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
            <input
              type="search"
              value={query}
              onChange={(e) => filter(setQuery)(e.target.value)}
              placeholder='Search by name, roll no., ID or skill, e.g. "Fast Bowler", "Goalkeeper"'
              className={`${fieldClass} w-full pl-10`}
            />
          </label>
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div role="group" aria-label="Talent categories" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {[{ key: "all", label: "All Talents", count: list.length }, ...catalog.categories.map((c) => ({ key: c.label, ...c }))].map((c) => {
            const on = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={on}
                onClick={() => pickCategory(c.key)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition-colors ${
                  on ? "border-primary bg-primary text-surface" : "border-ink/12 text-ink/70 hover:border-accent hover:text-primary"
                }`}
              >
                {c.key === "all" ? <Icon d={categoryIcon("")} className="size-4" /> : <span aria-hidden className={`size-2.5 rounded-full ${categoryTone(c.key).dot}`} />}
                {c.label}
                <span className={`text-[.72rem] ${on ? "text-surface/70" : "text-ink/40"}`}>{c.count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-[1.3fr_1fr_.8fr_1fr_auto]">
          <MultiSelect label="All skills" options={skillOptions} value={skillSel} onChange={filter(setSkillSel)} />
          <MultiSelect label="All grades" options={grades.map((g) => ({ value: String(g), label: `Grade ${g}` }))} value={gradeSel} onChange={filter(setGradeSel)} />
          <Select label="Section" value={letter} onChange={filter(setLetter)}>
            <option value="all">All sections</option>
            {letters.map((l) => (
              <option key={l} value={l}>
                Section {l}
              </option>
            ))}
          </Select>
          <Select label="Proficiency / honor level" value={level} onChange={filter(setLevel)}>
            <option value="all">All levels</option>
            {[...levels].reverse().map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </Select>
          <button type="button" onClick={reset} disabled={!filtersOn} className={`${ghostBtn} max-lg:col-span-2 disabled:pointer-events-none disabled:opacity-45`}>
            <Icon d="M4 4v6h6 M4.5 15a8 8 0 1 0 1.9-8.3L4 10" className="size-[18px]" />
            Reset Filters
          </button>
        </div>

        {filtersOn ? (
          <p className="text-[.8rem] text-ink/55" aria-live="polite">
            <strong className="text-ink">{filtered.length}</strong> {filtered.length === 1 ? "student matches" : "students match"} these filters
            {skillSel.length > 0 && <> · skills: {skillSel.join(" or ")}</>}
            {gradeSel.length > 0 && <> · grades: {[...gradeSel].sort((a, b) => +a - +b).join(", ")}</>}
          </p>
        ) : null}

        {visible.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <Icon d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" className="size-7" />
            </span>
            <p className="font-bold">No talents match these filters</p>
            <p className="max-w-[380px] text-[.86rem] text-ink/55">Try another skill, grade or honor level, or reset the filters to see the full directory.</p>
            <button type="button" onClick={reset} className={ghostBtn}>
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${view === "table" ? "lg:hidden" : ""}`}>
              {visible.map((t) => (
                <TalentCard key={t.id} t={t} {...actions} />
              ))}
            </ul>
            {view === "table" && (
              <div className="max-lg:hidden">
                <TalentTable list={visible} {...actions} />
              </div>
            )}
          </>
        )}

        <Pagination page={current} pages={pages} total={filtered.length} size={PAGE_SIZE} noun="talents" onPage={setPage} />
      </section>

      {hydrated && profile && (
        <TalentProfile
          key={profile.id}
          t={profile}
          shortlistedFor={shortlist[profile.id]}
          onShortlist={() => actions.onShortlist(profile)}
          onCertificate={() => certificate(profile)}
          onClose={() => setProfileId(null)}
        />
      )}
      {hydrated && endorsing && <EndorseForm talents={list} pool={pool} onSave={endorse} onClose={() => setEndorsing(false)} />}
      {picking && <ShortlistDialog t={picking} onPick={(event) => shortlistFor(picking, event)} onClose={closePick} />}
      {toast && <Toast {...toast} onDone={closeToast} />}
    </main>
  );
}
