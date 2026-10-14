"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Chip, Drawer, Select, ghostBtn } from "@/components/dashboard/controls";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionLabel, students, type Student } from "@/lib/students";
import { categories, levels, skillOf, skills, type CategoryKey, type Level, type Talent } from "@/lib/talents";

export type Endorsement = { student: Student; skill: string; role: string; level: Level; achievement: string; remark: string };

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

const input = (bad?: string) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-[.92rem] outline-none transition-colors hover:border-accent focus:border-primary ${bad ? "border-danger" : "border-ink/12"}`;

export default function EndorseForm({ talents, onSave, onClose }: { talents: Talent[]; onSave: (e: Endorsement) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [category, setCategory] = useState<CategoryKey>("sports");
  const [skill, setSkill] = useState(skills.find((k) => k.category === "sports")!.name);
  const [role, setRole] = useState(skillOf(skill).roles[0]);
  const [level, setLevel] = useState<Level>("team");
  const [achievement, setAchievement] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string>();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students.filter((s) => `${s.name} ${s.regId} ${s.section}`.toLowerCase().includes(q) || String(s.rollNo) === q).slice(0, 6);
  }, [query]);

  const existing = student && talents.find((t) => t.student.id === student.id);

  const pickCategory = (c: CategoryKey) => {
    setCategory(c);
    const first = skills.find((k) => k.category === c)!;
    setSkill(first.name);
    setRole(first.roles[0]);
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
            onClick={() => {
              if (!student) return setError("Choose the student you are endorsing.");
              onSave({ student, skill, role, level, achievement: achievement.trim(), remark: remark.trim() });
              close();
            }}
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
          <Field id="endorse-student" label="Student" error={error}>
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
                    aria-invalid={!!error}
                    aria-describedby={error ? "endorse-student-error" : undefined}
                    className={`${input(error)} pl-10`}
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
                            setError(undefined);
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

          <fieldset>
            <legend className="mb-2 text-[.84rem] font-bold">Talent category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip key={c.key} type="radio" name="endorse-category" checked={category === c.key} onChange={() => pickCategory(c.key)}>
                  <Icon d={c.icon} className="size-4" />
                  {c.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="endorse-skill" label="Specific skill">
              <Select
                label="Specific skill"
                value={skill}
                onChange={(v) => {
                  setSkill(v);
                  setRole(skillOf(v).roles[0]);
                }}
              >
                {skills
                  .filter((k) => k.category === category)
                  .map((k) => (
                    <option key={k.name} value={k.name}>
                      {k.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field id="endorse-role" label="Position / specialisation">
              <Select label="Position / specialisation" value={role} onChange={setRole}>
                {skillOf(skill).roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
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

          <Field id="endorse-achievement" label="Achievement / honor" hint="(optional)">
            <input id="endorse-achievement" value={achievement} onChange={(e) => setAchievement(e.target.value)} placeholder="e.g. Best Speaker - Regional Debate 2026" className={input()} />
          </Field>

          <Field id="endorse-remark" label="Coach or coordinator remark" hint="(optional)">
            <textarea id="endorse-remark" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Feedback from the sports coach or activity coordinator" className={`${input()} resize-y`} />
          </Field>
        </div>
      )}
    </Drawer>
  );
}
