"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

const faqs = [
  {
    q: "How does the Principal monitor teacher attendance and daily activity?",
    a: "Every teacher marks their own attendance with a check-in when they arrive and a check-out when they leave. Each action is timestamped and shows up instantly on the Principal's dashboard, where they can see who is present, late or absent, review daily activity, and view attendance trends over time.",
  },
  {
    q: "How does the AI Test & Quiz Generator help teachers?",
    a: "Teachers enter a topic, grade, number of questions and difficulty, and the AI generates a ready-to-use test or quiz in seconds. Teachers can review and edit the questions, then assign them to a class, saving hours of manual paper-setting each week.",
  },
  {
    q: "Can the Principal send notices to specific roles (teachers vs. students)?",
    a: "Yes. When creating an announcement, the Principal chooses the audience: teachers only, students only, or the whole school. Each notice appears in the right portal's notice feed, so everyone only sees what is meant for them.",
  },
  {
    q: "How do teachers generate and send digital report cards to students?",
    a: "Teachers enter or review student marks and progress, and the system builds a digital report card. With one click it is sent directly to the student's portal, where it can be viewed and downloaded. No printing or manual distribution needed.",
  },
  {
    q: "How do students attempt online tests and access their results?",
    a: "Assigned tests and quizzes appear on the student's dashboard. Students attempt them online within the given time, submit, and see their results once released, alongside their attendance records, notices and downloadable report cards.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 lg:py-[104px]">
      <div className="shell grid items-start gap-[clamp(36px,5vw,72px)] lg:grid-cols-[.85fr_1.15fr]">
        <div className="lg:sticky lg:top-[108px]">
          <Eyebrow>FAQ</Eyebrow>
          <h2 data-reveal className="mb-3.5 text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-[1.15] tracking-tight">
            Questions schools ask us
          </h2>
          <p data-reveal className="mb-7 text-ink/60">
            Everything about how Principals, Teachers and Students use the platform day to day.
          </p>
          <div data-reveal>
            <ButtonLink href="/contact">Still have questions? Contact Us</ButtonLink>
          </div>
        </div>

        <div className="grid gap-3.5">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                data-reveal
                className={`rounded-[14px] border transition-[background-color,border-color,box-shadow] duration-300 ${
                  isOpen ? "border-accent bg-white shadow-[0_16px_40px_rgba(6,30,41,.1)]" : "border-transparent bg-surface"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="relative w-full cursor-pointer py-5 pl-[22px] pr-16 text-left text-base font-bold transition-colors hover:text-primary"
                  >
                    {f.q}
                    <span
                      aria-hidden
                      className={`absolute right-5 top-1/2 grid size-[30px] -translate-y-1/2 place-items-center rounded-full transition-[rotate,background-color,color] duration-[350ms] ease-nav ${
                        isOpen ? "rotate-45 bg-primary text-surface" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <svg viewBox="0 0 20 20" className="size-3.5">
                        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-nav ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="mx-[22px] mb-[22px] border-t border-ink/10 pt-3.5 text-[.96rem] text-ink/80">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
