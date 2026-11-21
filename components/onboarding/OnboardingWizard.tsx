"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { Spinner } from "@/components/auth/fields";
import { buttonClass } from "@/components/ui/Button";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { defaults, loadCalendarStep, loadClassesStep, loadPoliciesStep, loadSchoolStep, loadSubjectsStep, loadTimingsStep, saveCalendarStep, saveClassesStep, savePoliciesStep, saveSchoolStep, saveSettings, saveSubjectsStep, saveTimingsStep, sectionTotal, steps, validateStep, type Errors, type Onboarding, type StepKey } from "@/lib/onboarding";
import { CalendarStep, ClassesStep, PoliciesStep, ReviewStep, SchoolStep, SubjectsStep, TimingsStep, type StepProps } from "./steps";

// Front-end phase: the draft is kept in this browser so a refresh does not lose progress.
// Replace with the onboarding API in the backend phase.
const KEY = "school-onboarding-v2";
type Saved = { data: Onboarding; step: number; furthest: number };

const intro: Record<StepKey, { title: string; text: string }> = {
  school: { title: "Tell us about your school", text: "These details appear on every document the platform prints." },
  calendar: { title: "Set your academic calendar", text: "The year, terms and days off that attendance, fees and report cards follow." },
  timings: { title: "School hours and periods", text: "Used for teacher check-ins and the student timetable." },
  classes: { title: "Grades and sections", text: "Pick the grades you teach and how many sections each one has." },
  subjects: { title: "Subjects", text: "What is taught and in which grades." },
  policies: { title: "Policies", text: "When a student counts as late or a fee defaulter, and the attendance thresholds that flag students and classes." },
  review: { title: "Review and finish", text: "Check everything once. You can change these settings later." },
};

const forms: Partial<Record<StepKey, (p: StepProps) => React.ReactNode>> = {
  school: SchoolStep,
  calendar: CalendarStep,
  timings: TimingsStep,
  classes: ClassesStep,
  subjects: SubjectsStep,
  policies: PoliciesStep,
};

const RAIL_ITEM = 60;

export default function OnboardingWizard() {
  const [data, setData] = useState<Onboarding>(defaults);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"editing" | "saving" | "done">("editing");
  const [advancing, setAdvancing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Restore a saved draft after mount (the server render always starts from the defaults).
  useEffect(() => {
    let hasDraft = false;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        hasDraft = true;
        const saved = JSON.parse(raw) as Saved;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of browser-only state
        setData({ ...defaults, ...saved.data });
        // Clamp: a draft saved before the Fees step was merged into Policies can point past the last step.
        setStep(Math.min(saved.step, steps.length - 1));
        setFurthest(Math.min(saved.furthest, steps.length - 1));
      }
    } catch {}
    setLoaded(true);
    // Fill step 1 from the school table where this browser has no value yet.
    loadSchoolStep().then((s) => {
      if (!s) return;
      setData((d) => ({ ...d, school: { name: d.school.name || s.name, principal: d.school.principal || s.principal } }));
    });
    // Without a draft in this browser, start the Calendar step from what is saved in the database
    // (keeping the sample holidays when none are saved yet).
    if (!hasDraft)
      loadCalendarStep().then((c) => {
        if (!c) return;
        setData((d) => ({ ...d, calendar: { ...c, holidays: c.holidays.length ? c.holidays : d.calendar.holidays } }));
      });
    // Same for the Timings step (keeps the sample periods when none are saved yet).
    if (!hasDraft)
      loadTimingsStep().then((t) => {
        if (t) setData((d) => ({ ...d, timings: t }));
      });
    // Same for the Classes step.
    if (!hasDraft)
      loadClassesStep().then((g) => {
        if (g) setData((d) => ({ ...d, grades: g }));
      });
    // Same for the Subjects step (keeps the sample subjects when none are saved yet).
    if (!hasDraft)
      loadSubjectsStep().then((s) => {
        if (s) setData((d) => ({ ...d, subjects: s }));
      });
    // Same for the Policies step (fee rules and attendance thresholds).
    if (!hasDraft)
      loadPoliciesStep().then((p) => {
        if (p) setData((d) => ({ ...d, fees: { ...d.fees, ...p.fees }, policies: p.policies }));
      });
  }, []);

  useEffect(() => {
    if (!loaded || status === "done") return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ data, step, furthest } satisfies Saved));
    } catch {}
  }, [data, step, furthest, loaded, status]);

  const key = steps[step].key;
  const last = step === steps.length - 1;

  const set = (fn: (d: Onboarding) => Onboarding) => {
    const next = fn(data);
    setData(next);
    if (Object.keys(errors).length) setErrors(validateStep(key, next));
  };

  const go = (i: number) => {
    setErrors({});
    setSaveError("");
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** First step (up to `upTo`) with problems, so Continue and Finish never skip an invalid step. */
  const firstInvalid = (upTo: number) => {
    for (let i = 0; i <= upTo; i++) {
      const found = validateStep(steps[i].key, data);
      if (Object.keys(found).length) return { i, found };
    }
    return null;
  };

  const showErrors = (i: number, found: Errors) => {
    if (i !== step) go(i);
    setErrors(found);
    requestAnimationFrame(() => document.getElementById(Object.keys(found)[0])?.focus());
  };

  // Navigation lock removed for now: Continue moves on even if this step is incomplete.
  // Finish setup still checks every step.
  // Exception: the School, Calendar, Timings, Classes, Subjects and Policies steps are saved to the database, so they must be valid first.
  // Until Continue is pressed, edits live only in React state (plus the local draft).
  const next = async () => {
    if (key === "school" || key === "calendar" || key === "timings" || key === "classes" || key === "subjects" || key === "policies") {
      const found = validateStep(key, data);
      if (Object.keys(found).length) return showErrors(step, found);
      setAdvancing(true);
      setSaveError("");
      const err =
        key === "school"
          ? await saveSchoolStep(data.school)
          : key === "calendar"
            ? await saveCalendarStep(data.calendar)
            : key === "timings"
              ? await saveTimingsStep(data.timings)
              : key === "classes"
                ? await saveClassesStep(data.grades)
                : key === "subjects"
                  ? await saveSubjectsStep(data)
                  : await savePoliciesStep(data.fees, data.policies);
      setAdvancing(false);
      if (err) return setSaveError(err);
    }
    setFurthest((f) => Math.max(f, step + 1));
    go(step + 1);
  };

  const finish = async () => {
    const bad = firstInvalid(steps.length - 2);
    if (bad) return showErrors(bad.i, bad.found);
    setStatus("saving");
    // Front-end phase: simulate saving the school setup.
    await new Promise((r) => setTimeout(r, 1200));
    saveSettings(data);
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setStatus("done");
  };

  if (status === "done") return <Done data={data} />;

  const Form = forms[key];

  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-[320px_1fr]">
      {/* Step rail */}
      <aside className="hidden bg-linear-160 from-ink via-ink to-primary text-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-8">
          <Logo />
          <p className="mt-10 text-[.75rem] font-bold uppercase tracking-[.18em] text-accent">School setup</p>
          <nav aria-label="Setup steps" className="relative mt-4">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 rounded-xl bg-surface/10 transition-transform duration-[450ms] ease-nav"
              style={{ height: RAIL_ITEM, transform: `translateY(${step * RAIL_ITEM}px)` }}
            />
            <ol>
              {steps.map((s, i) => {
                const done = i < furthest && i !== step;
                const reachable = true;
                return (
                  <li key={s.key} style={{ height: RAIL_ITEM }}>
                    <button
                      type="button"
                      disabled={!reachable}
                      onClick={() => go(i)}
                      aria-current={i === step ? "step" : undefined}
                      className="relative flex h-full w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left disabled:cursor-default"
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-[.8rem] font-bold transition-colors duration-300 ${
                          i === step ? "bg-linear-135 from-primary to-accent text-surface" : done ? "bg-accent/25 text-accent" : "border border-surface/20 text-surface/50"
                        }`}
                      >
                        {done ? <Icon d={iconPaths.check} className="size-4" /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[.92rem] font-semibold ${reachable ? "text-surface" : "text-surface/45"}`}>{s.label}</span>
                        <span className="block truncate text-[.76rem] text-surface/50">{s.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <p className="mt-auto text-[.8rem] text-surface/50">Your progress is saved on this device as you go.</p>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-col">
        <div ref={topRef} className="bg-linear-135 from-ink to-primary px-[clamp(16px,3.5vw,40px)] py-4 lg:hidden">
          <Logo />
          <div className="mt-4 flex items-center justify-between text-[.82rem] font-semibold text-surface/80">
            <span>
              Step {step + 1} of {steps.length}: {steps[step].label}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface/15">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-nav" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[860px] flex-1 px-[clamp(16px,3.5vw,40px)] py-8 lg:py-14">
          <div key={key} className="animate-fade-in">
            <p className="hidden text-[.8rem] font-bold uppercase tracking-[.16em] text-accent lg:block">
              Step {step + 1} of {steps.length}
            </p>
            <h1 className="mt-1 text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold tracking-tight">{intro[key].title}</h1>
            <p className="mt-1.5 text-ink/65">{intro[key].text}</p>

            <div className="mt-7 rounded-[22px] border border-ink/10 bg-white p-5 shadow-[0_20px_50px_rgba(6,30,41,.08)] sm:p-8">
              {Form ? <Form d={data} set={set} errors={errors} /> : <ReviewStep d={data} onEdit={(k) => go(steps.findIndex((s) => s.key === k))} />}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span />
            {last ? (
              <button type="button" onClick={finish} disabled={status === "saving"} className={buttonClass("primary", "lg", "cursor-pointer disabled:cursor-wait disabled:opacity-90 max-sm:w-full")}>
                {status === "saving" ? (
                  <>
                    <Spinner />
                    Setting up your school...
                  </>
                ) : (
                  "Finish setup"
                )}
              </button>
            ) : (
              <button type="button" onClick={next} disabled={advancing} className={buttonClass("primary", "lg", "cursor-pointer disabled:cursor-wait disabled:opacity-90 max-sm:w-full")}>
                {advancing && <Spinner />}
                {advancing ? "Saving..." : "Continue"}
                <svg viewBox="0 0 20 20" aria-hidden className="size-4"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
          {saveError && (
            <p role="alert" className="mt-3 text-right text-[.88rem] font-medium text-red-600">
              {saveError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Done({ data }: { data: Onboarding }) {
  const grades = data.grades.filter((g) => g.on).length;
  return (
    <main className="grid min-h-dvh place-items-center bg-linear-160 from-ink via-ink to-primary px-[clamp(16px,3.5vw,40px)] py-10">
      <div className="w-full max-w-[520px] animate-fade-in rounded-[22px] bg-white p-7 text-center shadow-[0_30px_70px_rgba(0,0,0,.3)] sm:p-10" role="status">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-linear-135 from-primary to-accent text-surface shadow-[0_14px_34px_rgba(29,84,109,.35)]">
          <Icon d={iconPaths.check} className="size-8" />
        </span>
        <h1 className="mt-5 text-[1.6rem] font-extrabold tracking-tight">{data.school.name} is ready</h1>
        <p className="mx-auto mt-2 max-w-[400px] text-ink/65">
          {grades} {grades === 1 ? "grade" : "grades"}, {sectionTotal(data)} sections and {data.subjects.length} subjects are set up. Next, invite your teachers and enroll students from the dashboard.
        </p>
        <Link href="/principal" className={buttonClass("primary", "lg", "mt-7")}>
          Open principal dashboard
        </Link>
      </div>
    </main>
  );
}
