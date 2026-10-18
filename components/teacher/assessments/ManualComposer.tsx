"use client";

import { useRef, useState } from "react";
import { Drawer, Select, fieldClass, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mySections } from "@/lib/classAttendance";
import { formatMeta, newAssessmentId, sectionSubjects, type Assessment, type Attachment, type Format, type SubmissionMode } from "@/lib/assessments";

const label = "grid gap-1.5 text-[.8rem] font-bold text-ink/70";
const pad = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);

const tools: { cmd: string; label: string; icon: string }[] = [
  { cmd: "bold", label: "Bold", icon: "M7 5h6a3.5 3.5 0 0 1 0 7H7z M7 12h7a3.5 3.5 0 0 1 0 7H7z" },
  { cmd: "italic", label: "Italic", icon: "M10 5h8 M6 19h8 M14 5l-4 14" },
  { cmd: "underline", label: "Underline", icon: "M7 4v7a5 5 0 0 0 10 0V4 M5 20h14" },
  { cmd: "insertUnorderedList", label: "Bulleted list", icon: "M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01" },
  { cmd: "insertOrderedList", label: "Numbered list", icon: "M10 6h10 M10 12h10 M10 18h10 M4 5l1.5-1v5 M3.5 15.5a1.5 1.5 0 1 1 2.4 1.2L3.5 19H6.5" },
];

/** Manual homework / task composer: rich-text instructions, attachments and submission settings. */
export default function ManualComposer({
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
  now: number;
  onSave: (a: Assessment, publish: boolean) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(draft?.title ?? "");
  const [format, setFormat] = useState<Format>(draft?.format ?? "homework");
  const [section, setSection] = useState(draft?.section ?? initialSection);
  const [subject, setSubject] = useState(draft?.subject ?? initialSubject);
  const [files, setFiles] = useState<Attachment[]>(draft?.attachments ?? []);
  const [due, setDue] = useState(() => local(draft ? new Date(draft.due) : new Date(now + 3 * 24 * 3_600_000)));
  const [mode, setMode] = useState<SubmissionMode>(draft?.mode ?? "online");
  const [marks, setMarks] = useState(draft?.totalMarks ?? 20);
  const [tried, setTried] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const subjects = sectionSubjects(section);
  const dueBad = new Date(due).getTime() <= now;

  const build = (publish: boolean): Assessment | null => {
    setTried(true);
    const text = editor.current?.innerText.trim() ?? "";
    if (!title.trim() || (publish && (!text || dueBad))) return null;
    return {
      id: draft?.id ?? newAssessmentId(),
      title: title.trim(),
      topic: title.trim(),
      section,
      subject,
      format,
      status: publish ? "live" : "draft",
      start: new Date(now).toISOString(),
      due: new Date(due).toISOString(),
      totalMarks: marks,
      instructionsHtml: editor.current?.innerHTML ?? "",
      instructionsText: text,
      attachments: files,
      mode,
      autoGraded: false,
      released: false,
    };
  };

  return (
    <Drawer
      title="Create Manual Assignment / Task"
      subtitle="Write instructions, attach worksheets and set how students submit."
      width="max-w-[760px]"
      onClose={onClose}
      footer={(close) => (
        <>
          <button
            type="button"
            onClick={() => {
              const a = build(false);
              if (a) {
                onSave(a, false);
                close();
              }
            }}
            className={ghostBtn}
          >
            Save as Draft
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => {
              const a = build(true);
              if (a) {
                onSave(a, true);
                close();
              }
            }}
            className={buttonClass("primary", "md", "cursor-pointer")}
          >
            <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
            Assign to Class
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-5 p-5 sm:p-7">
          <label className={label}>
            Assignment title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Problem Set" className={`${fieldClass} ${tried && !title.trim() ? "border-danger" : ""}`} aria-invalid={tried && !title.trim()} />
            {tried && !title.trim() && <span className="font-semibold text-danger">Give the assignment a title.</span>}
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className={label}>
              Type
              <Select label="Type" value={format} onChange={(v) => setFormat(v as Format)}>
                {(["homework", "project", "term-test"] as const).map((f) => (
                  <option key={f} value={f}>
                    {formatMeta[f].label}
                  </option>
                ))}
              </Select>
            </label>
            <label className={label}>
              Class
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
            <span id="instr-label">Instructions</span>
            <div className="overflow-hidden rounded-xl border border-ink/12 focus-within:border-primary">
              <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-ink/8 bg-surface/70 p-1">
                {tools.map((t) => (
                  <button
                    key={t.cmd}
                    type="button"
                    title={t.label}
                    aria-label={t.label}
                    // Keep the editor selection while clicking the toolbar.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => document.execCommand(t.cmd)}
                    className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink/65 transition-colors hover:bg-white hover:text-primary"
                  >
                    <Icon d={t.icon} className="size-[18px]" />
                  </button>
                ))}
              </div>
              <div
                ref={editor}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-labelledby="instr-label"
                data-placeholder="Explain the task, list the questions or steps, and how it will be marked."
                className="min-h-[160px] px-4 py-3 text-[.92rem] font-normal leading-relaxed text-ink outline-none empty:before:text-ink/40 empty:before:content-[attr(data-placeholder)] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: draft?.instructionsHtml ?? "" }}
              />
            </div>
            {tried && !editor.current?.innerText.trim() && <span className="font-semibold text-[#9a6a0f]">Instructions are needed before assigning.</span>}
          </div>

          <div className={label}>
            File attachments
            <button type="button" onClick={() => fileInput.current?.click()} className="grid cursor-pointer justify-items-center gap-1.5 rounded-xl border-2 border-dashed border-ink/15 px-4 py-6 text-center transition-colors hover:border-accent hover:bg-surface/50">
              <Icon d="M12 16V4 M7 9l5-5 5 5 M5 20h14" className="size-6 text-primary" />
              <span className="text-[.88rem] font-bold text-ink">Add worksheets, diagrams or problem sets</span>
              <span className="text-[.76rem] font-normal text-ink/50">PDF or images, up to 10 MB each</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                const picked = [...(e.target.files ?? [])].filter((f) => f.size <= 10_000_000).map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) }));
                setFiles((x) => [...x, ...picked]);
                e.target.value = "";
              }}
            />
            {files.length > 0 && (
              <ul className="grid gap-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}${i}`} className="flex items-center gap-2.5 rounded-xl border border-ink/8 px-3 py-2 font-normal">
                    <Icon d="M7 3h7l5 5v13H7z M14 3v5h5" className="size-[18px] shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-[.86rem] font-semibold text-ink">{f.name}</span>
                    <span className="text-[.74rem] text-ink/50">{kb(f.size)}</span>
                    <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/50 hover:bg-danger/8 hover:text-danger">
                      <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 rounded-2xl border border-ink/8 p-4 sm:grid-cols-2">
            <label className={label}>
              Due date & time
              <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={`${fieldClass} ${tried && dueBad ? "border-danger" : ""}`} />
              {tried && dueBad && <span className="font-semibold text-danger">Pick a time in the future.</span>}
            </label>
            <label className={label}>
              Total marks
              <input type="number" min={1} max={200} value={marks} onChange={(e) => setMarks(Math.max(1, Math.min(200, Number(e.target.value) || 1)))} className={fieldClass} />
            </label>
            <div className={`${label} sm:col-span-2`}>
              Submission format
              <div role="radiogroup" aria-label="Submission format" className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["online", "Online file upload / image", "Students upload a PDF or photo in their portal.", "M12 16V4 M7 9l5-5 5 5 M5 20h14"],
                    ["physical", "Physical classroom submission", "Students hand in paper copies; you enter marks here.", "M4 5h16v14H4z M8 9h8 M8 13h5"],
                  ] as const
                ).map(([k, t, d, ic]) => (
                  <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left font-normal transition-colors ${mode === k ? "border-primary bg-primary/5" : "border-ink/10 hover:border-accent"}`}>
                    <Icon d={ic} className={`mt-0.5 size-5 shrink-0 ${mode === k ? "text-primary" : "text-ink/45"}`} />
                    <span className="grid">
                      <strong className="text-[.88rem] text-ink">{t}</strong>
                      <span className="text-[.78rem] text-ink/55">{d}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
