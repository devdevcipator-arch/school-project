"use client";

import { useState, type ReactNode } from "react";
import { ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionSubjects } from "@/lib/assessments";
import { mySections } from "@/lib/classAttendance";
import type { DraftAction } from "@/lib/copilot";
import { sectionLabel, sections } from "@/lib/students";
import { emailFor, subjects } from "@/lib/teachers";

export type ActionState = "pending" | "executed" | "cancelled";

const meta: Record<DraftAction["type"], { label: string; icon: string; confirm: string }> = {
  teacher: { label: "Add new teacher", icon: "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M19 8v6 M16 11h6", confirm: "Create Teacher Account" },
  student: { label: "Enroll student", icon: "M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5", confirm: "Enroll Student" },
  announcement: { label: "Post announcement", icon: "M3 11l15-6v14L3 13z M7 13v5h3v-4", confirm: "Post Announcement" },
  quiz: { label: "Generate AI quiz", icon: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3", confirm: "Generate Quiz" },
  "class-notice": { label: "Send class notice", icon: "M3 11l15-6v14L3 13z M7 13v5h3v-4", confirm: "Send Notice" },
  remark: { label: "Report card remark", icon: "M4 20h4L19 9l-4-4L4 16z M14 6l4 4", confirm: "Use This Remark" },
};

const input = (bad?: boolean) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-[.88rem] text-ink outline-none transition-colors hover:border-accent focus:border-primary ${bad ? "border-danger" : "border-ink/12"}`;

function Field({ id, label, error, children, wide = false }: { id: string; label: string; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1 block text-[.76rem] font-bold text-ink/65">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[.76rem] font-semibold text-danger">{error}</p>}
    </div>
  );
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRe = /^\+?\d[\d\s-]{9,15}$/;

/**
 * Direct action drafted by the copilot. Nothing runs until the user reviews the fields and confirms.
 */
export default function ActionCard({
  id,
  draft,
  state,
  result,
  onExecute,
  onCancel,
}: {
  id: string;
  draft: DraftAction;
  state: ActionState;
  result?: string;
  onExecute: (d: DraftAction) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<DraftAction>(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = meta[d.type];
  const set = (patch: Partial<DraftAction>) => setD((x) => ({ ...x, ...patch }) as DraftAction);
  const f = (k: string) => `${id}-${k}`;

  const confirm = () => {
    const e: Record<string, string> = {};
    if (d.type === "teacher") {
      if (d.name.trim().length < 3) e.name = "Enter the teacher's full name.";
      if (!emailRe.test(d.email)) e.email = "Enter a valid email address.";
      if (!d.subject) e.subject = "Choose a subject.";
      if (d.phone && !phoneRe.test(d.phone)) e.phone = "Enter a valid phone number.";
    } else if (d.type === "student") {
      if (d.name.trim().length < 3) e.name = "Enter the student's full name.";
      if (!sections.includes(d.section)) e.section = "Choose a class and section.";
      if (d.guardian.trim().length < 3) e.guardian = "Enter the guardian's name.";
      if (!phoneRe.test(d.phone)) e.phone = "Enter the guardian's phone number.";
    } else if (d.type === "quiz") {
      if (d.topic.trim().length < 3) e.topic = "Name the topic or chapter.";
    } else if (d.type === "remark") {
      if (d.text.trim().length < 10) e.text = "Write the remark.";
    } else {
      if (d.title.trim().length < 4) e.title = "Add a title.";
      if (d.body.trim().length < 10) e.body = "Write the message.";
    }
    setErrors(e);
    if (!Object.keys(e).length) onExecute(d);
  };

  if (state !== "pending")
    return (
      <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-[.86rem] ${state === "executed" ? "bg-ok/20 text-[#bfe9d0]" : "bg-surface/8 text-surface/60"}`}>
        <Icon d={state === "executed" ? "M5 12l4 4 10-10" : "M6 6l12 12 M18 6 6 18"} className="mt-0.5 size-5 shrink-0" />
        <span>{state === "executed" ? result : `${m.label} cancelled. Nothing was changed.`}</span>
      </div>
    );

  return (
    <div className="rounded-2xl bg-white p-4 text-ink shadow-[0_14px_34px_rgba(0,0,0,.25)] sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
          <Icon d={m.icon} className="size-5" />
        </span>
        <div>
          <p className="text-[.7rem] font-bold uppercase tracking-[.12em] text-accent">Action requires your confirmation</p>
          <p className="font-extrabold tracking-tight">{m.label}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {d.type === "teacher" && (
          <>
            <Field id={f("name")} label="Full name" error={errors.name}>
              <input id={f("name")} value={d.name} onChange={(e) => set({ name: e.target.value, email: d.email && d.email !== emailFor(d.name) ? d.email : emailFor(e.target.value) })} className={input(!!errors.name)} />
            </Field>
            <Field id={f("subject")} label="Subject" error={errors.subject}>
              <select id={f("subject")} value={d.subject} onChange={(e) => set({ subject: e.target.value })} className={`${input(!!errors.subject)} cursor-pointer`}>
                <option value="">Choose a subject</option>
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field id={f("email")} label="School email" error={errors.email}>
              <input id={f("email")} type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} className={input(!!errors.email)} />
            </Field>
            <Field id={f("phone")} label="Phone (optional)" error={errors.phone}>
              <input id={f("phone")} value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+92 3XX XXXXXXX" className={input(!!errors.phone)} />
            </Field>
            <Field id={f("ct")} label="Class teacher of (optional)" wide>
              <select id={f("ct")} value={d.classTeacher} onChange={(e) => set({ classTeacher: e.target.value })} className={`${input()} cursor-pointer`}>
                <option value="">Not a class teacher</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {d.type === "student" && (
          <>
            <Field id={f("name")} label="Student's full name" error={errors.name}>
              <input id={f("name")} value={d.name} onChange={(e) => set({ name: e.target.value })} className={input(!!errors.name)} />
            </Field>
            <Field id={f("section")} label="Class & section" error={errors.section}>
              <select id={f("section")} value={d.section} onChange={(e) => set({ section: e.target.value })} className={`${input(!!errors.section)} cursor-pointer`}>
                <option value="">Choose a class</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={f("guardian")} label="Guardian's name" error={errors.guardian}>
              <input id={f("guardian")} value={d.guardian} onChange={(e) => set({ guardian: e.target.value })} className={input(!!errors.guardian)} />
            </Field>
            <Field id={f("phone")} label="Guardian's phone" error={errors.phone}>
              <input id={f("phone")} value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+92 3XX XXXXXXX" className={input(!!errors.phone)} />
            </Field>
          </>
        )}
        {d.type === "quiz" && (
          <>
            <Field id={f("topic")} label="Topic / chapter" error={errors.topic} wide>
              <input id={f("topic")} value={d.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="e.g. Quadratic Equations" className={input(!!errors.topic)} />
            </Field>
            <Field id={f("section")} label="Class">
              <select
                id={f("section")}
                value={d.section}
                onChange={(e) => set({ section: e.target.value, subject: sectionSubjects(e.target.value).includes(d.subject) ? d.subject : sectionSubjects(e.target.value)[0] })}
                className={`${input()} cursor-pointer`}
              >
                {mySections.map((s) => (
                  <option key={s.section} value={s.section}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={f("subject")} label="Subject">
              <select id={f("subject")} value={d.subject} onChange={(e) => set({ subject: e.target.value })} className={`${input()} cursor-pointer`}>
                {sectionSubjects(d.section).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field id={f("count")} label="Questions">
              <input id={f("count")} type="number" min={3} max={30} value={d.count} onChange={(e) => set({ count: Math.max(3, Math.min(30, Number(e.target.value) || 3)) })} className={input()} />
            </Field>
            <Field id={f("difficulty")} label="Difficulty">
              <select id={f("difficulty")} value={d.difficulty} onChange={(e) => set({ difficulty: e.target.value as typeof d.difficulty })} className={`${input()} cursor-pointer`}>
                {["Easy", "Medium", "Hard", "Adaptive"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </>
        )}
        {d.type === "class-notice" && (
          <>
            <Field id={f("title")} label="Title" error={errors.title} wide>
              <input id={f("title")} value={d.title} onChange={(e) => set({ title: e.target.value })} className={input(!!errors.title)} />
            </Field>
            <Field id={f("body")} label="Message" error={errors.body} wide>
              <textarea id={f("body")} rows={4} value={d.body} onChange={(e) => set({ body: e.target.value })} className={`${input(!!errors.body)} resize-y`} />
            </Field>
            <Field id={f("section")} label="Class">
              <select id={f("section")} value={d.section} onChange={(e) => set({ section: e.target.value })} className={`${input()} cursor-pointer`}>
                {mySections.map((s) => (
                  <option key={s.section} value={s.section}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={f("audience")} label="Send to">
              <select id={f("audience")} value={d.audience} onChange={(e) => set({ audience: e.target.value as typeof d.audience })} className={`${input()} cursor-pointer`}>
                <option value="students">Students of this class</option>
                <option value="parents">Parents of this class</option>
              </select>
            </Field>
          </>
        )}
        {d.type === "remark" && (
          <Field id={f("text")} label={`Remark for ${d.student} (${sectionLabel(d.section)})`} error={errors.text} wide>
            <textarea id={f("text")} rows={4} value={d.text} onChange={(e) => set({ text: e.target.value })} className={`${input(!!errors.text)} resize-y`} />
          </Field>
        )}
        {d.type === "announcement" && (
          <>
            <Field id={f("title")} label="Title" error={errors.title} wide>
              <input id={f("title")} value={d.title} onChange={(e) => set({ title: e.target.value })} className={input(!!errors.title)} />
            </Field>
            <Field id={f("body")} label="Message" error={errors.body} wide>
              <textarea id={f("body")} rows={4} value={d.body} onChange={(e) => set({ body: e.target.value })} className={`${input(!!errors.body)} resize-y`} />
            </Field>
            <Field id={f("audience")} label="Audience">
              <select id={f("audience")} value={d.audience} onChange={(e) => set({ audience: e.target.value as typeof d.audience })} className={`${input()} cursor-pointer`}>
                <option value="school">School-wide</option>
                <option value="staff">Teachers & staff only</option>
                <option value="students">Students & parents only</option>
              </select>
            </Field>
            <Field id={f("priority")} label="Priority">
              <select id={f("priority")} value={d.priority} onChange={(e) => set({ priority: e.target.value as typeof d.priority })} className={`${input()} cursor-pointer`}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className={ghostBtn}>
          Discard
        </button>
        <button type="button" onClick={confirm} className={buttonClass("primary", "md", "cursor-pointer")}>
          <Icon d="M5 12l4 4 10-10" className="size-[18px]" />
          {m.confirm}
        </button>
      </div>
    </div>
  );
}
