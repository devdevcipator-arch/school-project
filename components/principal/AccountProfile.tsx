"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Field, PasswordInput, Spinner, fieldAria, fieldClass } from "@/components/auth/fields";
import { buttonClass } from "@/components/ui/Button";
import { principal } from "@/lib/principal";
import { initialsOf, saveName, usePrincipalName } from "@/lib/principalAccount";

// Principal > My Profile: name (editable), sign-in email (read only) and password change.

type Status = "idle" | "saving" | "saved";
type Pw = { current: string; next: string; confirm: string };
const emptyPw: Pw = { current: "", next: "", confirm: "" };

function SaveButton({ status, label }: { status: Status; label: string }) {
  return (
    <button type="submit" disabled={status === "saving"} className={buttonClass("primary", "md", "cursor-pointer disabled:cursor-wait max-sm:w-full")}>
      {status === "saving" ? (
        <>
          <Spinner />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

function Saved({ show, text }: { show: boolean; text: string }) {
  return (
    <p role="status" className={`text-[.88rem] font-semibold text-ok transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
      {show && text}
    </p>
  );
}

const panel = "rounded-[22px] border border-ink/10 bg-white p-5 shadow-[0_20px_50px_rgba(6,30,41,.06)] sm:p-8";

export default function AccountProfile() {
  const name = usePrincipalName();
  const [draft, setDraft] = useState(name);
  const [nameError, setNameError] = useState<string>();
  const [nameStatus, setNameStatus] = useState<Status>("idle");

  const [pw, setPw] = useState<Pw>(emptyPw);
  const [pwErrors, setPwErrors] = useState<Partial<Pw>>({});
  const [pwStatus, setPwStatus] = useState<Status>("idle");

  // Pick up the saved name once it is read from the browser.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft with stored name
  useEffect(() => setDraft(name), [name]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const clean = draft.trim().replace(/\s+/g, " ");
    if (clean.length < 3) {
      setNameError("Enter your full name.");
      document.getElementById("acc-name")?.focus();
      return;
    }
    setNameError(undefined);
    setNameStatus("saving");
    // Front-end phase: simulate the request.
    await new Promise((r) => setTimeout(r, 600));
    saveName(clean);
    setNameStatus("saved");
  };

  const validatePw = (p: Pw) => {
    const e: Partial<Pw> = {};
    if (!p.current) e.current = "Enter your current password.";
    if (p.next.length < 8) e.next = "Password must be at least 8 characters.";
    else if (p.next === p.current) e.next = "Choose a password different from the current one.";
    if (!p.confirm || p.confirm !== p.next) e.confirm = "Passwords do not match.";
    return e;
  };

  const setField = (k: keyof Pw, v: string) => {
    const next = { ...pw, [k]: v };
    setPw(next);
    setPwStatus("idle");
    if (Object.keys(pwErrors).length) setPwErrors(validatePw(next));
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const found = validatePw(pw);
    setPwErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`pw-${first}`)?.focus();
      return;
    }
    setPwStatus("saving");
    // Front-end phase: simulate the request.
    await new Promise((r) => setTimeout(r, 700));
    setPw(emptyPw);
    setPwStatus("saved");
  };

  const nameDirty = draft.trim().replace(/\s+/g, " ") !== name;

  return (
    <div className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] pb-16 pt-6">
      <div className="grid max-w-[860px] gap-6">
        <form onSubmit={saveProfile} noValidate className={panel}>
          <div className="mb-6 flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-linear-135 from-primary to-accent text-[1.2rem] font-bold text-surface">
              {initialsOf(draft || name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[1.2rem] font-extrabold tracking-tight">{name}</h2>
              <p className="truncate text-[.88rem] text-ink/55">Principal, {principal.school}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="acc-name" label="Full name" error={nameError}>
              <input
                id="acc-name"
                autoComplete="name"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setNameStatus("idle");
                  if (nameError && e.target.value.trim().length >= 3) setNameError(undefined);
                }}
                className={fieldClass(nameError)}
                {...fieldAria("acc-name", nameError)}
              />
            </Field>
            <Field id="acc-email" label="Email" aside={<span className="text-[.75rem] text-ink/45">Used to sign in</span>}>
              <input id="acc-email" type="email" value={principal.email} readOnly className={`${fieldClass()} cursor-default bg-ink/[.03] text-ink/70`} />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Saved show={nameStatus === "saved"} text="Name updated." />
            {nameDirty && (
              <button type="button" onClick={() => { setDraft(name); setNameError(undefined); }} className="cursor-pointer rounded-[10px] border border-ink/12 bg-white px-5 py-[11px] text-[.95rem] font-semibold transition-colors hover:border-accent hover:text-primary max-sm:w-full">
                Discard
              </button>
            )}
            <SaveButton status={nameStatus} label="Save name" />
          </div>
        </form>

        <form onSubmit={changePassword} noValidate className={panel}>
          <h2 className="text-[1.1rem] font-extrabold tracking-tight">Change password</h2>
          <p className="mt-1 text-[.9rem] text-ink/60">Use at least 8 characters.</p>

          <div className="mt-5 grid gap-5">
            <Field id="pw-current" label="Current password" error={pwErrors.current}>
              <PasswordInput id="pw-current" autoComplete="current-password" value={pw.current} error={pwErrors.current} onChange={(e) => setField("current", e.target.value)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="pw-next" label="New password" error={pwErrors.next}>
                <PasswordInput id="pw-next" autoComplete="new-password" placeholder="Min. 8 characters" value={pw.next} error={pwErrors.next} onChange={(e) => setField("next", e.target.value)} />
              </Field>
              <Field id="pw-confirm" label="Confirm new password" error={pwErrors.confirm}>
                <PasswordInput id="pw-confirm" autoComplete="new-password" placeholder="Re-enter password" value={pw.confirm} error={pwErrors.confirm} onChange={(e) => setField("confirm", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Saved show={pwStatus === "saved"} text="Password changed." />
            <SaveButton status={pwStatus} label="Update password" />
          </div>
        </form>
      </div>
    </div>
  );
}
