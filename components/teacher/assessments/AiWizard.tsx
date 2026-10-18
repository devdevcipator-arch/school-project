"use client";

import { useEffect, useState } from "react";
import { Drawer, Select, fieldClass, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mySections } from "@/lib/classAttendance";
import {
  generateQuestions,
  questionTypeMeta,
  newAssessmentId,
  regenerateQuestion,
  sectionSubjects,
  type Assessment,
  type Difficulty,
  type Question,
  type QuestionType,
} from "@/lib/assessments";
import { printAssessment } from "./documents";
import { aiIcon } from "./parts";

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Adaptive"];
const allTypes = Object.keys(questionTypeMeta) as QuestionType[];
const label = "grid gap-1.5 text-[.8rem] font-bold text-ink/70";
const pad = (n: number) => String(n).padStart(2, "0");
/** Date to the value format of <input type="datetime-local">. */
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function Steps({ step }: { step: number }) {
  const names = ["Configure", "Preview & edit", "Publish or export"];
  return (
    <ol className="flex flex-wrap items-center gap-2 border-b border-ink/8 px-5 py-3.5 sm:px-7">
      {names.map((n, i) => (
        <li key={n} className="flex items-center gap-2">
          <span className={`grid size-7 place-items-center rounded-full text-[.78rem] font-extrabold ${i + 1 < step ? "bg-ok text-white" : i + 1 === step ? "bg-primary text-surface" : "bg-ink/8 text-ink/50"}`}>
            {i + 1 < step ? <Icon d="M5 12l4 4 10-10" className="size-4" /> : i + 1}
          </span>
          <span className={`text-[.84rem] font-bold ${i + 1 === step ? "text-ink" : "text-ink/50"}`}>{n}</span>
          {i < names.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-ink/15" />}
        </li>
      ))}
    </ol>
  );
}

function QuestionCard({
  q,
  n,
  total,
  onChange,
  onMove,
  onRegenerate,
  onDelete,
}: {
  q: Question;
  n: number;
  total: number;
  onChange: (q: Question) => void;
  onMove: (d: -1 | 1) => void;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-[.78rem] font-extrabold text-surface">Q{n}</span>
          <Badge tone="neutral">{questionTypeMeta[q.type].short}</Badge>
          <span className="text-[.76rem] font-semibold text-ink/50">{q.marks} marks</span>
        </span>
        <span className="flex flex-wrap gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={n === 1} aria-label={`Move question ${n} up`} className={`${ghostSm} disabled:opacity-30`}>
            <Icon d="M12 19V5 M5 12l7-7 7 7" className="size-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={n === total} aria-label={`Move question ${n} down`} className={`${ghostSm} disabled:opacity-30`}>
            <Icon d="M12 5v14 M5 12l7 7 7-7" className="size-4" />
          </button>
          <button type="button" onClick={() => setEditing((e) => !e)} className={ghostSm}>
            <Icon d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4" className="size-4" />
            {editing ? "Done" : "Edit"}
          </button>
          <button type="button" onClick={onRegenerate} className={ghostSm}>
            <Icon d="M4 4v6h6 M20 20v-6h-6 M5.5 15a7 7 0 0 0 12 2.5 M18.5 9a7 7 0 0 0-12-2.5" className="size-4" />
            Regenerate
          </button>
          <button type="button" onClick={onDelete} aria-label={`Delete question ${n}`} className={`${ghostSm} hover:!bg-danger/8 hover:!text-danger`}>
            <Icon d="M5 7h14 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3" className="size-4" />
          </button>
        </span>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-2.5">
          <textarea value={q.text} onChange={(e) => onChange({ ...q, text: e.target.value })} rows={2} aria-label={`Question ${n} wording`} className={`${fieldClass} resize-y`} />
          {q.type === "mcq" &&
            q.options!.map((o, k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="radio" name={`ans-${q.id}`} checked={q.answer === o} onChange={() => onChange({ ...q, answer: o })} className="size-4 accent-[#2e8b57]" aria-label={`Mark option ${k + 1} correct`} />
                <input
                  value={o}
                  onChange={(e) => {
                    const options = q.options!.map((x, j) => (j === k ? e.target.value : x));
                    onChange({ ...q, options, answer: q.answer === o ? e.target.value : q.answer });
                  }}
                  aria-label={`Option ${k + 1}`}
                  className={`${fieldClass} flex-1 !py-2`}
                />
              </label>
            ))}
          {q.type === "tf" && (
            <div className="flex gap-2">
              {["True", "False"].map((v) => (
                <button key={v} type="button" onClick={() => onChange({ ...q, answer: v })} className={`cursor-pointer rounded-xl border px-4 py-2 text-[.84rem] font-bold ${q.answer === v ? "border-ok bg-ok text-white" : "border-ink/12"}`}>
                  {v}
                </button>
              ))}
            </div>
          )}
          {(q.type === "fill" || q.type === "short") && (
            <input value={q.answer} onChange={(e) => onChange({ ...q, answer: e.target.value })} aria-label={`Answer for question ${n}`} placeholder="Answer key" className={fieldClass} />
          )}
          <label className="flex items-center gap-2 text-[.8rem] font-semibold text-ink/60">
            Marks
            <input type="number" min={1} max={20} value={q.marks} onChange={(e) => onChange({ ...q, marks: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} className={`${fieldClass} w-20 !py-1.5`} />
          </label>
        </div>
      ) : (
        <>
          <p className="mt-3 text-[.95rem] font-semibold leading-snug">{q.text}</p>
          {q.options && (
            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
              {q.options.map((o, k) => (
                <li key={k} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[.84rem] ${o === q.answer ? "border-ok/40 bg-ok/8 font-bold text-ok" : "border-ink/8 text-ink/70"}`}>
                  <span className="font-bold">{"ABCD"[k]}.</span>
                  {o}
                  {o === q.answer && <Icon d="M5 12l4 4 10-10" className="ml-auto size-4" />}
                </li>
              ))}
            </ul>
          )}
          {!q.options && (
            <p className="mt-2.5 rounded-xl border border-ok/30 bg-ok/6 px-3 py-2 text-[.84rem]">
              <span className="font-bold text-ok">Answer key: </span>
              {q.answer}
            </p>
          )}
          <p className="mt-2 text-[.8rem] text-ink/55">
            <span className="font-bold text-ink/65">Explanation: </span>
            {q.explanation}
          </p>
        </>
      )}
    </li>
  );
}

/** 3-step AI test builder: configure, preview and edit the generated paper, then publish online or export. */
export default function AiWizard({
  section: initialSection,
  subject: initialSubject,
  draft,
  now,
  onSave,
  onClose,
}: {
  section: string;
  subject: string;
  draft?: Assessment;
  /** Page clock, used to decide live vs scheduled. */
  now: number;
  onSave: (a: Assessment, publish: boolean) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(draft?.questions?.length ? 2 : 1);
  const [section, setSection] = useState(draft?.section ?? initialSection);
  const [subject, setSubject] = useState(draft?.subject ?? initialSubject);
  const [topic, setTopic] = useState(draft?.topic ?? "");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(draft?.difficulty ?? "Medium");
  const [types, setTypes] = useState<QuestionType[]>(["mcq", "tf", "short", "fill"]);
  const [count, setCount] = useState(10);
  const [marks, setMarks] = useState(2);
  const [questions, setQuestions] = useState<Question[]>(draft?.questions ?? []);
  const [loading, setLoading] = useState(false);
  const [salt, setSalt] = useState(1);
  const [mode, setMode] = useState<"publish" | "export">("publish");
  const [start, setStart] = useState(() => local(new Date(now)));
  const [due, setDue] = useState(() => local(new Date(now + 24 * 3_600_000)));
  const [duration, setDuration] = useState(draft?.durationMins ?? 30);
  const [withKey, setWithKey] = useState(true);
  const [tried, setTried] = useState(false);

  const subjects = sectionSubjects(section);
  const total = questions.reduce((s, q) => s + q.marks, 0);

  // Simulated AI latency so the preview step feels like real generation.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setQuestions(generateQuestions({ subject, topic: topic.trim(), types, count, marks, salt }));
      setLoading(false);
    }, 1400);
    return () => clearTimeout(t);
  }, [loading, subject, topic, types, count, marks, salt]);

  const generate = () => {
    setTried(true);
    if (!topic.trim() || !types.length) return;
    if (!title.trim()) setTitle(`${topic.trim()} Quiz`);
    setSalt((s) => s + 1);
    setLoading(true);
    setStep(2);
  };

  const build = (publish: boolean): Assessment => {
    const startIso = new Date(start).toISOString();
    return {
      id: draft?.id ?? newAssessmentId(),
      title: title.trim() || `${topic.trim()} Quiz`,
      topic: topic.trim(),
      section,
      subject,
      format: "ai-quiz",
      status: publish ? (new Date(start).getTime() > now ? "scheduled" : "live") : "draft",
      start: startIso,
      due: new Date(due).toISOString(),
      durationMins: duration,
      totalMarks: total,
      difficulty,
      questions,
      mode: "online",
      autoGraded: true,
      released: false,
    };
  };

  const dueBad = new Date(due) <= new Date(start);

  return (
    <Drawer
      title={
        <span className="inline-flex items-center gap-2">
          <Icon d={aiIcon} className="size-5 text-accent" />
          {draft ? "Continue AI Test" : "Generate AI Test / Quiz"}
        </span>
      }
      subtitle="Describe the chapter, review the generated paper, then publish or print it."
      width="max-w-[880px]"
      onClose={onClose}
      footer={(close) => (
        <>
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className={ghostBtn}>
              Back
            </button>
          )}
          <span className="flex-1" />
          {step >= 2 && questions.length > 0 && !loading && (
            <button
              type="button"
              onClick={() => {
                onSave(build(false), false);
                close();
              }}
              className={ghostBtn}
            >
              Save as Draft
            </button>
          )}
          {step === 1 && (
            <button type="button" onClick={generate} className={buttonClass("primary", "md", "cursor-pointer")}>
              <Icon d={aiIcon} className="size-[18px]" />
              Generate Questions
            </button>
          )}
          {step === 2 && (
            <button type="button" onClick={() => setStep(3)} disabled={loading || !questions.length} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50")}>
              Continue
            </button>
          )}
          {step === 3 &&
            (mode === "publish" ? (
              <button
                type="button"
                disabled={dueBad}
                onClick={() => {
                  onSave(build(true), true);
                  close();
                }}
                className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50")}
              >
                <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
                Publish to Student Portal
              </button>
            ) : (
              <button type="button" onClick={() => printAssessment(build(false), withKey)} className={buttonClass("primary", "md", "cursor-pointer")}>
                <Icon d="M6 9V3h12v6 M6 18H4v-7h16v7h-2 M8 14h8v7H8z" className="size-[18px]" />
                Print / Save PDF
              </button>
            ))}
        </>
      )}
    >
      {() => (
        <>
          <Steps step={step} />
          {step === 1 && (
            <div className="grid gap-5 p-5 sm:p-7">
              <label className={label}>
                Topic / chapter name
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis & Cellular Respiration" className={`${fieldClass} ${tried && !topic.trim() ? "border-danger" : ""}`} aria-invalid={tried && !topic.trim()} />
                {tried && !topic.trim() && <span className="font-semibold text-danger">Enter the topic the AI should write questions on.</span>}
              </label>
              <label className={label}>
                Assessment title <span className="font-normal text-ink/45">(optional, defaults to the topic)</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 4 Quick Quiz" className={fieldClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Class / grade
                  <Select
                    label="Class"
                    value={section}
                    onChange={(v) => {
                      setSection(v);
                      if (!sectionSubjects(v).includes(subject)) setSubject(sectionSubjects(v)[0]);
                    }}
                  >
                    {mySections.map((s) => (
                      <option key={s.section} value={s.section}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className={label}>
                  Subject
                  <Select label="Subject" value={subject} onChange={setSubject}>
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className={label}>
                Difficulty level
                <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-2 gap-1 rounded-xl border border-ink/10 bg-surface/70 p-1 sm:grid-cols-4">
                  {difficulties.map((d) => (
                    <button key={d} type="button" role="radio" aria-checked={difficulty === d} onClick={() => setDifficulty(d)} className={`cursor-pointer rounded-lg px-3 py-2 text-[.84rem] font-bold transition-colors ${difficulty === d ? "bg-primary text-surface" : "text-ink/60 hover:bg-white"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <fieldset className={label}>
                <legend className="mb-1.5">Question types</legend>
                <div className="flex flex-wrap gap-2">
                  {allTypes.map((t) => (
                    <label key={t} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[.86rem] font-semibold ${types.includes(t) ? "border-primary bg-primary/6 text-primary" : "border-ink/12 text-ink/65"}`}>
                      <input type="checkbox" checked={types.includes(t)} onChange={() => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} className="size-4 accent-[#1D546D]" />
                      {questionTypeMeta[t].label}
                    </label>
                  ))}
                </div>
                {tried && !types.length && <span className="font-semibold text-danger">Pick at least one question type.</span>}
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className={label}>
                  Number of questions
                  <input type="number" min={3} max={40} value={count} onChange={(e) => setCount(Math.max(3, Math.min(40, Number(e.target.value) || 3)))} className={fieldClass} />
                </label>
                <label className={label}>
                  Marks per question
                  <input type="number" min={1} max={10} value={marks} onChange={(e) => setMarks(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className={fieldClass} />
                </label>
                <div className="grid content-end">
                  <p className="rounded-xl bg-primary/6 px-3.5 py-2.5 text-[.84rem] text-ink/65">
                    Total <strong className="text-ink">{count * marks} marks</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 p-5 sm:p-7">
              {loading ? (
                <div className="grid gap-3" aria-live="polite">
                  <p className="inline-flex items-center gap-2 text-[.9rem] font-bold text-primary">
                    <Icon d={aiIcon} className="size-5 animate-spin [animation-duration:2.5s]" />
                    Writing {count} {difficulty.toLowerCase()} questions on &ldquo;{topic}&rdquo;...
                  </p>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[120px] animate-pulse rounded-2xl bg-ink/6" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface/80 px-4 py-3">
                    <p className="text-[.86rem] text-ink/70">
                      <strong className="text-ink">{questions.length} questions</strong> · {total} marks · {difficulty} · {subject}, {section}
                    </p>
                    <button type="button" onClick={generate} className={ghostSm}>
                      <Icon d="M4 4v6h6 M20 20v-6h-6 M5.5 15a7 7 0 0 0 12 2.5 M18.5 9a7 7 0 0 0-12-2.5" className="size-4" />
                      Regenerate all
                    </button>
                  </div>
                  <ol className="grid gap-3">
                    {questions.map((q, i) => (
                      <QuestionCard
                        key={q.id}
                        q={q}
                        n={i + 1}
                        total={questions.length}
                        onChange={(nq) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? nq : x)))}
                        onMove={(d) =>
                          setQuestions((qs) => {
                            const next = [...qs];
                            [next[i], next[i + d]] = [next[i + d], next[i]];
                            return next;
                          })
                        }
                        onRegenerate={() => {
                          setSalt((s) => s + 1);
                          setQuestions((qs) => qs.map((x) => (x.id === q.id ? regenerateQuestion(q, subject, topic, salt + i) : x)));
                        }}
                        onDelete={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                      />
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => setQuestions((qs) => [...qs, ...generateQuestions({ subject, topic, types: types.length ? types : ["mcq"], count: 1, marks, salt: salt + qs.length + 11 })])}
                    className={`${ghostBtn} justify-self-start`}
                  >
                    <Icon d="M12 5v14 M5 12h14" className="size-4" />
                    Add another question
                  </button>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 p-5 sm:p-7">
              <div role="radiogroup" aria-label="Deployment mode" className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["publish", "Publish Online to Student Portal", "Timed attempt with a live countdown. Answers are auto-graded.", "M4 12l16-8-6 16-2-6z"],
                    ["export", "Export Paper", "One-click print or PDF, with an optional answer key sheet.", "M6 9V3h12v6 M6 18H4v-7h16v7h-2 M8 14h8v7H8z"],
                  ] as const
                ).map(([k, t, d, ic]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={mode === k}
                    onClick={() => setMode(k)}
                    className={`grid cursor-pointer gap-2 rounded-2xl border-2 p-4 text-left transition-colors ${mode === k ? "border-primary bg-primary/5" : "border-ink/10 hover:border-accent"}`}
                  >
                    <span className={`grid size-10 place-items-center rounded-xl ${mode === k ? "bg-primary text-surface" : "bg-ink/6 text-ink/60"}`}>
                      <Icon d={ic} className="size-5" />
                    </span>
                    <strong className="text-[.95rem]">{t}</strong>
                    <span className="text-[.82rem] text-ink/60">{d}</span>
                  </button>
                ))}
              </div>

              {mode === "publish" ? (
                <div className="grid gap-4 rounded-2xl border border-ink/8 p-4 sm:grid-cols-3">
                  <label className={label}>
                    Opens at
                    <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
                  </label>
                  <label className={label}>
                    Closes at
                    <input type="datetime-local" value={due} min={start} onChange={(e) => setDue(e.target.value)} className={`${fieldClass} ${dueBad ? "border-danger" : ""}`} />
                  </label>
                  <label className={label}>
                    Time limit (minutes)
                    <input type="number" min={5} max={180} value={duration} onChange={(e) => setDuration(Math.max(5, Math.min(180, Number(e.target.value) || 5)))} className={fieldClass} />
                  </label>
                  {dueBad && <p className="text-[.8rem] font-semibold text-danger sm:col-span-3">The closing time must be after the opening time.</p>}
                  <p className="flex items-center gap-2 text-[.8rem] text-ink/60 sm:col-span-3">
                    <Icon d="M5 12l4 4 10-10" className="size-4 text-ok" />
                    Auto-grading on. Students see a {duration}-minute countdown once they start.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 rounded-2xl border border-ink/8 p-4">
                  <label className="flex items-center gap-2.5 text-[.88rem] font-semibold">
                    <input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} className="size-4 accent-[#1D546D]" />
                    Include answer key sheet (printed on a separate page)
                  </label>
                  <p className="text-[.8rem] text-ink/55">Opens a print-ready paper with a name and roll number header. Choose &ldquo;Save as PDF&rdquo; in the print dialog to download.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
