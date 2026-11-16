"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Field, fieldAria, fieldClass } from "@/components/auth/fields";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import { SaveButton, Saved, accountPanel as panel, type SaveStatus as Status } from "@/components/shared/accountParts";
import { principal } from "@/lib/principal";
import { initialsOf, saveName, usePrincipalName } from "@/lib/principalAccount";

// Principal > My Profile: name (editable), sign-in email (read only) and password change.

export default function AccountProfile() {
  const name = usePrincipalName();
  const [draft, setDraft] = useState(name);
  const [nameError, setNameError] = useState<string>();
  const [nameStatus, setNameStatus] = useState<Status>("idle");

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

        <ChangePasswordForm />
      </div>
    </div>
  );
}
