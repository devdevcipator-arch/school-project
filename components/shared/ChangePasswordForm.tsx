"use client";

import { useState, type FormEvent } from "react";
import { Field, PasswordInput } from "@/components/auth/fields";
import { SaveButton, Saved, accountPanel, type SaveStatus } from "./accountParts";

// Change password card shared by every role's My Profile page.

type Pw = { current: string; next: string; confirm: string };
const emptyPw: Pw = { current: "", next: "", confirm: "" };

function validatePw(p: Pw) {
  const e: Partial<Pw> = {};
  if (!p.current) e.current = "Enter your current password.";
  if (p.next.length < 8) e.next = "Password must be at least 8 characters.";
  else if (p.next === p.current) e.next = "Choose a password different from the current one.";
  if (!p.confirm || p.confirm !== p.next) e.confirm = "Passwords do not match.";
  return e;
}

export default function ChangePasswordForm() {
  const [pw, setPw] = useState<Pw>(emptyPw);
  const [errors, setErrors] = useState<Partial<Pw>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");

  const setField = (k: keyof Pw, v: string) => {
    const next = { ...pw, [k]: v };
    setPw(next);
    setStatus("idle");
    if (Object.keys(errors).length) setErrors(validatePw(next));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validatePw(pw);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`pw-${first}`)?.focus();
      return;
    }
    setStatus("saving");
    // Front-end phase: simulate the request.
    await new Promise((r) => setTimeout(r, 700));
    setPw(emptyPw);
    setStatus("saved");
  };

  return (
    <form onSubmit={submit} noValidate className={accountPanel}>
      <h2 className="text-[1.1rem] font-extrabold tracking-tight">Change password</h2>
      <p className="mt-1 text-[.9rem] text-ink/60">Use at least 8 characters.</p>

      <div className="mt-5 grid gap-5">
        <Field id="pw-current" label="Current password" error={errors.current}>
          <PasswordInput id="pw-current" autoComplete="current-password" value={pw.current} error={errors.current} onChange={(e) => setField("current", e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="pw-next" label="New password" error={errors.next}>
            <PasswordInput id="pw-next" autoComplete="new-password" placeholder="Min. 8 characters" value={pw.next} error={errors.next} onChange={(e) => setField("next", e.target.value)} />
          </Field>
          <Field id="pw-confirm" label="Confirm new password" error={errors.confirm}>
            <PasswordInput id="pw-confirm" autoComplete="new-password" placeholder="Re-enter password" value={pw.confirm} error={errors.confirm} onChange={(e) => setField("confirm", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <Saved show={status === "saved"} text="Password changed." />
        <SaveButton status={status} label="Update password" />
      </div>
    </form>
  );
}
