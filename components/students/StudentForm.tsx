"use client";

import { useState, type ReactNode } from "react";
import { Chip, Drawer, Select, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AS_OF, enrollStudent, sectionLabel, sections, type PendingStudent, type Student } from "@/lib/students";

type Method = "invite" | "profile";
type Fields = {
  name: string;
  email: string;
  gender: Student["gender"] | "";
  section: string;
  dob: string;
  guardian: string;
  guardianRelation: Student["guardianRelation"];
  phone: string;
  address: string;
};
type Errors = Partial<Record<"name" | "email" | "gender" | "section" | "dob" | "guardian" | "phone", string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRe = /^\+?\d[\d\s-]{9,15}$/;

const inviteIcon = "M4 6h16v12H4z M4 7l8 6 8-6";
const addIcon = "M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3 M19 14v6 M16 17h6";

// Onboarding methods shown at the top of the Add Student form.
const methods = [
  ["invite", "Invite link", "Email a one-time link; the student or guardian sets their own password.", inviteIcon],
  ["profile", "Create student profile", "Fill in the full profile now: class, guardian and contact details.", addIcon],
] as const;

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

/**
 * Add Student drawer. New students: pick "Invite link" (name + email only) or "Create student profile"
 * (everything). Opening a pending student (joined via invite) goes straight to the full profile.
 */
export default function StudentForm({
  pending,
  roster,
  onClose,
  onEnroll,
  onInvite,
}: {
  pending: PendingStudent | null;
  roster: Student[];
  onClose: () => void;
  onEnroll: (s: Student, from: PendingStudent | null) => void;
  onInvite: (p: PendingStudent) => void;
}) {
  const [method, setMethod] = useState<Method>("profile");
  const [f, setF] = useState<Fields>({
    name: pending?.name ?? "",
    email: pending?.email ?? "",
    gender: "",
    section: "",
    dob: "",
    guardian: "",
    guardianRelation: "Father",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((p) => ({ ...p, [k]: v }));
  const invite = !pending && method === "invite";
  const pickMethod = (m: Method) => {
    setMethod(m);
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (f.name.trim().length < 3) e.name = "Enter the student's full name.";
    if (!emailRe.test(f.email.trim())) e.email = "Enter a valid email address.";
    if (invite) return e;
    if (!f.gender) e.gender = "Select the student's gender.";
    if (!f.section) e.section = "Choose a class and section.";
    if (!f.dob) e.dob = "Enter the date of birth.";
    else if (f.dob >= AS_OF) e.dob = "Date of birth must be in the past.";
    if (f.guardian.trim().length < 3) e.guardian = "Enter the parent or guardian's name.";
    if (!phoneRe.test(f.phone.trim())) e.phone = "Enter a valid phone number, e.g. +92 300 1234567.";
    return e;
  };

  const submit = (close: () => void) => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (invite) {
      onInvite({ id: `ps-${crypto.randomUUID()}`, name: f.name.trim(), email: f.email.trim().toLowerCase(), joined: AS_OF });
    } else {
      const student = enrollStudent(
        {
          name: f.name.trim(),
          email: f.email.trim().toLowerCase(),
          gender: f.gender as Student["gender"],
          section: f.section,
          dob: f.dob,
          guardian: f.guardian.trim(),
          guardianRelation: f.guardianRelation,
          phone: f.phone.trim(),
          address: f.address.trim() || "Not provided",
        },
        roster,
      );
      onEnroll(student, pending);
    }
    close();
  };

  return (
    <Drawer
      title={pending ? "Assign Class & Details" : "Add New Student"}
      subtitle={
        pending
          ? `${pending.name} · joined via invite`
          : invite
            ? "Email an invite; the student completes their account after joining."
            : "Create the profile, assign a class and record guardian details."
      }
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Cancel
          </button>
          <button type="submit" form="student-form" className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d={invite ? inviteIcon : addIcon} className="size-[18px]" />
            {pending ? "Complete Profile" : invite ? "Send Invite Link" : "Save & Enroll Student"}
          </button>
        </>
      )}
    >
      {(close) => (
        <form
          id="student-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(close);
          }}
        >
          {!pending && (
            <Section title="Onboarding method" hint="Choose how this student gets started. The form below adjusts to your choice.">
              <fieldset className="grid gap-2.5 sm:grid-cols-2">
                <legend className="sr-only">Onboarding method</legend>
                {methods.map(([k, l, h, ic]) => (
                  <label key={k} className="cursor-pointer">
                    <input type="radio" name="method" checked={method === k} onChange={() => pickMethod(k)} className="peer sr-only" />
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

          <Section title="Student details" hint={invite ? "Only the basics are needed to send the invite." : undefined}>
            <Field id="s-name" label="Full name" error={errors.name}>
              <input {...aria("s-name", errors.name)} value={f.name} autoComplete="off" placeholder="e.g. Fatima Khan" onChange={(e) => set("name", e.target.value)} className={input(errors.name)} />
            </Field>
            <Field id="s-email" label={invite ? "Student or guardian email" : "Email"} error={errors.email}>
              <input {...aria("s-email", errors.email)} type="email" value={f.email} placeholder="name@gmail.com" onChange={(e) => set("email", e.target.value)} className={input(errors.email)} />
            </Field>
            {invite ? (
              <p className="animate-fade-in rounded-2xl bg-surface p-3.5 text-[.86rem] text-ink/70">
                A one-time invite link will be emailed to <strong className="text-ink">{f.email || "this email"}</strong>. Once they join, the student appears under Joined via Invite so you can assign a class and guardian details.
              </p>
            ) : (
              <>
                <fieldset aria-describedby={errors.gender ? "s-gender-error" : undefined}>
                  <legend className="mb-2 text-[.84rem] font-bold">Gender</legend>
                  <div className="flex flex-wrap gap-2">
                    {(["Male", "Female"] as const).map((g) => (
                      <Chip key={g} type="radio" name="gender" checked={f.gender === g} onChange={() => set("gender", g)}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                  {errors.gender && (
                    <p id="s-gender-error" className="mt-1.5 text-[.8rem] font-semibold text-danger">
                      {errors.gender}
                    </p>
                  )}
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[.84rem] font-bold">Class / section</p>
                    <Select label="Class / section" value={f.section} onChange={(v) => set("section", v)}>
                      <option value="">Choose a class</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          {sectionLabel(s)}
                        </option>
                      ))}
                    </Select>
                    {errors.section && <p className="mt-1.5 text-[.8rem] font-semibold text-danger">{errors.section}</p>}
                  </div>
                  <Field id="s-dob" label="Date of birth" error={errors.dob}>
                    <input {...aria("s-dob", errors.dob)} type="date" value={f.dob} max={AS_OF} onChange={(e) => set("dob", e.target.value)} className={`${input(errors.dob)} cursor-pointer`} />
                  </Field>
                </div>
              </>
            )}
          </Section>

          {!invite && (
            <Section title="Parent / guardian" hint="Primary contact for attendance alerts and fee notices.">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field id="s-guardian" label="Guardian name" error={errors.guardian}>
                  <input {...aria("s-guardian", errors.guardian)} value={f.guardian} placeholder="e.g. Imran Khan" onChange={(e) => set("guardian", e.target.value)} className={input(errors.guardian)} />
                </Field>
                <fieldset>
                  <legend className="mb-1.5 text-[.84rem] font-bold">Relation</legend>
                  <div className="flex flex-wrap gap-2">
                    {(["Father", "Mother", "Guardian"] as const).map((r) => (
                      <Chip key={r} type="radio" name="relation" checked={f.guardianRelation === r} onChange={() => set("guardianRelation", r)}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              </div>
              <Field id="s-phone" label="Guardian phone" error={errors.phone}>
                <input {...aria("s-phone", errors.phone)} type="tel" value={f.phone} placeholder="+92 300 1234567" onChange={(e) => set("phone", e.target.value)} className={input(errors.phone)} />
              </Field>
              <Field id="s-address" label="Home address (optional)">
                <input id="s-address" value={f.address} placeholder="House, street, area, city" onChange={(e) => set("address", e.target.value)} className={input()} />
              </Field>
            </Section>
          )}
        </form>
      )}
    </Drawer>
  );
}
