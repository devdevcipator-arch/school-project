"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Toast, ghostBtn, type ToastData } from "@/components/dashboard/controls";
import { Icon } from "@/components/ui/Icon";
import { generateQuestions } from "@/lib/assessments";
import { seedVault, type DraftAction, type Reply, type VaultDoc } from "@/lib/copilot";
import { AS_OF, sectionLabel } from "@/lib/students";
import { teachers } from "@/lib/teachers";
import ActionCard, { type ActionState } from "./ActionCard";
import ReplyView from "./ReplyView";
import { personas, type PersonaKey } from "./personas";
import VaultDrawer, { type UploadMeta } from "./VaultDrawer";

type Message = { id: string; from: "user" | "ai"; text: string; reply?: Reply; state?: ActionState; result?: string };

const spark = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";
const noop = () => () => {};

const greeting = (text: string): Message => ({ id: "m0", from: "ai", text });

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Shared AI workspace. `persona` picks the scope: the principal sees the whole school, a teacher only their classes, a student only their studies. */
export default function CopilotWorkspace({ persona: key = "principal" }: { persona?: PersonaKey }) {
  const persona = personas[key];
  const [messages, setMessages] = useState<Message[]>(() => [greeting(persona.greeting)]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<{ steps: string[]; at: number } | null>(null);
  const [vault, setVault] = useState<VaultDoc[]>(seedVault);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [added, setAdded] = useState(0);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeToast = useCallback(() => setToast(null), []);

  // Students see textbooks, syllabi and student policies, not staff handbooks.
  const shelf = persona.studyOnly ? vault.filter((d) => d.category !== "Handbook") : vault;
  const processing = vault.some((d) => d.status !== "indexed" && d.status !== "failed");

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Simulated ingestion pipeline: upload, parse, embed, index.
  const vaultRef = useRef(vault);
  useEffect(() => {
    vaultRef.current = vault;
  }, [vault]);
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(() => {
      const next = vaultRef.current.map((d) => {
        if (d.status === "indexed" || d.status === "failed") return d;
        const progress = Math.min(100, d.progress + 6 + Math.round(Math.random() * 6));
        const status: VaultDoc["status"] = progress >= 100 ? "indexed" : progress >= 60 ? "embedding" : progress >= 25 ? "parsing" : "uploading";
        return { ...d, progress, status };
      });
      vaultRef.current = next;
      setVault(next);
    }, 450);
    return () => clearInterval(t);
  }, [processing]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || thinking) return;
    const reply = persona.respond(text, shelf);
    const steps = reply.tools.length ? reply.tools.map((t) => `Querying ${t}`) : ["Understanding your request"];
    setMessages((m) => [...m, { id: uid("u"), from: "user", text }]);
    setInput("");
    setThinking({ steps, at: 0 });
    // Front-end phase: the reply is computed locally; the delay mirrors tool calls in the live API.
    steps.forEach((_, i) => setTimeout(() => setThinking((t) => (t ? { ...t, at: i } : t)), 380 * i));
    setTimeout(
      () => {
        setMessages((m) => [...m, { id: uid("r"), from: "ai", text: reply.text, reply, state: reply.action ? "pending" : undefined }]);
        setThinking(null);
      },
      380 * steps.length + 350,
    );
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  const settle = (id: string, state: ActionState, result?: string) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, state, result } : x)));

  const execute = (id: string, d: DraftAction) => {
    if (d.type === "teacher") {
      const emp = `EMP-${String(teachers.length + added + 1).padStart(3, "0")}`;
      setAdded((n) => n + 1);
      const result = `Teacher account created for ${d.name} (${emp}, ${d.subject})${d.classTeacher ? `, class teacher of ${sectionLabel(d.classTeacher)}` : ""}. Login invite sent to ${d.email}.`;
      settle(id, "executed", result);
    } else if (d.type === "student") {
      const result = `${d.name} enrolled in ${sectionLabel(d.section)}. Guardian ${d.guardian} (${d.phone}) will receive portal login details.`;
      settle(id, "executed", result);
    } else if (d.type === "quiz") {
      const questions = generateQuestions({ subject: d.subject, topic: d.topic, types: ["mcq", "tf", "fill", "short"], count: d.count, marks: 2 });
      settle(id, "executed", `Quiz written: ${d.count} ${d.difficulty.toLowerCase()} questions on ${d.topic} for ${sectionLabel(d.section)} (${d.count * 2} marks).`);
      const paper: Reply = {
        text: `Here is the ${d.topic} paper with its answer key. Open the AI Test builder in Assessments to fine-tune it and publish it to ${sectionLabel(d.section)}.`,
        tools: ["AI test maker"],
        blocks: [
          { kind: "list", items: questions.map((q, i) => `Q${i + 1}. ${q.text}${q.options ? ` (${q.options.join(" / ")})` : ""} Answer: ${q.answer}`) },
          { kind: "links", items: [{ label: "Open Assessments", href: "/teacher/assessments" }] },
        ],
      };
      setMessages((m) => [...m, { id: uid("r"), from: "ai", text: paper.text, reply: paper }]);
    } else if (d.type === "class-notice") {
      const to = `${d.audience === "parents" ? "parents of" : "students of"} ${sectionLabel(d.section)}`;
      settle(id, "executed", `Notice "${d.title}" sent to ${to}${d.priority !== "normal" ? ` as ${d.priority}` : ""}.`);
    } else if (d.type === "remark") {
      navigator.clipboard?.writeText(d.text).catch(() => {});
      settle(id, "executed", `Remark for ${d.student} copied to your clipboard. Paste it into their report card in Reports.`);
    } else {
      const to = d.audience === "staff" ? "Teachers & staff" : d.audience === "students" ? "Students & parents" : "the whole school";
      settle(id, "executed", `Announcement "${d.title}" posted to ${to}${d.priority !== "normal" ? ` as ${d.priority}` : ""}.`);
    }
  };

  const cancel = (id: string) => settle(id, "cancelled");

  const upload = (files: File[], meta: UploadMeta) => {
    const docs: VaultDoc[] = files.map((f) => {
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      const pages = Math.max(1, Math.round(f.size / 60_000));
      return {
        id: uid("d"),
        title: base.replace(/\b\w/g, (c) => c.toUpperCase()),
        file: f.name,
        category: meta.category,
        subject: meta.subject || undefined,
        grade: meta.grade || undefined,
        pages,
        size: f.size,
        uploaded: AS_OF,
        status: "uploading",
        progress: 0,
        keywords: [...base.toLowerCase().split(/\s+/), meta.subject.toLowerCase(), meta.grade.toLowerCase()].filter((w) => w.length > 2),
        passages: [{ page: 1, text: `${base} is now in the vault (${pages} pages${meta.subject ? `, ${meta.subject}` : ""}${meta.grade ? `, ${meta.grade}` : ""}). Ask about its chapters, units or rules and I will cite the relevant pages.` }],
      };
    });
    vaultRef.current = [...docs, ...vaultRef.current];
    setVault(vaultRef.current);
    setToast({ text: `${files.length === 1 ? files[0].name : `${files.length} files`} uploading to the knowledge vault.` });
  };

  const removeDoc = (d: VaultDoc) => {
    vaultRef.current = vaultRef.current.filter((x) => x.id !== d.id);
    setVault(vaultRef.current);
    setToast({ text: `${d.title} removed from the vault.` });
  };

  const newSession = () => {
    setMessages([greeting(persona.greeting)]);
    setThinking(null);
    setInput("");
    inputRef.current?.focus();
  };

  const onlyGreeting = messages.length === 1;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <header className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap gap-2 max-sm:w-full">
          <button type="button" onClick={newSession} className={`${ghostBtn} max-sm:flex-1`}>
            <Icon d="M4 4v6h6 M4.5 15a8 8 0 1 0 1.9-8.3L4 10" className="size-[18px]" />
            New Session
          </button>
          <button type="button" onClick={() => setVaultOpen(true)} className={`${ghostBtn} max-sm:flex-1`}>
            <Icon d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z M8 7h6" className="size-[18px]" />
            {persona.studyOnly ? "Browse Textbooks" : "Manage Document Vault"}
          </button>
        </div>
      </header>

      <section
        aria-label="AI conversation"
        className="relative isolate flex h-[calc(100dvh-14rem)] min-h-[560px] flex-col overflow-hidden rounded-[22px] bg-linear-135 from-ink via-ink to-primary text-surface shadow-[0_24px_60px_rgba(6,30,41,.25)]"
      >
        <span aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="flex items-center gap-3 border-b border-surface/10 px-5 py-4 sm:px-6">
          <span className="grid size-10 shrink-0 animate-float place-items-center rounded-xl bg-linear-135 from-primary to-accent shadow-[0_10px_24px_rgba(95,149,152,.35)]">
            <Icon d={spark} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-extrabold tracking-tight">{persona.name}</p>
            <p className="truncate text-[.78rem] text-surface/55">{persona.tagline}</p>
          </div>
        </div>

        <div ref={listRef} aria-live="polite" className="flex flex-1 flex-col gap-4 overflow-y-auto px-[max(16px,calc((100%-1100px)/2))] py-5 [scrollbar-width:thin]">
          {messages.map((m) =>
            m.from === "user" ? (
              <p key={m.id} className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-linear-135 from-primary to-accent px-4 py-3 text-[.92rem] leading-relaxed">
                {m.text}
              </p>
            ) : (
              <div key={m.id} className="flex max-w-[94%] gap-2.5 self-start">
                <span aria-hidden className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-surface/10 text-accent">
                  <Icon d={spark} className="size-4" />
                </span>
                <div className="grid min-w-0 flex-1 gap-3">
                  <div className="rounded-2xl rounded-tl-md bg-surface/10 px-4 py-3 text-[.92rem] leading-relaxed text-surface/90">{m.reply ? <ReplyView reply={m.reply} /> : m.text}</div>
                  {m.reply?.action && m.state && (
                    <ActionCard id={m.id} draft={m.reply.action} state={m.state} result={m.result} onExecute={(d) => execute(m.id, d)} onCancel={() => cancel(m.id)} />
                  )}
                </div>
              </div>
            ),
          )}
          {thinking && (
            <div className="flex gap-2.5 self-start" aria-label="Copilot is working">
              <span aria-hidden className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-surface/10 text-accent">
                <Icon d={spark} className="size-4 animate-spin [animation-duration:2.5s]" />
              </span>
              <ul className="grid gap-1 rounded-2xl rounded-tl-md bg-surface/10 px-4 py-3 text-[.82rem]">
                {thinking.steps.slice(0, thinking.at + 1).map((s, i) => (
                  <li key={s} className="flex animate-fade-in items-center gap-2 text-surface/75">
                    {i < thinking.at ? (
                      <Icon d="M5 12l4 4 10-10" className="size-3.5 text-[#8fd6ac]" />
                    ) : (
                      <span className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="size-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </span>
                    )}
                    {s}...
                  </li>
                ))}
              </ul>
            </div>
          )}
          {onlyGreeting && !thinking && (
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {persona.suggestions.map((g) => (
                <div key={g.group} className="rounded-2xl border border-surface/10 bg-surface/5 p-3.5">
                  <p className="mb-2 text-[.7rem] font-bold uppercase tracking-[.12em] text-accent">{g.group}</p>
                  <div className="grid gap-1.5">
                    {g.prompts.slice(0, 3).map((p) => (
                      <button key={p} type="button" onClick={() => ask(p)} className="cursor-pointer rounded-xl bg-surface/5 px-3 py-2 text-left text-[.8rem] font-semibold text-surface/85 transition-colors hover:bg-accent/25">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="border-t border-surface/10 px-[max(12px,calc((100%-1100px)/2))] py-3 sm:py-4"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-surface/15 bg-surface/8 p-2 transition-colors focus-within:border-accent">
            {!persona.studyOnly && (
              <button type="button" onClick={() => setVaultOpen(true)} title="Upload to the knowledge vault" aria-label="Upload books or documents" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-surface/70 transition-colors hover:bg-surface/10 hover:text-surface">
                <Icon d="M21 12.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" className="size-5" />
              </button>
            )}
            <label htmlFor="copilot-input" className="sr-only">
              Ask the {persona.name.toLowerCase()}
            </label>
            <textarea
              id="copilot-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={persona.placeholder}
              className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-[.92rem] text-surface outline-none [field-sizing:content] placeholder:text-surface/45"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || !!thinking}
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-linear-135 from-primary via-accent to-primary bg-[length:220%_100%] bg-left text-surface transition-[background-position,opacity] duration-500 ease-nav hover:bg-right disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" aria-hidden className="size-[18px]">
                <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="mt-2 px-1 text-[.7rem] text-surface/40">{persona.footnote}</p>
        </form>
      </section>

      {hydrated && vaultOpen && (
        <VaultDrawer
          docs={shelf}
          readOnly={persona.studyOnly}
          onUpload={upload}
          onRemove={removeDoc}
          onAsk={(d) => {
            setVaultOpen(false);
            setInput(`Using "${d.title}", `);
            setTimeout(() => inputRef.current?.focus(), 320);
          }}
          onClose={() => setVaultOpen(false)}
        />
      )}
      {toast && <Toast {...toast} onDone={closeToast} />}
    </main>
  );
}
