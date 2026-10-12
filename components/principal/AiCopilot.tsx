"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { aiMockAnswers, aiSuggestions } from "@/lib/principal";

type Message = { from: "user" | "ai"; text: string };

const sparkPath = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";
const scopes = ["Teachers", "Students", "Fees", "Institution records"];

const fallback =
  "In the live version I will read your school records to answer this. For now, try one of the suggestions to see a sample answer.";

export default function AiCopilot() {
  const [messages, setMessages] = useState<Message[]>([
    { from: "ai", text: "Hello! I can answer questions about any teacher, student, attendance or fee record, and add new users when you ask." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setThinking(true);
    // Front-end phase: canned answers. Replace with the AI API in the backend phase.
    await new Promise((r) => setTimeout(r, 900));
    setMessages((m) => [...m, { from: "ai", text: aiMockAnswers[text] ?? fallback }]);
    setThinking(false);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <section
      data-reveal
      aria-label="Principal AI Copilot"
      className="relative isolate overflow-hidden rounded-[22px] bg-linear-135 from-ink via-ink to-primary p-5 text-surface shadow-[0_24px_60px_rgba(6,30,41,.25)] sm:p-7"
    >
      <span aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-accent/25 blur-3xl" />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 shrink-0 animate-float place-items-center rounded-2xl bg-linear-135 from-primary to-accent shadow-[0_10px_24px_rgba(95,149,152,.35)]">
            <svg viewBox="0 0 24 24" aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d={sparkPath} /></svg>
          </span>
          <div>
            <h2 className="text-[1.2rem] font-extrabold tracking-tight">Principal AI Copilot</h2>
            <p className="text-[.86rem] text-surface/65">Ask about school data or tell me to onboard a user.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/15 px-3 py-1.5 text-[.76rem] font-bold text-[#8fd6ac]">
            <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5" />
            </svg>
            Full access
          </span>
          {scopes.map((s) => (
            <span key={s} className="rounded-full bg-surface/10 px-2.5 py-1.5 text-[.74rem] font-semibold text-surface/80">{s}</span>
          ))}
        </div>
      </header>

      <ul ref={listRef} aria-live="polite" className="mt-6 flex max-h-[260px] flex-col gap-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {messages.map((m, i) => (
          <li
            key={i}
            className={`max-w-[85%] animate-fade-in rounded-2xl px-4 py-3 text-[.92rem] leading-relaxed ${
              m.from === "user" ? "self-end rounded-br-md bg-linear-135 from-primary to-accent" : "self-start rounded-bl-md bg-surface/10 text-surface/90"
            }`}
          >
            {m.text}
          </li>
        ))}
        {thinking && (
          <li className="flex gap-1.5 self-start rounded-2xl rounded-bl-md bg-surface/10 px-4 py-4" aria-label="AI is typing">
            {[0, 150, 300].map((d) => (
              <span key={d} className="size-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${d}ms` }} />
            ))}
          </li>
        )}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        {aiSuggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={thinking}
            className="cursor-pointer rounded-full border border-surface/20 bg-surface/5 px-3.5 py-2 text-[.82rem] font-semibold text-surface/90 transition-[background-color,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent/20 disabled:cursor-wait disabled:opacity-60"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2 rounded-2xl border border-surface/15 bg-surface/8 p-2 transition-colors focus-within:border-accent">
        <label htmlFor="ai-input" className="sr-only">Ask the AI copilot</label>
        <input
          id="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about school data, fee defaulters, teacher logs, or tell AI to onboard a user..."
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[.92rem] text-surface outline-none placeholder:text-surface/45"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim() || thinking}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-linear-135 from-primary via-accent to-primary bg-[length:220%_100%] bg-left text-surface transition-[background-position,opacity] duration-500 ease-nav hover:bg-right disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" aria-hidden className="size-[18px]"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>
    </section>
  );
}
