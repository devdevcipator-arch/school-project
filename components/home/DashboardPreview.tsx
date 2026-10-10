"use client";

import { useEffect, useRef, useState } from "react";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";

const tabs = [
  { id: "principal", label: "Principal" },
  { id: "teacher", label: "Teacher · AI Quiz" },
  { id: "student", label: "Student" },
] as const;

const teachers = [
  { name: "Ayesha Khan", in: "07:52", status: "Present" },
  { name: "Bilal Ahmed", in: "08:04", status: "Late" },
  { name: "Sara Malik", in: "07:45", status: "Present" },
];

const kicker = "text-xs font-bold uppercase tracking-[.1em] text-accent";
const chip = "whitespace-nowrap rounded-full bg-accent/20 px-2.5 py-1 text-[.72rem] font-bold text-primary";

export default function DashboardPreview() {
  const [active, setActive] = useState(0);
  const { listRef: tabListRef, setHover: setTabHover } = useSlidingPill(active);
  const timer = useRef<number | undefined>(undefined);

  // Auto-rotate tabs until the user interacts
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => setActive((a) => (a + 1) % tabs.length), 5000);
    return () => clearInterval(timer.current);
  }, []);

  const select = (i: number) => {
    clearInterval(timer.current);
    setActive(i);
  };

  return (
    <div
      data-reveal
      aria-label="Dashboard preview"
      className="min-w-0 overflow-hidden rounded-[22px] border border-surface/30 bg-white text-ink shadow-[0_30px_70px_rgba(6,30,41,.35)]"
    >
      <div className="flex items-center gap-1.5 border-b border-ink/10 bg-surface px-3.5 py-3">
        <span className="size-2.5 shrink-0 rounded-full bg-accent" />
        <span className="size-2.5 shrink-0 rounded-full bg-accent/50" />
        <span className="size-2.5 shrink-0 rounded-full bg-accent/50" />
        <div ref={tabListRef} role="tablist" className="relative ml-3 flex gap-1 overflow-x-auto [scrollbar-width:none]" onMouseLeave={() => setTabHover(null)}>
          <span data-pill aria-hidden className={`${pillClass} shadow-none`} />
          {tabs.map((t, i) => (
            <button
              key={t.id}
              data-pill-item
              role="tab"
              type="button"
              aria-selected={i === active}
              onClick={() => select(i)}
              className={`relative z-10 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[.8rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                i === active ? "text-surface" : "text-ink/60 hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={active} role="tabpanel" className="animate-fade-in p-4 sm:p-[22px]">
        {active === 0 && (
          <>
            <div className="mb-[18px] flex items-start justify-between gap-3">
              <div>
                <p className={kicker}>Principal Dashboard</p>
                <h3 className="text-[1.2rem] font-bold">Today&apos;s Staff Monitor</h3>
              </div>
              <span className={chip}>Live</span>
            </div>
            <div className="mb-[18px] grid grid-cols-3 gap-2.5">
              {[
                ["42/45", "Teachers present"],
                ["94%", "Student attendance"],
                ["3", "Notices sent"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-surface p-3">
                  <strong className="block text-[1.05rem] text-primary sm:text-[1.25rem]">{v}</strong>
                  <span className="text-[.74rem] text-ink/60">{l}</span>
                </div>
              ))}
            </div>
            <table className="mb-4 w-full border-collapse text-[.82rem]">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/60">
                  <th className="px-1 py-1.5 font-semibold">Teacher</th>
                  <th className="px-1 py-1.5 font-semibold">Check-in</th>
                  <th className="px-1 py-1.5 font-semibold max-sm:hidden">Check-out</th>
                  <th className="px-1 py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.name} className="border-b border-ink/10">
                    <td className="px-1 py-2">{t.name}</td>
                    <td className="px-1 py-2">{t.in}</td>
                    <td className="px-1 py-2 max-sm:hidden">-</td>
                    <td className="px-1 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[.72rem] font-bold ${
                          t.status === "Present" ? "bg-ok/10 text-ok" : "bg-warn/15 text-warn"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div aria-hidden className="flex h-16 items-end gap-2">
              {[62, 78, 70, 88, 82, 94].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-t-md rounded-b-sm bg-linear-to-b from-accent to-primary" />
              ))}
            </div>
          </>
        )}

        {active === 1 && (
          <>
            <div className="mb-[18px] flex items-start justify-between gap-3">
              <div>
                <p className={kicker}>Teacher Workspace</p>
                <h3 className="text-[1.2rem] font-bold">AI Quiz Maker</h3>
              </div>
              <span className={chip}>AI</span>
            </div>
            <div className="mb-4 rounded-xl border-[1.5px] border-dashed border-accent bg-surface p-3.5">
              <span className="text-[.7rem] font-bold uppercase tracking-[.1em] text-accent">Topic</span>
              <p className="mb-2.5 mt-1 text-[.9rem] font-semibold">Grade 7 Science: Photosynthesis · 10 MCQs · Medium</p>
              <span className="inline-block rounded-lg bg-linear-135 from-primary to-accent px-3 py-1.5 text-[.78rem] font-bold text-surface">
                Generate ✦
              </span>
            </div>
            <ol className="mb-3.5 grid gap-3 text-[.86rem]">
              {[
                { q: "Which gas do plants absorb during photosynthesis?", opts: ["CO₂", "O₂", "N₂", "H₂"], right: 0 },
                { q: "Where does photosynthesis mainly occur?", opts: ["Root", "Chloroplast", "Stem", "Nucleus"], right: 1 },
              ].map((item, qi) => (
                <li key={item.q}>
                  <strong className="mb-1.5 block font-semibold">
                    <span className="text-primary">Q{qi + 1}. </span>
                    {item.q}
                  </strong>
                  <span className="flex flex-wrap gap-1.5">
                    {item.opts.map((o, oi) => (
                      <em
                        key={o}
                        className={`rounded-md border px-2.5 py-1 text-[.76rem] not-italic ${
                          oi === item.right ? "border-accent bg-accent/20 font-bold text-primary" : "border-ink/10"
                        }`}
                      >
                        {o}
                      </em>
                    ))}
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-[.8rem] text-ink/60">
              <span>10 questions ready</span>
              <span className="font-bold text-primary">Assign to 7-B →</span>
            </div>
          </>
        )}

        {active === 2 && (
          <>
            <div className="mb-[18px] flex items-start justify-between gap-3">
              <div>
                <p className={kicker}>Student Portal</p>
                <h3 className="text-[1.2rem] font-bold">Hi, Hamza 👋</h3>
              </div>
              <span className={chip}>Grade 7-B</span>
            </div>
            <div className="grid items-center justify-items-center gap-[18px] sm:grid-cols-[130px_1fr] sm:justify-items-stretch">
              <div
                className="relative grid aspect-square w-[130px] place-content-center rounded-full text-center"
                style={{ background: "conic-gradient(var(--color-primary) 92%, var(--color-surface) 0)" }}
              >
                <span aria-hidden className="absolute inset-3 rounded-full bg-white" />
                <span className="relative text-2xl font-extrabold leading-none text-primary">92%</span>
                <small className="relative text-[.72rem] text-ink/60">Attendance</small>
              </div>
              <ul className="grid w-full gap-2">
                {[
                  { tag: "Quiz", text: "Photosynthesis, due today", action: "Start" },
                  { tag: "Notice", text: "Sports day on Friday" },
                  { tag: "Report", text: "Term 1 report card", action: "Download" },
                ].map((f) => (
                  <li key={f.tag} className="flex flex-wrap items-center gap-1.5 rounded-[10px] bg-surface px-3 py-2.5 text-[.83rem]">
                    <b className="rounded-[5px] bg-accent px-[7px] py-0.5 text-[.68rem] uppercase tracking-[.08em] text-surface">{f.tag}</b>
                    {f.text}
                    {f.action && <span className="ml-auto font-bold text-primary">{f.action}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
