"use client";

import {
  ampm,
  feePlans,
  monthNames,
  sectionLetters,
  sectionTotal,
  shortDay,
  uid,
  weekdays,
  type Errors,
  type Onboarding,
  type StepKey,
} from "@/lib/onboarding";
import { AddButton, Block, ErrorText, Note, RemoveButton, SelectField, Stepper, TextField, ToggleChip, inputClass } from "./kit";

export type StepProps = { d: Onboarding; set: (fn: (d: Onboarding) => Onboarding) => void; errors: Errors };

const grades = Array.from({ length: 10 }, (_, i) => i + 1);
const addMinutes = (hm: string, mins: number) => {
  const [h, m] = hm.split(":").map(Number);
  const t = Math.min(h * 60 + m + mins, 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/* ---------------- 1. School ---------------- */

export function SchoolStep({ d, set, errors }: StepProps) {
  const s = d.school;
  const put = (k: keyof Onboarding["school"], v: string) => set((x) => ({ ...x, school: { ...x.school, [k]: v } }));
  return (
    <div className="grid gap-5">
      <TextField id="ob-name" label="School name" placeholder="e.g. Greenfield Public School" value={s.name} error={errors["ob-name"]} onChange={(e) => put("name", e.target.value)} note="Printed on report cards, fee reports, certificates and reminders." />
      <TextField id="ob-principal" label="Principal's full name" placeholder="e.g. Dr. Sara Ahmed" value={s.principal} error={errors["ob-principal"]} onChange={(e) => put("principal", e.target.value)} note="Signs report cards and talent certificates." />
    </div>
  );
}

/* ---------------- 2. Calendar ---------------- */

export function CalendarStep({ d, set, errors }: StepProps) {
  const c = d.calendar;
  const put = (patch: Partial<Onboarding["calendar"]>) => set((x) => ({ ...x, calendar: { ...x.calendar, ...patch } }));
  const endMonth = monthNames[(c.yearStartMonth + 10) % 12];
  return (
    <div className="grid gap-7">
      <Block title="Academic year" hint={`Your year runs ${monthNames[c.yearStartMonth - 1]} to ${endMonth}. Fee installments follow the same months.`}>
        <SelectField id="ob-year-start" label="Year starts in" value={c.yearStartMonth} onChange={(v) => put({ yearStartMonth: Number(v) })} className="max-w-[260px]">
          {monthNames.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </SelectField>
      </Block>

      <Block title="Current term" hint="Attendance rates are counted from the term's start date.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="ob-term" label="Term name" placeholder="e.g. Autumn term 2026" value={c.termName} error={errors["ob-term"]} onChange={(e) => put({ termName: e.target.value })} />
          <TextField id="ob-term-start" label="Term started on" type="date" value={c.termStart} error={errors["ob-term-start"]} onChange={(e) => put({ termStart: e.target.value })} />
        </div>
      </Block>

      <Block title="Exam terms" hint="Teachers fill one report card per student for each exam term." action={<AddButton onClick={() => put({ examTerms: [...c.examTerms, ""] })}>Add exam term</AddButton>}>
        <ol className="grid gap-2.5">
          {c.examTerms.map((t, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[.8rem] font-bold text-primary">{i + 1}</span>
              <input
                id={`ob-exam-${i}`}
                aria-label={`Exam term ${i + 1}`}
                placeholder="e.g. Final Exam"
                value={t}
                onChange={(e) => put({ examTerms: c.examTerms.map((x, k) => (k === i ? e.target.value : x)) })}
                className={inputClass(i === 0 ? errors["ob-exam-0"] : undefined)}
              />
              <RemoveButton label={`Remove exam term ${i + 1}`} disabled={c.examTerms.length === 1} onClick={() => put({ examTerms: c.examTerms.filter((_, k) => k !== i) })} />
            </li>
          ))}
        </ol>
        <ErrorText id="ob-exam-0" error={errors["ob-exam-0"]} />
      </Block>

      <Block title="School days" hint="Attendance is only taken on these days.">
        <div id="ob-days" tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
          {weekdays.map((w) => (
            <ToggleChip
              key={w.n}
              id={`ob-day-${w.n}`}
              checked={c.schoolDays.includes(w.n)}
              onChange={() => put({ schoolDays: c.schoolDays.includes(w.n) ? c.schoolDays.filter((x) => x !== w.n) : [...c.schoolDays, w.n] })}
            >
              {w.short}
            </ToggleChip>
          ))}
        </div>
        <ErrorText id="ob-days" error={errors["ob-days"]} />
      </Block>

      <Block
        title="Holidays and breaks"
        hint="No attendance is expected on these dates. A one-day holiday has the same start and end date."
        action={<AddButton onClick={() => put({ holidays: [...c.holidays, { id: uid("h"), name: "", from: "", to: "" }] })}>Add holiday</AddButton>}
      >
        {c.holidays.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink/15 px-4 py-5 text-center text-[.88rem] text-ink/55">No holidays added yet.</p>
        ) : (
          <ul className="grid gap-3">
            {c.holidays.map((h) => {
              const id = `ob-hol-${h.id}`;
              const edit = (patch: Partial<typeof h>) => put({ holidays: c.holidays.map((x) => (x.id === h.id ? { ...x, ...patch } : x)) });
              return (
                <li key={h.id}>
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 gap-2 sm:grid-cols-[1.4fr_1fr_1fr]">
                      <input id={id} aria-label="Holiday name" placeholder="Holiday name" value={h.name} onChange={(e) => edit({ name: e.target.value })} className={inputClass(errors[id])} />
                      <input type="date" aria-label={`${h.name || "Holiday"} starts`} value={h.from} onChange={(e) => edit({ from: e.target.value, to: h.to && h.to >= e.target.value ? h.to : e.target.value })} className={inputClass()} />
                      <input type="date" aria-label={`${h.name || "Holiday"} ends`} value={h.to} min={h.from || undefined} onChange={(e) => edit({ to: e.target.value })} className={inputClass()} />
                    </div>
                    <RemoveButton label={`Remove ${h.name || "holiday"}`} onClick={() => put({ holidays: c.holidays.filter((x) => x.id !== h.id) })} />
                  </div>
                  <ErrorText id={id} error={errors[id]} />
                </li>
              );
            })}
          </ul>
        )}
      </Block>
    </div>
  );
}

/* ---------------- 3. Timings ---------------- */

export function TimingsStep({ d, set, errors }: StepProps) {
  const t = d.timings;
  const put = (patch: Partial<Onboarding["timings"]>) => set((x) => ({ ...x, timings: { ...x.timings, ...patch } }));
  const add = (isBreak: boolean) => {
    const last = t.periods.at(-1);
    const start = last?.end ?? t.start;
    const teaching = t.periods.filter((p) => !p.isBreak).length;
    put({ periods: [...t.periods, { id: uid("p"), label: isBreak ? "Break" : `Period ${teaching + 1}`, start, end: addMinutes(start, isBreak ? 20 : 45), isBreak }] });
  };
  return (
    <div className="grid gap-7">
      <Block title="School hours" hint="Teachers who check in after the start time are marked late.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="ob-start" label="School starts" type="time" value={t.start} error={errors["ob-start"]} onChange={(e) => put({ start: e.target.value })} />
          <TextField id="ob-end" label="School ends" type="time" value={t.end} onChange={(e) => put({ end: e.target.value })} />
        </div>
      </Block>

      <Block
        title="Daily periods"
        hint="The bell schedule students see on their timetable. Subjects and teachers are assigned to periods later."
        action={
          <div className="flex flex-wrap gap-2">
            <AddButton onClick={() => add(false)}>Add period</AddButton>
            <AddButton onClick={() => add(true)}>Add break</AddButton>
          </div>
        }
      >
        <ul id="ob-periods" tabIndex={-1} className="grid gap-3 outline-none">
          {t.periods.map((p) => {
            const id = `ob-per-${p.id}`;
            const edit = (patch: Partial<typeof p>) => put({ periods: t.periods.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) });
            return (
              <li key={p.id}>
                <div className={`flex items-start gap-2 rounded-2xl p-2 ${p.isBreak ? "bg-accent/12" : "bg-surface"}`}>
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1.3fr_1fr_1fr]">
                    <input id={id} aria-label="Period name" value={p.label} onChange={(e) => edit({ label: e.target.value })} className={inputClass(errors[id])} />
                    <input type="time" aria-label={`${p.label} starts`} value={p.start} onChange={(e) => edit({ start: e.target.value })} className={inputClass()} />
                    <input type="time" aria-label={`${p.label} ends`} value={p.end} onChange={(e) => edit({ end: e.target.value })} className={inputClass()} />
                  </div>
                  <RemoveButton label={`Remove ${p.label || "period"}`} disabled={t.periods.length === 1} onClick={() => put({ periods: t.periods.filter((x) => x.id !== p.id) })} />
                </div>
                <ErrorText id={id} error={errors[id]} />
              </li>
            );
          })}
        </ul>
        <ErrorText id="ob-periods" error={errors["ob-periods"]} />
      </Block>
    </div>
  );
}

/* ---------------- 4. Classes ---------------- */

export function ClassesStep({ d, set, errors }: StepProps) {
  const on = d.grades.filter((g) => g.on);
  const edit = (grade: number, patch: Partial<Onboarding["grades"][number]>) => set((x) => ({ ...x, grades: x.grades.map((g) => (g.grade === grade ? { ...g, ...patch } : g)) }));
  return (
    <div className="grid gap-5">
      <p className="text-[.9rem] text-ink/65">
        <strong className="text-ink">{sectionTotal(d)} sections</strong> across {on.length} {on.length === 1 ? "grade" : "grades"}. Each section gets its own class teacher, attendance register and fee register.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {d.grades.map((g) => (
          <li key={g.grade} className={`flex items-center justify-between gap-3 rounded-2xl border p-3 pl-4 transition-colors ${g.on ? "border-ink/12 bg-white" : "border-dashed border-ink/12 bg-surface"}`}>
            <label htmlFor={`ob-grade-${g.grade}`} className="flex min-w-0 cursor-pointer items-center gap-3">
              <input id={`ob-grade-${g.grade}`} type="checkbox" checked={g.on} onChange={() => edit(g.grade, { on: !g.on })} className="size-[18px] shrink-0 cursor-pointer accent-primary" />
              <span className="min-w-0">
                <span className={`block font-bold ${g.on ? "" : "text-ink/45"}`}>Grade {g.grade}</span>
                <span className="block truncate text-[.8rem] text-ink/55">{g.on ? sectionLetters(g.sections).map((l) => `${g.grade}-${l}`).join(", ") : "Not offered"}</span>
              </span>
            </label>
            <Stepper id={`ob-sec-${g.grade}`} label={`Sections in Grade ${g.grade}`} value={g.sections} min={1} max={8} disabled={!g.on} onChange={(v) => edit(g.grade, { sections: v })} />
          </li>
        ))}
      </ul>
      <ErrorText id="ob-grade-1" error={errors["ob-grade-1"]} />
    </div>
  );
}

/* ---------------- 5. Subjects ---------------- */

export function SubjectsStep({ d, set, errors }: StepProps) {
  const editSub = (id: string, patch: Partial<Onboarding["subjects"][number]>) => set((x) => ({ ...x, subjects: x.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  return (
    <div className="grid gap-7">
      <Block
        title="Subjects"
        hint="Which grades study each subject. Report cards and teacher assignments use this list."
        action={<AddButton onClick={() => set((x) => ({ ...x, subjects: [...x.subjects, { id: uid("sub"), name: "", from: 1, to: 10 }] }))}>Add subject</AddButton>}
      >
        <div className="mb-2 hidden gap-2 px-1 text-[.76rem] font-bold uppercase tracking-wider text-ink/50 sm:grid sm:grid-cols-[1.8fr_1fr_1fr_40px]">
          <span>Subject</span>
          <span>From grade</span>
          <span>To grade</span>
        </div>
        <ul id="ob-subjects" tabIndex={-1} className="grid gap-3 outline-none">
          {d.subjects.map((s) => {
            const id = `ob-sub-${s.id}`;
            return (
              <li key={s.id}>
                <div className="grid grid-cols-[1fr_40px] gap-2 rounded-2xl bg-surface p-2 sm:grid-cols-[1.8fr_1fr_1fr_40px] sm:bg-transparent sm:p-0">
                  <input id={id} aria-label="Subject name" placeholder="Subject name" value={s.name} onChange={(e) => editSub(s.id, { name: e.target.value })} className={inputClass(errors[id])} />
                  <div className="col-span-2 row-start-2 grid grid-cols-2 gap-2 sm:contents">
                    <SelectField id={`${id}-from`} ariaLabel={`${s.name || "Subject"} from grade`} value={s.from} onChange={(v) => editSub(s.id, { from: Number(v) })}>
                      {grades.map((g) => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </SelectField>
                    <SelectField id={`${id}-to`} ariaLabel={`${s.name || "Subject"} to grade`} value={s.to} onChange={(v) => editSub(s.id, { to: Number(v) })}>
                      {grades.map((g) => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">
                    <RemoveButton label={`Remove ${s.name || "subject"}`} onClick={() => set((x) => ({ ...x, subjects: x.subjects.filter((y) => y.id !== s.id) }))} />
                  </div>
                </div>
                <ErrorText id={id} error={errors[id]} />
              </li>
            );
          })}
        </ul>
        <ErrorText id="ob-subjects" error={errors["ob-subjects"]} />
      </Block>
    </div>
  );
}

/* ---------------- 6. Fees ---------------- */

export function FeesStep({ d, set, errors }: StepProps) {
  const f = d.fees;
  const put = (patch: Partial<Onboarding["fees"]>) => set((x) => ({ ...x, fees: { ...x.fees, ...patch } }));
  return (
    <div className="grid gap-7">
      <Note>Fees are tracked by status, due dates and payment behaviour only. No amounts are recorded anywhere on the platform.</Note>

      <Block title="Installment plans offered" hint="Each student follows one of these plans per academic year.">
        <div id="ob-plan-monthly" tabIndex={-1} className="grid gap-3 outline-none sm:grid-cols-3">
          {feePlans.map((p) => {
            const on = f.plans.includes(p.key);
            return (
              <label key={p.key} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/30 ${on ? "border-primary bg-primary/5" : "border-ink/12 bg-white hover:border-accent"}`}>
                <input type="checkbox" checked={on} onChange={() => put({ plans: on ? f.plans.filter((x) => x !== p.key) : [...f.plans, p.key] })} className="mt-1 size-[18px] shrink-0 cursor-pointer accent-primary" />
                <span>
                  <span className="block font-bold">{p.label}</span>
                  <span className="block text-[.82rem] text-ink/60">{p.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        <ErrorText id="ob-plan-monthly" error={errors["ob-plan-monthly"]} />
      </Block>

      <Block title="Due date and defaulters">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SelectField id="ob-due" label="Fees fall due on" value={f.dueDay} onChange={(v) => put({ dueDay: Number(v) })}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Day {n} of the month</option>
              ))}
            </SelectField>
            <p className="pt-1.5 text-[.8rem] text-ink/55">Paid after this day counts as late.</p>
          </div>
          <div>
            <SelectField id="ob-defaulter" label="Mark as defaulter after" value={f.defaulterMonths} onChange={(v) => put({ defaulterMonths: Number(v) })}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} unpaid {n === 1 ? "month" : "months"}</option>
              ))}
            </SelectField>
            <p className="pt-1.5 text-[.8rem] text-ink/55">Defaulters are flagged for reminders.</p>
          </div>
        </div>
      </Block>
    </div>
  );
}

/* ---------------- 7. Policies ---------------- */

export function PoliciesStep({ d, set, errors }: StepProps) {
  const p = d.policies;
  const put = (patch: Partial<Onboarding["policies"]>) => set((x) => ({ ...x, policies: { ...x.policies, ...patch } }));
  const pct = (v: string) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const lowest = p.scale.at(-1);
  return (
    <div className="grid gap-7">
      <Block title="Attendance thresholds">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="ob-att-student" label="Student attendance defaulter below (%)" type="number" min={0} max={100} value={p.studentAttendanceBelow} onChange={(e) => put({ studentAttendanceBelow: pct(e.target.value) })} note="Students under this term rate are flagged." />
          <TextField id="ob-att-class" label="Flag a class below (%)" type="number" min={0} max={100} value={p.classAttendanceBelow} onChange={(e) => put({ classAttendanceBelow: pct(e.target.value) })} note="Shown in red on the principal overview." />
        </div>
      </Block>

      <Block title="Grading scale" hint="Letter grades on report cards, from the minimum percentage for each.">
        <ul className="grid max-w-[420px] gap-2.5">
          {p.scale.map((b, i) => {
            const id = `ob-band-${i}`;
            return (
              <li key={b.letter}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-14 shrink-0 place-items-center rounded-xl bg-primary text-[.95rem] font-extrabold text-surface">{b.letter}</span>
                  <label htmlFor={id} className="text-[.88rem] font-semibold text-ink/60">
                    <span className="sr-only">{b.letter} </span>from
                  </label>
                  <input id={id} type="number" min={1} max={100} value={b.min} onChange={(e) => put({ scale: p.scale.map((x, k) => (k === i ? { ...x, min: pct(e.target.value) } : x)) })} className={`${inputClass(errors[id])} max-w-[110px]`} />
                  <span className="text-[.9rem] font-semibold text-ink/60">%</span>
                </div>
                <ErrorText id={id} error={errors[id]} />
              </li>
            );
          })}
          <li className="flex items-center gap-3">
            <span className="grid h-10 w-14 shrink-0 place-items-center rounded-xl bg-ink/10 text-[.95rem] font-extrabold text-ink/70">F</span>
            <span className="text-[.9rem] text-ink/60">Below {lowest?.min ?? 0}%</span>
          </li>
        </ul>
      </Block>
    </div>
  );
}

/* ---------------- 8. Review ---------------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-[.84rem] font-semibold text-ink/55">{label}</dt>
      <dd className="text-[.92rem]">{children}</dd>
    </div>
  );
}

export function ReviewStep({ d, onEdit }: { d: Onboarding; onEdit: (k: StepKey) => void }) {
  const c = d.calendar;
  const days = weekdays.filter((w) => c.schoolDays.includes(w.n)).map((w) => w.short);
  const card = (title: string, key: StepKey, rows: React.ReactNode) => (
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="font-bold">{title}</h3>
        <button type="button" onClick={() => onEdit(key)} className="cursor-pointer rounded-lg px-2.5 py-1 text-[.84rem] font-semibold text-primary transition-colors hover:bg-primary/8">
          Edit
        </button>
      </div>
      <dl className="divide-y divide-ink/8">{rows}</dl>
    </section>
  );
  return (
    <div className="grid gap-4">
      {card(
        "School",
        "school",
        <>
          <Row label="School name">{d.school.name}</Row>
          <Row label="Principal">{d.school.principal}</Row>        </>,
      )}
      {card(
        "Calendar",
        "calendar",
        <>
          <Row label="Academic year">{monthNames[c.yearStartMonth - 1]} to {monthNames[(c.yearStartMonth + 10) % 12]}</Row>
          <Row label="Current term">{c.termName}, from {shortDay(c.termStart)}</Row>
          <Row label="Exam terms">{c.examTerms.filter((t) => t.trim()).join(", ")}</Row>
          <Row label="School days">{days.join(", ")}</Row>
          <Row label="Holidays and breaks">{c.holidays.length ? c.holidays.map((h) => `${h.name} (${h.from === h.to ? shortDay(h.from) : `${shortDay(h.from)} to ${shortDay(h.to)}`})`).join(", ") : "None"}</Row>
        </>,
      )}
      {card(
        "Timings",
        "timings",
        <>
          <Row label="School hours">{ampm(d.timings.start)} to {ampm(d.timings.end)}</Row>
          <Row label="Daily periods">
            {d.timings.periods.filter((p) => !p.isBreak).length} periods, {d.timings.periods.filter((p) => p.isBreak).length} {d.timings.periods.filter((p) => p.isBreak).length === 1 ? "break" : "breaks"}
          </Row>
        </>,
      )}
      {card(
        "Classes",
        "classes",
        <>
          <Row label="Grades offered">{d.grades.filter((g) => g.on).map((g) => g.grade).join(", ")}</Row>
          <Row label="Sections">{sectionTotal(d)} in total</Row>
        </>,
      )}
      {card(
        "Subjects",
        "subjects",
        <>          <Row label="Subjects">{d.subjects.map((s) => s.name).join(", ")}</Row>
        </>,
      )}
      {card(
        "Fees",
        "fees",
        <>
          <Row label="Plans offered">{feePlans.filter((p) => d.fees.plans.includes(p.key)).map((p) => p.label).join(", ")}</Row>
          <Row label="Due date">Day {d.fees.dueDay} of each month</Row>
          <Row label="Defaulter after">{d.fees.defaulterMonths} unpaid {d.fees.defaulterMonths === 1 ? "month" : "months"}</Row>
        </>,
      )}
      {card(
        "Policies",
        "policies",
        <>
          <Row label="Student attendance">Defaulter below {d.policies.studentAttendanceBelow}%</Row>
          <Row label="Class attendance">Flagged below {d.policies.classAttendanceBelow}%</Row>
          <Row label="Grading scale">{d.policies.scale.map((b) => `${b.letter} ${b.min}%+`).join(", ")}, F below</Row>
        </>,
      )}
    </div>
  );
}
