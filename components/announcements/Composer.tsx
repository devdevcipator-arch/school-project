"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  audiences,
  categories,
  channels,
  departments,
  formatSize,
  grades,
  plainText,
  priorities,
  type Attachment,
  type AudienceKey,
  type Category,
  type Channel,
  type Notice,
  type Priority,
} from "@/lib/announcements";
import { AudienceTag, PriorityBadge, priorityMeta } from "./tags";

const MAX_BYTES = 10 * 1024 * 1024;

/** ISO date to the "YYYY-MM-DDTHH:mm" local value a datetime-local input expects. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
const ALLOWED = /\.(pdf|png|jpe?g)$/i;

type Errors = Partial<Record<"targets" | "title" | "body" | "schedule", string>>;

const ghost =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-ink/12 bg-white px-[18px] py-[11px] text-[.92rem] font-semibold text-ink transition-[border-color,color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-primary";

/** Numbered composer step with an anchor id for the progress rail. */
function Step({ n, id, title, done, children }: { n: number; id: string; title: string; done: boolean; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 border-b border-ink/8 px-5 py-6 last:border-0 sm:px-7">
      <h3 className="mb-4 flex items-center gap-3 text-[1rem] font-extrabold tracking-tight">
        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[.8rem] font-bold transition-colors ${done ? "bg-ok text-white" : "bg-primary/10 text-primary"}`}>
          {done ? <Icon d="M5 12l4 4 10-10" className="size-4" /> : n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 text-[.8rem] font-semibold text-danger">
      {children}
    </p>
  );
}

/** Pill-shaped checkbox/radio used for audiences, grades, categories and channels. */
function Chip({ type, name, checked, onChange, children }: { type: "radio" | "checkbox"; name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3.5 py-2 text-[.84rem] font-semibold text-ink/75 transition-[background-color,border-color,color] duration-200 hover:border-accent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-surface peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        {children}
      </span>
    </label>
  );
}

const toolbar: { cmd: string; label: string; icon: string }[] = [
  { cmd: "bold", label: "Bold", icon: "M7 5h6a3.5 3.5 0 0 1 0 7H7z M7 12h7a3.5 3.5 0 0 1 0 7H7z" },
  { cmd: "italic", label: "Italic", icon: "M10 5h8 M6 19h8 M14 5l-4 14" },
  { cmd: "insertUnorderedList", label: "Bullet list", icon: "M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01" },
  { cmd: "insertOrderedList", label: "Numbered list", icon: "M10 6h10 M10 12h10 M10 18h10 M4 5l1.5-1v5 M3.5 15h3l-3 4h3" },
];

function RichText({ initial, onChange, invalid, describedBy }: { initial: string; onChange: (html: string) => void; invalid: boolean; describedBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initial;
    // Seed once on mount; afterwards the DOM is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => onChange(ref.current?.innerHTML ?? "");

  const run = (cmd: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    sync();
  };

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount && ref.current?.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
  };

  const applyLink = () => {
    const raw = url.trim();
    if (!raw) return;
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    ref.current?.focus();
    const sel = window.getSelection();
    if (range.current && sel) {
      sel.removeAllRanges();
      sel.addRange(range.current);
    }
    if (sel && !sel.isCollapsed) run("createLink", href);
    else run("insertHTML", `<a href="${encodeURI(href)}">${href.replace(/[<>&"]/g, "")}</a>`);
    setUrl("");
    setLinkOpen(false);
  };

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-colors focus-within:border-primary ${invalid ? "border-danger" : "border-ink/12"}`}>
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 border-b border-ink/8 bg-surface/60 px-2 py-1.5">
        {toolbar.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(t.cmd)}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink/70 transition-colors hover:bg-white hover:text-primary"
          >
            <Icon d={t.icon} className="size-4" />
          </button>
        ))}
        <span aria-hidden className="mx-1 h-5 w-px bg-ink/12" />
        <button
          type="button"
          title="Insert link"
          aria-label="Insert link"
          aria-expanded={linkOpen}
          onMouseDown={(e) => {
            e.preventDefault();
            saveRange();
          }}
          onClick={() => setLinkOpen((v) => !v)}
          className={`grid size-8 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-white hover:text-primary ${linkOpen ? "bg-white text-primary" : "text-ink/70"}`}
        >
          <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" className="size-4" />
        </button>
        {linkOpen && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-1">
            <input
              autoFocus
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
              }}
              placeholder="https://example.com"
              aria-label="Link address"
              className="min-w-0 flex-1 rounded-lg border border-ink/12 bg-white px-2.5 py-1.5 text-[.84rem] outline-none focus:border-primary"
            />
            <button type="button" onClick={applyLink} className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-[.8rem] font-bold text-surface">
              Add
            </button>
          </div>
        )}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        aria-label="Notice content"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={saveRange}
        data-placeholder="Write the notice. Use the toolbar for bold text, lists and links."
        className="min-h-[150px] px-4 py-3 text-[.92rem] leading-relaxed outline-none empty:before:text-ink/40 empty:before:content-[attr(data-placeholder)] [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}

function Uploader({ files, onChange }: { files: Attachment[]; onChange: (f: Attachment[]) => void }) {
  const inputId = useId();
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");

  const add = (list: FileList | null) => {
    if (!list) return;
    const ok: Attachment[] = [];
    const rejected: string[] = [];
    for (const f of Array.from(list)) {
      if (!ALLOWED.test(f.name) || f.size > MAX_BYTES) rejected.push(f.name);
      else if (!files.some((x) => x.name === f.name)) ok.push({ name: f.name, size: f.size });
    }
    setError(rejected.length ? `Skipped ${rejected.join(", ")}: only PDF, PNG or JPG up to 10 MB.` : "");
    if (ok.length) onChange([...files, ...ok]);
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-ink/15 bg-surface/50 hover:border-accent"
        }`}
      >
        <span className="grid size-11 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
          <Icon d="M12 16V4 M7 9l5-5 5 5 M5 20h14" className="size-5" />
        </span>
        <span className="text-[.9rem] font-bold">
          Drag and drop files, or <span className="text-primary underline">browse</span>
        </span>
        <span className="text-[.78rem] text-ink/55">Circulars, datesheets or guidelines · PDF, PNG, JPG up to 10 MB</span>
        <input id={inputId} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      </label>
      {error && <p className="mt-2 text-[.8rem] font-semibold text-danger">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white px-3 py-2.5">
              <Icon d="M7 3h7l5 5v13H7z M14 3v5h5" className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-[.86rem] font-semibold">{f.name}</span>
              <span className="text-[.76rem] text-ink/50">{formatSize(f.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(files.filter((x) => x.name !== f.name))}
                className="grid size-7 cursor-pointer place-items-center rounded-lg text-ink/50 transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Icon d="M6 6l12 12 M18 6 6 18" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What recipients will see, including the sticky banner for urgent notices. */
function Preview({ n }: { n: Notice }) {
  return (
    <div className="grid gap-4 px-5 py-6 sm:px-7">
      <p className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Recipient preview</p>
      {n.priority === "urgent" && n.channels.includes("banner") && (
        <div className="flex items-center gap-2.5 rounded-xl bg-danger px-4 py-3 text-[.88rem] font-semibold text-white">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[.68rem] font-extrabold uppercase tracking-[.12em]">Urgent</span>
          <span className="truncate">{n.title || "Untitled notice"}</span>
        </div>
      )}
      <article className={`rounded-2xl border bg-white p-5 ${n.priority === "urgent" ? "border-danger/40" : n.priority === "important" ? "border-warn/50" : "border-ink/10"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={n.priority} />
          <AudienceTag audience={n.audience} targets={n.targets} />
          <span className="rounded-full bg-ink/6 px-2.5 py-1 text-[.72rem] font-bold text-ink/60">{n.category}</span>
        </div>
        <h4 className="mt-3 text-[1.15rem] font-extrabold tracking-tight">{n.title || "Untitled notice"}</h4>
        <p className="mt-1 text-[.8rem] text-ink/50">From {n.author}</p>
        {/* Front-end preview of the author's own content. Sanitize server-side in the backend phase. */}
        <div
          className="mt-3 text-[.92rem] leading-relaxed text-ink/80 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: plainText(n.body) ? n.body : "<p>No content yet.</p>" }}
        />
        {n.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {n.attachments.map((a) => (
              <span key={a.name} className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-[.78rem] font-semibold text-primary">
                <Icon d="M7 3h7l5 5v13H7z M14 3v5h5" className="size-3.5" />
                {a.name}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

const inputCls = (bad?: string) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-[.92rem] outline-none transition-colors focus:border-primary ${bad ? "border-danger" : "border-ink/12"}`;

export type ComposerResult = { notice: Notice; action: "draft" | "broadcast" };

export default function Composer({ initial, onClose, onSubmit }: { initial: Notice | null; onClose: () => void; onSubmit: (r: ComposerResult) => void }) {
  const [audience, setAudience] = useState<AudienceKey>(initial?.audience ?? "school");
  const [targets, setTargets] = useState<string[]>(initial?.targets ?? []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "General Notice");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "normal");
  const [body, setBody] = useState(initial?.body ?? "");
  const [files, setFiles] = useState<Attachment[]>(initial?.attachments ?? []);
  const [mode, setMode] = useState<"now" | "schedule">(initial?.status === "scheduled" ? "schedule" : "now");
  const [scheduleAt, setScheduleAt] = useState(initial?.status === "scheduled" ? toLocalInput(initial.date) : "");
  const [chs, setChs] = useState<Channel[]>(initial?.channels ?? ["feed"]);
  const [errors, setErrors] = useState<Errors>({});
  const [preview, setPreview] = useState(false);
  const [closing, setClosing] = useState(false);
  const [id] = useState(() => initial?.id ?? `n-${crypto.randomUUID()}`);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  // Lock page scroll, focus the panel, and close on Escape while the drawer is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsTargets = audience === "classes" || audience === "department";
  const targetOptions = audience === "classes" ? grades : departments;

  const draft = (): Notice => ({
    id,
    title: title.trim(),
    body,
    audience,
    targets: needsTargets ? targets : [],
    category,
    priority,
    status: "draft",
    date: new Date().toISOString(),
    author: "Principal Office",
    attachments: files,
    channels: chs,
    reads: initial?.reads ?? { read: 0, total: audience === "staff" || audience === "department" ? 30 : 642 },
    pinned: initial?.pinned ?? false,
  });

  const submit = (action: "draft" | "broadcast") => {
    const e: Errors = {};
    if (!title.trim()) e.title = "Add a title so recipients know what this is about.";
    if (action === "broadcast") {
      if (needsTargets && !targets.length) e.targets = `Select at least one ${audience === "classes" ? "grade" : "department"}.`;
      if (!plainText(body)) e.body = "Write the notice content before broadcasting.";
      if (mode === "schedule" && (!scheduleAt || new Date(scheduleAt) <= new Date())) e.schedule = "Pick a future date and time.";
    }
    setErrors(e);
    if (Object.keys(e).length) {
      setPreview(false);
      const first = (["targets", "title", "body", "schedule"] as const).find((k) => e[k]);
      const step = first === "targets" ? "step-audience" : first === "title" ? "step-details" : first === "body" ? "step-content" : "step-dispatch";
      requestAnimationFrame(() => document.getElementById(step)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    const n = draft();
    if (action === "broadcast") {
      n.status = mode === "schedule" ? "scheduled" : "published";
      n.date = mode === "schedule" ? new Date(scheduleAt).toISOString() : new Date().toISOString();
    }
    onSubmit({ notice: n, action });
    close();
  };

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const done = {
    audience: !needsTargets || targets.length > 0,
    details: title.trim().length > 0,
    content: plainText(body).length > 0,
    dispatch: chs.length > 0 && (mode === "now" || !!scheduleAt),
  };
  const steps = [
    { id: "step-audience", label: "Audience", ok: done.audience },
    { id: "step-details", label: "Details", ok: done.details },
    { id: "step-content", label: "Content", ok: done.content },
    { id: "step-dispatch", label: "Dispatch", ok: done.dispatch },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden onClick={close} className={`absolute inset-0 bg-ink/55 backdrop-blur-[2px] transition-opacity duration-300 ${closing ? "opacity-0" : "animate-backdrop-in"}`} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[680px] flex-col bg-surface shadow-[-24px_0_60px_rgba(6,30,41,.25)] outline-none transition-transform duration-300 ease-nav ${
          closing ? "translate-x-full" : "animate-drawer-in"
        }`}
      >
        <header className="shrink-0 bg-linear-135 from-ink to-primary px-5 pb-4 pt-5 text-surface sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-[1.25rem] font-extrabold tracking-tight">
                {initial ? "Edit Announcement" : "Create New Announcement"}
              </h2>
              <p className="mt-0.5 text-[.84rem] text-surface/65">Target, write and dispatch a notice in four steps.</p>
            </div>
            <button type="button" aria-label="Close composer" onClick={close} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-surface/20 transition-colors hover:bg-surface/10">
              <Icon d="M6 6l12 12 M18 6 6 18" className="size-5" />
            </button>
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(false);
                    requestAnimationFrame(() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
                  }}
                  className="group grid w-full cursor-pointer gap-1.5 text-left"
                >
                  <span className={`h-1 rounded-full transition-colors duration-300 ${s.ok ? "bg-accent" : "bg-surface/20"}`} />
                  <span className="text-[.74rem] font-semibold text-surface/70 group-hover:text-surface">
                    <span className="max-sm:hidden">{i + 1}. </span>
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {preview ? (
            <Preview n={{ ...draft(), status: "published" }} />
          ) : (
            <form onSubmit={(e) => (e.preventDefault(), submit("broadcast"))} noValidate>
              <Step n={1} id="step-audience" title="Audience & target" done={done.audience}>
                <fieldset>
                  <legend className="sr-only">Target audience</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {audiences.map((a) => (
                      <label key={a.key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="audience"
                          checked={audience === a.key}
                          onChange={() => {
                            setAudience(a.key);
                            setTargets([]);
                          }}
                          className="peer sr-only"
                        />
                        <span className="flex h-full items-center gap-3 rounded-2xl border border-ink/12 p-3.5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-[inset_0_0_0_1px_var(--color-primary)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                          <AudienceTag audience={a.key} />
                          <span className="grid min-w-0">
                            <span className="text-[.86rem] font-bold">{a.label}</span>
                            <span className="text-[.76rem] text-ink/55">{a.hint}</span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {needsTargets && (
                  <fieldset className="mt-4 animate-fade-in rounded-2xl bg-surface/70 p-4" aria-describedby={errors.targets ? "err-targets" : undefined}>
                    <legend className="sr-only">{audience === "classes" ? "Grade levels" : "Departments"}</legend>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-[.8rem] font-bold text-ink/70">{audience === "classes" ? "Select grade levels" : "Select departments"}</p>
                      <button
                        type="button"
                        onClick={() => setTargets(targets.length === targetOptions.length ? [] : targetOptions)}
                        className="cursor-pointer text-[.78rem] font-bold text-primary hover:text-accent"
                      >
                        {targets.length === targetOptions.length ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {targetOptions.map((t) => (
                        <Chip key={t} type="checkbox" name="targets" checked={targets.includes(t)} onChange={() => setTargets(toggle(targets, t))}>
                          {t}
                        </Chip>
                      ))}
                    </div>
                    <FieldError id="err-targets">{errors.targets}</FieldError>
                  </fieldset>
                )}
              </Step>

              <Step n={2} id="step-details" title="Notice details" done={done.details}>
                <label htmlFor="notice-title" className="mb-1.5 block text-[.84rem] font-bold">
                  Title / subject line
                </label>
                <input
                  id="notice-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Mid-term exam datesheet released"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "err-title" : undefined}
                  className={inputCls(errors.title)}
                />
                <FieldError id="err-title">{errors.title}</FieldError>

                <fieldset className="mt-5">
                  <legend className="mb-2 text-[.84rem] font-bold">Category</legend>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Chip key={c} type="radio" name="category" checked={category === c} onChange={() => setCategory(c)}>
                        {c}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-5">
                  <legend className="mb-2 text-[.84rem] font-bold">Priority level</legend>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {priorities.map((p) => (
                      <label key={p.key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          checked={priority === p.key}
                          onChange={() => {
                            setPriority(p.key);
                            if (p.key === "urgent" && !chs.includes("banner")) setChs([...chs, "banner"]);
                          }}
                          className="peer sr-only"
                        />
                        <span
                          className={`flex h-full flex-col gap-1 rounded-2xl border border-ink/12 p-3.5 transition-[border-color,background-color] duration-200 hover:border-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                            p.key === "urgent" ? "peer-checked:border-danger peer-checked:bg-danger/5" : p.key === "important" ? "peer-checked:border-warn peer-checked:bg-warn/8" : "peer-checked:border-primary peer-checked:bg-primary/5"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2 text-[.88rem] font-bold">
                            <span className={`size-2.5 rounded-full ${priorityMeta[p.key].dot}`} />
                            {p.label}
                          </span>
                          <span className="text-[.76rem] text-ink/55">{p.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Step>

              <Step n={3} id="step-content" title="Content & attachments" done={done.content}>
                <RichText initial={body} onChange={setBody} invalid={!!errors.body} describedBy={errors.body ? "err-body" : undefined} />
                <FieldError id="err-body">{errors.body}</FieldError>
                <div className="mt-4">
                  <Uploader files={files} onChange={setFiles} />
                </div>
              </Step>

              <Step n={4} id="step-dispatch" title="Dispatch & scheduling" done={done.dispatch}>
                <fieldset>
                  <legend className="mb-2 text-[.84rem] font-bold">Publishing mode</legend>
                  <div className="flex flex-wrap gap-2">
                    <Chip type="radio" name="mode" checked={mode === "now"} onChange={() => setMode("now")}>
                      <Icon d="M5 12h14 M13 6l6 6-6 6" className="size-4" /> Publish immediately
                    </Chip>
                    <Chip type="radio" name="mode" checked={mode === "schedule"} onChange={() => setMode("schedule")}>
                      <Icon d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" className="size-4" /> Schedule for later
                    </Chip>
                  </div>
                </fieldset>
                {mode === "schedule" && (
                  <div className="mt-3 animate-fade-in">
                    <label htmlFor="notice-schedule" className="mb-1.5 block text-[.8rem] font-bold text-ink/70">
                      Date & time
                    </label>
                    <input
                      id="notice-schedule"
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                      aria-invalid={!!errors.schedule}
                      aria-describedby={errors.schedule ? "err-schedule" : undefined}
                      className={`${inputCls(errors.schedule)} sm:max-w-[280px]`}
                    />
                    <FieldError id="err-schedule">{errors.schedule}</FieldError>
                  </div>
                )}

                <fieldset className="mt-5">
                  <legend className="mb-2 text-[.84rem] font-bold">Notification channels</legend>
                  <div className="grid gap-2">
                    {channels.map((c) => (
                      <label key={c.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 px-3.5 py-3 transition-colors hover:border-accent has-checked:border-primary has-checked:bg-primary/5">
                        <input type="checkbox" checked={chs.includes(c.key)} onChange={() => setChs(toggle(chs, c.key))} className="size-4 cursor-pointer accent-primary" />
                        <span className="text-[.88rem] font-semibold">{c.label}</span>
                        {c.key === "banner" && priority === "urgent" && <span className="ml-auto rounded-full bg-danger/10 px-2 py-0.5 text-[.7rem] font-bold text-danger">Recommended</span>}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Step>
              <button type="submit" hidden />
            </form>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-ink/10 bg-white px-5 py-4 sm:px-7">
          <button type="button" onClick={() => submit("draft")} className={`${ghost} cursor-pointer max-sm:flex-1`}>
            Save Draft
          </button>
          <button type="button" onClick={() => setPreview((v) => !v)} aria-pressed={preview} className={`${ghost} cursor-pointer max-sm:flex-1`}>
            <Icon d={preview ? "M15 18l-6-6 6-6" : "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z"} className="size-4" />
            {preview ? "Back to Edit" : "Preview Notice"}
          </button>
          <button type="button" onClick={() => submit("broadcast")} className={buttonClass("primary", "md", "cursor-pointer max-sm:w-full sm:ml-auto")}>
            <Icon d="M3 11l15-6v14L3 13z M7 13v5h3v-4" className="size-[18px]" />
            {mode === "schedule" ? "Schedule Announcement" : "Broadcast Announcement"}
          </button>
        </footer>
      </div>
    </div>
  );
}
