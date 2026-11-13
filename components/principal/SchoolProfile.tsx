"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/auth/fields";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { CalendarStep, ClassesStep, FeesStep, PoliciesStep, SchoolStep, SubjectsStep, TimingsStep, type StepProps } from "@/components/onboarding/steps";
import { buttonClass } from "@/components/ui/Button";
import { defaults, formSteps, loadSettings, saveSettings, validateStep, type Errors, type Onboarding, type StepKey } from "@/lib/onboarding";
import { principal } from "@/lib/principal";

// Principal > School Profile: every detail captured during onboarding, editable with the same forms.

const forms: Partial<Record<StepKey, (p: StepProps) => React.ReactNode>> = {
  school: SchoolStep,
  calendar: CalendarStep,
  timings: TimingsStep,
  classes: ClassesStep,
  subjects: SubjectsStep,
  fees: FeesStep,
  policies: PoliciesStep,
};

const intro: Partial<Record<StepKey, string>> = {
  school: "These details appear on every document the platform prints.",
  calendar: "The year, terms and days off that attendance, fees and report cards follow.",
  timings: "Used for teacher check-ins and the student timetable.",
  classes: "The grades you teach and how many sections each one has.",
  subjects: "What is taught and in which grades.",
  fees: "How installments are planned and when a student counts as late or a defaulter.",
  policies: "The thresholds that flag students and classes.",
};

// Before onboarding has been finished on this device, start from the onboarding defaults with the signed-in school.
const fallback: Onboarding = { ...defaults, school: { name: principal.school, principal: principal.name } };

export default function SchoolProfile() {
  const [saved, setSaved] = useState<Onboarding>(fallback);
  const [draft, setDraft] = useState<Onboarding>(fallback);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const { listRef, target, setHover } = useSlidingPill(tab);

  useEffect(() => {
    const s = loadSettings(fallback);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of browser-only state
    setSaved(s);
    setDraft(s);
  }, []);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const key = formSteps[tab].key;
  const Form = forms[key]!;

  const set = (fn: (d: Onboarding) => Onboarding) => {
    const next = fn(draft);
    setDraft(next);
    setStatus("idle");
    if (Object.keys(errors).length) setErrors(validateStep(key, next));
  };

  const open = (i: number) => {
    setTab(i);
    setErrors({});
  };

  const save = async () => {
    // Check every section, so an edit in one (e.g. turning off a grade) cannot break another (its subjects).
    for (let i = 0; i < formSteps.length; i++) {
      const found = validateStep(formSteps[i].key, draft);
      if (Object.keys(found).length) {
        setTab(i);
        setErrors(found);
        requestAnimationFrame(() => document.getElementById(Object.keys(found)[0])?.focus());
        return;
      }
    }
    setStatus("saving");
    // Front-end phase: simulate saving the school settings.
    await new Promise((r) => setTimeout(r, 700));
    saveSettings(draft);
    setSaved(draft);
    setStatus("saved");
  };

  const discard = () => {
    setDraft(saved);
    setErrors({});
    setStatus("idle");
  };

  return (
    <div className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] pb-28 pt-6">
      <div className="overflow-x-auto pb-1 [scrollbar-width:none]">
        <ul ref={listRef} role="tablist" aria-label="School profile sections" className="relative inline-flex min-w-max gap-1 rounded-full border border-ink/8 bg-white p-1.5 shadow-[0_10px_30px_rgba(6,30,41,.05)]" onMouseLeave={() => setHover(null)}>
          <span data-pill aria-hidden className={pillClass} />
          {formSteps.map((s, i) => (
            <li key={s.key} role="presentation">
              <button
                type="button"
                role="tab"
                data-pill-item
                aria-selected={i === tab}
                onClick={() => open(i)}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={`relative z-10 cursor-pointer rounded-full px-4 py-2 text-[.9rem] font-semibold transition-colors duration-[350ms] ease-nav ${i === target ? "text-surface" : "text-ink/65 hover:text-ink"}`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <section role="tabpanel" aria-label={formSteps[tab].label} className="mt-5 max-w-[860px]">
        <div key={key} className="animate-fade-in">
          <h2 className="text-[1.25rem] font-extrabold tracking-tight">{formSteps[tab].label}</h2>
          <p className="mt-1 text-[.92rem] text-ink/60">{intro[key]}</p>
          <div className="mt-5 rounded-[22px] border border-ink/10 bg-white p-5 shadow-[0_20px_50px_rgba(6,30,41,.06)] sm:p-8">
            <Form d={draft} set={set} errors={errors} />
          </div>
        </div>
      </section>

      {/* Save bar: appears once something changed, and confirms after saving. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 transition-[translate,opacity] duration-500 ease-nav lg:left-[268px] ${dirty || status === "saved" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}
      >
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-white/95 px-[clamp(16px,3vw,36px)] py-3 backdrop-blur">
          <p role="status" className="text-[.9rem] font-semibold text-ink/70">
            {dirty ? "You have unsaved changes." : "School profile saved."}
          </p>
          {dirty && (
            <div className="flex gap-2 max-sm:w-full">
              <button
                type="button"
                onClick={discard}
                disabled={status === "saving"}
                className="cursor-pointer rounded-[10px] border border-ink/12 bg-white px-5 py-[11px] text-[.95rem] font-semibold transition-colors hover:border-accent hover:text-primary max-sm:flex-1"
              >
                Discard
              </button>
              <button type="button" onClick={save} disabled={status === "saving"} className={buttonClass("primary", "md", "cursor-pointer disabled:cursor-wait max-sm:flex-1")}>
                {status === "saving" ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
