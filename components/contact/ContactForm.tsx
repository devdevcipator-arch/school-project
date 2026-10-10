"use client";

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

const topics = [
  { id: "inquiry", label: "General inquiry" },
  { id: "register", label: "School registration" },
  { id: "demo", label: "Live demo" },
] as const;
type Topic = (typeof topics)[number]["id"];

const roles = ["Principal", "Administrator", "Trustee", "School Owner", "Other"];

type Fields = { school: string; name: string; role: string; email: string; phone: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { school: "", name: "", role: "", email: "", phone: "", message: "" };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.school.trim().length < 2) e.school = "Please enter your school or institution name.";
  if (f.name.trim().length < 2) e.name = "Please enter the contact person's name.";
  if (!f.role) e.role = "Please choose your role.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Please enter a valid email address.";
  if (f.phone.replace(/[^\d]/g, "").length < 7) e.phone = "Please enter a valid phone or mobile number.";
  if (f.message.trim().length < 10) e.message = "Please tell us a little more (at least 10 characters).";
  return e;
}

// Topic preselected from the URL hash (/contact#register, /contact#demo)
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => window.location.hash.slice(1);
const topicFromHash = (hash: string): Topic => (hash === "register" || hash === "demo" ? hash : "inquiry");

const fieldBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-[.95rem] text-ink outline-none placeholder:text-ink/40 transition-[border-color,box-shadow,translate] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(6,30,41,.08)] focus:-translate-y-1 focus:ring-4";

function Field({
  id,
  label,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[.85rem] font-semibold text-ink/80">
        {label} <span className="text-danger" aria-hidden>*</span>
      </label>
      {children}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-nav ${error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <p id={`${id}-error`} role={error ? "alert" : undefined} className="overflow-hidden pt-1.5 text-[.8rem] font-medium text-danger">
          {error}
        </p>
      </div>
    </div>
  );
}

export default function ContactForm() {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const [topicChoice, setTopicChoice] = useState<Topic | null>(null);
  const topic = topicChoice ?? topicFromHash(hash);
  const topicIndex = topics.findIndex((t) => t.id === topic);
  const { listRef, setHover } = useSlidingPill(topicIndex);

  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const update = (key: keyof Fields) => (e: { target: { value: string } }) => {
    const next = { ...fields, [key]: e.target.value };
    setFields(next);
    if (touched) setErrors(validate(next));
  };

  const fieldClass = (key: keyof Fields) =>
    `${fieldBase} ${
      errors[key]
        ? "border-danger/70 focus:border-danger focus:ring-danger/15"
        : "border-ink/15 hover:border-accent focus:border-primary focus:ring-accent/25"
    }`;

  const aria = (key: keyof Fields) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

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
    // Front-end phase: simulate the request. Replace with the real API call in the backend phase.
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("sent");
  };

  const reset = () => {
    setFields(empty);
    setErrors({});
    setTouched(false);
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <div className="grid min-h-[520px] animate-fade-in place-content-center justify-items-center gap-4 p-8 text-center sm:p-10" role="status">
        <span className="relative grid size-20 place-items-center rounded-full bg-linear-135 from-primary to-accent text-surface shadow-[0_14px_34px_rgba(29,84,109,.35)]">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent/30 [animation-iteration-count:2]" />
          <Icon d={iconPaths.check} className="relative size-9" />
        </span>
        <h3 className="text-[1.5rem] font-extrabold">Message sent. Thank you!</h3>
        <p className="max-w-[420px] text-ink/70">
          Thanks, {fields.name.split(" ")[0]}. Our team will contact you at <strong className="text-primary">{fields.email}</strong> within
          one business day about {topics[topicIndex].label.toLowerCase()} for {fields.school}.
        </p>
        <button type="button" onClick={reset} className={buttonClass("dark", "md", "mt-2 cursor-pointer")}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5 p-6 sm:p-8 lg:p-10">
      <div data-reveal>
        <h2 className="text-[1.5rem] font-extrabold tracking-tight">Send us a message</h2>
        <p className="mt-1 text-[.93rem] text-ink/60">Fields marked * are required.</p>
      </div>

      {/* Topic: same sliding pill as the navigation */}
      <fieldset data-reveal>
        <legend className="mb-2 text-[.85rem] font-semibold text-ink/80">I&apos;m interested in</legend>
        <div
          ref={listRef}
          role="radiogroup"
          onMouseLeave={() => setHover(null)}
          className="relative grid grid-cols-1 gap-1 rounded-2xl border border-ink/10 bg-surface p-1 sm:grid-cols-3"
        >
          <span data-pill aria-hidden className={`${pillClass} shadow-none`} />
          {topics.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={topic === t.id}
              data-pill-item
              onClick={() => setTopicChoice(t.id)}
              onMouseEnter={() => setHover(i)}
              className={`relative z-10 cursor-pointer rounded-full px-3 py-2.5 text-[.85rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                topic === t.id ? "text-surface" : "text-ink/70 hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Field id="school" label="School / Institution Name" error={errors.school}>
        <input id="school" name="school" autoComplete="organization" placeholder="e.g. Greenfield Public School" value={fields.school} onChange={update("school")} className={fieldClass("school")} {...aria("school")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Contact Person Name" error={errors.name}>
          <input id="name" name="name" autoComplete="name" placeholder="Full name" value={fields.name} onChange={update("name")} className={fieldClass("name")} {...aria("name")} />
        </Field>
        <Field id="role" label="Role" error={errors.role}>
          <div className="relative">
            <select id="role" name="role" value={fields.role} onChange={update("role")} className={`${fieldClass("role")} cursor-pointer appearance-none pr-10 ${fields.role ? "" : "text-ink/40"}`} {...aria("role")}>
              <option value="" disabled>Select your role</option>
              {roles.map((r) => (
                <option key={r} value={r} className="text-ink">{r}</option>
              ))}
            </select>
            <svg viewBox="0 0 20 20" aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-primary">
              <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="email" label="Official Email Address" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="principal@school.edu" value={fields.email} onChange={update("email")} className={fieldClass("email")} {...aria("email")} />
        </Field>
        <Field id="phone" label="Phone / Mobile Number" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+92 300 0000000" value={fields.phone} onChange={update("phone")} className={fieldClass("phone")} {...aria("phone")} />
        </Field>
      </div>

      <Field id="message" label="Message / Query" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Ask us about onboarding, AI quiz features, system setup, or anything else."
          value={fields.message}
          onChange={update("message")}
          className={`${fieldClass("message")} resize-y`}
          {...aria("message")}
        />
      </Field>

      <div data-reveal className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className={buttonClass("primary", "lg", "min-w-[200px] cursor-pointer disabled:cursor-wait disabled:opacity-90 max-sm:w-full")}
        >
          {status === "sending" ? (
            <>
              <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-surface/40 border-t-surface" />
              Sending...
            </>
          ) : (
            <>
              Send Message
              <svg viewBox="0 0 20 20" aria-hidden className="size-4"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </>
          )}
        </button>
        <p className="text-[.82rem] text-ink/50">We reply within one business day.</p>
      </div>
    </form>
  );
}
