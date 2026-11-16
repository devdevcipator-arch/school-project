"use client";

import type { ReactNode } from "react";
import { Field, fieldClass } from "@/components/auth/fields";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import { accountPanel } from "@/components/shared/accountParts";
import { teacher } from "@/lib/teacher";
import { emailFor, teachers } from "@/lib/teachers";
import { principal } from "@/lib/principal";

// Teacher > My Profile: sign-in email, password change and the class assignment set by the principal.
// Front-end phase: the assignment is read from the principal's teacher roster.

const record = teachers.find((t) => t.name === teacher.name);
const email = record?.email ?? emailFor(teacher.name);

/** "10-A" to "Class 10 - Section A". */
const classLabel = (c: string) => {
  const [g, s] = c.split("-");
  return `Class ${g} - Section ${s}`;
};

function Assigned({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <dt className="text-[.84rem] font-bold">{label}</dt>
      <dd className="flex flex-wrap gap-2">{children}</dd>
    </div>
  );
}

const pill = "rounded-full border px-3.5 py-1.5 text-[.85rem] font-semibold";
const None = () => <span className="text-[.9rem] text-ink/50">Not assigned</span>;

export default function TeacherAccount() {
  const classTeacher = record?.classTeacher ?? null;
  const classes = record?.classes ?? [];
  const subjects = record?.subjects ?? [];

  return (
    <div className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] pb-16 pt-6">
      <div className="grid max-w-[860px] gap-6">
        <section className={accountPanel}>
          <div className="mb-6 flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-linear-135 from-primary to-accent text-[1.2rem] font-bold text-surface">
              {teacher.initials}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[1.2rem] font-extrabold tracking-tight">{teacher.name}</h2>
              <p className="truncate text-[.88rem] text-ink/55">
                {teacher.role}, {principal.school}
              </p>
            </div>
          </div>
          <Field id="acc-email" label="Email" aside={<span className="text-[.75rem] text-ink/45">Used to sign in</span>}>
            <input id="acc-email" type="email" value={email} readOnly className={`${fieldClass()} cursor-default bg-ink/[.03] text-ink/70`} />
          </Field>
        </section>

        <section className={accountPanel}>
          <h2 className="text-[1.1rem] font-extrabold tracking-tight">Academic assignment</h2>
          <p className="mt-1 text-[.9rem] text-ink/60">Set by the principal. Ask the principal if anything needs to change.</p>

          <dl className="mt-5 grid gap-5">
            <Assigned label="Primary assigned class / section">
              {classTeacher ? <span className={`${pill} border-ink bg-ink text-surface`}>{classLabel(classTeacher)}</span> : <None />}
            </Assigned>
            <Assigned label="Other classes taught">
              {classes.length ? classes.map((g) => <span key={g} className={`${pill} border-primary/20 bg-primary/10 text-primary`}>{g}</span>) : <None />}
            </Assigned>
            <Assigned label="Assigned subjects">
              {subjects.length ? subjects.map((s) => <span key={s} className={`${pill} border-accent/40 bg-accent/8 text-[#3d6e71]`}>{s}</span>) : <None />}
            </Assigned>
          </dl>
        </section>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
