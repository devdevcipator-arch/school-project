"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { Spinner } from "@/components/auth/fields";
import { buttonClass } from "@/components/ui/Button";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { defaults, sectionTotal, steps, validateStep, type Errors, type Onboarding, type StepKey } from "@/lib/onboarding";
import { CalendarStep, ClassesStep, FeesStep, PoliciesStep, ReviewStep, SchoolStep, SubjectsStep, TimingsStep, type StepProps } from "./steps";

// Front-end phase: the draft is kept in this browser so a refresh does not lose progress.
// Replace with the onboarding API in the backend phase.
const KEY = "school-onboarding-v1";
type Saved = { data: Onboarding; step: number; furthest: number };

const intro: Record<StepKey, { title: string; text: string }> = {
  school: { title: "Tell us about your school", text: "These details appear on every document the platform prints." },
  calendar: { title: "Set your academic calendar", text: "The year, terms and days off that attendance, fees and report cards follow." },
  timings: { title: "School hours and periods", text: "Used for teacher check-ins and the student timetable." },
  classes: { title: "Grades and sections", text: "Pick the grades you teach and how many sections each one has." },
  subjects: { title: "Subjects and departments", text: "What is taught, by which department and in which grades." },
  fees: { title: "Fee rules", text: "How installments are planned and when a student counts as late or a defaulter." },
  policies: { title: "Attendance and grading", text: "The thresholds that flag students and classes, and your report card scale." },
  review: { title: "Review and finish", text: "Check everything once. You can change these settings later." },
};

const forms: Partial<Record<StepKey, (p: StepProps) => React.ReactNode>> = {
  school: SchoolStep,
  calendar: CalendarStep,
  timings: TimingsStep,
  classes: ClassesStep,
  subjects: SubjectsStep,
  fees: FeesStep,
  policies: PoliciesStep,
};

const RAIL_ITEM = 60;

export default function OnboardingWizard() {
  const [data, setData] = useState<Onboarding>(defaults);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"editing" | "saving" | "done">("editing");
  const [loaded, setLoaded] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Restore a saved draft after mount (the server render always starts from the defaults).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of browser-only state
        setData({ ...defaults, ...saved.data });
        setStep(saved.step);
        setFurthest(saved.furthest);
      }
    } catch {}
    setLoaded(true);
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
  const next = () => {
    setFurthest((f) => Math.max(f, step + 1));
    go(step + 1);
  };

  const finish = async () => {
    const bad = firstInvalid(steps.length - 2);
    if (bad) return showErrors(bad.i, bad.found);
    setStatus("saving");
    // Front-end phase: simulate saving the school setup.
    await new Promise((r) => setTimeout(r, 1200));
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
            {step > 0 ? (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-ink/12 bg-white px-5 py-3 text-[.95rem] font-semibold transition-[border-color,color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-primary"
              >
                <svg viewBox="0 0 20 20" aria-hidden className="size-4"><path d="M16 10H5M9 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back
              </button>
            ) : (
              <span />
            )}
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
              <button type="button" onClick={next} className={buttonClass("primary", "lg", "cursor-pointer max-sm:w-full")}>
                Continue
                <svg viewBox="0 0 20 20" aria-hidden className="size-4"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
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
