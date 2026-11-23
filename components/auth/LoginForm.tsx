"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { Field, PasswordInput, Spinner, emailPattern, fieldAria, fieldClass } from "@/components/auth/fields";
import { setRememberMe, supabase } from "@/lib/supabase";

type Errors = { email?: string; password?: string };

function validate(email: string, password: string): Errors {
  const e: Errors = {};
  if (!emailPattern.test(email.trim())) e.email = "Please enter a valid email address.";
  if (!password) e.password = "Please enter your password.";
  return e;
}

// Where to go after sign in: the page the guard sent them from (?next=), otherwise
// onboarding for a principal whose school has no name yet, otherwise the principal dashboard.
async function destination(userId: string) {
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  const { data: profile } = await supabase.from("users").select("name").eq("id", userId).maybeSingle();
  return profile && !profile.name ? "/onboarding" : "/principal";
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState("");
  const router = useRouter();

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
    setFormError("");
    setRememberMe(remember);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setFormError(
        error.code === "invalid_credentials"
          ? "Incorrect email or password."
          : error.code === "email_not_confirmed"
            ? "Please confirm your email first. Check your inbox for the link we sent."
            : error.message,
      );
      setStatus("idle");
      return;
    }
    setStatus("done");
    router.replace(await destination(data.user.id));
  };

  // Already signed in: skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) router.replace(await destination(data.session.user.id));
    });
  }, [router]);

  if (status === "done") {
    return (
      <div className="grid animate-fade-in justify-items-center gap-4 py-8 text-center" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-linear-135 from-primary to-accent text-surface shadow-[0_14px_34px_rgba(29,84,109,.35)]">
          <Icon d={iconPaths.check} className="size-8" />
        </span>
        <h2 className="text-[1.4rem] font-extrabold">Welcome back!</h2>
        <p className="max-w-[340px] text-ink/70">
          Signed in as <strong className="text-primary">{email}</strong>. Taking you to your dashboard...
        </p>
        <Spinner />
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight">Login</h2>
        <p className="mt-1 text-[.93rem] text-ink/60">Sign in to your account to continue.</p>
      </div>

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

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-[.9rem] text-red-700">{formError}</p>
      )}

      <button type="submit" disabled={status === "sending"} className={buttonClass("primary", "lg", "w-full cursor-pointer disabled:cursor-wait disabled:opacity-90")}>
        {status === "sending" ? (
          <>
            <Spinner />
            Signing in...
          </>
        ) : (
          "Login"
        )}
      </button>

      <p className="text-center text-[.92rem] text-ink/65">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:text-accent">Sign up</Link>
      </p>
    </form>
  );
}
