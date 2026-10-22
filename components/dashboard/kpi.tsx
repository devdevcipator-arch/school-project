import type { ReactNode } from "react";

/** KPI card: header and body. `fill` stretches the body so its last row sits on the card bottom. */
export function Kpi({ label, icon, fill, children }: { label: string; icon: string; fill?: boolean; children: ReactNode }) {
  return (
    <section
      className="flex min-w-0 flex-col rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[translate,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(6,30,41,.1)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[.86rem] font-bold text-ink/60">{label}</h2>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </span>
      </div>
      <div className={`mt-4 grid gap-4 ${fill ? "flex-1 content-between" : ""}`}>{children}</div>
    </section>
  );
}

/** Stacked bar with a 2px surface gap, plus a legend (identity never by color alone). */
export function SplitBar({ parts }: { parts: { label: string; value: number; fill: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-2.5 gap-0.5" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {parts.map((p, i) => (
          <span
            key={p.label}
            title={`${p.label}: ${p.value}`}
            className={`h-full ${p.fill} ${i === 0 ? "rounded-l-[3px]" : ""} ${i === parts.length - 1 ? "rounded-r-full" : ""}`}
            style={{ width: `${(p.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[.78rem] text-ink/65">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${p.fill}`} />
            {p.label} <strong className="text-ink">{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Ring({ percent, label = `${percent}% present` }: { percent: number; label?: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 76 76" className="size-[68px] shrink-0 -rotate-90" role="img" aria-label={label}>
      <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-ink/8" />
      <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${(percent / 100) * c} ${c}`} />
    </svg>
  );
}

export const kpiBig = "text-[1.9rem] font-extrabold leading-none tracking-tight";
export const kpiSub = "text-[.82rem] font-semibold tracking-normal text-ink/50";
