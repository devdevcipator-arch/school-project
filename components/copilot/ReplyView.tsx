import Link from "next/link";
import type { Block, Reply, Tone } from "@/lib/copilot";

const toneText: Record<Tone, string> = {
  ok: "text-[#8fd6ac]",
  warn: "text-[#f0c36a]",
  serious: "text-[#f3a36b]",
  danger: "text-[#f19b90]",
  neutral: "text-surface",
};

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case "stats":
      return (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {b.items.map((i) => (
            <div key={i.label} className="rounded-xl bg-surface/8 px-3 py-2.5">
              <dt className="text-[.7rem] font-semibold text-surface/55">{i.label}</dt>
              <dd className={`text-[1.05rem] font-extrabold tracking-tight ${toneText[i.tone ?? "neutral"]}`}>{i.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-surface/10">
          <table className="w-full min-w-[420px] text-left text-[.8rem]">
            <thead className="bg-surface/8 text-[.66rem] font-bold uppercase tracking-[.1em] text-surface/55">
              <tr>
                {b.columns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface/8">
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold text-surface" : "text-surface/75"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list":
      return (
        <ul className="grid gap-1.5">
          {b.items.map((i) => (
            <li key={i} className="flex gap-2 text-surface/85">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
              {i}
            </li>
          ))}
        </ul>
      );
    case "links":
      return (
        <div className="flex flex-wrap gap-2">
          {b.items.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 rounded-full border border-surface/20 px-3 py-1.5 text-[.78rem] font-bold text-surface transition-colors hover:border-accent hover:bg-accent/20">
              {l.label}
              <svg viewBox="0 0 20 20" aria-hidden className="size-3.5">
                <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      );
  }
}

/** An AI answer: text, structured blocks, citations from the vault and the tool trace. */
export default function ReplyView({ reply }: { reply: Reply }) {
  return (
    <div className="grid gap-3">
      <p>{reply.text}</p>
      {reply.blocks?.map((b, i) => <BlockView key={i} b={b} />)}
      {reply.sources && (
        <div className="flex flex-wrap items-center gap-1.5 text-[.72rem]">
          <span className="font-bold text-surface/55">Sources:</span>
          {reply.sources.map((s) => (
            <span key={`${s.doc}-${s.page}`} className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 font-semibold text-surface/90">
              <svg viewBox="0 0 24 24" aria-hidden className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z M8 7h6" />
              </svg>
              {s.doc} · p. {s.page}
            </span>
          ))}
        </div>
      )}
      {reply.tools.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 border-t border-surface/10 pt-2 text-[.7rem] text-surface/45">
          <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
          </svg>
          Used: {reply.tools.join(" · ")}
        </p>
      )}
    </div>
  );
}
