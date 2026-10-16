"use client";

import { useState, type ReactNode } from "react";
import { Chip, Drawer, Select, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { emailFor, grades, sections, subjects, type Teacher, type TeacherStatus } from "@/lib/teachers";

type Fields = {
  name: string;
  empId: string;
  email: string;
  phone: string;
  ctGrade: string;
  ctSection: string;
  classes: string[];
  subjects: string[];
  status: TeacherStatus;
  credential: "password" | "invite";
};
type Errors = Partial<Record<"name" | "empId" | "email" | "phone" | "classTeacher" | "subjects", string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRe = /^\+?\d[\d\s-]{9,15}$/;

function makePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-b border-ink/8 px-5 py-6 last:border-0 sm:px-7">
      <h3 className="text-[1rem] font-extrabold tracking-tight">{title}</h3>
      {hint && <p className="mt-0.5 text-[.8rem] text-ink/55">{hint}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[.84rem] font-bold">
        {label}
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
const aria = (id: string, bad?: string) => ({ id, "aria-invalid": !!bad, "aria-describedby": bad ? `${id}-error` : undefined });

const inviteIcon = "M4 6h16v12H4z M4 7l8 6 8-6";

// Onboarding methods shown at the top of the Add Teacher form.
const methods = [
  ["invite", "Invite link", "Email a one-time link; the teacher sets their own password.", inviteIcon],
  ["password", "Create teacher profile", "Fill in the full profile now: contact details, classes and subjects.", "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M19 8v6 M16 11h6"],
] as const;

export default function TeacherForm({
  initial,
  roster,
  onClose,
  onSave,
}: {
  initial: Teacher | null;
  roster: Teacher[];
  onClose: () => void;
  onSave: (t: Teacher, credential?: { type: "password" | "invite"; value: string }) => void;
}) {
  const nextEmp = `TCH-${Math.max(1000, ...roster.map((t) => Number(t.empId.replace(/\D/g, "")) || 0)) + 1}`;
  const [ctG, ctS] = initial?.classTeacher?.split("-") ?? ["", "A"];
  const [f, setF] = useState<Fields>({
    name: initial?.name ?? "",
    empId: initial?.empId ?? nextEmp,
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    ctGrade: ctG,
    ctSection: ctS,
    classes: initial?.classes ?? [],
    subjects: initial?.subjects ?? [],
    status: initial?.status ?? "active",
    credential: "password",
  });
  const [emailTouched, setEmailTouched] = useState(!!initial);
  // Generated once per form; handed to onSave for the teacher's first login.
  const [password] = useState(makePassword);
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "classes" | "subjects", v: string) => setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const others = roster.filter((t) => t.id !== initial?.id);

  // Invite mode (new teachers only) collects just name + email; the teacher fills in the rest
  // after accepting. "Create teacher profile" sets up the complete profile now.
  const invite = !initial && f.credential === "invite";
  const pickMethod = (m: Fields["credential"]) => {
    set("credential", m);
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (f.name.trim().length < 3) e.name = "Enter the teacher's full name.";
    if (!emailRe.test(f.email.trim())) e.email = "Enter a valid email address.";
    else if (others.some((t) => t.email.toLowerCase() === f.email.trim().toLowerCase())) e.email = "Another teacher already uses this email.";
    if (invite) return e;
    if (!/^TCH-\d{3,6}$/.test(f.empId.trim())) e.empId = "Use the format TCH-1234.";
    else if (others.some((t) => t.empId === f.empId.trim())) e.empId = "This employee ID is already in use.";
    if (!phoneRe.test(f.phone.trim())) e.phone = "Enter a valid phone number, e.g. +92 300 1234567.";
    if (f.ctGrade) {
      const cls = `${f.ctGrade}-${f.ctSection}`;
      const holder = others.find((t) => t.classTeacher === cls && t.status !== "inactive");
      if (holder) e.classTeacher = `${cls} already has a class teacher: ${holder.name}.`;
    }
    if (!f.subjects.length) e.subjects = "Assign at least one subject.";
    return e;
  };

  const submit = (close: () => void) => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    // Hidden fields never leak into an invite, even if they were filled before switching.
    const classTeacher = !invite && f.ctGrade ? `${f.ctGrade}-${f.ctSection}` : null;
    const status = initial ? f.status : "active";
    onSave(
      {
        id: initial?.id ?? `t-${crypto.randomUUID()}`,
        name: f.name.trim(),
        empId: invite ? nextEmp : f.empId.trim(),
        email: f.email.trim().toLowerCase(),
        phone: invite ? "" : f.phone.trim(),
        classTeacher,
        classes: invite ? [] : grades.filter((g) => f.classes.includes(g)),
        subjects: invite ? [] : subjects.filter((s) => f.subjects.includes(s)),
        status,
        // Invites wait in the pending tab; finishing a pending profile starts normal check-ins.
        checkIn: invite ? { state: "none" } : initial && !initial.pending && status === initial.status ? initial.checkIn : { state: status === "active" ? "absent" : status === "leave" ? "leave" : "none" },
        joined: initial?.joined ?? new Date().toISOString().slice(0, 10),
        ...(invite && { pending: true }),
      },
      initial ? undefined : { type: f.credential, value: f.credential === "password" ? password : f.email.trim() },
    );
    close();
  };

  return (
    <Drawer
      title={initial?.pending ? "Assign Classes & Subjects" : initial ? "Edit Details / Class Assignment" : "Add New Teacher"}
      subtitle={
        initial
          ? `${initial.name} · ${initial.empId}`
          : invite
            ? "Email an invite; the teacher completes their own profile after joining."
            : "Create the profile, assign classes and send login credentials."
      }
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Cancel
          </button>
          <button type="submit" form="teacher-form" className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d={initial ? "M5 12l4 4 10-10" : invite ? inviteIcon : "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M19 8v6 M16 11h6"} className="size-[18px]" />
            {initial?.pending ? "Complete Profile" : initial ? "Save Changes" : invite ? "Send Invite Link" : "Save & Onboard Teacher"}
          </button>
        </>
      )}
    >
      {(close) => (
        <form
          id="teacher-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(close);
          }}
        >
          {!initial && (
            <Section title="Onboarding method" hint="Choose how this teacher gets started. The form below adjusts to your choice.">
              <fieldset className="grid gap-2.5 sm:grid-cols-2">
                <legend className="sr-only">Onboarding method</legend>
                {methods.map(([k, l, h, ic]) => (
                  <label key={k} className="cursor-pointer">
                    <input type="radio" name="credential" checked={f.credential === k} onChange={() => pickMethod(k)} className="peer sr-only" />
                    <span className="flex h-full gap-3 rounded-2xl border border-ink/12 p-3.5 transition-[border-color,background-color] duration-200 hover:border-accent peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon d={ic} className="size-[18px]" />
                      </span>
                      <span className="grid">
                        <span className="text-[.88rem] font-bold">{l}</span>
                        <span className="text-[.76rem] text-ink/55">{h}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Section>
          )}

          <Section title="Teacher profile details" hint={invite ? "Only the basics are needed to send the invite." : undefined}>
            <Field id="t-name" label="Full name" error={errors.name}>
              <input
                {...aria("t-name", errors.name)}
                value={f.name}
                autoComplete="off"
                placeholder="e.g. Ayesha Siddiqui"
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!emailTouched) set("email", e.target.value.trim() ? emailFor(e.target.value) : "");
                }}
                className={input(errors.name)}
              />
            </Field>
            {!invite && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="t-emp" label="Employee ID / code" error={errors.empId}>
                  <input {...aria("t-emp", errors.empId)} value={f.empId} onChange={(e) => set("empId", e.target.value.toUpperCase())} className={input(errors.empId)} />
                </Field>
                <Field id="t-phone" label="Phone number" error={errors.phone}>
                  <input {...aria("t-phone", errors.phone)} type="tel" value={f.phone} placeholder="+92 300 1234567" onChange={(e) => set("phone", e.target.value)} className={input(errors.phone)} />
                </Field>
              </div>
            )}
            <Field id="t-email" label="Official email" error={errors.email}>
              <input
                {...aria("t-email", errors.email)}
                type="email"
                value={f.email}
                placeholder="name@greenfield.edu.pk"
                onChange={(e) => {
                  setEmailTouched(true);
                  set("email", e.target.value);
                }}
                className={input(errors.email)}
              />
            </Field>
            {invite && (
              <p className="animate-fade-in rounded-2xl bg-surface p-3.5 text-[.86rem] text-ink/70">
                A one-time invite link will be emailed to <strong className="text-ink">{f.email || "the official email"}</strong>. The teacher sets their own password, and you can assign classes and subjects afterwards.
              </p>
            )}
            {initial && (
              <fieldset>
                <legend className="mb-2 text-[.84rem] font-bold">Status</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["active", "Active"],
                      ["leave", "On Leave"],
                      ["inactive", "Inactive"],
                    ] as const
                  ).map(([k, l]) => (
                    <Chip key={k} type="radio" name="status" checked={f.status === k} onChange={() => set("status", k)}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            )}
          </Section>

          {!invite && (
            <Section title="Academic assignment" hint="Class teacher section plus the grades and subjects this teacher covers.">
              <div>
                <p className="mb-1.5 text-[.84rem] font-bold">Primary assigned class / section</p>
                <div className="grid grid-cols-[1fr_120px] gap-2.5">
                  <Select label="Class teacher of grade" value={f.ctGrade} onChange={(v) => set("ctGrade", v)}>
                    <option value="">Not a class teacher</option>
                    {grades.map((g) => (
                      <option key={g} value={g.replace("Grade ", "")}>
                        Class {g.replace("Grade ", "")}
                      </option>
                    ))}
                  </Select>
                  <Select label="Section" value={f.ctSection} onChange={(v) => set("ctSection", v)} className={f.ctGrade ? "" : "pointer-events-none opacity-50"}>
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </Select>
                </div>
                {errors.classTeacher && <p className="mt-1.5 text-[.8rem] font-semibold text-danger">{errors.classTeacher}</p>}
              </div>

              <fieldset>
                <legend className="mb-2 text-[.84rem] font-bold">Other classes taught</legend>
                <div className="flex flex-wrap gap-2">
                  {grades.map((g) => (
                    <Chip key={g} type="checkbox" name="classes" checked={f.classes.includes(g)} onChange={() => toggle("classes", g)}>
                      {g}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset aria-describedby={errors.subjects ? "t-subjects-error" : undefined}>
                <legend className="mb-2 text-[.84rem] font-bold">Assigned subjects</legend>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <Chip key={s} type="checkbox" name="subjects" checked={f.subjects.includes(s)} onChange={() => toggle("subjects", s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
                {errors.subjects && (
                  <p id="t-subjects-error" className="mt-1.5 text-[.8rem] font-semibold text-danger">
                    {errors.subjects}
                  </p>
                )}
              </fieldset>
            </Section>
          )}

        </form>
      )}
    </Drawer>
  );
}
