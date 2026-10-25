"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Chip, Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionLabel, students, type Student } from "@/lib/students";
import { canonical, catalogCategoryOf, catalogFrom, categories, levels, rolesFor, skills, type Level, type Talent } from "@/lib/talents";
import { categoryTone } from "./parts";

export type Endorsement = { student: Student; category: string; skills: string[]; role: string; level: Level; achievements: string[]; remark: string };
type Errors = Partial<Record<"student" | "category" | "skill", string>>;

const uniq = (list: string[]) => [...new Map(list.map((v) => [v.toLowerCase(), v])).values()];
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[.84rem] font-bold">
        {label} {hint && <span className="font-normal text-ink/50">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[.8rem] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function NewTag({ label, tone, kind }: { label: string; tone: string; kind: "category" | "skill" }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[.78rem] text-ink/55">
      <span className={`rounded-full border px-2.5 py-0.5 font-bold ${tone}`}>{label}</span>
      New {kind}: it will be created when you save.
    </p>
  );
}

const input = (bad?: string) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-[.92rem] outline-none transition-colors hover:border-accent focus:border-primary ${bad ? "border-danger" : "border-ink/12"}`;

/** Type a value and press Enter or comma to add it as a tag; Backspace on an empty field removes the last one. */
function TagField({
  id,
  tags,
  onChange,
  list,
  placeholder,
  error,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  list?: string;
  placeholder: string;
  error?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const v = raw.trim().replace(/s+/g, " ");
    setDraft("");
    if (v && !tags.some((t) => same(t, v))) onChange([...tags, v]);
  };
  return (
    <div className={`flex flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2.5 py-2 transition-colors focus-within:border-primary hover:border-accent ${error ? "border-danger" : "border-ink/12"}`}>
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-[.82rem] font-semibold text-primary">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="grid size-5 cursor-pointer place-items-center rounded-full hover:bg-primary/15">
            <Icon d="M6 6l12 12 M18 6 6 18" className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={list}
        autoComplete="off"
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={() => add(draft)}
        placeholder={tags.length ? "Add another" : placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1.5 text-[.92rem] outline-none"
      />
    </div>
  );
}

export default function EndorseForm({
  talents,
  pool = students,
  onSave,
  onClose,
}: {
  talents: Talent[];
  /** Students who can be endorsed (a teacher only sees their own classes). */
  pool?: Student[];
  onSave: (e: Endorsement) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [category, setCategory] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState<Level>("team");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pool.filter((s) => `${s.name} ${s.regId} ${s.section}`.toLowerCase().includes(q) || String(s.rollNo) === q).slice(0, 6);
  }, [query, pool]);

  const existing = student && talents.find((t) => t.student.id === student.id);

  // Suggestions mix the starter catalog with everything already typed into the directory.
  const catalog = useMemo(() => catalogFrom(talents), [talents]);
  const categoryList = useMemo(() => uniq([...categories.map((c) => c.label), ...catalog.categories.map((c) => c.label)]), [catalog]);
  const allSkills = useMemo(() => [...skills.map((k) => ({ skill: k.name, category: categories.find((c) => c.key === k.category)!.label })), ...catalog.skills], [catalog]);
  const lead = skillTags[0] ?? "";
  const roleList = useMemo(
    () => uniq([...rolesFor(lead), ...talents.filter((t) => same(t.primary.skill, lead)).map((t) => t.primary.role)].filter(Boolean)),
    [talents, lead],
  );
  const isNewCategory = category.trim() !== "" && !categoryList.some((c) => same(c, category));
  const newSkills = skillTags.filter((t) => !allSkills.some((k) => same(k.skill, t)));

  /** Adding a known skill with no category fills the category in for the principal. */
  const changeSkills = (next: string[]) => {
    setSkillTags(next);
    if (next.length) setErrors((e) => ({ ...e, skill: undefined }));
    if (category.trim() || !next[0]) return;
    const known = catalogCategoryOf(next[0]) ?? allSkills.find((k) => same(k.skill, next[0]))?.category;
    if (known) setCategory(known);
  };

  const submit = (close: () => void) => {
    const next: Errors = {};
    if (!student) next.student = "Choose the student you are endorsing.";
    if (!category.trim()) next.category = "Type a talent category, e.g. Sports & Athletics or Swimming.";
    if (!skillTags.length) next.skill = "Add at least one skill, e.g. Cricket or Quran Recitation.";
    setErrors(next);
    if (!student || Object.keys(next).length) return;
    const cat = canonical(category, categoryList);
    onSave({
      student,
      category: cat,
      skills: skillTags.map((k) => canonical(k, allSkills.filter((x) => same(x.category, cat)).map((x) => x.skill))),
      role: role.trim().replace(/\s+/g, " "),
      level,
      achievements,
      remark: remark.trim(),
    });
    close();
  };

  return (
    <Drawer
      title="Endorse / Tag Student Skill"
      subtitle="Record a talent and achievement for an existing student."
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submit(close)}
            className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}
          >
            <Icon d="M5 12l4 4 10-10" className="size-[18px]" />
            Save Endorsement
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <Field id="endorse-student" label="Student" error={errors.student}>
            {student ? (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
                <Avatar name={student.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{student.name}</p>
                  <p className="text-[.78rem] text-ink/55">
                    {sectionLabel(student.section)} · Roll {student.rollNo} · {student.regId}
                  </p>
                  {existing && <p className="mt-0.5 text-[.76rem] font-semibold text-primary">Already profiled: this skill will be added to their record.</p>}
                </div>
                <button type="button" onClick={() => setStudent(null)} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[.8rem] font-bold text-primary hover:bg-primary/8">
                  Change
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <div className="relative">
                  <Icon d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/45" />
                  <input
                    id="endorse-student"
                    type="search"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, roll no., registration ID or class"
                    aria-invalid={!!errors.student}
                    aria-describedby={errors.student ? "endorse-student-error" : undefined}
                    className={`${input(errors.student)} pl-10`}
                  />
                </div>
                {matches.length > 0 && (
                  <ul className="overflow-hidden rounded-2xl border border-ink/10">
                    {matches.map((s) => (
                      <li key={s.id} className="border-b border-ink/8 last:border-0">
                        <button
                          type="button"
                          onClick={() => {
                            setStudent(s);
                            setErrors((e) => ({ ...e, student: undefined }));
                          }}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary/6"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[.9rem] font-bold">{s.name}</span>
                            <span className="text-[.76rem] text-ink/50">
                              Roll {s.rollNo} · {s.regId}
                            </span>
                          </span>
                          <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-[.72rem] font-bold text-primary">{sectionLabel(s.section)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {query.trim() && matches.length === 0 && <p className="text-[.82rem] text-ink/55">No student matches &quot;{query}&quot;.</p>}
              </div>
            )}
          </Field>

          <div className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-4 sm:p-5">
            <p className="text-[.8rem] text-ink/60">
              Type any category, skill and position. Suggestions appear as you type, and anything new is added to the directory filters automatically.
            </p>
            <Field id="endorse-category" label="Talent category" error={errors.category}>
              <input
                id="endorse-category"
                list="endorse-category-list"
                autoComplete="off"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Sports & Athletics, Islamic Studies, Swimming"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? "endorse-category-error" : undefined}
                className={input(errors.category)}
              />
              <datalist id="endorse-category-list">
                {categoryList.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {isNewCategory && <NewTag label={category.trim()} tone={categoryTone(category).chip} kind="category" />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="endorse-skill" label="Specific skill" hint="(press Enter to add each)" error={errors.skill}>
                <TagField id="endorse-skill" tags={skillTags} onChange={changeSkills} placeholder="e.g. Cricket, Naat, Swimming" error={errors.skill} />
                {newSkills.map((k) => (
                  <NewTag key={k} label={k} tone="border-ink/12 bg-white text-ink/70" kind="skill" />
                ))}
              </Field>
              <Field id="endorse-role" label="Position / specialisation" hint="(optional)">
                <input
                  id="endorse-role"
                  list="endorse-role-list"
                  autoComplete="off"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Captain, Goalkeeper, Lead Vocalist"
                  className={input()}
                />
                <datalist id="endorse-role-list">
                  {roleList.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </Field>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-[.84rem] font-bold">Proficiency / honor level</legend>
            <div className="flex flex-wrap gap-2">
              {levels.map((l) => (
                <Chip key={l.key} type="radio" name="endorse-level" checked={level === l.key} onChange={() => setLevel(l.key)}>
                  {l.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <Field id="endorse-achievement" label="Achievement / honor" hint="(optional, press Enter to add each)">
            <TagField id="endorse-achievement" tags={achievements} onChange={setAchievements} placeholder="e.g. Best Speaker - Regional Debate 2026" />
          </Field>

          <Field id="endorse-remark" label="Coach or coordinator remark" hint="(optional)">
            <textarea id="endorse-remark" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Feedback from the sports coach or activity coordinator" className={`${input()} resize-y`} />
          </Field>
        </div>
      )}
    </Drawer>
  );
}
