"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { Field, PasswordInput, RoleTabs, Spinner, emailPattern, fieldAria, fieldClass, type Role } from "@/components/auth/fields";

type Errors = { email?: string; password?: string };

function validate(email: string, password: string): Errors {
  const e: Errors = {};
  if (!emailPattern.test(email.trim())) e.email = "Please enter a valid email address.";
  if (!password) e.password = "Please enter your password.";
  return e;
}

export default function LoginForm() {
  const [role, setRole] = useState<Role>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    const found = validate(email, password);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStatus("sending");
    // Front-end phase: simulate sign in. Replace with real auth in the backend phase.
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="grid animate-fade-in justify-items-center gap-4 py-8 text-center" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-linear-135 from-primary to-accent text-surface shadow-[0_14px_34px_rgba(29,84,109,.35)]">
          <Icon d={iconPaths.check} className="size-8" />
        </span>
        <h2 className="text-[1.4rem] font-extrabold">Welcome back!</h2>
        <p className="max-w-[340px] text-ink/70">
          Signed in as <strong className="text-primary">{role}</strong>. The {role.toLowerCase()} dashboard is coming soon.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className={buttonClass("dark", "md", "mt-2 cursor-pointer")}>
          Back to login
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight">Login</h2>
        <p className="mt-1 text-[.93rem] text-ink/60">Choose your role and sign in to your account.</p>
      </div>

      <RoleTabs value={role} onChange={setRole} />

      <Field id="email" label="Email Address" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setErrors(validate(e.target.value, password));
          }}
          className={fieldClass(errors.email)}
          {...fieldAria("email", errors.email)}
        />
      </Field>

      <Field
        id="password"
        label="Password"
        error={errors.password}
        aside={<Link href="#" className="text-[.82rem] font-semibold text-primary hover:text-accent">Forgot password?</Link>}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched) setErrors(validate(email, e.target.value));
          }}
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 text-[.9rem] text-ink/75">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 cursor-pointer accent-primary" />
        Remember me
      </label>

      <button type="submit" disabled={status === "sending"} className={buttonClass("primary", "lg", "w-full cursor-pointer disabled:cursor-wait disabled:opacity-90")}>
        {status === "sending" ? (
          <>
            <Spinner />
            Signing in...
          </>
        ) : (
          `Login as ${role}`
        )}
      </button>

      <p className="text-center text-[.92rem] text-ink/65">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:text-accent">Sign up</Link>
      </p>
    </form>
  );
}
