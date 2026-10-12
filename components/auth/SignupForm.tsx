"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { Field, PasswordInput, RoleTabs, Spinner, emailPattern, fieldAria, fieldClass, type Role } from "@/components/auth/fields";

type Fields = { name: string; email: string; password: string; confirm: string; terms: boolean };
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { name: "", email: "", password: "", confirm: "", terms: false };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!emailPattern.test(f.email.trim())) e.email = "Please enter a valid email address.";
  if (f.password.length < 8) e.password = "Password must be at least 8 characters.";
  if (!f.confirm || f.confirm !== f.password) e.confirm = "Passwords do not match.";
  if (!f.terms) e.terms = "Please accept the terms to continue.";
  return e;
}

export default function SignupForm() {
  const [role, setRole] = useState<Role>("Admin");
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (touched) setErrors(validate(next));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStatus("sending");
    // Front-end phase: simulate account creation. Replace with real auth in the backend phase.
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="grid animate-fade-in justify-items-center gap-4 py-8 text-center" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-linear-135 from-primary to-accent text-surface shadow-[0_14px_34px_rgba(29,84,109,.35)]">
          <Icon d={iconPaths.check} className="size-8" />
        </span>
        <h2 className="text-[1.4rem] font-extrabold">Account created!</h2>
        <p className="max-w-[340px] text-ink/70">
          Welcome, {fields.name.split(" ")[0]}. Your {role.toLowerCase()} account for <strong className="text-primary">{fields.email}</strong> is ready.
        </p>
        <Link href="/login" className={buttonClass("primary", "md", "mt-2")}>Go to login</Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight">Create account</h2>
        <p className="mt-1 text-[.93rem] text-ink/60">Choose your role and fill in your details.</p>
      </div>

      <RoleTabs value={role} onChange={setRole} />

      <Field id="name" label="Full Name" error={errors.name}>
        <input id="name" name="name" autoComplete="name" placeholder="Your full name" value={fields.name} onChange={(e) => set("name", e.target.value)} className={fieldClass(errors.name)} {...fieldAria("name", errors.name)} />
      </Field>

      <Field id="email" label="Email Address" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@school.edu" value={fields.email} onChange={(e) => set("email", e.target.value)} className={fieldClass(errors.email)} {...fieldAria("email", errors.email)} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="password" label="Password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Min. 8 characters" value={fields.password} error={errors.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field id="confirm" label="Confirm Password" error={errors.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" placeholder="Re-enter password" value={fields.confirm} error={errors.confirm} onChange={(e) => set("confirm", e.target.value)} />
        </Field>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[.9rem] text-ink/75">
          <input id="terms" type="checkbox" checked={fields.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-1 size-4 shrink-0 cursor-pointer accent-primary" {...fieldAria("terms", errors.terms)} />
          <span>
            I agree to the <Link href="#" className="font-semibold text-primary hover:text-accent">Terms</Link> and{" "}
            <Link href="#" className="font-semibold text-primary hover:text-accent">Privacy Policy</Link>.
          </span>
        </label>
        {errors.terms && (
          <p id="terms-error" role="alert" className="pt-1.5 text-[.8rem] font-medium text-danger">{errors.terms}</p>
        )}
      </div>

      <button type="submit" disabled={status === "sending"} className={buttonClass("primary", "lg", "w-full cursor-pointer disabled:cursor-wait disabled:opacity-90")}>
        {status === "sending" ? (
          <>
            <Spinner />
            Creating account...
          </>
        ) : (
          "Sign Up"
        )}
      </button>

      <p className="text-center text-[.92rem] text-ink/65">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-accent">Login</Link>
      </p>
    </form>
  );
}
